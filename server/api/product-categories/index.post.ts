type CreateProductCategoryBody = {
  nameEn?: string
  nameZh?: string
  sortOrder?: number
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const body = await readBody<CreateProductCategoryBody>(event)
  const nameEn = body.nameEn?.trim() || ''
  const nameZh = body.nameZh?.trim() || ''
  if (!nameEn || !nameZh) {
    throw createError({ statusCode: 500, statusMessage: '请填写英文名称和中文名称。' })
  }

  const allocated = await allocateUniqueSlug(mysqlDb, 'products_categories', nameEn, 'product-category')
  const sortOrder = Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0
  const result = await mysqlDb.execute('INSERT INTO products_categories (slug, name_en, name_zh, sort_order) VALUES (?, ?, ?, ?)', [allocated.slug, nameEn, nameZh, sortOrder])
  const inserted = await mysqlDb.one<ProductCategoryRow>('SELECT * FROM products_categories WHERE id = ?', [result.insertId])

  if (!inserted) throw createError({ statusCode: 500, statusMessage: '创建产品分类失败。' })
  return mapProductCategory(inserted)
})
