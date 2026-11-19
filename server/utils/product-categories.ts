import type { MysqlDb } from './mysql'
export async function resolveProductCategoryId(db: MysqlDb, slug: string) {
  const row = await db.one<{ id: number }>('SELECT id FROM products_categories WHERE slug = ?', [slug])

  if (!row) {
    throw createError({ statusCode: 500, statusMessage: '未找到产品分类。' })
  }

  return row.id
}
