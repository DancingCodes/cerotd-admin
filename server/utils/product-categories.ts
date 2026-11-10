import type { MysqlDb } from './mysql'
export async function resolveProductCategoryId(db: MysqlDb, slug: string) {
  const row = await db.one<{ id: number }>('SELECT id FROM products_categories WHERE slug = ?', [slug])

  if (!row) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to resolve product category' })
  }

  return row.id
}
