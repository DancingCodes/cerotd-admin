import * as CdnClient from 'tencentcloud-sdk-nodejs-cdn/tencentcloud/services/cdn/v20180606/cdn_client'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default defineApiHandler(async (event) => {
  assertAdmin(event)

  const config = useRuntimeConfig(event)
  if (!config.cosSecretId || !config.cosSecretKey) {
    throw createError({ statusCode: 500, statusMessage: 'Tencent Cloud credentials are not configured' })
  }

  const origin = new URL(config.portalOrigin)
  if (origin.hostname !== 'cerotd.dancingcodes.cn') {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_PORTAL_ORIGIN must be cerotd.dancingcodes.cn' })
  }

  const [products, news] = await Promise.all([
    mysqlDb.list<{ slug: string }>('SELECT slug FROM products WHERE is_published = 1'),
    mysqlDb.list<{ slug: string }>('SELECT slug FROM news WHERE is_published = 1')
  ])

  const pagePaths = [
    '/', '/about', '/advantages', '/contact', '/news', '/products', '/services',
    ...products.map(({ slug }) => `/products/${encodeURIComponent(slug)}`),
    ...news.map(({ slug }) => `/news/${encodeURIComponent(slug)}`)
  ]
  const apiPaths = ['/api/products', '/api/product-categories', '/api/news', '/api/news-categories']
  const urls = [...new Set([...pagePaths, ...apiPaths].map(path => new URL(path, origin).toString()))]

  const client = new CdnClient.Client({
    credential: { secretId: config.cosSecretId, secretKey: config.cosSecretKey },
    region: 'ap-beijing',
    profile: { httpProfile: { endpoint: 'cdn.tencentcloudapi.com' } }
  })

  let purgeTaskId: string
  try {
    const purge = await client.PurgePathCache({ Paths: [`${origin.origin}/`], FlushType: 'delete' })
    purgeTaskId = purge.TaskId || ''
    if (!purgeTaskId) throw new Error('CDN did not return a purge task ID')

    let complete = false
    for (let attempt = 0; attempt < 45; attempt += 1) {
      await sleep(2000)
      const status = await client.DescribePurgeTasks({ TaskId: purgeTaskId, PurgeType: 'path' })
      const tasks = status.PurgeLogs?.filter(item => item.TaskId === purgeTaskId) || []
      if (tasks.some(item => item.Status === 'fail')) throw new Error('CDN purge task failed')
      if (tasks.length && tasks.every(item => item.Status === 'done')) {
        complete = true
        break
      }
    }
    if (!complete) throw new Error('CDN purge task timed out')

    const preheat = await client.PushUrlsCache({ Urls: urls, Area: 'global' })
    return { refreshed: urls.length, preheated: urls.length, purgeTaskId, preheatTaskId: preheat.TaskId || '' }
  } catch (error) {
    console.error('Portal CDN sync failed', error)
    throw createError({ statusCode: 502, statusMessage: 'CDN refresh or preheat failed' })
  }
})
