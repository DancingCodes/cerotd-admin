type UpdateNewsBody = {
  category?: string
  titleEn?: string
  titleZh?: string
  bodyEn?: string
  bodyZh?: string
  coverUrl?: string | null
  images?: string[]
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
  const bodyEn = body.bodyEn?.trim() ?? current.body_en
  const bodyZh = body.bodyZh?.trim() ?? current.body_zh
  const coverUrl = body.coverUrl === undefined ? current.cover_url : body.coverUrl?.trim() || null
  const images = body.images === undefined ? parseJsonArray(current.images_json) : Array.isArray(body.images)
    ? body.images.filter((url): url is string => typeof url === 'string' && url.trim().length > 0).map(url => url.trim())
    : []
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
       SET category = ?, title_en = ?, title_zh = ?, body_en = ?, body_zh = ?,
           cover_url = ?, images_json = ?, is_published = ?, published_at = ?,
           updated_at = UTC_TIMESTAMP()
       WHERE id = ?`, [category, titleEn, titleZh, bodyEn, bodyZh, coverUrl, JSON.stringify(images), isPublished, publishedAt, current.id])

  const updated = await mysqlDb.one<NewsRow>('SELECT * FROM news WHERE id = ?', [current.id])
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: '更新新闻失败。' })
  }

  return mapNews(updated)
})
