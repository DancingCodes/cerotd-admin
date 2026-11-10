export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const includeUnpublished = String(query.all || '') === '1'
  const categorySlug = typeof query.category === 'string' ? query.category.trim() : ''
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const status = String(query.status || 'all').trim().toLowerCase()
  const paging = parsePagination(query)

  if (includeUnpublished) {
    assertAdmin(event)
  }

  const where: string[] = []
  const binds: Array<string | number> = []

  if (!includeUnpublished) {
    where.push('p.is_published = 1')
  } else if (status === 'published') {
    where.push('p.is_published = 1')
  } else if (status === 'draft') {
    where.push('p.is_published = 0')
  }

  if (categorySlug) {
    where.push('c.slug = ?')
    binds.push(categorySlug)
  }

  if (q) {
    where.push('(p.name_en LIKE ? OR p.name_zh LIKE ? OR p.slug LIKE ?)')
    const like = '%' + q + '%'
    binds.push(like, like, like)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const orderSql = 'ORDER BY p.created_at DESC, p.id DESC'

  if (!paging.enabled) {
    const result = await mysqlDb.list<ProductRow>(`${productSelectSql}
        ${whereSql}
        ${orderSql}`, [...binds])
    return {
      items: result.map(mapProduct)
    }
  }

  const countRow = await mysqlDb.one<{ count: number }>(`SELECT COUNT(*) AS count
       FROM products p
       JOIN products_categories c ON c.id = p.category_id
       ${whereSql}`, [...binds])

  const total = Number(countRow?.count || 0)
  const result = await mysqlDb.list<ProductRow>(`${productSelectSql}
       ${whereSql}
       ${orderSql}
       LIMIT ? OFFSET ?`, [...binds, paging.pageSize, paging.offset])

  return {
    items: result.map(mapProduct),
    total,
    page: paging.page,
    pageSize: paging.pageSize
  }
})
