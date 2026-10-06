import Link from 'next/link'
import { CalendarCheck, CheckCheck, Clock3, Flame, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import { participantContext, getParticipantMeetings, getParticipantProgress, getParticipantSurveys } from '@/lib/participant'
import { trialProgress } from '@/lib/participant-progress'
import { participantDate, participantText } from '@/i18n/participant'
import { hasMeetingAccess } from '@/lib/access'
import RefreshStatus from '@/components/RefreshStatus'
import ParticipationChart from '@/components/ParticipationChart'
import ParticipationHistory from '@/components/ParticipationHistory'
import ParticipantMeetings from '@/components/ParticipantMeetings'
import JourneyInbox from '@/components/JourneyInbox'

export default async function ParticipantDashboard() {
  const { user, locale } = await participantContext()
  const [progress, meetings, surveys] = await Promise.all([getParticipantProgress(), getParticipantMeetings(), getParticipantSurveys()])
  const t = participantText(locale)
  const trial = trialProgress(user)
  const active = hasMeetingAccess(user)
  const student = user.journeyStatus === 'active_student'
  const metrics = [
    { icon: Clock3, value: `${Math.floor(progress.minutes / 60)}h ${Math.floor(progress.minutes % 60)}min`, label: t.watched, hint: t.confirmed },
    { icon: CalendarCheck, value: progress.history.length, label: t.attended, hint: t.distinctSessions },
    { icon: Flame, value: progress.activeDays, label: t.activeDays, hint: t.daysHint },
    { icon: CheckCheck, value: surveys.filter(s => s.submitted_at).length, label: t.answered, hint: t.answersHint },
  ]
  return <div className="participant-page">
    <RefreshStatus />
    <header className="participant-page-heading"><div><p className="workspace-eyebrow">{t.greeting}, {user.name.split(' ')[0]}</p><h1>{t.welcome}</h1><p>{t.intro}</p></div><span className="workspace-date">{participantDate(new Date().toISOString(), locale)}</span></header>
    <div className="participant-metrics">{metrics.map(({ icon: Icon, value, label, hint }) => <article className="workspace-card metric-card" key={label}><div><span>{label}</span><Icon aria-hidden="true" /></div><strong>{value}</strong><p>{hint}</p></article>)}</div>
    <div className="participant-chart-grid">
      <ParticipationChart data={progress.chart} locale={locale} />
      <section className="workspace-card trial-card"><div className="workspace-card-heading"><h2>{student ? t.student : t.trial}</h2><Sparkles aria-hidden="true" /></div>
        {student ? <div className="trial-student"><CheckCheck aria-hidden="true" /><p>{t.studentHint}</p></div> : <>
          <div className="trial-ring" style={{ '--trial-progress': `${trial.percent}%` } as CSSProperties} role="img" aria-label={`${trial.elapsed} / 30 ${t.elapsed}`}><div><strong>{trial.elapsed}<small>/30</small></strong><span>{t.elapsed}</span></div></div>
          <h3>{active ? `${trial.remaining} ${t.remaining}` : t.expired}</h3><p>{active ? t.trialHint : t.expiredHint}</p>
          <div className="trial-deadline">{t.until}<strong>{participantDate(new Date(trial.end).toISOString(), locale)}</strong></div>
          {!active && <Link className="workspace-button secondary" href="/dashboard/produtos">{t.products}</Link>}
        </>}
      </section>
    </div>
    <section><div className="workspace-section-heading"><div><p className="workspace-eyebrow">ACRO LIVE</p><h2>{t.roomsTitle}</h2><p>{t.roomsIntro}</p></div><Link href="/dashboard/reunioes">{t.seeAll}</Link></div><ParticipantMeetings meetings={meetings.slice(0, 3)} locale={locale} /></section>
    <JourneyInbox />
    <section><div className="workspace-section-heading"><div><h2>{t.latest}</h2><p>{t.latestHint}</p></div><Link href="/dashboard/historico">{t.seeAll}</Link></div><ParticipationHistory history={progress.history.slice(0, 4)} locale={locale} /></section>
  </div>
}
