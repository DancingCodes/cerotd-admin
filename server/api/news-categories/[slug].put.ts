type UpdateNewsCategoryBody = {
  nameEn?: string
  nameZh?: string
  sortOrder?: number
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const currentSlug = getRouterParam(event, 'slug')
  if (!currentSlug) {
    throw createError({ statusCode: 500, statusMessage: 'slug is required' })
  }

  const current = await mysqlDb.one<NewsCategoryRow>('SELECT * FROM news_categories WHERE slug = ?', [currentSlug])

  if (!current) {
    throw createError({ statusCode: 500, statusMessage: 'News category not found' })
  }

  const body = await readBody<UpdateNewsCategoryBody>(event)
  const nameEn = body.nameEn?.trim() ?? current.name_en
  const nameZh = body.nameZh?.trim() ?? current.name_zh
  const sortOrder = body.sortOrder === undefined ? current.sort_order : Number(body.sortOrder)

  if (!nameEn || !nameZh) {
    throw createError({ statusCode: 500, statusMessage: 'nameEn and nameZh are required' })
  }

  await mysqlDb.execute(`UPDATE news_categories
       SET name_en = ?, name_zh = ?, sort_order = ?, updated_at = UTC_TIMESTAMP()
       WHERE id = ?`, [nameEn, nameZh, sortOrder, current.id])
  const updated = await mysqlDb.one<NewsCategoryRow>('SELECT * FROM news_categories WHERE id = ?', [current.id])

  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update news category' })
  }

  return mapNewsCategory(updated)
})
