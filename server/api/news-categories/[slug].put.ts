type UpdateNewsCategoryBody = {
  nameEn?: string
  nameZh?: string
  sortOrder?: number
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const currentSlug = getRouterParam(event, 'slug')
  if (!currentSlug) {
    throw createError({ statusCode: 500, statusMessage: '分类标识不能为空。' })
  }

  const current = await mysqlDb.one<NewsCategoryRow>('SELECT * FROM news_categories WHERE slug = ?', [currentSlug])

  if (!current) {
    throw createError({ statusCode: 500, statusMessage: '未找到新闻分类。' })
  }

  const body = await readBody<UpdateNewsCategoryBody>(event)
  const nameEn = body.nameEn?.trim() ?? current.name_en
  const nameZh = body.nameZh?.trim() ?? current.name_zh
  const sortOrder = body.sortOrder === undefined ? current.sort_order : Number(body.sortOrder)

  if (!nameEn || !nameZh) {
    throw createError({ statusCode: 500, statusMessage: '请填写英文名称和中文名称。' })
  }

  await mysqlDb.execute(`UPDATE news_categories
       SET name_en = ?, name_zh = ?, sort_order = ?, updated_at = UTC_TIMESTAMP()
       WHERE id = ?`, [nameEn, nameZh, sortOrder, current.id])
  const updated = await mysqlDb.one<NewsCategoryRow>('SELECT * FROM news_categories WHERE id = ?', [current.id])

  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: '更新新闻分类失败。' })
  }

  return mapNewsCategory(updated)
})
