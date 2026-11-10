export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 500, statusMessage: 'slug is required' })
  }

  const current = await mysqlDb.one('SELECT id FROM products WHERE slug = ?', [slug])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: 'Product not found' })
  }

  await mysqlDb.execute('DELETE FROM products WHERE slug = ?', [slug])
  return { ok: true }
})
