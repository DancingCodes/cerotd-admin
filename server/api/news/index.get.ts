export default defineApiHandler(async (event) => {
  const query = getQuery(event)
  const includeUnpublished = String(query.all || '') === '1'
  const category = typeof query.category === 'string' ? query.category.trim() : ''
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const status = String(query.status || 'all').trim().toLowerCase()
  const paging = parsePagination(query)

  if (includeUnpublished) {
    assertAdmin(event)
  }

  const where: string[] = []
  const binds: Array<string | number> = []

  if (!includeUnpublished) {
    where.push('is_published = 1')
  } else if (status === 'published') {
    where.push('is_published = 1')
  } else if (status === 'draft') {
    where.push('is_published = 0')
  }

  if (category) {
    const found = await findNewsCategory(mysqlDb, category)
    if (!found) {
      throw createError({ statusCode: 500, statusMessage: 'invalid category' })
    }
    where.push('category = ?')
    binds.push(category)
  }

  if (q) {
    where.push('(title_en LIKE ? OR title_zh LIKE ? OR slug LIKE ?)')
    const like = '%' + q + '%'
    binds.push(like, like, like)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const orderSql = 'ORDER BY published_at DESC, id DESC'

  if (!paging.enabled) {
    const result = await mysqlDb.list<NewsRow>(`SELECT *
         FROM news
         ${whereSql}
         ${orderSql}`, [...binds])
    return {
      items: result.map(mapNews)
    }
  }

  const countRow = await mysqlDb.one<{ count: number }>(`SELECT COUNT(*) AS count FROM news ${whereSql}`, [...binds])
  const total = Number(countRow?.count || 0)

  const result = await mysqlDb.list<NewsRow>(`SELECT *
       FROM news
       ${whereSql}
       ${orderSql}
       LIMIT ? OFFSET ?`, [...binds, paging.pageSize, paging.offset])

  return {
    items: result.map(mapNews),
    total,
    page: paging.page,
    pageSize: paging.pageSize
  }
})
