import { isLeadLog } from './access'

export function meetingDay(value: string) {
  return new Date(value).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}
export function belongsToMeeting(log: { meetingId?: string | null; meetingUUID?: string | null; joinTime?: string | null; createdAt: string }, meeting: { zoomMeetingId?: string | null; meetingUUID?: string | null; date?: string | null; kind?: string | null }) {
  if (log.meetingId !== meeting.zoomMeetingId) return false
  if (meeting.kind === 'personal' || meeting.kind === 'recurring') return true
  if (log.meetingUUID && meeting.meetingUUID) return log.meetingUUID === meeting.meetingUUID
  return meetingDay(log.joinTime || log.createdAt) === (meeting.date ? meetingDay(meeting.date) : '')
}
export { isLeadLog }
