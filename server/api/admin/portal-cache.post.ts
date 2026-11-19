import * as CdnClient from 'tencentcloud-sdk-nodejs-cdn/tencentcloud/services/cdn/v20180606/cdn_client.js'
import { homepagePreheatUrls } from '../../utils/portal-preheat'

type SyncMode = 'content' | 'assets'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function chunks<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size))
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)

  const body = await readBody<{ mode?: SyncMode }>(event)
  const mode = body?.mode
  if (mode !== 'content' && mode !== 'assets') {
    throw createError({ statusCode: 500, statusMessage: '请选择缓存刷新类型。' })
  }

  const config = useRuntimeConfig(event)
  if (!config.cosSecretId || !config.cosSecretKey) {
    throw createError({ statusCode: 500, statusMessage: '腾讯云配置未完成。' })
  }

  const origin = new URL(config.portalOrigin)
  if (origin.hostname !== 'cerotd.dancingcodes.cn') {
    throw createError({ statusCode: 500, statusMessage: '网站地址配置必须是 cerotd.dancingcodes.cn。' })
  }

  const client = new CdnClient.Client({
    credential: { secretId: config.cosSecretId, secretKey: config.cosSecretKey },
    region: 'ap-beijing',
    profile: { httpProfile: { endpoint: 'cdn.tencentcloudapi.com' } }
  })

  try {
    let purgeTasks: { id: string; type: 'url' | 'path' }[] = []
    let refreshed = 0
    let preheatUrls: string[] = []

    if (mode === 'content') {
      const [products, news, productCategories, newsCategories] = await Promise.all([
        mysqlDb.list<{ slug: string; is_published: number }>('SELECT slug, is_published FROM products'),
        mysqlDb.list<{ slug: string; is_published: number }>('SELECT slug, is_published FROM news'),
        mysqlDb.list<{ slug: string }>('SELECT slug FROM products_categories'),
        mysqlDb.list<{ slug: string }>('SELECT slug FROM news_categories')
      ])

      const pagePaths = [
        '/products', '/news',
        ...productCategories.map(({ slug }) => `/products?category=${encodeURIComponent(slug)}`),
        ...newsCategories.map(({ slug }) => `/news?category=${encodeURIComponent(slug)}`)
      ]
      const apiPaths = [
        '/api/products', '/api/news', '/api/news-categories'
      ]
      const urls = [...new Set([...pagePaths, '/sitemap.xml', ...apiPaths].map(path => new URL(path, origin).toString()))]
      const contentPaths = ['/products/', '/news/', '/api/products/', '/api/news/'].map(path => new URL(path, origin).toString())
      refreshed = urls.length + contentPaths.length
      preheatUrls = [...new Set([
        ...pagePaths,
        ...products.filter(item => item.is_published === 1).map(({ slug }) => `/products/${encodeURIComponent(slug)}`),
        ...news.filter(item => item.is_published === 1).map(({ slug }) => `/news/${encodeURIComponent(slug)}`)
      ].map(path => new URL(path, origin).toString()))]

      for (const batch of chunks(urls, 100)) {
        const purge = await client.PurgeUrlsCache({ Urls: batch })
        if (!purge.TaskId) throw new Error('CDN did not return a URL purge task ID')
        purgeTasks.push({ id: purge.TaskId, type: 'url' })
      }
      const contentPurge = await client.PurgePathCache({ Paths: contentPaths, FlushType: 'delete' })
      if (!contentPurge.TaskId) throw new Error('CDN did not return a content path purge task ID')
      purgeTasks.push({ id: contentPurge.TaskId, type: 'path' })
    } else {
      const purge = await client.PurgePathCache({ Paths: [new URL('/', origin).toString()], FlushType: 'delete' })
      if (!purge.TaskId) throw new Error('CDN did not return a site purge task ID')
      purgeTasks.push({ id: purge.TaskId, type: 'path' })
      refreshed = 1
    }

    const deadline = Date.now() + 150_000
    while (purgeTasks.length && Date.now() < deadline) {
      await sleep(2000)
      const statuses = await Promise.all(purgeTasks.map(async task => {
        const result = await client.DescribePurgeTasks({ TaskId: task.id, PurgeType: task.type })
        const logs = result.PurgeLogs?.filter(item => item.TaskId === task.id) || []
        if (logs.some(item => item.Status === 'fail')) throw new Error(`CDN purge task ${task.id} failed`)
        return logs.length > 0 && logs.every(item => item.Status === 'done')
      }))
      purgeTasks = purgeTasks.filter((_, index) => !statuses[index])
    }
    if (purgeTasks.length) throw new Error(`CDN purge tasks timed out: ${purgeTasks.map(task => task.id).join(', ')}`)

    if (mode === 'assets') {
      const response = await fetch(new URL('/', origin), { signal: AbortSignal.timeout(15_000) })
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        throw new Error(`Cannot read portal homepage: HTTP ${response.status}`)
      }
      preheatUrls = homepagePreheatUrls(await response.text(), origin)
      if (preheatUrls.length < 2) throw new Error('Portal homepage has no preheatable resources')
    }

    const preheatTaskIds: string[] = []
    const failedUrls = new Set<string>()
    const preheatBatches = chunks(preheatUrls, 3)
    const preheatDeadline = Date.now() + 50 * 60_000
    for (const batch of preheatBatches) {
      if (Date.now() >= preheatDeadline) throw new Error('CDN preheat queue timed out')
      const result = await client.PushUrlsCache({ Urls: batch, Area: 'global' })
      if (!result.TaskId) throw new Error('CDN did not return a preheat task ID')
      preheatTaskIds.push(result.TaskId)

      let finished = false
      while (Date.now() < preheatDeadline) {
        await sleep(5000)
        const status = await client.DescribePushTasks({ TaskId: result.TaskId, Limit: 100 })
        const logs = status.PushLogs?.filter(item => item.TaskId === result.TaskId) || []
        if (logs.length < batch.length || logs.some(item => !['done', 'fail', 'invalid'].includes(item.Status || ''))) continue
        for (const log of logs) {
          if (log.Status !== 'done') failedUrls.add(log.Url || 'unknown')
        }
        finished = true
        break
      }
      if (!finished) throw new Error(`CDN preheat timed out at task ${result.TaskId}`)
    }

    return { mode, refreshed, preheated: preheatUrls.length - failedUrls.size, failedUrls: [...failedUrls], preheatTaskIds }
  } catch (error) {
    console.error(`Portal CDN ${mode} sync failed`, error)
    throw createError({ statusCode: 500, statusMessage: 'CDN 刷新或预热失败。' })
  }
})
