import nextEnv from '@next/env'
import assert from 'node:assert/strict'
import { Pool } from 'pg'

nextEnv.loadEnvConfig(process.cwd())
const uri = process.env.DATABASE_URI
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!uri || !url || !key) throw new Error('Configure DATABASE_URI e as variáveis públicas do Supabase.')

// Read-only checks. Never print identities, credentials or row contents.
const pool = new Pool({ connectionString: uri, max: 1, connectionTimeoutMillis: 10000 })
try {
  const db = await pool.connect()
  try {
    await db.query('begin read only')
    const { rows: tables } = await db.query(`select c.relname,c.relrowsecurity from pg_class c
      join pg_namespace n on n.oid=c.relnamespace where n.nspname='connect' and c.relkind='r'`)
    assert(tables.length > 30, 'Estrutura incompleta')
    assert(tables.every(t => t.relrowsecurity), 'Tabela sem RLS')
    const { rows: legacyExposure } = await db.query(`select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and not c.relrowsecurity
      and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT'))`)
    const { rows: migrations } = await db.query('select name from private.connect_migrations order by name')
    const { rows: roles } = await db.query('select role,count(*)::int count from connect.user_roles group by role')
    assert.equal(roles.find(r => r.role === 'owner')?.count, 1, 'Owner único não importado')
    const { rows: [counts] } = await db.query(`select
      (select count(*)::int from public.users) legacy_users,
      (select count(*)::int from connect.profiles) profiles,
      (select count(*)::int from connect.meeting_rooms) rooms,
      (select count(*)::int from connect.meetings) meetings,
      (select count(*)::int from public.meeting_logs) legacy_attendance,
      (select count(*)::int from connect.meeting_attendance_sessions) attendance,
      (select count(*)::int from connect.form_submissions) submissions,
      (select count(*)::int from connect.form_assignments where meeting_id is not null) reflections,
      (select count(*)::int from connect.products) products,
      (select count(*)::int from connect.meeting_attendance_sessions where meeting_id is null) unlinked_legacy_attendance,
      (select count(*)::int from connect.user_journeys j join private.legacy_entity_map m on m.new_id=j.user_id and m.entity_type='users'
        join public.users u on u.id::text=m.legacy_id where j.trial_started_at<>u.created_at or j.trial_ends_at<>u.created_at+interval '30 days') changed_trial_dates`)
    assert.equal(counts.profiles, counts.legacy_users, 'Contagem de usuários divergente')
    assert.equal(counts.attendance, counts.legacy_attendance, 'Contagem de presenças divergente')
    assert.equal(counts.changed_trial_dates, 0, 'Trial histórico divergente')
    const { rows: members } = await db.query(`select p.id from connect.profiles p where not p.is_blocked
      and not exists(select 1 from connect.user_roles r where r.user_id=p.id and r.role in('owner','admin')) limit 1`)
    assert(members.length, 'Nenhum membro para validar isolamento')
    await db.query('set local role authenticated')
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [members[0].id])
    const { rows: visible } = await db.query('select id from connect.profiles')
    assert.equal(visible.length, 1, 'RLS de perfil não isolou o membro')
    assert.equal(visible[0].id, members[0].id)
    const { rows: [privileges] } = await db.query(`select
      has_table_privilege(current_user,'private.zoom_credentials','SELECT') private_read,
      has_table_privilege(current_user,'connect.user_roles','INSERT') roles_write,
      has_table_privilege(current_user,'connect.user_journeys','UPDATE') trial_write`)
    assert.deepEqual(privileges, { private_read: false, roles_write: false, trial_write: false })
    await db.query('rollback')
    console.log(JSON.stringify({ migrations: migrations.map(m => m.name), tablesWithRLS: tables.length, counts, memberIsolation: 'ok', protectedWrites: 'ok', legacyTablesExposedWithoutRLS: legacyExposure.map(t => t.relname) }, null, 2))
    assert.equal(legacyExposure.length, 0, 'Tabelas legadas ainda expostas sem RLS')
  } catch (error) { await db.query('rollback'); throw error }
  finally { db.release() }

  const headers = { apikey: key }
  const settings = await fetch(`${url}/auth/v1/settings`, { headers, signal: AbortSignal.timeout(15000) })
  assert.equal(settings.status, 200, 'Auth indisponível')
  const auth = await settings.json()
  assert.equal(auth.external?.zoom, true, 'Provedor Zoom desativado')
  const rest = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
    headers: { ...headers, 'Accept-Profile': 'connect' }, signal: AbortSignal.timeout(15000),
  })
  const body = await rest.json()
  assert.notEqual(body.code, 'PGRST106', 'Schema connect ainda não está exposto na Data API')
  assert([401, 403].includes(rest.status), 'Acesso anônimo deve ser negado')
  console.log('Auth Zoom: ativo. Data API connect: acessível e protegida contra acesso anônimo.')
} finally { await pool.end() }
