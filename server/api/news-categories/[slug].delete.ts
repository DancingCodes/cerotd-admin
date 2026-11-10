export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 500, statusMessage: 'slug is required' })
  }

  const current = await mysqlDb.one<{ id: number }>('SELECT id FROM news_categories WHERE slug = ?', [slug])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: 'News category not found' })
  }

  const linked = await mysqlDb.one('SELECT id FROM news WHERE category = ? LIMIT 1', [slug])
  if (linked) {
    throw createError({ statusCode: 500, statusMessage: 'News category has articles. Delete or move them first.' })
  }

  await mysqlDb.execute('DELETE FROM news_categories WHERE slug = ?', [slug])
  return { ok: true }
})
