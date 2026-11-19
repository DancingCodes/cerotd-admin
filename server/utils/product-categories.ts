import type { MysqlDb } from './mysql'
import { productCategories } from '../../shared/product-categories'
export async function resolveProductCategoryId(db: MysqlDb, slug: string) {
  if (!productCategories.some(category => category.slug === slug)) {
    throw createError({ statusCode: 500, statusMessage: '请选择有效的产品分类。' })
  }
  const row = await db.one<{ id: number }>('SELECT id FROM products_categories WHERE slug = ?', [slug])

  if (!row) {
    throw createError({ statusCode: 500, statusMessage: '产品分类尚未写入数据库。' })
  }

  return row.id
}
