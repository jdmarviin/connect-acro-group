import { participantContext, getParticipantMeetings } from '@/lib/participant'
import { participantText } from '@/i18n/participant'
import { hasMeetingAccess } from '@/lib/access'
import ParticipantMeetings from '@/components/ParticipantMeetings'
import RefreshStatus from '@/components/RefreshStatus'
import Link from 'next/link'

export default async function MeetingsPage() {
  const { user, locale } = await participantContext()
  const meetings = await getParticipantMeetings()
  const t = participantText(locale)
  return <div className="participant-page"><RefreshStatus interval={15000} /><header className="participant-page-heading"><div><p className="workspace-eyebrow">ACRO LIVE</p><h1>{t.meetings}</h1><p>{t.roomsIntro}</p></div></header>
    {hasMeetingAccess(user) ? <ParticipantMeetings meetings={meetings} locale={locale} /> : <div className="workspace-card workspace-empty"><h2>{t.expired}</h2><p>{t.expiredHint}</p><Link href="/dashboard/produtos" className="workspace-button">{t.products}</Link></div>}
  </div>
}
