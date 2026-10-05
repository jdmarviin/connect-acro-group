import type { DataReader } from './data/types'

export function isPermanent(meeting: { kind?: string | null }) {
  return meeting.kind === 'personal' || meeting.kind === 'recurring'
}
export async function findJoinableMeeting(db: DataReader, meetingNumber: string) {
  const result = await db.find({ collection: 'meetings', where: { and: [
    { zoomMeetingId: { equals: meetingNumber } }, { kind: { not_equals: 'occurrence' } },
  ] }, pagination: false, depth: 0 })
  return result.docs.sort((a, b) => Number(isPermanent(b)) - Number(isPermanent(a)) || Number(b.status === 'live') - Number(a.status === 'live') || Date.parse(b.date || b.createdAt) - Date.parse(a.date || a.createdAt))[0]
}
