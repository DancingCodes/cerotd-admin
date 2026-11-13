type UpdateProductBody = {
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
  const currentSlug = getRouterParam(event, 'slug')
  if (!currentSlug) {
    throw createError({ statusCode: 500, statusMessage: '产品标识不能为空。' })
  }

  const current = await mysqlDb.one<ProductRow>(`${productSelectSql} WHERE p.slug = ?`, [currentSlug])

  if (!current) {
    throw createError({ statusCode: 500, statusMessage: '未找到产品。' })
  }

  const body = await readBody<UpdateProductBody>(event)
  const nameEn = body.nameEn?.trim() ?? current.name_en
  const nameZh = body.nameZh?.trim() ?? current.name_zh
  const summaryEn = body.summaryEn?.trim() ?? current.summary_en
  const summaryZh = body.summaryZh?.trim() ?? current.summary_zh
  const descriptionEn = body.descriptionEn?.trim() ?? current.description_en
  const descriptionZh = body.descriptionZh?.trim() ?? current.description_zh
  const isPublished =
    body.isPublished === undefined ? current.is_published : body.isPublished ? 1 : 0

  let categoryId = current.category_id
  if (body.categorySlug?.trim()) {
    categoryId = await resolveProductCategoryId(mysqlDb, body.categorySlug.trim())
  }

  const images =
    body.images === undefined
      ? parseJsonArray(current.images_json)
      : body.images.map((item) => String(item).trim()).filter(Boolean)
  const specsEn =
    body.specsEn === undefined
      ? parseJsonArray(current.specs_en_json)
      : body.specsEn.map((item) => String(item).trim()).filter(Boolean)
  const specsZh =
    body.specsZh === undefined
      ? parseJsonArray(current.specs_zh_json)
      : body.specsZh.map((item) => String(item).trim()).filter(Boolean)
  const coverUrl =
    body.coverUrl === undefined ? current.cover_url || images[0] || null : body.coverUrl || images[0] || null

  if (!nameEn || !nameZh) {
    throw createError({ statusCode: 500, statusMessage: '请填写英文名称和中文名称。' })
  }

  await mysqlDb.execute(`UPDATE products
       SET category_id = ?, name_en = ?, name_zh = ?, summary_en = ?, summary_zh = ?,
           description_en = ?, description_zh = ?, cover_url = ?, images_json = ?, specs_en_json = ?,
           specs_zh_json = ?, is_published = ?, updated_at = UTC_TIMESTAMP()
       WHERE id = ?`, [categoryId, nameEn, nameZh, summaryEn, summaryZh, descriptionEn, descriptionZh, coverUrl, JSON.stringify(images), JSON.stringify(specsEn), JSON.stringify(specsZh), isPublished, current.id])

  const updated = await mysqlDb.one<ProductRow>(`${productSelectSql} WHERE p.id = ?`, [current.id])

  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: '更新产品失败。' })
  }

  return mapProduct(updated)
})
