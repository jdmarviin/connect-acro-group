import TrialCountdown from '@/components/TrialCountdown'
import { formatDuration } from '@/lib/format'
import { isManager } from '@/lib/access'
import RefreshStatus from '@/components/RefreshStatus'
import Link from 'next/link'
import { getData } from '@/lib/data'
import { currentUser } from '@/lib/auth'
import { hasMeetingAccess, trialEndsAt } from '@/lib/access'
import { isLeadLog } from '@/lib/reporting'
import { redirect } from 'next/navigation'
import JourneyInbox from '@/components/JourneyInbox'
import { Suspense } from 'react'

export default async function ParticipantDashboard() {
  const user = await currentUser()
  if (!user) redirect('/auth')
  if (isManager(user)) redirect('/admin/dashboard')
  if (!user.onboardingCompleted) redirect('/onboarding')
  const db = await getData()
  const active = hasMeetingAccess(user)
  const [meetings, logs] = await Promise.all([
    active ? db.find({ collection: 'meetings', where: { and: [
    { kind: { not_equals: 'occurrence' } },
    { or: [{ kind: { in: ['personal', 'recurring'] } }, { status: { not_in: ['ended', 'cancelled'] } }] },
  ] }, sort: 'date', pagination: false }) : Promise.resolve({ docs: [] }),
    db.find({ collection: 'meeting-logs', where: { user: { equals: user.id } }, depth: 1, sort: '-joinTime', pagination: false }),
  ])
  meetings.docs.sort((a, b) => Number(b.kind === 'personal') - Number(a.kind === 'personal'))
  const history = logs.docs.filter(isLeadLog)
  const total = history.reduce((sum, log) => sum + (log.durationMinutes || 0), 0)

  return <div className="max-w-5xl mx-auto px-6 pt-12 pb-32 space-y-8">
    <RefreshStatus />
    <header>
      <h1 className="text-3xl font-bold text-white">Meu Painel</h1>
      {active && <TrialCountdown endsAt={trialEndsAt(user)} initialNow={Date.now()} />}
    </header>

    {active ? (
      <p>Acesso até {new Date(trialEndsAt(user)).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília).</p>
    ) : (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
        <p className="font-bold">Seu período de acesso gratuito expirou.</p>
        <p>Para continuar participando das reuniões ao vivo, por favor, assine um dos nossos produtos.</p>
        <Link href="/dashboard/produtos" className="inline-block mt-4 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition">
          Ver Produtos
        </Link>
      </div>
    )}

    {active && (
      <section className="space-y-4"><h2 className="text-xl font-semibold text-white">Reuniões</h2>
        {meetings.docs.length === 0 && <p>Nenhuma reunião disponível no momento.</p>}
      {meetings.docs.map(meeting => <article key={meeting.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between gap-4">
        <div><h3 className="font-semibold text-white">{meeting.title}</h3><p>{meeting.date ? `${new Date(meeting.date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília)` : 'Recorrente · sem data fixa'}</p></div>
        <Link href={`/reuniao/${meeting.zoomMeetingId}`} className="bg-acro-blue text-white px-5 py-3 rounded-xl">{meeting.status === 'live' ? 'Ao vivo · Entrar' : 'Entrar e aguardar'}</Link>
      </article>)}
      </section>
    )}
    <Suspense fallback={<p role="status">Carregando avisos e diário…</p>}><JourneyInbox /></Suspense>
    <section className="space-y-4"><h2 className="text-xl font-semibold text-white">Histórico e progresso</h2><p>Tempo confirmado: {formatDuration(total)}</p>
      {history.length === 0 && <p>Você ainda não tem presenças registradas.</p>}
      {history.map(log => <article key={log.id} className="glass-panel p-5 rounded-2xl">
        <Link href={`/reuniao/${log.meetingId}/relatorio`} className="text-white font-semibold">Reunião {log.meetingId}</Link>
        <p>{log.joinTime ? new Date(log.joinTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Entrada aguardando confirmação'} · {formatDuration(log.durationMinutes)}</p>
        {!log.leaveTime && <p className="text-sm">Aguardando confirmação de saída pelo Zoom.</p>}
      </article>)}
    </section>
  </div>
}
