import type { MysqlDb } from './mysql'

export type ProductRow = {
  id: number
  slug: string
  category_id: number
  name_en: string
  name_zh: string
  summary_en: string
  summary_zh: string
  description_en: string
  description_zh: string
  cover_url: string | null
  images_json: string
  specs_en_json: string
  specs_zh_json: string
  is_published: number
  created_at: string
  updated_at: string
  category_slug?: string
  category_name_en?: string
  category_name_zh?: string
}


export type NewsRow = {
  id: number
  slug: string
  category: string
  title_en: string
  title_zh: string
  summary_en: string
  summary_zh: string
  content_en: string
  content_zh: string
  cover_url: string | null
  is_published: number
  published_at: string
  created_at: string
  updated_at: string
}

export function parseJsonArray(input: string | null | undefined) {
  if (!input) return [] as string[]
  try {
    const value = JSON.parse(input)
    return Array.isArray(value) ? value.map((item) => String(item)) : []
  } catch {
    return [] as string[]
  }
}

export function mapProduct(row: ProductRow) {
  const images = parseJsonArray(row.images_json)
  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.category_id,
    category: row.category_slug
      ? {
          slug: row.category_slug,
          name: {
            en: row.category_name_en || '',
            zh: row.category_name_zh || ''
          }
        }
      : null,
    name: {
      en: row.name_en,
      zh: row.name_zh
    },
    summary: {
      en: row.summary_en,
      zh: row.summary_zh
    },
    description: {
      en: row.description_en,
      zh: row.description_zh
    },
    coverUrl: row.cover_url || images[0] || null,
    images,
    specs: {
      en: parseJsonArray(row.specs_en_json),
      zh: parseJsonArray(row.specs_zh_json)
    },
    isPublished: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const productSelectSql = `SELECT
  p.*,
  c.slug AS category_slug,
  c.name_en AS category_name_en,
  c.name_zh AS category_name_zh
FROM products p
JOIN products_categories c ON c.id = p.category_id`

export type ProductCategoryRow = {
  id: number
  slug: string
  name_en: string
  name_zh: string
  sort_order: number
  created_at: string
  updated_at: string
}

export function mapProductCategory(row: ProductCategoryRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: {
      en: row.name_en,
      zh: row.name_zh
    },
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export type NewsCategoryRow = {
  id: number
  slug: string
  name_en: string
  name_zh: string
  sort_order: number
  created_at: string
  updated_at: string
}

export function mapNewsCategory(row: NewsCategoryRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: {
      en: row.name_en,
      zh: row.name_zh
    },
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export async function findNewsCategory(db: MysqlDb, slug: string) {
  return db.one<NewsCategoryRow>('SELECT * FROM news_categories WHERE slug = ?', [slug])
}

export function mapNews(row: NewsRow) {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: {
      en: row.title_en,
      zh: row.title_zh
    },
    summary: {
      en: row.summary_en,
      zh: row.summary_zh
    },
    content: {
      en: row.content_en,
      zh: row.content_zh
    },
    coverUrl: row.cover_url,
    isPublished: row.is_published === 1,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
