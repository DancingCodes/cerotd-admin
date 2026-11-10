type CreateNewsCategoryBody = {
  nameEn?: string
  nameZh?: string
  sortOrder?: number
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody<CreateNewsCategoryBody>(event)

  const nameEn = body.nameEn?.trim() || ''
  const nameZh = body.nameZh?.trim() || ''
  if (!nameEn || !nameZh) {
    throw createError({ statusCode: 500, statusMessage: 'nameEn and nameZh are required' })
  }

  const allocated = await allocateUniqueSlug(mysqlDb, 'news_categories', nameEn, 'news-category')
  const slug = allocated.slug

  const sortOrder = Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0

  const result = await mysqlDb.execute(`INSERT INTO news_categories (slug, name_en, name_zh, sort_order)
       VALUES (?, ?, ?, ?)`, [slug, nameEn, nameZh, sortOrder])
  const inserted = await mysqlDb.one<NewsCategoryRow>('SELECT * FROM news_categories WHERE id = ?', [result.insertId])

  if (!inserted) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create news category' })
  }

  let row = inserted
  if (allocated.usedFallback) {
    await finalizeFallbackSlug(mysqlDb, 'news_categories', inserted.id, true, 'news-category')
    row = (await mysqlDb.one<NewsCategoryRow>('SELECT * FROM news_categories WHERE id = ?', [inserted.id])) || inserted
  }

  return mapNewsCategory(row)
})
