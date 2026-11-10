export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain')
  return 'User-agent: *\nDisallow: /\n'
})
