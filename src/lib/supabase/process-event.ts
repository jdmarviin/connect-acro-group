import type { ZoomEvent } from '../zoom-webhook'
import type { PoolClient } from 'pg'
import { createHash } from 'node:crypto'

// Caller validates HMAC/account/timestamp and owns the transaction.
export async function persistZoomEvent(db: Pick<PoolClient,'query'>, body: ZoomEvent, eventKey: string) {
  const o=body.payload.object
  const inserted=await db.query(`insert into private.integration_events(provider,event_key,event_type,external_entity_id,payload)
    values('zoom',$1,$2,$3,$4) on conflict(provider,event_key) do nothing returning id`,[eventKey,body.event,String(o.id),body])
  if(!inserted.rows.length) return {duplicate:true}
  // Serialize events for this room, including reconnects and out-of-order deliveries.
  const {rows:[room]}=await db.query("select * from connect.meeting_rooms where provider='zoom' and external_meeting_id=$1 for update",[String(o.id)])
  if(!room) {
    await db.query("update private.integration_events set processing_status='ignored',processed_at=now() where provider='zoom' and event_key=$1",[eventKey])
    return {ignored:true}
  }
  let {rows:[meeting]}=await db.query('select * from connect.meetings where external_uuid=$1',[o.uuid])
  if(!meeting && o.start_time) {
    const result=await db.query(`select * from connect.meetings where room_id=$1 and external_uuid is null
      and scheduled_starts_at between $2::timestamptz-interval '12 hours' and $2::timestamptz+interval '12 hours'
      order by abs(extract(epoch from scheduled_starts_at-$2::timestamptz)) limit 1`,[room.id,o.start_time])
    meeting=result.rows[0]
    if(meeting) await db.query('update connect.meetings set external_uuid=$1 where id=$2',[o.uuid,meeting.id])
  }
  if(!meeting) {
    const result=await db.query(`insert into connect.meetings(room_id,title,external_uuid,planned_duration_minutes,created_by)
      values($1,$2,$3,$4,$5) returning *`,[room.id,room.title,o.uuid,room.duration_minutes,room.host_user_id])
    meeting=result.rows[0]
  }
  if(body.event==='meeting.started'||body.event==='meeting.ended') {
    await db.query(`update connect.meetings set actual_started_at=coalesce(actual_started_at,$2::timestamptz),
      actual_ended_at=coalesce(actual_ended_at,$3::timestamptz),
      status=case when actual_ended_at is not null or $3::timestamptz is not null then 'ended' else 'live' end where id=$1`,
      [meeting.id,o.start_time||null,o.end_time||null])
  } else {
    const p=o.participant!
    const identity=String(p.user_id||p.participant_uuid)
    const persistentId=p.participant_user_id||p.id
    let userId:string|null=null
    if(p.customer_key) {
      const {rows:[ticket]}=await db.query('select user_id from connect.meeting_access_tickets where id::text=$1 and room_id=$2',[p.customer_key,room.id])
      userId=ticket?.user_id||null
    }
    if(!userId&&persistentId) {
      const {rows:[user]}=await db.query('select id from connect.profiles where zoom_user_id=$1',[persistentId])
      userId=user?.id||null
    }
    if(!userId&&p.email) {
      const {rows:[user]}=await db.query('select id from connect.profiles where lower(email)=$1',[p.email.trim().toLowerCase()])
      userId=user?.id||null
    }
    let role='unknown'
    if(userId) {
      const {rows}=await db.query('select role from connect.user_roles where user_id=$1',[userId])
      role=rows.some(r=>r.role==='owner')?'owner':rows.some(r=>r.role==='admin')?'admin':'member'
    } else if(persistentId===o.host_id) role='admin'
    let existing
    if(p.join_time) {
      const {rows}=await db.query('select * from connect.meeting_attendance_sessions where meeting_id=$1 and provider_participant_id=$2 and joined_at=$3',[meeting.id,identity,p.join_time])
      existing=rows[0]
    }
    if(!existing&&body.event==='meeting.participant_left'&&!p.join_time) {
      const {rows}=await db.query('select * from connect.meeting_attendance_sessions where meeting_id=$1 and provider_participant_id=$2 and left_at is null and joined_at<=$3 order by joined_at desc limit 1',[meeting.id,identity,p.leave_time])
      existing=rows[0]
    }
    if(!existing&&body.event==='meeting.participant_joined') {
      const {rows}=await db.query('select * from connect.meeting_attendance_sessions where meeting_id=$1 and provider_participant_id=$2 and joined_at is null and left_at>=$3 order by left_at limit 1',[meeting.id,identity,p.join_time])
      existing=rows[0]
    }
    const sessionKey=existing?.session_key||createHash('sha256').update(JSON.stringify([o.uuid,identity,p.join_time||p.leave_time])).digest('hex')
    await db.query(`insert into connect.meeting_attendance_sessions(meeting_id,user_id,session_key,provider_participant_id,participant_role_snapshot,participant_name,participant_email,joined_at,left_at)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(session_key) do update set
      user_id=coalesce(excluded.user_id,meeting_attendance_sessions.user_id),participant_role_snapshot=excluded.participant_role_snapshot,
      participant_name=excluded.participant_name,participant_email=excluded.participant_email,
      joined_at=excluded.joined_at,left_at=excluded.left_at`,
      [meeting.id,userId||existing?.user_id,sessionKey,identity,role==='unknown'?(existing?.participant_role_snapshot||role):role,
       p.user_name||existing?.participant_name,p.email||existing?.participant_email,existing?.joined_at||p.join_time||null,p.leave_time||existing?.left_at||null])
  }
  await db.query("update private.integration_events set processing_status='processed',processed_at=now() where provider='zoom' and event_key=$1",[eventKey])
  return {success:true}
}
