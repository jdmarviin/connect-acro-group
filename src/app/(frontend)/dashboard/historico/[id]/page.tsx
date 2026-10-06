import Link from 'next/link'
import { notFound } from 'next/navigation'
import { participantContext, getParticipantProgress } from '@/lib/participant'
import { participantDate, participantText } from '@/i18n/participant'
import { getData } from '@/lib/data'
import { isLeadLog, meetingDay } from '@/lib/reporting'
import { formatDuration } from '@/lib/format'
import RefreshStatus from '@/components/RefreshStatus'

export default async function ParticipationDetail({ params }: { params: Promise<{ id: string }> }) {
  const [{ user, locale }, { history }, { id }] = await Promise.all([participantContext(), getParticipantProgress(), params])
  const meeting = history.find(item => item.id === id)
  if (!meeting) notFound()
  const db = await getData()
  const { docs } = await db.find({ collection: 'meeting-logs', where: { and: [{ user: { equals: user.id } }, { meetingId: { equals: meeting.meetingId } }] }, sort: 'joinTime', pagination: false })
  const logs = docs.filter(log => isLeadLog(log) && log.joinTime && (log.meetingUUID || `${log.meetingId}:${meetingDay(log.joinTime)}`) === id)
  const t = participantText(locale)
  return <div className="participant-page"><RefreshStatus /><Link href="/dashboard/historico" className="reflection-back">{t.history}</Link><header className="participant-page-heading"><div><p className="workspace-eyebrow">{participantDate(meeting.date, locale)}</p><h1>{meeting.title}</h1><p>{meeting.connections} {t.connections} · {formatDuration(meeting.minutes)} · {t.confirmed}</p></div></header>
    <section className="workspace-card workspace-table-scroll"><table className="workspace-table"><thead><tr><th>{locale === 'ht' ? 'Antre' : 'Entrada'}</th><th>{locale === 'ht' ? 'Sòti' : 'Saída'}</th><th>{t.duration}</th></tr></thead><tbody>{logs.map(log => <tr key={log.id}><td>{participantDate(log.joinTime!, locale, true)}</td><td>{log.leaveTime ? participantDate(log.leaveTime, locale, true) : <span className="workspace-badge pending">{t.pending}</span>}</td><td>{formatDuration(log.leaveTime ? log.durationMinutes : 0)}</td></tr>)}</tbody></table></section>
  </div>
}
