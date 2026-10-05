import 'server-only'
import { Pool, type PoolClient, type QueryResultRow } from 'pg'

let pool: Pool | undefined
export function databasePool() {
  const uri = process.env.DATABASE_URI
  if (!uri) throw new Error('Configure DATABASE_URI (conexão PostgreSQL do Supabase).')
  return pool ??= new Pool({ connectionString: uri, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 })
}
// Only trusted server services use this connection. Browser queries use Supabase Auth + RLS.
export async function transaction<T>(fn: (db: PoolClient) => Promise<T>, userId?: string) {
  const db = await databasePool().connect()
  try {
    await db.query(userId ? 'begin; set local role authenticated' : 'begin')
    if (userId) {
      await db.query("select set_config('request.jwt.claim.sub',$1,true)", [userId])
    }
    const value = await fn(db)
    await db.query('commit')
    return value
  } catch (error) { await db.query('rollback'); throw error }
  finally { db.release() }
}
export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
  return (await databasePool().query<T>(sql, params)).rows
}
