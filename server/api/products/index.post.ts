type CreateProductBody = {
  categorySlug?: string
  nameEn?: string
  nameZh?: string
  summaryEn?: string
  summaryZh?: string
  descriptionEn?: string
  descriptionZh?: string
  coverUrl?: string | null
  images?: string[]
  specsEn?: string[]
  specsZh?: string[]
  isPublished?: boolean
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody<CreateProductBody>(event)

  const nameEn = body.nameEn?.trim() || ''
  const nameZh = body.nameZh?.trim() || ''
  const categorySlug = body.categorySlug?.trim() || ''
  if (!nameEn || !nameZh) {
    throw createError({ statusCode: 500, statusMessage: 'nameEn and nameZh are required' })
  }
  if (!categorySlug) {
    throw createError({ statusCode: 500, statusMessage: 'categorySlug is required' })
  }

  const categoryId = await resolveProductCategoryId(mysqlDb, categorySlug)

  const allocated = await allocateUniqueSlug(mysqlDb, 'products', nameEn, 'product')
  const slug = allocated.slug

  const images = Array.isArray(body.images) ? body.images.map((item) => String(item).trim()).filter(Boolean) : []
  const specsEn = Array.isArray(body.specsEn) ? body.specsEn.map((item) => String(item).trim()).filter(Boolean) : []
  const specsZh = Array.isArray(body.specsZh) ? body.specsZh.map((item) => String(item).trim()).filter(Boolean) : []
  const coverUrl = body.coverUrl ?? images[0] ?? null
  const isPublished = body.isPublished === false ? 0 : 1

  const inserted = await mysqlDb.execute(`INSERT INTO products (
        slug, category_id, name_en, name_zh, summary_en, summary_zh, description_en, description_zh,
        cover_url, images_json, specs_en_json, specs_zh_json, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [slug, categoryId, nameEn, nameZh, body.summaryEn?.trim() || '', body.summaryZh?.trim() || '', body.descriptionEn?.trim() || '', body.descriptionZh?.trim() || '', coverUrl, JSON.stringify(images), JSON.stringify(specsEn), JSON.stringify(specsZh), isPublished])

  if (!inserted) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create product' })
  }

  await finalizeFallbackSlug(mysqlDb, 'products', inserted.insertId, allocated.usedFallback, 'product')

  const row = await mysqlDb.one<ProductRow>(`${productSelectSql} WHERE p.id = ?`, [inserted.insertId])

  if (!row) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load created product' })
  }

  return mapProduct(row)
})
