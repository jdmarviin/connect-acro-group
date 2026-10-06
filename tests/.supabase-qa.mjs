// tests/supabase.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// src/lib/supabase/process-event.ts
import { createHash } from "node:crypto";
async function persistZoomEvent(db, body, eventKey) {
  const o = body.payload.object;
  const inserted = await db.query(`insert into private.integration_events(provider,event_key,event_type,external_entity_id,payload)
    values('zoom',$1,$2,$3,$4) on conflict(provider,event_key) do nothing returning id`, [eventKey, body.event, String(o.id), body]);
  if (!inserted.rows.length) return { duplicate: true };
  const { rows: [room] } = await db.query("select * from connect.meeting_rooms where provider='zoom' and external_meeting_id=$1 for update", [String(o.id)]);
  if (!room) {
    await db.query("update private.integration_events set processing_status='ignored',processed_at=now() where provider='zoom' and event_key=$1", [eventKey]);
    return { ignored: true };
  }
  let { rows: [meeting] } = await db.query("select * from connect.meetings where external_uuid=$1", [o.uuid]);
  if (!meeting && o.start_time) {
    const result = await db.query(`select * from connect.meetings where room_id=$1 and external_uuid is null
      and scheduled_starts_at between $2::timestamptz-interval '12 hours' and $2::timestamptz+interval '12 hours'
      order by abs(extract(epoch from scheduled_starts_at-$2::timestamptz)) limit 1`, [room.id, o.start_time]);
    meeting = result.rows[0];
    if (meeting) await db.query("update connect.meetings set external_uuid=$1 where id=$2", [o.uuid, meeting.id]);
  }
  if (!meeting) {
    const result = await db.query(`insert into connect.meetings(room_id,title,external_uuid,planned_duration_minutes,created_by)
      values($1,$2,$3,$4,$5) returning *`, [room.id, room.title, o.uuid, room.duration_minutes, room.host_user_id]);
    meeting = result.rows[0];
  }
  if (body.event === "meeting.started" || body.event === "meeting.ended") {
    await db.query(
      `update connect.meetings set actual_started_at=coalesce(actual_started_at,$2::timestamptz),
      actual_ended_at=coalesce(actual_ended_at,$3::timestamptz),
      status=case when actual_ended_at is not null or $3::timestamptz is not null then 'ended' else 'live' end where id=$1`,
      [meeting.id, o.start_time || null, o.end_time || null]
    );
  } else {
    const p = o.participant;
    const identity = String(p.user_id || p.participant_uuid);
    const persistentId = p.participant_user_id || p.id;
    let userId = null;
    if (p.customer_key) {
      const { rows: [ticket] } = await db.query("select user_id from connect.meeting_access_tickets where id::text=$1 and room_id=$2", [p.customer_key, room.id]);
      userId = ticket?.user_id || null;
    }
    if (!userId && persistentId) {
      const { rows: [user] } = await db.query("select id from connect.profiles where zoom_user_id=$1", [persistentId]);
      userId = user?.id || null;
    }
    if (!userId && p.email) {
      const { rows: [user] } = await db.query("select id from connect.profiles where lower(email)=$1", [p.email.trim().toLowerCase()]);
      userId = user?.id || null;
    }
    let role = "unknown";
    if (userId) {
      const { rows } = await db.query("select role from connect.user_roles where user_id=$1", [userId]);
      role = rows.some((r) => r.role === "owner") ? "owner" : rows.some((r) => r.role === "admin") ? "admin" : "member";
    } else if (persistentId === o.host_id) role = "admin";
    let existing;
    if (p.join_time) {
      const { rows } = await db.query("select * from connect.meeting_attendance_sessions where meeting_id=$1 and provider_participant_id=$2 and joined_at=$3", [meeting.id, identity, p.join_time]);
      existing = rows[0];
    }
    if (!existing && body.event === "meeting.participant_left" && !p.join_time) {
      const { rows } = await db.query("select * from connect.meeting_attendance_sessions where meeting_id=$1 and provider_participant_id=$2 and left_at is null and joined_at<=$3 order by joined_at desc limit 1", [meeting.id, identity, p.leave_time]);
      existing = rows[0];
    }
    if (!existing && body.event === "meeting.participant_joined") {
      const { rows } = await db.query("select * from connect.meeting_attendance_sessions where meeting_id=$1 and provider_participant_id=$2 and joined_at is null and left_at>=$3 order by left_at limit 1", [meeting.id, identity, p.join_time]);
      existing = rows[0];
    }
    const sessionKey = existing?.session_key || createHash("sha256").update(JSON.stringify([o.uuid, identity, p.join_time || p.leave_time])).digest("hex");
    await db.query(
      `insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,provider_participant_id,participant_role_snapshot,participant_name,participant_email,joined_at,left_at)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(session_key) do update set
      user_id=coalesce(excluded.user_id,meeting_attendance_sessions.user_id),participant_role_snapshot=excluded.participant_role_snapshot,
      participant_name=excluded.participant_name,participant_email=excluded.participant_email,
      joined_at=excluded.joined_at,left_at=excluded.left_at`,
      [
        meeting.id,
        userId || existing?.user_id,
        sessionKey,
        identity,
        role === "unknown" ? existing?.participant_role_snapshot || role : role,
        p.user_name || existing?.participant_name,
        p.email || existing?.participant_email,
        existing?.joined_at || p.join_time || null,
        p.leave_time || existing?.left_at || null
      ]
    );
  }
  await db.query("update private.integration_events set processing_status='processed',processed_at=now() where provider='zoom' and event_key=$1", [eventKey]);
  return { success: true };
}

// src/lib/supabase/cookies.ts
import { createChunks, stringFromBase64URL, stringToBase64URL } from "@supabase/ssr";
function withoutProviderTokens(cookies) {
  const result = cookies.filter((c) => !/^sb-.+-auth-token(?:\.\d+)?$/.test(c.name));
  const groups = /* @__PURE__ */ new Map();
  for (const cookie of cookies) {
    const match = cookie.name.match(/^(sb-.+-auth-token)(?:\.\d+)?$/);
    if (match) groups.set(match[1], [...groups.get(match[1]) || [], cookie]);
  }
  for (const [key, chunks] of groups) {
    const active = chunks.filter((c) => c.value).sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true }));
    if (!active.length) {
      result.push(...chunks);
      continue;
    }
    const encoded = active.map((c) => c.value).join("");
    const session = JSON.parse(encoded.startsWith("base64-") ? stringFromBase64URL(encoded.slice(7)) : encoded);
    delete session.provider_token;
    delete session.provider_refresh_token;
    const safe = "base64-" + stringToBase64URL(JSON.stringify(session));
    result.push(...chunks.map((c) => ({ ...c, value: "", options: { ...c.options, maxAge: 0 } })));
    result.push(...createChunks(key, safe).map((c) => ({ ...c, options: active[0].options })));
  }
  return result;
}

// tests/supabase.test.ts
import { createChunks as createChunks2, stringToBase64URL as stringToBase64URL2, stringFromBase64URL as stringFromBase64URL2 } from "@supabase/ssr";
var alice = "10000000-0000-4000-8000-000000000001";
var bob = "10000000-0000-4000-8000-000000000002";
var owner = "10000000-0000-4000-8000-000000000003";
async function setup() {
  const db = new PGlite();
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
  `);
  const folder = new URL("../supabase/migrations/", import.meta.url);
  for (const file of readdirSync(folder).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await db.exec(readFileSync(new URL(file, folder), "utf8"));
    } catch (error) {
      throw new Error(`Migration failed: ${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  }
  for (const [id, email] of [[alice, "alice@example.test"], [bob, "bob@example.test"], [owner, "owner@example.test"]]) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, email]);
  }
  await db.query("insert into connect.user_roles(user_id,role) values($1,'owner')", [owner]);
  return db;
}
async function asUser(db, id, fn) {
  await db.exec("begin; set local role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
  try {
    const result = await fn();
    await db.exec("commit");
    return result;
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}
var validOnboarding = {
  operatesInFinancialMarket: "no",
  tradingKnowledgeTime: "1 m\xEAs",
  tookCoursesBefore: "no",
  currentProfession: "Designer",
  availableTime: "2 horas",
  mainGoal: "Aprender",
  tradingIntention: "extra_income",
  biggestDifficulty: "Gest\xE3o",
  expectations30Days: "Disciplina"
};
test("Supabase migrations: RLS isolation, immutable trial, protected roles and private secrets", async () => {
  const db = await setup();
  try {
    await asUser(db, alice, async () => {
      assert.equal((await db.query("select * from connect.profiles")).rows.length, 1);
      assert.equal((await db.query("select * from connect.user_journeys")).rows.length, 1);
    });
    for (const sql of [
      "update connect.profiles set is_blocked=true",
      "update connect.user_journeys set trial_ends_at=now()+interval '90 days'",
      "insert into connect.user_roles(user_id,role) values(auth.uid(),'admin')",
      "select * from private.zoom_credentials",
      "select * from private.integration_events",
      "insert into connect.meeting_attendance_sessions(session_key) values('fake')",
      "delete from connect.profiles"
    ]) await assert.rejects(asUser(db, alice, () => db.exec(sql)), /permission denied/);
    await asUser(db, owner, async () => assert.equal((await db.query("select * from connect.profiles")).rows.length, 3));
    await assert.rejects(db.query("insert into connect.user_roles(user_id,role) values($1,'owner')", [bob]), /duplicate/);
    await assert.rejects(db.query("delete from connect.user_roles where user_id=$1 and role='owner'", [owner]), /Owner/);
    const missing = await db.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='connect' and c.relkind='r' and not relrowsecurity");
    assert.equal(missing.rows.length, 0);
  } finally {
    await db.close();
  }
});
test("retired Payload tables are not exposed through the public API", async () => {
  const db = await setup();
  try {
    await assert.rejects(asUser(db, alice, () => db.query("select * from public.users")), /permission denied/);
    await db.exec("set role anon");
    await assert.rejects(db.query("select * from public.users"), /permission denied/);
    await db.exec("reset role");
    assert.equal((await db.query("select * from public.users")).rows.length, 0);
  } finally {
    await db.close();
  }
});
test("historical rounded minutes are preserved without losing exact seconds", async () => {
  const db = await setup();
  try {
    await db.query(`insert into connect.meeting_attendance_sessions(user_id,session_key,participant_role_snapshot,joined_at,left_at,legacy_duration_minutes)
      values($1,'rounded-history','member','2026-09-09T04:15:17Z','2026-09-09T04:58:06Z',43),
      ($1,'new-session','member','2026-10-01T10:00:00Z','2026-10-01T10:00:15Z',null)`, [alice]);
    const { rows: [historical] } = await db.query("select duration_seconds from connect.meeting_attendance_sessions where session_key='rounded-history'");
    assert.equal(Number(historical.duration_seconds), 2569);
    await asUser(db, alice, async () => {
      const { rows: [summary] } = await db.query("select duration_seconds from connect.meeting_attendance_summary");
      assert.equal(Number(summary.duration_seconds), 43 * 60 + 15);
    });
  } finally {
    await db.close();
  }
});
test("onboarding validates all answers atomically and cannot be submitted twice", async () => {
  const db = await setup();
  try {
    const { rows: [assignment] } = await db.query("select id from connect.form_assignments where meeting_id is null");
    await assert.rejects(asUser(db, alice, () => db.query("select connect.submit_form($1,$2,$3)", [assignment.id, {}, "+5511999999999"])), /Required/);
    assert.equal((await db.query("select * from connect.form_submissions")).rows.length, 0);
    await asUser(db, alice, () => db.query("select connect.submit_form($1,$2,$3)", [assignment.id, validOnboarding, "+5511999999999"]));
    assert.equal((await db.query("select * from connect.form_answers")).rows.length, 9);
    assert.ok((await db.query("select onboarding_completed_at from connect.user_journeys where user_id=$1", [alice])).rows[0].onboarding_completed_at);
    await assert.rejects(asUser(db, alice, () => db.query("select connect.submit_form($1,$2,$3)", [assignment.id, validOnboarding, "+5511999999999"])), /already submitted/i);
    await asUser(db, bob, async () => assert.equal((await db.query("select * from connect.form_answers")).rows.length, 0));
    await assert.rejects(db.exec("update connect.form_questions set label='{}'"), /immutable/);
  } finally {
    await db.close();
  }
});
test("daily reflection requires completed attendance and is private to the participant", async () => {
  const db = await setup();
  try {
    const { rows: [room] } = await db.query("insert into connect.meeting_rooms(host_user_id,external_meeting_id,room_type,title) values($1,'123456789','personal','Sala') returning id", [owner]);
    const { rows: [meeting] } = await db.query("insert into connect.meetings(room_id,title,status,external_uuid) values($1,'Sess\xE3o','ended','occurrence-1') returning id", [room.id]);
    await db.query("update connect.meetings set status='ended' where id=$1", [meeting.id]);
    assert.equal((await db.query("select * from connect.form_assignments where meeting_id=$1", [meeting.id])).rows.length, 0);
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at,left_at) values($1,$2,'session-1','member',now()-interval '15 seconds',now())", [meeting.id, alice]);
    const { rows: [assignment] } = await db.query("select id from connect.form_assignments where meeting_id=$1", [meeting.id]);
    await assert.rejects(asUser(db, bob, () => db.query("select connect.submit_form($1,$2)", [assignment.id, { learned_today: "Disciplina" }])), /unavailable/);
    assert.equal(Number((await db.query("select duration_seconds from connect.meeting_attendance_sessions")).rows[0].duration_seconds), 15);
    await db.query("update connect.meeting_attendance_sessions set participant_name='Alice'");
    assert.equal((await db.query("select * from connect.notifications")).rows.length, 1);
    await asUser(db, alice, () => db.query("select connect.submit_form($1,$2)", [assignment.id, { learned_today: "Disciplina" }]));
    await asUser(db, bob, async () => assert.equal((await db.query("select * from connect.notifications")).rows.length, 0));
  } finally {
    await db.close();
  }
});
test("ten reconnects and multiple meetings produce one daily questionnaire, with a new one next day", async () => {
  const db = await setup();
  try {
    const { rows: [room] } = await db.query("insert into connect.meeting_rooms(host_user_id,external_meeting_id,room_type,title) values($1,'987654321','personal','Sala') returning id", [owner]);
    const { rows: [meeting] } = await db.query("insert into connect.meetings(room_id,title,status) values($1,'Sess\xE3o','live') returning id", [room.id]);
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at) values($1,$2,'open','member','2026-10-06T10:00:00Z')", [meeting.id, alice]);
    assert.equal((await db.query("select * from connect.form_assignments where reflection_day is not null")).rows.length, 0);
    await asUser(db, alice, async () => assert.equal((await db.query("select * from connect.form_assignments where meeting_id is not null")).rows.length, 0));
    await db.query("update connect.meeting_attendance_sessions set left_at='2026-10-06T10:10:00Z' where session_key='open'");
    for (let i = 0; i < 10; i++) await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at,left_at) values($1,$2,$3,'member','2026-10-06T11:00:00Z','2026-10-06T11:10:00Z')", [meeting.id, alice, `reconnect-${i}`]);
    const { rows: [second] } = await db.query("insert into connect.meetings(room_id,title,status,actual_ended_at) values($1,'Segunda sess\xE3o','ended','2026-10-06T14:00:00Z') returning id", [room.id]);
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at) values($1,$2,'ended-session','member','2026-10-06T13:00:00Z')", [second.id, alice]);
    const { rows: assignments } = await db.query("select id from connect.form_assignments where reflection_day is not null");
    assert.equal(assignments.length, 1);
    assert.equal((await db.query("select * from connect.notifications where event_type='form_available'")).rows.length, 1);
    await asUser(db, alice, () => db.query("select connect.submit_form($1,$2)", [assignments[0].id, { learned_today: "Disciplina" }]));
    await assert.rejects(asUser(db, alice, () => db.query("select connect.submit_form($1,$2)", [assignments[0].id, { learned_today: "Outra resposta" }])), /Already submitted/);
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at,left_at) values($1,$2,'next-day','member','2026-10-07T03:01:00Z','2026-10-07T03:02:00Z')", [meeting.id, alice]);
    await db.query("insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,participant_role_snapshot,joined_at,left_at) values($1,$2,'bob','member','2026-10-06T11:00:00Z','2026-10-06T11:10:00Z')", [meeting.id, bob]);
    assert.equal((await db.query("select * from connect.form_assignments where reflection_day is not null")).rows.length, 3);
    await asUser(db, bob, async () => assert.equal((await db.query("select * from connect.form_assignments where reflection_day is not null")).rows.length, 1));
    await asUser(db, alice, async () => assert.equal((await db.query("select * from connect.form_assignments where reflection_day is not null")).rows.length, 2));
  } finally {
    await db.close();
  }
});
test("actual Supabase webhook processor: retries, reconnects and out-of-order events", async () => {
  const db = await setup();
  try {
    await db.query("insert into connect.meeting_rooms(host_user_id,external_meeting_id,room_type,title) values($1,'123456789','personal','Sala')", [owner]);
    await db.query("update connect.profiles set zoom_user_id=$2 where id=$1", [alice, "zoom-alice"]);
    let n = 0;
    const handle = async (body, key = String(++n)) => {
      await db.exec("begin");
      try {
        const result = await persistZoomEvent(db, body, key);
        await db.exec("commit");
        return result;
      } catch (error) {
        await db.exec("rollback");
        throw error;
      }
    };
    const event = (name, participant) => ({
      event: name,
      payload: { object: { id: "123456789", uuid: "real-occurrence", ...name === "meeting.started" ? { start_time: "2026-10-01T10:00:00Z" } : {}, ...name === "meeting.ended" ? { end_time: "2026-10-01T11:00:00Z" } : {}, participant } }
    });
    await handle(event("meeting.started"), "start");
    assert.deepEqual(await handle(event("meeting.started"), "start"), { duplicate: true });
    await handle(event("meeting.participant_left", { user_id: "connection", participant_user_id: "zoom-alice", leave_time: "2026-10-01T10:01:00Z" }));
    await handle(event("meeting.participant_joined", { user_id: "connection", participant_user_id: "zoom-alice", join_time: "2026-10-01T10:00:30Z" }));
    await handle(event("meeting.participant_joined", { user_id: "connection", participant_user_id: "zoom-alice", join_time: "2026-10-01T10:02:00Z" }));
    await handle(event("meeting.participant_left", { user_id: "connection", participant_user_id: "zoom-alice", leave_time: "2026-10-01T10:03:00Z" }));
    await handle(event("meeting.ended"));
    await handle(event("meeting.started"));
    const { rows: [totals] } = await db.query("select count(*)::int count,sum(duration_seconds)::text seconds from connect.meeting_attendance_sessions");
    assert.equal(totals.count, 2);
    assert.equal(Number(totals.seconds), 90);
    assert.equal((await db.query("select status from connect.meetings")).rows[0].status, "ended");
    assert.equal((await db.query("select * from connect.form_assignments where meeting_id is not null")).rows.length, 1);
    assert.equal((await db.query("select * from private.integration_events")).rows.length, 7);
  } finally {
    await db.close();
  }
});
test("OAuth provider credentials are stripped from chunked browser cookies", () => {
  const session = { access_token: "app-token", refresh_token: "app-refresh", provider_token: "zoom-secret", provider_refresh_token: "zoom-refresh", user: { id: alice, large: "x".repeat(5e3) } };
  const chunks = createChunks2("sb-project-auth-token", "base64-" + stringToBase64URL2(JSON.stringify(session))).map((c) => ({ ...c, options: { path: "/" } }));
  const safe = withoutProviderTokens(chunks).filter((c) => c.value);
  const decoded = JSON.parse(stringFromBase64URL2(safe.map((c) => c.value).join("").slice(7)));
  assert.equal(decoded.provider_token, void 0);
  assert.equal(decoded.provider_refresh_token, void 0);
  assert.equal(decoded.access_token, "app-token");
  assert.equal(decoded.refresh_token, "app-refresh");
  assert.equal(decoded.user.id, alice);
});
test("course release and progress enforce enrollment and payment grants are idempotent", async () => {
  const db = await setup();
  try {
    const { rows: [course] } = await db.query("insert into connect.courses(slug,title,status) values('course','Curso','published') returning id");
    const { rows: [module] } = await db.query("insert into connect.course_modules(course_id,title,position) values($1,'M\xF3dulo',1) returning id", [course.id]);
    const { rows: [lesson] } = await db.query("insert into connect.course_lessons(module_id,title,content_type,position,duration_seconds) values($1,'Aula','video',1,60) returning id", [module.id]);
    await asUser(db, alice, async () => assert.equal((await db.query("select * from connect.course_lessons")).rows.length, 0));
    await assert.rejects(asUser(db, alice, () => db.query("select connect.record_lesson_progress($1,30,false)", [lesson.id])), /unavailable/);
    const { rows: [product] } = await db.query("insert into connect.products(name,status) values('Curso','published') returning id");
    await db.query("insert into connect.product_courses(product_id,course_id) values($1,$2)", [product.id, course.id]);
    const { rows: [order] } = await db.query("insert into connect.orders(user_id,subtotal_cents,total_cents,provider) values($1,100,100,'test') returning id", [alice]);
    await db.query("insert into connect.order_items(order_id,product_id,product_name_snapshot,unit_amount_cents) values($1,$2,'Curso',100)", [order.id, product.id]);
    await assert.rejects(asUser(db, alice, () => db.query("update connect.orders set status='paid' where id=$1", [order.id])), /permission denied/);
    await db.query("update connect.orders set status='paid',paid_at=now() where id=$1", [order.id]);
    await db.query("update connect.orders set status='paid' where id=$1", [order.id]);
    assert.equal((await db.query("select * from connect.course_enrollments")).rows.length, 1);
    await asUser(db, alice, () => db.query("select connect.record_lesson_progress($1,60,true)", [lesson.id]));
    await asUser(db, alice, async () => assert.equal(Number((await db.query("select progress_percent from connect.course_progress_summary")).rows[0].progress_percent), 100));
    await asUser(db, bob, async () => assert.equal((await db.query("select * from connect.lesson_progress")).rows.length, 0));
  } finally {
    await db.close();
  }
});
