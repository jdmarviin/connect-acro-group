import 'server-only'
import { transaction } from './database'
import { encryptToken, decryptToken } from '../zoom-api'
import { parseZoomLink } from '../zoom-link'
import type { AppUser } from '../data/types'
import { isManager } from '../access'

function encryptionKey() {
  if(!process.env.ZOOM_TOKEN_ENCRYPTION_KEY) throw new Error('Configure ZOOM_TOKEN_ENCRYPTION_KEY.')
  return process.env.ZOOM_TOKEN_ENCRYPTION_KEY
}
export async function zoomSupabaseRequest<T>(host:AppUser,path:string,init:RequestInit={}):Promise<T> {
  if(!isManager(host)||!host.zoomId) throw new Error('O anfitrião precisa vincular sua conta Zoom.')
  const key=encryptionKey()
  const token=await transaction(async db=>{
    const {rows:[credential]}=await db.query('select * from private.zoom_credentials where user_id=$1 for update',[host.id])
    if(!credential) throw new Error('Conecte o Zoom novamente para autorizar a sala.')
    if(new Date(credential.expires_at).getTime()>Date.now()+60000) return decryptToken(credential.access_token_encrypted,key)
    const response=await fetch('https://zoom.us/oauth/token',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(15000),
      headers:{Authorization:`Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:decryptToken(credential.refresh_token_encrypted,key)})})
    if(!response.ok) throw new Error('A autorização Zoom expirou. Conecte sua conta novamente.')
    const tokens=await response.json()
    if(!tokens.access_token||!tokens.refresh_token||!Number.isFinite(tokens.expires_in)) throw new Error('Resposta OAuth inválida.')
    await db.query('update private.zoom_credentials set access_token_encrypted=$2,refresh_token_encrypted=$3,expires_at=$4,updated_at=now() where user_id=$1',
      [host.id,encryptToken(tokens.access_token,key),encryptToken(tokens.refresh_token,key),new Date(Date.now()+tokens.expires_in*1000)])
    return tokens.access_token as string
  })
  const response=await fetch(`https://api.zoom.us/v2${path}`,{...init,cache:'no-store',signal:AbortSignal.timeout(15000),
    headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}})
  if(!response.ok) throw new Error(`Zoom recusou a operação (${response.status}). Confira a conexão e os escopos.`)
  return response.status===204?undefined as T:response.json()
}
export async function saveZoomRoom(input:{host:AppUser;title:string;kind:'scheduled'|'recurring'|'personal';zoomLink:string;date?:string|null;duration:number;roomKey?:string}) {
  const {meetingNumber}=parseZoomLink(input.zoomLink)
  return transaction(async db=>{
    const {rows:[room]}=await db.query(`insert into connect.meeting_rooms(host_user_id,external_meeting_id,room_type,title,duration_minutes,room_key)
      values($1,$2,$3,$4,$5,$6) on conflict(provider,external_meeting_id) do update set
      title=excluded.title,duration_minutes=excluded.duration_minutes,room_key=excluded.room_key returning id`,
      [input.host.id,meetingNumber,input.kind,input.title,input.duration,input.roomKey])
    await db.query(`insert into private.meeting_room_secrets(room_id,join_url_encrypted) values($1,$2)
      on conflict(room_id) do update set join_url_encrypted=excluded.join_url_encrypted,updated_at=now()`,[room.id,encryptToken(input.zoomLink,encryptionKey())])
    if(input.kind==='scheduled') await db.query(`insert into connect.meetings(room_id,title,scheduled_starts_at,planned_duration_minutes,created_by)
      values($1,$2,$3,$4,$5)`,[room.id,input.title,input.date,input.duration,input.host.id])
    return room.id as string
  })
}
export async function syncSupabaseRoom(owner:AppUser) {
  if(owner.role!=='owner') throw new Error('A sala padrão pertence ao owner.')
  const profile=await zoomSupabaseRequest<{pmi:number}>(owner,'/users/me')
  if(!profile.pmi) throw new Error('PMI não disponível.')
  const room=await zoomSupabaseRequest<{host_id:string;join_url:string;duration?:number}>(owner,`/meetings/${profile.pmi}`)
  if(room.host_id!==owner.zoomId) throw new Error('Conta anfitriã divergente.')
  return saveZoomRoom({host:owner,title:'Sala do Owner',kind:'personal',zoomLink:room.join_url,duration:room.duration||60,roomKey:'owner-personal'})
}
// Called only after the signature route validates the current user's access.
export async function issueSupabaseTicket(userId:string,meetingNumber:string,key:string,expiresAt:string) {
  return transaction(async db=>{
    const {rows:[room]}=await db.query(`select r.id,s.join_url_encrypted,m.id meeting_id from connect.meeting_rooms r
      join private.meeting_room_secrets s on s.room_id=r.id
      left join lateral(select id from connect.meetings where room_id=r.id and status='live' order by actual_started_at desc limit 1) m on true
      where r.external_meeting_id=$1 and r.provider='zoom' and r.is_active`,[meetingNumber])
    if(!room) throw new Error('Sala indisponível.')
    await db.query('insert into connect.meeting_access_tickets(id,user_id,meeting_id,room_id,expires_at) values($1,$2,$3,$4,$5)',[key,userId,room.meeting_id,room.id,expiresAt])
    return parseZoomLink(decryptToken(room.join_url_encrypted,encryptionKey())).password
  })
}
