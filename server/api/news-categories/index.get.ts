export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const paging = parsePagination(query)
  const orderSql = 'ORDER BY sort_order ASC, id ASC'

  if (!paging.enabled) {
    const sql = `SELECT * FROM news_categories ${orderSql}`
    const result = await mysqlDb.list<NewsCategoryRow>(sql)
    return {
      items: result.map(mapNewsCategory)
    }
  }

  const countRow = await mysqlDb.one<{ count: number }>('SELECT COUNT(*) AS count FROM news_categories')
  const total = Number(countRow?.count || 0)

  const result = await mysqlDb.list<NewsCategoryRow>(`SELECT * FROM news_categories
       ${orderSql}
       LIMIT ? OFFSET ?`, [paging.pageSize, paging.offset])

  return {
    items: result.map(mapNewsCategory),
    total,
    page: paging.page,
    pageSize: paging.pageSize
  }
})
