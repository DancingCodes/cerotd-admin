import * as CdnClient from 'tencentcloud-sdk-nodejs-cdn/tencentcloud/services/cdn/v20180606/cdn_client.js'

const origin = new URL(process.env.NUXT_PORTAL_ORIGIN)
if (origin.hostname !== 'cerotd.dancingcodes.cn') throw new Error('Unexpected portal origin')

const client = new CdnClient.Client({
  credential: {
    secretId: process.env.NUXT_COS_SECRET_ID,
    secretKey: process.env.NUXT_COS_SECRET_KEY
  },
  region: 'ap-beijing',
  profile: { httpProfile: { endpoint: 'cdn.tencentcloudapi.com' } }
})

const startTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
const response = await client.DescribePurgeTasks({
  PurgeType: 'path',
  StartTime: startTime,
  Keyword: `${origin.origin}/`,
  Limit: 20
})
const logs = (response.PurgeLogs || []).sort((a, b) => (b.CreateTime || '').localeCompare(a.CreateTime || ''))
const latestTaskId = logs[0]?.TaskId
if (!latestTaskId) throw new Error('No recent CDN directory refresh task was found')
const latest = logs.filter(log => log.TaskId === latestTaskId)
console.log(JSON.stringify({ purgeTaskId: latestTaskId, submittedAt: latest[0].CreateTime, statuses: latest.map(log => log.Status) }))

if (!process.argv.includes('--push')) process.exit(0)
if (!latest.every(log => log.Status === 'done')) throw new Error('Latest directory refresh has not completed; preheat was not submitted')

async function getPublishedSlugs(endpoint) {
  const response = await fetch(`https://cerotdadmin.dancingcodes.cn/api/${endpoint}`)
  if (!response.ok) throw new Error(`${endpoint} returned HTTP ${response.status}`)
  const payload = await response.json()
  if (payload.code !== 200 || !Array.isArray(payload.data?.items)) throw new Error(`${endpoint} returned unexpected data`)
  return payload.data.items.map(item => item.slug)
}

const [products, news] = await Promise.all([
  getPublishedSlugs('products'),
  getPublishedSlugs('news')
])
const paths = [
  '/', '/about', '/advantages', '/contact', '/news', '/products', '/services',
  ...products.map(slug => `/products/${encodeURIComponent(slug)}`),
  ...news.map(slug => `/news/${encodeURIComponent(slug)}`)
]
const urls = [...new Set(paths.map(path => new URL(path, origin).toString()))]
const preheat = await client.PushUrlsCache({ Urls: urls, Area: 'global' })
console.log(JSON.stringify({ preheatTaskId: preheat.TaskId, urls: urls.length, products: products.length, news: news.length }))
