export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 500, statusMessage: 'slug is required' })
  }

  const current = await mysqlDb.one('SELECT id FROM news WHERE slug = ?', [slug])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: 'News not found' })
  }

  await mysqlDb.execute('DELETE FROM news WHERE slug = ?', [slug])
  return { ok: true }
})
