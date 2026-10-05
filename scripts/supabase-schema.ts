import nextEnv from '@next/env'
import { Pool } from 'pg'
import { readFileSync,readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

nextEnv.loadEnvConfig(process.cwd())
const apply=process.argv.includes('--apply')
const inspect=process.argv.includes('--inspect')
const uri=process.env.DATABASE_URI
if(!uri) throw new Error('Configure DATABASE_URI.')
const pool=new Pool({connectionString:uri,connectionTimeoutMillis:10000,max:1})
try {
  const db=await pool.connect()
  try {
    if(inspect) {
      const {rows}=await db.query(`select table_schema,table_name from information_schema.tables where table_schema in ('public','connect','private') and table_type='BASE TABLE' order by 1,2`)
      console.log(JSON.stringify({host:new URL(uri).hostname,tables:rows},null,2))
    } else {
      const folder=new URL('../supabase/migrations/',import.meta.url)
      const files=readdirSync(folder).filter(f=>f.endsWith('.sql')).sort()
      const {rows:[state]}=await db.query("select to_regclass('private.connect_migrations') is not null as initialized")
      const applied=new Map<string,string>()
      if(state.initialized) for(const row of (await db.query('select name,checksum from private.connect_migrations')).rows) applied.set(row.name,row.checksum)
      for(const name of files) {
        const sql=readFileSync(new URL(name,folder),'utf8')
        const checksum=createHash('sha256').update(sql).digest('hex')
        if(applied.has(name)) {
          if(applied.get(name)!==checksum) throw new Error(`Migration already applied with another checksum: ${name}`)
          console.log('applied',name); continue
        }
        console.log(apply?'applying':'pending',name)
        if(!apply) continue
        await db.query('begin')
        try {
          await db.query("select pg_advisory_xact_lock(hashtext('connect-schema-migrations'))")
          await db.query(sql)
          await db.query('create table if not exists private.connect_migrations(name text primary key,checksum text not null,applied_at timestamptz not null default now())')
          await db.query('insert into private.connect_migrations(name,checksum) values($1,$2)',[name,checksum])
          await db.query('commit')
        } catch(error) { await db.query('rollback'); throw error }
      }
      if(!apply) console.log('Somente inspeção. Use --apply para aplicar as migrations pendentes.')
    }
  } finally { db.release() }
} finally { await pool.end() }
