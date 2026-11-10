export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin')
  const allowed = useRuntimeConfig(event).portalOrigin
  if (!allowed || origin !== allowed) throw createError({ statusCode: 403 })
  setHeader(event, 'Access-Control-Allow-Origin', allowed)
  setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
  setHeader(event, 'Vary', 'Origin')
  setResponseStatus(event, 204)
  return ''
})
