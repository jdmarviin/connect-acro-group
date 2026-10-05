import crypto from 'crypto'

export function verifyZoomSignature(body: string, timestamp: string | null, signature: string | null, secret: string, now = Date.now()) {
  if (!secret || !timestamp || !signature || !/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) return false
  const expected = `v0=${crypto.createHmac('sha256', secret).update(`v0:${timestamp}:${body}`).digest('hex')}`
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
export function durationMinutes(join: string, leave: string) {
  const duration = (Date.parse(leave) - Date.parse(join)) / 60000
  if (!Number.isFinite(duration) || duration < 0) throw new Error('Invalid attendance interval')
  return Math.round(duration * 10000) / 10000
}
function iso(value: unknown): string | undefined {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return undefined
  return new Date(value).toISOString()
}
export type ZoomEvent = {
  event: string
  event_ts?: number
  payload: { account_id?: string; object: {
    id: string | number; uuid: string; host_id?: string; start_time?: string; end_time?: string
    participant?: { user_id?: string; id?: string; participant_user_id?: string; participant_uuid?: string; user_name?: string; email?: string; customer_key?: string; join_time?: string; leave_time?: string }
  } }
}
export const supportedEvents = ['meeting.started', 'meeting.ended', 'meeting.participant_joined', 'meeting.participant_left']
export function validateZoomEvent(body: ZoomEvent) {
  const object = body?.payload?.object
  if (!object?.id || !object.uuid) return false
  if (body.event.startsWith('meeting.participant_')) {
    const p = object.participant
    return Boolean(p && (p.user_id || p.participant_uuid) && iso(body.event.endsWith('joined') ? p.join_time : p.leave_time))
  }
  return Boolean(iso(body.event === 'meeting.started' ? object.start_time : object.end_time))
}
