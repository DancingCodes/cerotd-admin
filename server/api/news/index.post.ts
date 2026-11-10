type CreateNewsBody = {
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
  const body = await readBody<CreateNewsBody>(event)

  const titleEn = body.titleEn?.trim() || ''
  const titleZh = body.titleZh?.trim() || ''
  if (!titleEn || !titleZh) {
    throw createError({ statusCode: 500, statusMessage: 'titleEn and titleZh are required' })
  }

  let category = (body.category?.trim() || '').toLowerCase()
  if (!category) {
    const first = await mysqlDb.one<{ slug: string }>('SELECT slug FROM news_categories ORDER BY sort_order ASC, id ASC LIMIT 1')
    category = first?.slug || ''
  }
  const categoryRow = category ? await findNewsCategory(mysqlDb, category) : null
  if (!categoryRow) {
    throw createError({ statusCode: 500, statusMessage: 'Create a news category first.' })
  }

  const allocated = await allocateUniqueSlug(mysqlDb, 'news', titleEn, 'news')
  const slug = allocated.slug

  const isPublished = body.isPublished === true ? 1 : 0
  const publishedAt = body.publishedAt?.trim() || new Date().toISOString().slice(0, 19).replace('T', ' ')
  const contentEn = sanitizeNewsHtml(body.contentEn || '')
  const contentZh = sanitizeNewsHtml(body.contentZh || '')
  const coverUrl = body.coverUrl?.trim() || null

  const inserted = await mysqlDb.execute(`INSERT INTO news (
        slug, category, title_en, title_zh, summary_en, summary_zh, content_en, content_zh,
        cover_url, is_published, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [slug, category, titleEn, titleZh, body.summaryEn?.trim() || '', body.summaryZh?.trim() || '', contentEn, contentZh, coverUrl, isPublished, publishedAt])

  if (!inserted) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create news' })
  }

  await finalizeFallbackSlug(mysqlDb, 'news', inserted.insertId, allocated.usedFallback, 'news')

  const row = await mysqlDb.one<NewsRow>('SELECT * FROM news WHERE id = ?', [inserted.insertId])
  if (!row) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load created news' })
  }

  return mapNews(row)
})
