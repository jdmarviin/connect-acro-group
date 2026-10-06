import { participantContext, getParticipantProgress } from '@/lib/participant'
import { participantText } from '@/i18n/participant'
import ParticipationHistory from '@/components/ParticipationHistory'
import RefreshStatus from '@/components/RefreshStatus'

export default async function HistoryPage() {
  const { locale } = await participantContext()
  const { history } = await getParticipantProgress()
  const t = participantText(locale)
  return <div className="participant-page"><RefreshStatus /><header className="participant-page-heading"><div><p className="workspace-eyebrow">{t.space}</p><h1>{t.historyTitle}</h1><p>{t.historyIntro}</p></div></header><ParticipationHistory history={history} locale={locale} searchable /></div>
}
