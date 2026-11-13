export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 500, statusMessage: '新闻标识不能为空。' })
  }

  const current = await mysqlDb.one('SELECT id FROM news WHERE slug = ?', [slug])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: '未找到新闻。' })
  }

  await mysqlDb.execute('DELETE FROM news WHERE slug = ?', [slug])
  return { ok: true }
})
