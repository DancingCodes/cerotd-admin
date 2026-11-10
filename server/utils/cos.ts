import COS from 'cos-nodejs-sdk-v5'

const TYPES = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'], ['image/gif', 'gif'], ['image/avif', 'avif']])
export function assertImageType(type: string) {
  if (!TYPES.has(type)) throw createError({ statusCode: 400, statusMessage: 'Unsupported image type' })
}
export function buildObjectKey(folder: string, type: string) {
  const safe = folder.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'uploads'
  return safe + '/' + crypto.randomUUID() + '.' + TYPES.get(type)
}
export async function uploadImage(key: string, data: Uint8Array, type: string) {
  const config = useRuntimeConfig()
  if (!config.cosSecretId || !config.cosSecretKey || !config.cosBucketUrl || !config.cosPublicBaseUrl) throw createError({ statusCode: 500, statusMessage: 'COS settings are incomplete' })
  const bucketUrl = new URL(config.cosBucketUrl)
  const match = /^([^.]+)\.cos\.([^.]+)\.myqcloud\.com$/.exec(bucketUrl.hostname)
  if (bucketUrl.protocol !== 'https:' || !match) throw createError({ statusCode: 500, statusMessage: 'Invalid COS bucket URL' })
  const bucket = match[1]!
  const region = match[2]!
  const cos = new COS({ SecretId: config.cosSecretId, SecretKey: config.cosSecretKey })
  await new Promise<void>((resolve, reject) => cos.putObject({ Bucket: bucket, Region: region, Key: key, Body: data, ContentType: type, CacheControl: 'public, max-age=31536000, immutable' }, error => error ? reject(error) : resolve()))
  return config.cosPublicBaseUrl.replace(/\/$/, '') + '/' + key.split('/').map(encodeURIComponent).join('/')
}
