export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 500, statusMessage: '产品标识不能为空。' })
  }

  const current = await mysqlDb.one('SELECT id FROM products WHERE slug = ?', [slug])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: '未找到产品。' })
  }

  await mysqlDb.execute('DELETE FROM products WHERE slug = ?', [slug])
  return { ok: true }
})
