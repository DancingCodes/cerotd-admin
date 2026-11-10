import type { MysqlDb } from './mysql'
import type { H3Event } from 'h3'

export function assertAdmin(event: H3Event, invalidTokenStatus = 401) {
  const fromRuntime = useRuntimeConfig(event).adminApiToken
  const token = fromRuntime

  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ADMIN_API_TOKEN is not configured'
    })
  }

  const header = getHeader(event, 'authorization') || ''
  if (header !== `Bearer ${token}`) {
    throw createError({ statusCode: invalidTokenStatus, statusMessage: 'Invalid token' })
  }
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const SLUG_TABLES = {
  products: true,
  news: true,
  products_categories: true,
  news_categories: true
} as const

type SlugTable = keyof typeof SLUG_TABLES

export async function allocateUniqueSlug(
  db: MysqlDb,
  table: SlugTable,
  source: string,
  fallbackPrefix: string
) {
  if (!SLUG_TABLES[table]) {
    throw createError({ statusCode: 500, statusMessage: 'invalid slug table' })
  }

  const fromSource = slugify(source)
  const base = fromSource || fallbackPrefix
  let candidate = base
  let index = 2

  while (true) {
    const existing = await db.one(`SELECT id FROM ${table} WHERE slug = ?`, [candidate])
    if (!existing) {
      return {
        slug: candidate,
        usedFallback: !fromSource
      }
    }
    candidate = `${base}-${index}`
    index += 1
    if (index > 1000) {
      throw createError({ statusCode: 500, statusMessage: 'unable to allocate unique slug' })
    }
  }
}

export async function finalizeFallbackSlug(
  db: MysqlDb,
  table: SlugTable,
  id: number,
  usedFallback: boolean,
  fallbackPrefix: string
) {
  if (!usedFallback) return null
  const nextSlug = `${fallbackPrefix}-${id}`
  const conflict = await db.one(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`, [nextSlug, id])
  if (conflict) return null
  await db.execute(`UPDATE ${table} SET slug = ? WHERE id = ?`, [nextSlug, id])
  return nextSlug
}
