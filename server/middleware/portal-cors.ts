export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/contact')) return
  const allowed = useRuntimeConfig(event).portalOrigin
  const origin = getHeader(event, 'origin')
  if (!allowed || origin !== allowed) return
  setHeader(event, 'Access-Control-Allow-Origin', allowed)
  setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
  setHeader(event, 'Vary', 'Origin')
})
