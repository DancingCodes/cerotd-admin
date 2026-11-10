export function parsePagination(query: Record<string, unknown>) {
  const enabled = query.page != null || query.pageSize != null
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  const offset = (page - 1) * pageSize
  return { enabled, page, pageSize, offset }
}
