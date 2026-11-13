export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 500, statusMessage: '分类标识不能为空。' })
  }

  const current = await mysqlDb.one<{ id: number }>('SELECT id FROM news_categories WHERE slug = ?', [slug])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: '未找到新闻分类。' })
  }

  const linked = await mysqlDb.one('SELECT id FROM news WHERE category = ? LIMIT 1', [slug])
  if (linked) {
    throw createError({ statusCode: 500, statusMessage: '该新闻分类下还有文章，请先删除或移动文章。' })
  }

  await mysqlDb.execute('DELETE FROM news_categories WHERE slug = ?', [slug])
  return { ok: true }
})
