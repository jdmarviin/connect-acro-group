import 'server-only'
import type { AppUser, DataReader, Documents, Where } from '../data/types'
import { query, transaction } from './database'
import { authenticatedUser } from './server'

const userProjection = `
 select jsonb_build_object('id',p.id,'name',p.full_name,'email',p.email,'whatsapp',p.whatsapp,
 'zoomId',p.zoom_user_id,'avatar_url',p.avatar_url,'isBlocked',p.is_blocked,
 'role',case when exists(select 1 from connect.user_roles r where r.user_id=p.id and r.role='owner') then 'owner'
 when exists(select 1 from connect.user_roles r where r.user_id=p.id and r.role='admin') then 'admin' else 'user' end,
 'onboardingCompleted',j.onboarding_completed_at is not null,'trialEndsAt',j.trial_ends_at,
 'journeyStatus',j.status,'createdAt',p.created_at,'updatedAt',p.updated_at) doc
 from connect.profiles p join connect.user_journeys j on j.user_id=p.id`
const meetingFields = `'title',m.title,'status',m.status,'date',m.scheduled_starts_at,
 'meetingUUID',m.external_uuid,'startedAt',m.actual_started_at,'endedAt',m.actual_ended_at,
 'zoomMeetingId',r.external_meeting_id,'zoomHostId',p.zoom_user_id,'host',r.host_user_id,
 'zoomLink','','durationMinutes',m.planned_duration_minutes,'notifyParticipants',m.notification_enabled,
 'createdAt',m.created_at,'updatedAt',m.updated_at`
const projections: Record<keyof Documents,string> = {
  users:userProjection,
  meetings:`
 select jsonb_build_object('id',m.id,'kind',case when r.room_type='scheduled' then 'scheduled' else 'occurrence' end,
 'parentMeeting',case when r.room_type<>'scheduled' then r.id end,${meetingFields}) doc
 from connect.meetings m join connect.meeting_rooms r on r.id=m.room_id left join connect.profiles p on p.id=r.host_user_id
 union all
 select jsonb_build_object('id',r.id,'kind',r.room_type,'title',r.title,'roomKey',r.room_key,
 'status',case when m.status='live' then 'live' else 'scheduled' end,'date',null,
 'meetingUUID',m.external_uuid,'startedAt',m.actual_started_at,'endedAt',m.actual_ended_at,
 'zoomMeetingId',r.external_meeting_id,'zoomHostId',p.zoom_user_id,'host',r.host_user_id,
 'zoomLink','','durationMinutes',r.duration_minutes,'createdAt',r.created_at,'updatedAt',r.updated_at) doc
 from connect.meeting_rooms r left join connect.profiles p on p.id=r.host_user_id
 left join lateral(select * from connect.meetings where room_id=r.id order by actual_started_at desc nulls last limit 1) m on true
 where r.room_type<>'scheduled' and r.is_active`,
  'meeting-logs':`
 select jsonb_build_object('id',s.id,'user',u.doc,'meetingId',coalesce(r.external_meeting_id,s.legacy_external_meeting_id),
 'meetingUUID',coalesce(m.external_uuid,s.legacy_external_uuid),'zoomUserId',s.provider_participant_id,
 'joinTime',s.joined_at,'leaveTime',s.left_at,'durationMinutes',coalesce(s.legacy_duration_minutes,s.duration_seconds/60),'webhookStatus',s.status,
 'participantRole',case when s.participant_role_snapshot='member' then 'user' else s.participant_role_snapshot end,
 'participantName',s.participant_name,'participantEmail',s.participant_email,
 'source',case when s.source='legacy' then 'browser' else 'zoom' end,
 'createdAt',s.created_at,'updatedAt',s.updated_at) doc
 from connect.meeting_attendance_sessions s left join connect.meetings m on m.id=s.meeting_id
 left join connect.meeting_rooms r on r.id=m.room_id left join (${userProjection}) u on u.doc->>'id'=s.user_id::text`,
  products:`select jsonb_build_object('id',id,'name',name,'description',description,'thumbnailUrl',coalesce(thumbnail_url,''),'checkoutUrl',coalesce(external_checkout_url,'')) doc from connect.products`,
}
const allowedFields = new Set(['id','role','email','zoomId','user','kind','status','date','zoomMeetingId','meetingId','meetingUUID','roomKey','joinTime','createdAt','updatedAt'])
function expression(field:string) {
  if (!allowedFields.has(field)) throw new Error(`Unsupported filter: ${field}`)
  return field==='user' ? "doc->'user'->>'id'" : `doc->>'${field}'`
}
export function compileWhere(where:Where|undefined,values:unknown[]):string {
  if (!where) return 'true'
  return Object.entries(where).map(([field,condition])=>{
    if (field==='and'||field==='or') {
      if (!Array.isArray(condition)) throw new Error('Invalid filter')
      return '('+condition.map(w=>compileWhere(w,values)).join(field==='and'?' and ':' or ')+')'
    }
    const column=expression(field)
    return Object.entries(condition as Record<string,unknown>).map(([operator,value])=>{
      if(operator==='exists') return `${column} is ${value?'not ':''}null`
      if(operator==='in'||operator==='not_in') {
        if(!Array.isArray(value)) throw new Error('Invalid list')
        values.push(value.map(String))
        return `${operator==='not_in'?'not ':''}(${column}=any($${values.length}::text[]))`
      }
      const operators:Record<string,string>={equals:'=',not_equals:'is distinct from',greater_than_equal:'>=',less_than_equal:'<='}
      if(!operators[operator]) throw new Error('Unsupported operator')
      values.push(String(value))
      return `${column} ${operators[operator]} $${values.length}`
    }).join(' and ')
  }).join(' and ')
}
export async function readUser(id:string):Promise<AppUser|undefined> {
  const rows=await query<{doc:AppUser}>(`select doc from (${userProjection}) users where doc->>'id'=$1`,[id])
  return rows[0]?.doc
}
export async function supabaseReader():Promise<DataReader> {
  const user=await authenticatedUser()
  if(!user) throw new Error('Unauthorized')
  const reader:DataReader={
    async find({collection,where,sort,limit,pagination}) {
      const values:unknown[]=[]
      const filter=compileWhere(where,values)
      const order=sort ? ` order by ${expression(sort.replace(/^-/,' ' ).trim())} ${sort.startsWith('-')?'desc':'asc'} nulls last` : ''
      const max= pagination===false ? '' : ` limit ${Math.max(1,Math.min(limit||100,1000))}`
      return transaction(async db=> {
        const result=await db.query(`select doc from (${projections[collection]}) records where ${filter}${order}${max}`,values)
        return {docs:result.rows.map(row=>row.doc)}
      },user.id)
    },
    async findByID({collection,id}) {
      const {docs}=await reader.find({collection,where:{id:{equals:id}},limit:1})
      if(!docs[0]) throw new Error('Not found')
      return docs[0]
    },
  }
  return reader
}
