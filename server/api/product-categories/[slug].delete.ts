export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 500, statusMessage: '分类标识不能为空。' })

  const current = await mysqlDb.one<{ id: number }>('SELECT id FROM products_categories WHERE slug = ?', [slug])
  if (!current) throw createError({ statusCode: 500, statusMessage: '未找到产品分类。' })

  const linked = await mysqlDb.one('SELECT id FROM products WHERE category_id = ? LIMIT 1', [current.id])
  if (linked) throw createError({ statusCode: 500, statusMessage: '该产品分类下还有产品，请先删除或移动产品。' })

  await mysqlDb.execute('DELETE FROM products_categories WHERE id = ?', [current.id])
  return { ok: true }
})
