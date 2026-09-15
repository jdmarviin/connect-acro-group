import crypto from 'crypto'
import type { Payload, PayloadRequest, Where } from 'payload'

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

// Invoked within a single database transaction together with the deduplication receipt.
export async function processZoomEvent(payload: Payload, body: ZoomEvent, req: PayloadRequest) {
  const object = body.payload.object
  const meetingId = String(object.id)
  const uuid = object.uuid
  if (body.event === 'meeting.started' || body.event === 'meeting.ended') {
    const startedAt = iso(object.start_time)
    const endedAt = iso(object.end_time)
    const byUUID = await payload.find({ collection: 'meetings', where: { meetingUUID: { equals: uuid } }, limit: 1, req })
    let meeting = byUUID.docs[0]
    if (!meeting && startedAt) {
      // Use the closest scheduled entry, bounded to 12 hours; never overwrite another occurrence.
      const candidates = await payload.find({ collection: 'meetings', where: { and: [
        { zoomMeetingId: { equals: meetingId } },
        { or: [{ meetingUUID: { exists: false } }, { meetingUUID: { equals: '' } }] },
        { date: { greater_than_equal: new Date(Date.parse(startedAt) - 43200000).toISOString() } },
        { date: { less_than_equal: new Date(Date.parse(startedAt) + 43200000).toISOString() } },
      ] }, pagination: false, req })
      meeting = candidates.docs.sort((a, b) => Math.abs(Date.parse(a.date) - Date.parse(startedAt)) - Math.abs(Date.parse(b.date) - Date.parse(startedAt)))[0]
    }
    if (meeting) await payload.update({ collection: 'meetings', id: meeting.id, data: {
      meetingUUID: uuid,
      startedAt: startedAt || meeting.startedAt,
      endedAt: endedAt || meeting.endedAt,
      status: endedAt || meeting.endedAt ? 'ended' : 'live',
    }, req })
    // Missing departure events remain pending; do not invent watch time from meeting duration.
    return
  }
  const participant = object.participant!
  const identity = String(participant.user_id || participant.participant_uuid)
  const joinTime = iso(participant.join_time)
  const leaveTime = iso(participant.leave_time)
  const accountUserId = participant.participant_user_id || participant.id
  const email = participant.email?.trim().toLowerCase()
  // user_id identifies the connection, NOT the persistent Zoom account. Never match display names.
  let user
  if (participant.customer_key) {
    const tickets = await payload.find({ collection: 'meeting-tickets', where: { and: [
      { key: { equals: participant.customer_key } }, { meetingId: { equals: meetingId } },
    ] }, limit: 1, depth: 1, req })
    const ticket = tickets.docs[0]
    if (ticket && typeof ticket.user === 'object') user = ticket.user
  }
  if (!user && accountUserId) {
    const result = await payload.find({ collection: 'users', where: { zoomId: { equals: accountUserId } }, limit: 2, req })
    if (result.docs.length === 1) user = result.docs[0]
  }
  if (!user && email) {
    const result = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 2, req })
    if (result.docs.length === 1) user = result.docs[0]
  }
  const base: Where[] = [{ meetingUUID: { equals: uuid } }, { zoomUserId: { equals: identity } }]
  let existing
  if (joinTime) {
    const result = await payload.find({ collection: 'meeting-logs', where: { and: [...base, { joinTime: { equals: joinTime } }] }, limit: 1, req })
    existing = result.docs[0]
  }
  if (!existing && body.event === 'meeting.participant_left' && !joinTime) {
    const result = await payload.find({ collection: 'meeting-logs', where: { and: [...base,
      { webhookStatus: { equals: 'joined' } }, { joinTime: { less_than_equal: leaveTime } },
    ] }, sort: '-joinTime', limit: 1, req })
    existing = result.docs[0]
  }
  if (!existing && body.event === 'meeting.participant_joined') {
    // Departure can arrive first. Reconcile the earliest pending departure after this join.
    const result = await payload.find({ collection: 'meeting-logs', where: { and: [...base,
      { joinTime: { exists: false } }, { leaveTime: { greater_than_equal: joinTime } },
    ] }, sort: 'leaveTime', limit: 1, req })
    existing = result.docs[0]
  }
  const joined = existing?.joinTime || joinTime
  const left = leaveTime || existing?.leaveTime
  const sessionKey = existing?.sessionKey || crypto.createHash('sha256').update(JSON.stringify([uuid, identity, joinTime || leaveTime])).digest('hex')
  const data = {
    sessionKey, meetingId, meetingUUID: uuid, zoomUserId: identity,
    user: user?.id || (typeof existing?.user === 'object' ? existing.user?.id : existing?.user) || null,
    participantRole: user?.role || existing?.participantRole || (accountUserId === object.host_id ? 'admin' : 'unknown'),
    participantName: participant.user_name || existing?.participantName || '',
    participantEmail: email || existing?.participantEmail || '',
    joinTime: joined || null, leaveTime: left || null,
    durationMinutes: joined && left ? durationMinutes(joined, left) : 0,
    webhookStatus: left ? 'left' as const : 'joined' as const, source: 'zoom' as const,
  }
  if (existing) await payload.update({ collection: 'meeting-logs', id: existing.id, data, req })
  else await payload.create({ collection: 'meeting-logs', data, req })
}
