type UpdateProductCategoryBody = {
  nameEn?: string
  nameZh?: string
  sortOrder?: number
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 500, statusMessage: '分类标识不能为空。' })

  const current = await mysqlDb.one<ProductCategoryRow>('SELECT * FROM products_categories WHERE slug = ?', [slug])
  if (!current) throw createError({ statusCode: 500, statusMessage: '未找到产品分类。' })

  const body = await readBody<UpdateProductCategoryBody>(event)
  const nameEn = body.nameEn?.trim() ?? current.name_en
  const nameZh = body.nameZh?.trim() ?? current.name_zh
  const sortOrder = body.sortOrder === undefined ? current.sort_order : Number(body.sortOrder)
  if (!nameEn || !nameZh) throw createError({ statusCode: 500, statusMessage: '请填写英文名称和中文名称。' })

  await mysqlDb.execute(`UPDATE products_categories
      SET name_en = ?, name_zh = ?, sort_order = ?, updated_at = UTC_TIMESTAMP()
      WHERE id = ?`, [nameEn, nameZh, sortOrder, current.id])
  const updated = await mysqlDb.one<ProductCategoryRow>('SELECT * FROM products_categories WHERE id = ?', [current.id])

  if (!updated) throw createError({ statusCode: 500, statusMessage: '更新产品分类失败。' })
  return mapProductCategory(updated)
})
