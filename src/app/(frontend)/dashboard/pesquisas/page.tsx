import Link from 'next/link'
import { CheckCheck, ClipboardCheck, NotebookPen } from 'lucide-react'
import { getParticipantSurveys, participantContext, pendingSurveys } from '@/lib/participant'
import { participantDate, participantText } from '@/i18n/participant'
import RefreshStatus from '@/components/RefreshStatus'

export default async function SurveysPage({ searchParams }: { searchParams: Promise<{ afterMeeting?: string }> }) {
  const [{ locale }, surveys, params] = await Promise.all([participantContext(), getParticipantSurveys(), searchParams])
  const t = participantText(locale)
  const pending = pendingSurveys(surveys)
  const completed = surveys.filter(s => s.submitted_at)
  return <div className="participant-page"><RefreshStatus interval={params.afterMeeting ? 5000 : 30000} />
    <header className="participant-page-heading"><div><p className="workspace-eyebrow">{t.space}</p><h1>{t.surveysTitle}</h1><p>{t.surveysIntro}</p></div></header>
    {params.afterMeeting && <div className="workspace-notice"><CheckCheck aria-hidden="true" /><div><strong>{t.returnMessage}</strong><p>{t.returnHint}</p></div></div>}
    <section><div className="workspace-section-heading"><div><h2>{t.toAnswer} <span className="workspace-count">{pending.length}</span></h2><p>{t.dailyHint}</p></div></div>
      {pending.length ? <div className="survey-grid">{pending.map(survey => <article className="workspace-card survey-card" key={survey.id}><NotebookPen aria-hidden="true" /><span className="workspace-badge pending">{t.toAnswer}</span><h3>{t.daily}</h3><p>{survey.reflection_day && participantDate(survey.reflection_day, locale)}</p><small>{survey.title}</small><Link className="workspace-button" href={`/dashboard/diario/${survey.id}`}>{t.reply}</Link></article>)}</div> : <div className="workspace-card workspace-empty compact"><ClipboardCheck aria-hidden="true" /><strong>{t.noPending}</strong><p>{t.noPendingHint}</p></div>}
    </section>
    <section><div className="workspace-section-heading"><h2>{t.completed} <span className="workspace-count">{completed.length}</span></h2></div>
      {completed.length ? <div className="survey-grid">{completed.map(survey => <article className="workspace-card survey-card" key={survey.id}><ClipboardCheck aria-hidden="true" /><span className="workspace-badge success">{t.completed}</span><h3>{survey.meeting_id ? t.daily : t.initial}</h3><p>{t.submittedAt} {participantDate(survey.submitted_at!, locale)}</p>{survey.title && <small>{survey.title}</small>}<Link className="workspace-button secondary" href={`/dashboard/diario/${survey.id}`}>{t.viewAnswers}</Link></article>)}</div> : <div className="workspace-card workspace-empty compact"><strong>{t.noAnswers}</strong><p>{t.noAnswersHint}</p></div>}
    </section>
  </div>
}
