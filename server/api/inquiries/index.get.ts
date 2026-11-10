export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const query = getQuery(event)
  const status = String(query.status || 'all').trim().toLowerCase()
  const range = String(query.range || 'all').trim().toLowerCase()
  const paging = parsePagination(query)

  const where: string[] = []
  if (status === 'unread') where.push('is_read = 0')
  if (status === 'read') where.push('is_read = 1')
  if (range === 'today') where.push('DATE(created_at) = UTC_DATE()')
  if (range === '7d') where.push('created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)')
  if (range === '30d') where.push('created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)')

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  type InquiryRow = {
    id: number
    name: string
    company: string
    email: string
    phone: string
    country: string
    im: string
    bulk_intent: string
    product_slug: string
    message: string
    locale: string
    is_read: number
    created_at: string
  }

  let total = 0
  let rows: InquiryRow[] = []

  if (paging.enabled) {
    const countRow = await mysqlDb.one<{ count: number }>(`SELECT COUNT(*) AS count FROM inquiries ${whereSql}`)
    total = Number(countRow?.count || 0)
    const result = await mysqlDb.list<InquiryRow>(`SELECT id, name, company, email, phone, country, im, bulk_intent, product_slug, message, locale, is_read, created_at
         FROM inquiries
         ${whereSql}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`, [paging.pageSize, paging.offset])
    rows = result
  } else {
    const result = await mysqlDb.list<InquiryRow>(`SELECT id, name, company, email, phone, country, im, bulk_intent, product_slug, message, locale, is_read, created_at
         FROM inquiries
         ${whereSql}
         ORDER BY created_at DESC, id DESC`)
    rows = result
    total = rows.length
  }

  const unreadRow = await mysqlDb.one<{ count: number }>('SELECT COUNT(*) AS count FROM inquiries WHERE is_read = 0')

  return {
    unreadCount: Number(unreadRow?.count || 0),
    total,
    page: paging.enabled ? paging.page : 1,
    pageSize: paging.enabled ? paging.pageSize : total,
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      company: row.company,
      email: row.email,
      phone: row.phone,
      country: row.country,
      im: row.im,
      bulkIntent: row.bulk_intent,
      productSlug: row.product_slug,
      message: row.message,
      locale: row.locale,
      isRead: row.is_read === 1,
      createdAt: row.created_at
    }))
  }
})
