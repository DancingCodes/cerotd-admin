type UpdateNewsBody = {
  category?: string
  titleEn?: string
  titleZh?: string
  summaryEn?: string
  summaryZh?: string
  contentEn?: string
  contentZh?: string
  coverUrl?: string | null
  isPublished?: boolean
  publishedAt?: string
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const currentSlug = getRouterParam(event, 'slug')
  if (!currentSlug) {
    throw createError({ statusCode: 500, statusMessage: 'slug is required' })
  }

  const current = await mysqlDb.one<NewsRow>('SELECT * FROM news WHERE slug = ?', [currentSlug])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: 'News not found' })
  }

  const body = await readBody<UpdateNewsBody>(event)
  const titleEn = body.titleEn?.trim() ?? current.title_en
  const titleZh = body.titleZh?.trim() ?? current.title_zh
  const summaryEn = body.summaryEn?.trim() ?? current.summary_en
  const summaryZh = body.summaryZh?.trim() ?? current.summary_zh
  const contentEn = body.contentEn === undefined ? current.content_en : sanitizeNewsHtml(body.contentEn)
  const contentZh = body.contentZh === undefined ? current.content_zh : sanitizeNewsHtml(body.contentZh)
  const coverUrl = body.coverUrl === undefined ? current.cover_url : body.coverUrl?.trim() || null
  const publishedAt = body.publishedAt?.trim() || current.published_at
  const isPublished =
    body.isPublished === undefined ? current.is_published : body.isPublished ? 1 : 0

  const categoryRaw = body.category?.trim() || current.category
  const category = categoryRaw.toLowerCase()
  const categoryRow = await findNewsCategory(mysqlDb, category)
  if (!categoryRow) {
    throw createError({ statusCode: 500, statusMessage: 'Create a news category first.' })
  }

  if (!titleEn || !titleZh) {
    throw createError({ statusCode: 500, statusMessage: 'titleEn and titleZh are required' })
  }

  await mysqlDb.execute(`UPDATE news
       SET category = ?, title_en = ?, title_zh = ?, summary_en = ?, summary_zh = ?,
           content_en = ?, content_zh = ?, cover_url = ?, is_published = ?, published_at = ?,
           updated_at = UTC_TIMESTAMP()
       WHERE id = ?`, [category, titleEn, titleZh, summaryEn, summaryZh, contentEn, contentZh, coverUrl, isPublished, publishedAt, current.id])

  const updated = await mysqlDb.one<NewsRow>('SELECT * FROM news WHERE id = ?', [current.id])
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update news' })
  }

  return mapNews(updated)
})
