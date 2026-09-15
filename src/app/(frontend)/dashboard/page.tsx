import RefreshStatus from '@/components/RefreshStatus'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { currentUser } from '@/lib/auth'
import { hasMeetingAccess, trialDaysRemaining } from '@/lib/access'
import { isLeadLog } from '@/lib/reporting'
import { redirect } from 'next/navigation'

export default async function ParticipantDashboard() {
  const user = await currentUser()
  if (!user) redirect('/auth')
  if (user.role === 'admin') redirect('/admin/dashboard')
  if (!user.onboardingCompleted) redirect('/onboarding')
  const payload = await getPayload({ config })
  const active = hasMeetingAccess(user)
  const meetings = active ? await payload.find({ collection: 'meetings', where: { or: [
    { status: { equals: 'live' } },
    { and: [{ date: { greater_than_equal: new Date().toISOString() } }, { status: { not_equals: 'ended' } }] },
  ] }, sort: 'date', pagination: false }) : { docs: [] }
  const logs = await payload.find({ collection: 'meeting-logs', where: { user: { equals: user.id } }, depth: 1, sort: '-joinTime', pagination: false })
  const history = logs.docs.filter(isLeadLog)
  const total = history.reduce((sum, log) => sum + (log.durationMinutes || 0), 0)
  return <div className="max-w-5xl mx-auto px-6 pt-12 pb-32 space-y-8">
    <RefreshStatus />
    <header><h1 className="text-3xl font-bold text-white">Meu Painel</h1><p className="mt-2">{active ? `${trialDaysRemaining(user)} dias restantes de acesso gratuito.` : 'Seu período gratuito de 30 dias terminou. Entre em contato com o trader para conhecer os produtos.'}</p></header>
    <section className="space-y-4"><h2 className="text-xl font-semibold text-white">Reuniões</h2>
      {meetings.docs.length === 0 && <p>Nenhuma reunião disponível no momento.</p>}
      {meetings.docs.map(meeting => <article key={meeting.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between gap-4">
        <div><h3 className="font-semibold text-white">{meeting.title}</h3><p>{new Date(meeting.date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília)</p></div>
        {meeting.status === 'live' ? <Link href={`/reuniao/${meeting.zoomMeetingId}`} className="bg-red-600 text-white px-5 py-3 rounded-xl">Ao vivo · Entrar</Link> : <span className="text-sm">Agendada</span>}
      </article>)}
    </section>
    <section className="space-y-4"><h2 className="text-xl font-semibold text-white">Histórico e progresso</h2><p>Tempo confirmado: {total.toFixed(2)} minutos</p>
      {history.length === 0 && <p>Você ainda não tem presenças registradas.</p>}
      {history.map(log => <article key={log.id} className="glass-panel p-5 rounded-2xl">
        <Link href={`/reuniao/${log.meetingId}/relatorio`} className="text-white font-semibold">Reunião {log.meetingId}</Link>
        <p>{log.joinTime ? new Date(log.joinTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Entrada aguardando confirmação'} · {Number(log.durationMinutes || 0).toFixed(2)} min</p>
        {!log.leaveTime && <p className="text-sm">Aguardando confirmação de saída pelo Zoom.</p>}
      </article>)}
    </section>
  </div>
}
