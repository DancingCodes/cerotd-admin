export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 500, statusMessage: 'slug is required' })

  const current = await mysqlDb.one<{ id: number }>('SELECT id FROM products_categories WHERE slug = ?', [slug])
  if (!current) throw createError({ statusCode: 500, statusMessage: 'Product category not found' })

  const linked = await mysqlDb.one('SELECT id FROM products WHERE category_id = ? LIMIT 1', [current.id])
  if (linked) throw createError({ statusCode: 500, statusMessage: 'Product category has products. Delete or move them first.' })

  await mysqlDb.execute('DELETE FROM products_categories WHERE id = ?', [current.id])
  return { ok: true }
})
