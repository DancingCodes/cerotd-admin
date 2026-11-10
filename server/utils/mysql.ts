import { createPool, type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise'

type Params = Array<string | number | null>
type DbPool = Pool & {
  execute<T extends RowDataPacket[] | ResultSetHeader>(sql: string, params: Params): Promise<[T, unknown]>
  query<T extends RowDataPacket[]>(sql: string, params: Params): Promise<[T, unknown]>
}
let pool: DbPool | undefined
const retryableCodes = new Set(['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE'])
async function readWithRetry<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read()
  } catch (error) {
    if (!retryableCodes.has((error as { code?: string }).code || '')) throw error
    return read()
  }
}
function connection() {
  if (!pool) {
    const url = useRuntimeConfig().mysqlUrl
    if (!url) throw createError({ statusCode: 500, statusMessage: 'NUXT_MYSQL_URL is required' })
    pool = createPool({ uri: url, connectionLimit: 10, timezone: 'Z', dateStrings: true }) as DbPool
  }
  return pool
}

export const mysqlDb = {
  async one<T>(sql: string, params: Params = []): Promise<T | null> {
    const [rows] = await readWithRetry(() => connection().execute<RowDataPacket[]>(sql, params))
    return (rows[0] as T | undefined) ?? null
  },
  async list<T>(sql: string, params: Params = []): Promise<T[]> {
    const [rows] = await readWithRetry(() => connection().query<RowDataPacket[]>(sql, params))
    return rows as T[]
  },
  async execute(sql: string, params: Params = []): Promise<ResultSetHeader> {
    const [result] = await connection().execute<ResultSetHeader>(sql, params)
    return result
  }
}

export type MysqlDb = typeof mysqlDb
