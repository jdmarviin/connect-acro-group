import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { persistZoomEvent } from '../src/lib/supabase/process-event'
import { withoutProviderTokens } from '../src/lib/supabase/cookies'
import { createChunks,stringToBase64URL,stringFromBase64URL } from '@supabase/ssr'
import type { PoolClient } from 'pg'
import type { ZoomEvent } from '../src/lib/zoom-webhook'

const alice = '10000000-0000-4000-8000-000000000001'
const bob = '10000000-0000-4000-8000-000000000002'
const owner = '10000000-0000-4000-8000-000000000003'
async function setup() {
  const db = new PGlite()
  // Only the Supabase-managed Auth environment is stubbed. Application SQL is unmodified.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table public.users(id uuid primary key);
    grant all on public.users to anon,authenticated;
    create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to authenticated,anon,service_role;
    grant execute on function auth.uid() to authenticated,anon,service_role;
  `)
  const folder = new URL('../supabase/migrations/', import.meta.url)
  for (const file of readdirSync(folder).filter(f => f.endsWith('.sql')).sort()) {
    try { await db.exec(readFileSync(new URL(file, folder), 'utf8')) }
    catch (error) { throw new Error(`Migration failed: ${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error }) }
  }
  for (const [id, email] of [[alice,'alice@example.test'],[bob,'bob@example.test'],[owner,'owner@example.test']]) {
    await db.query('insert into auth.users(id,email) values($1,$2)', [id,email])
  }
  await db.query("insert into connect.user_roles(user_id,role) values($1,'owner')", [owner])
  return db
}
async function asUser<T>(db: PGlite, id: string, fn: () => Promise<T>) {
  await db.exec('begin; set local role authenticated;')
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id])
  try { const result = await fn(); await db.exec('commit'); return result }
  catch (error) { await db.exec('rollback'); throw error }
}
const validOnboarding = {
  operatesInFinancialMarket: 'no', tradingKnowledgeTime: '1 mês', tookCoursesBefore: 'no',
  currentProfession: 'Designer', availableTime: '2 horas', mainGoal: 'Aprender',
  tradingIntention: 'extra_income', biggestDifficulty: 'Gestão', expectations30Days: 'Disciplina',
}

test('Supabase migrations: RLS isolation, immutable trial, protected roles and private secrets', async () => {
  const db = await setup()
  try {
    await asUser(db, alice, async () => {
      assert.equal((await db.query('select * from connect.profiles')).rows.length, 1)
      assert.equal((await db.query('select * from connect.user_journeys')).rows.length, 1)
    })
    for (const sql of [
      "update connect.profiles set is_blocked=true",
      "update connect.user_journeys set trial_ends_at=now()+interval '90 days'",
      "insert into connect.user_roles(user_id,role) values(auth.uid(),'admin')",
      'select * from private.zoom_credentials',
      'select * from private.integration_events',
      "insert into connect.meeting_attendance_sessions(session_key) values('fake')",
      "delete from connect.profiles",
    ]) await assert.rejects(asUser(db, alice, () => db.exec(sql)), /permission denied/)
    await asUser(db, owner, async () => assert.equal((await db.query('select * from connect.profiles')).rows.length, 3))
    await assert.rejects(db.query("insert into connect.user_roles(user_id,role) values($1,'owner')",[bob]), /duplicate/)
    await assert.rejects(db.query("delete from connect.user_roles where user_id=$1 and role='owner'",[owner]), /Owner/)
    const missing = await db.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='connect' and c.relkind='r' and not relrowsecurity")
    assert.equal(missing.rows.length,0)
  } finally { await db.close() }
})

test('retired Payload tables are not exposed through the public API', async () => {
  const db = await setup()
  try {
    await assert.rejects(asUser(db, alice, () => db.query('select * from public.users')), /permission denied/)
    await db.exec('set role anon')
    await assert.rejects(db.query('select * from public.users'), /permission denied/)
    await db.exec('reset role')
    assert.equal((await db.query('select * from public.users')).rows.length, 0)
  } finally { await db.close() }
})

test('historical rounded minutes are preserved without losing exact seconds', async () => {
  const db = await setup()
  try {
    await db.query(`insert into connect.meeting_attendance_sessions(user_id,session_key,participant_role_snapshot,joined_at,left_at,legacy_duration_minutes)
      values($1,'rounded-history','member','2026-09-09T04:15:17Z','2026-09-09T04:58:06Z',43),
      ($1,'new-session','member','2026-10-01T10:00:00Z','2026-10-01T10:00:15Z',null)`, [alice])
    const { rows: [historical] } = await db.query<{duration_seconds:string}>("select duration_seconds from connect.meeting_attendance_sessions where session_key='rounded-history'")
    assert.equal(Number(historical.duration_seconds), 2569)
    await asUser(db, alice, async () => {
      const { rows: [summary] } = await db.query<{duration_seconds:string}>('select duration_seconds from connect.meeting_attendance_summary')
      assert.equal(Number(summary.duration_seconds), 43 * 60 + 15)
    })
  } finally { await db.close() }
})

test('onboarding validates all answers atomically and cannot be submitted twice', async () => {
  const db = await setup()
  try {
    const { rows: [assignment] } = await db.query<{id:string}>('select id from connect.form_assignments where meeting_id is null')
    await assert.rejects(asUser(db, alice, () => db.query('select connect.submit_form($1,$2,$3)',[assignment.id,{},'+5511999999999'])), /Required/)
    assert.equal((await db.query('select * from connect.form_submissions')).rows.length,0)
    await asUser(db, alice, () => db.query('select connect.submit_form($1,$2,$3)',[assignment.id,validOnboarding,'+5511999999999']))
    assert.equal((await db.query('select * from connect.form_answers')).rows.length,9)
    assert.ok((await db.query<{onboarding_completed_at:string}>('select onboarding_completed_at from connect.user_journeys where user_id=$1',[alice])).rows[0].onboarding_completed_at)
    await assert.rejects(asUser(db, alice, () => db.query('select connect.submit_form($1,$2,$3)',[assignment.id,validOnboarding,'+5511999999999'])), /already submitted/i)
    await asUser(db,bob,async()=>assert.equal((await db.query('select * from connect.form_answers')).rows.length,0))
    await assert.rejects(db.exec("update connect.form_questions set label='{}'"), /immutable/)
  } finally { await db.close() }
})

test('daily reflection requires completed attendance and is private to the participant', async () => {
  const db = await setup()
  try {
    const {rows:[room]}=await db.query<{id:string}>("insert into connect.meeting_rooms(host_user_id,external_meeting_id,room_type,title) values($1,'123456789','personal','Sala') returning id",[owner])
    const {rows:[meeting]}=await db.query<{id:string}>("insert into connect.meetings(room_id,title,status,external_uuid) values($1,'Sessão','ended','occurrence-1') returning id",[room.id])
    await db.query("update connect.meetings set status='ended' where id=$1",[meeting.id])
    assert.equal((await db.query('select * from connect.form_assignments where meeting_id=$1',[meeting.id])).rows.length,0)
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at,left_at) values($1,$2,'session-1','member',now()-interval '15 seconds',now())",[meeting.id,alice])
    const {rows:[assignment]}=await db.query<{id:string}>('select id from connect.form_assignments where meeting_id=$1',[meeting.id])
    await assert.rejects(asUser(db,bob,()=>db.query('select connect.submit_form($1,$2)',[assignment.id,{learned_today:'Disciplina'}])), /unavailable/)
    assert.equal(Number((await db.query<{duration_seconds:string}>("select duration_seconds from connect.meeting_attendance_sessions")).rows[0].duration_seconds),15)
    await db.query("update connect.meeting_attendance_sessions set participant_name='Alice'")
    assert.equal((await db.query('select * from connect.notifications')).rows.length,1)
    await asUser(db,alice,()=>db.query('select connect.submit_form($1,$2)',[assignment.id,{learned_today:'Disciplina'}]))
    await asUser(db,bob,async()=>assert.equal((await db.query('select * from connect.notifications')).rows.length,0))
  } finally { await db.close() }
})

test('ten reconnects and multiple meetings produce one daily questionnaire, with a new one next day', async () => {
  const db = await setup()
  try {
    const {rows:[room]} = await db.query<{id:string}>("insert into connect.meeting_rooms(host_user_id,external_meeting_id,room_type,title) values($1,'987654321','personal','Sala') returning id",[owner])
    const {rows:[meeting]} = await db.query<{id:string}>("insert into connect.meetings(room_id,title,status) values($1,'Sessão','live') returning id",[room.id])
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at) values($1,$2,'open','member','2026-10-06T10:00:00Z')",[meeting.id,alice])
    assert.equal((await db.query('select * from connect.form_assignments where reflection_day is not null')).rows.length,0)
    await asUser(db,alice,async()=>assert.equal((await db.query('select * from connect.form_assignments where meeting_id is not null')).rows.length,0))
    await db.query("update connect.meeting_attendance_sessions set left_at='2026-10-06T10:10:00Z' where session_key='open'")
    for (let i=0;i<10;i++) await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at,left_at) values($1,$2,$3,'member','2026-10-06T11:00:00Z','2026-10-06T11:10:00Z')",[meeting.id,alice,`reconnect-${i}`])
    const {rows:[second]} = await db.query<{id:string}>("insert into connect.meetings(room_id,title,status,actual_ended_at) values($1,'Segunda sessão','ended','2026-10-06T14:00:00Z') returning id",[room.id])
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at) values($1,$2,'ended-session','member','2026-10-06T13:00:00Z')",[second.id,alice])
    const {rows:assignments} = await db.query<{id:string}>('select id from connect.form_assignments where reflection_day is not null')
    assert.equal(assignments.length,1)
    assert.equal((await db.query("select * from connect.notifications where event_type='form_available'")).rows.length,1)
    await asUser(db,alice,()=>db.query('select connect.submit_form($1,$2)',[assignments[0].id,{learned_today:'Disciplina'}]))
    await assert.rejects(asUser(db,alice,()=>db.query('select connect.submit_form($1,$2)',[assignments[0].id,{learned_today:'Outra resposta'}])),/Already submitted/)
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at,left_at) values($1,$2,'next-day','member','2026-10-07T03:01:00Z','2026-10-07T03:02:00Z')",[meeting.id,alice])
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at,left_at) values($1,$2,'bob','member','2026-10-06T11:00:00Z','2026-10-06T11:10:00Z')",[meeting.id,bob])
    assert.equal((await db.query('select * from connect.form_assignments where reflection_day is not null')).rows.length,3)
    await asUser(db,bob,async()=>assert.equal((await db.query('select * from connect.form_assignments where reflection_day is not null')).rows.length,1))
    await asUser(db,alice,async()=>assert.equal((await db.query('select * from connect.form_assignments where reflection_day is not null')).rows.length,2))
  } finally { await db.close() }
})

test('actual Supabase webhook processor: retries, reconnects and out-of-order events',async()=>{
 const db=await setup()
 try {
  await db.query("insert into connect.meeting_rooms(host_user_id,external_meeting_id,room_type,title) values($1,'123456789','personal','Sala')",[owner])
  await db.query('update connect.profiles set zoom_user_id=$2 where id=$1',[alice,'zoom-alice'])
  let n=0
  const handle=async(body:ZoomEvent,key=String(++n))=>{
   await db.exec('begin')
   try {const result=await persistZoomEvent(db as unknown as Pick<PoolClient,'query'>,body,key);await db.exec('commit');return result}
   catch(error){await db.exec('rollback');throw error}
  }
  const event=(name:string,participant?:ZoomEvent['payload']['object']['participant']):ZoomEvent=>({
   event:name,payload:{object:{id:'123456789',uuid:'real-occurrence',...(name==='meeting.started'?{start_time:'2026-10-01T10:00:00Z'}:{}),...(name==='meeting.ended'?{end_time:'2026-10-01T11:00:00Z'}:{}),participant}},
  })
  await handle(event('meeting.started'),'start')
  assert.deepEqual(await handle(event('meeting.started'),'start'),{duplicate:true})
  await handle(event('meeting.participant_left',{user_id:'connection',participant_user_id:'zoom-alice',leave_time:'2026-10-01T10:01:00Z'}))
  await handle(event('meeting.participant_joined',{user_id:'connection',participant_user_id:'zoom-alice',join_time:'2026-10-01T10:00:30Z'}))
  await handle(event('meeting.participant_joined',{user_id:'connection',participant_user_id:'zoom-alice',join_time:'2026-10-01T10:02:00Z'}))
  await handle(event('meeting.participant_left',{user_id:'connection',participant_user_id:'zoom-alice',leave_time:'2026-10-01T10:03:00Z'}))
  await handle(event('meeting.ended'))
  await handle(event('meeting.started'))
  const {rows:[totals]}=await db.query<{count:number;seconds:string}>('select count(*)::int count,sum(duration_seconds)::text seconds from connect.meeting_attendance_sessions')
  assert.equal(totals.count,2);assert.equal(Number(totals.seconds),90)
  assert.equal((await db.query<{status:string}>('select status from connect.meetings')).rows[0].status,'ended')
  assert.equal((await db.query('select * from connect.form_assignments where meeting_id is not null')).rows.length,1)
  assert.equal((await db.query('select * from private.integration_events')).rows.length,7)
 }finally{await db.close()}
})

test('OAuth provider credentials are stripped from chunked browser cookies',()=>{
 const session={access_token:'app-token',refresh_token:'app-refresh',provider_token:'zoom-secret',provider_refresh_token:'zoom-refresh',user:{id:alice,large:'x'.repeat(5000)}}
 const chunks=createChunks('sb-project-auth-token','base64-'+stringToBase64URL(JSON.stringify(session))).map(c=>({...c,options:{path:'/'}}))
 const safe=withoutProviderTokens(chunks).filter(c=>c.value)
 const decoded=JSON.parse(stringFromBase64URL(safe.map(c=>c.value).join('').slice(7)))
 assert.equal(decoded.provider_token,undefined);assert.equal(decoded.provider_refresh_token,undefined)
 assert.equal(decoded.access_token,'app-token');assert.equal(decoded.refresh_token,'app-refresh')
 assert.equal(decoded.user.id,alice)
})

test('course release and progress enforce enrollment and payment grants are idempotent',async()=>{
 const db=await setup()
 try {
  const {rows:[course]}=await db.query<{id:string}>("insert into connect.courses(slug,title,status) values('course','Curso','published') returning id")
  const {rows:[module]}=await db.query<{id:string}>("insert into connect.course_modules(course_id,title,position) values($1,'Módulo',1) returning id",[course.id])
  const {rows:[lesson]}=await db.query<{id:string}>("insert into connect.course_lessons(module_id,title,content_type,position,duration_seconds) values($1,'Aula','video',1,60) returning id",[module.id])
  await asUser(db,alice,async()=>assert.equal((await db.query('select * from connect.course_lessons')).rows.length,0))
  await assert.rejects(asUser(db,alice,()=>db.query('select connect.record_lesson_progress($1,30,false)',[lesson.id])),/unavailable/)
  const {rows:[product]}=await db.query<{id:string}>("insert into connect.products(name,status) values('Curso','published') returning id")
  await db.query('insert into connect.product_courses(product_id,course_id) values($1,$2)',[product.id,course.id])
  const {rows:[order]}=await db.query<{id:string}>("insert into connect.orders(user_id,subtotal_cents,total_cents,provider) values($1,100,100,'test') returning id",[alice])
  await db.query("insert into connect.order_items(order_id,product_id,product_name_snapshot,unit_amount_cents) values($1,$2,'Curso',100)",[order.id,product.id])
  await assert.rejects(asUser(db,alice,()=>db.query("update connect.orders set status='paid' where id=$1",[order.id])),/permission denied/)
  await db.query("update connect.orders set status='paid',paid_at=now() where id=$1",[order.id])
  await db.query("update connect.orders set status='paid' where id=$1",[order.id])
  assert.equal((await db.query('select * from connect.course_enrollments')).rows.length,1)
  await asUser(db,alice,()=>db.query('select connect.record_lesson_progress($1,60,true)',[lesson.id]))
  await asUser(db,alice,async()=>assert.equal(Number((await db.query<{progress_percent:string}>('select progress_percent from connect.course_progress_summary')).rows[0].progress_percent),100))
  await asUser(db,bob,async()=>assert.equal((await db.query('select * from connect.lesson_progress')).rows.length,0))
 }finally{await db.close()}
})
