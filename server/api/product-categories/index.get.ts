import { productCategories } from '../../../shared/product-categories'

export default defineApiHandler(async (event) => {
  const paging = parsePagination(getQuery(event))
  if (paging.enabled) assertAdmin(event)

  const rows = await mysqlDb.list<{ id: number; slug: string }>('SELECT id, slug FROM products_categories')
  const ids = new Map(rows.map(row => [row.slug, row.id]))
  const items = productCategories.map((category, index) => ({
    id: ids.get(category.slug) ?? null,
    ...category,
    sortOrder: index + 1
  }))

  if (!paging.enabled) return { items }

  return {
    items: items.slice(paging.offset, paging.offset + paging.pageSize),
    total: items.length,
    page: paging.page,
    pageSize: paging.pageSize
  }
})
