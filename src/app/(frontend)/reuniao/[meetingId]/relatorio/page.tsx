import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { isLeadLog } from '@/lib/reporting'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'

export default async function MeetingReport({ params }: { params: Promise<{ meetingId: string }> }) {
  const user = await currentUser()
  if (!user) redirect('/auth')
  if (user.role === 'admin') redirect('/admin/dashboard')
  const { meetingId } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'meeting-logs', where: { and: [
    { user: { equals: user.id } }, { meetingId: { equals: meetingId } },
  ] }, depth: 1, pagination: false, sort: '-joinTime' })
  const logs = result.docs.filter(isLeadLog)
  return <div className="max-w-4xl mx-auto p-8 text-white space-y-6">
    <Link href="/dashboard" className="underline">Voltar ao painel</Link>
    <h1 className="text-2xl font-bold">Minhas presenças · Reunião {meetingId}</h1>
    <p>{logs.length} acessos · {logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0).toFixed(2)} minutos confirmados</p>
    {logs.length === 0 && <p>Nenhuma presença registrada.</p>}
    {logs.map(log => <article key={log.id} className="glass-panel p-5 rounded-xl">
      <p>Entrada: {log.joinTime ? new Date(log.joinTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Aguardando confirmação'}</p>
      <p>Saída: {log.leaveTime ? new Date(log.leaveTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Aguardando confirmação'}</p>
      <p>{Number(log.durationMinutes || 0).toFixed(2)} minutos</p>
    </article>)}
  </div>
}
