export default defineApiHandler((event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  assertAdmin(event, 500)
  return { ok: true }
})
