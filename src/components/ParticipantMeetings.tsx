import Link from 'next/link'
import { CalendarDays, Radio, Video } from 'lucide-react'
import type { AppMeeting } from '@/lib/data/types'
import type { Locale } from '@/i18n/dictionaries'
import { participantDate, participantText } from '@/i18n/participant'

export default function ParticipantMeetings({ meetings, locale }: { meetings: AppMeeting[]; locale: Locale }) {
  const t = participantText(locale)
  if (!meetings.length) return <div className="workspace-card workspace-empty"><CalendarDays aria-hidden="true" /><strong>{t.noRooms}</strong><p>{t.noRoomsHint}</p></div>
  return <div className="participant-meetings">{meetings.map(meeting => <article key={meeting.id} className={`workspace-card participant-meeting ${meeting.status === 'live' ? 'is-live' : ''}`}>
    <div className="meeting-symbol"><Video aria-hidden="true" /></div>
    <div className="meeting-copy"><span className={`workspace-badge ${meeting.status === 'live' ? 'live' : ''}`}>{meeting.status === 'live' ? <><Radio aria-hidden="true" />{t.live}</> : meeting.date ? t.scheduled : t.waiting}</span><h3>{meeting.title}</h3><p><CalendarDays aria-hidden="true" />{meeting.date ? participantDate(meeting.date, locale, true) : t.recurring}</p></div>
    <Link prefetch={false} className={meeting.status === 'live' ? 'workspace-button' : 'workspace-button secondary'} href={`/reuniao/${meeting.zoomMeetingId}`}><Video aria-hidden="true" />{meeting.status === 'live' ? t.enter : t.wait}</Link>
  </article>)}</div>
}
