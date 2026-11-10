export default defineApiHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 500, statusMessage: 'slug is required' })
  }

  const query = getQuery(event)
  const includeUnpublished = String(query.all || '') === '1'
  if (includeUnpublished) {
    assertAdmin(event)
  }

  const row = includeUnpublished
    ? await mysqlDb.one<ProductRow>(`${productSelectSql} WHERE p.slug = ?`, [slug])
    : await mysqlDb.one<ProductRow>(`${productSelectSql} WHERE p.slug = ? AND p.is_published = 1`, [slug])

  if (!row) {
    throw createError({ statusCode: 500, statusMessage: 'Product not found' })
  }

  return mapProduct(row)
})
