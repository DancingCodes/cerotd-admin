export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const paging = parsePagination(query)
  const orderSql = 'ORDER BY sort_order ASC, id ASC'

  if (!paging.enabled) {
    const result = await mysqlDb.list<ProductCategoryRow>(`SELECT * FROM products_categories ${orderSql}`)
    return { items: result.map(mapProductCategory) }
  }

  assertAdmin(event)
  const countRow = await mysqlDb.one<{ count: number }>('SELECT COUNT(*) AS count FROM products_categories')
  const total = Number(countRow?.count || 0)
  const result = await mysqlDb.list<ProductCategoryRow>(`SELECT * FROM products_categories ${orderSql} LIMIT ? OFFSET ?`, [paging.pageSize, paging.offset])

  return {
    items: result.map(mapProductCategory),
    total,
    page: paging.page,
    pageSize: paging.pageSize
  }
})
