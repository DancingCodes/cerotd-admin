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
    throw createError({ statusCode: 500, statusMessage: '新闻标识不能为空。' })
  }

  const current = await mysqlDb.one<NewsRow>('SELECT * FROM news WHERE slug = ?', [currentSlug])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: '未找到新闻。' })
  }

  const body = await readBody<UpdateNewsBody>(event)
  const titleEn = body.titleEn?.trim() ?? current.title_en
  const titleZh = body.titleZh?.trim() ?? current.title_zh
  const summaryEn = body.summaryEn?.trim() ?? current.summary_en
  const summaryZh = body.summaryZh?.trim() ?? current.summary_zh
  const contentEn = body.contentEn === undefined ? current.content_en : sanitizeNewsHtml(body.contentEn)
  const contentZh = body.contentZh === undefined ? current.content_zh : sanitizeNewsHtml(body.contentZh)
  const coverUrl = body.coverUrl === undefined ? current.cover_url : body.coverUrl?.trim() || null
  if (!coverUrl) {
    throw createError({ statusCode: 500, statusMessage: '请上传封面。' })
  }
  const publishedAt = body.publishedAt?.trim() || current.published_at
  const isPublished =
    body.isPublished === undefined ? current.is_published : body.isPublished ? 1 : 0

  const categoryRaw = body.category?.trim() || current.category
  const category = categoryRaw.toLowerCase()
  const categoryRow = await findNewsCategory(mysqlDb, category)
  if (!categoryRow) {
    throw createError({ statusCode: 500, statusMessage: '请先创建新闻分类。' })
  }

  if (!titleEn || !titleZh) {
    throw createError({ statusCode: 500, statusMessage: '请填写英文标题和中文标题。' })
  }

  await mysqlDb.execute(`UPDATE news
       SET category = ?, title_en = ?, title_zh = ?, summary_en = ?, summary_zh = ?,
           content_en = ?, content_zh = ?, cover_url = ?, is_published = ?, published_at = ?,
           updated_at = UTC_TIMESTAMP()
       WHERE id = ?`, [category, titleEn, titleZh, summaryEn, summaryZh, contentEn, contentZh, coverUrl, isPublished, publishedAt, current.id])

  const updated = await mysqlDb.one<NewsRow>('SELECT * FROM news WHERE id = ?', [current.id])
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: '更新新闻失败。' })
  }

  return mapNews(updated)
})
