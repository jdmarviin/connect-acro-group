import RefreshStatus from '@/components/RefreshStatus'
import { findJoinableMeeting } from '@/lib/meetings'
import { isManager } from '@/lib/access'
import { currentUser } from '@/lib/auth'
import { hasMeetingAccess } from '@/lib/access'
import { getData } from '@/lib/data'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReuniaoPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const user = await currentUser()
  if (!user) redirect('/auth')
  if (!hasMeetingAccess(user)) redirect('/dashboard?expired=1')
  if (!isManager(user) && !user.onboardingCompleted) redirect('/onboarding')
  const { meetingId } = await params
  const db = await getData()
  const meeting = await findJoinableMeeting(db, meetingId)
  if (!meeting) notFound()
  if (meeting.status === 'ended') return (
    <div className="max-w-xl mx-auto p-10 text-white space-y-6">
      <h1 className="text-2xl font-bold">{meeting.title}</h1>
      <p>Esta reunião foi encerrada.</p>
      <Link className="block underline" href="/dashboard">Voltar ao painel</Link>
    </div>
  )
  if (meeting.status !== 'live' && !isManager(user)) return (
    <div className="max-w-xl mx-auto p-10 text-white space-y-6">
      <h1 className="text-2xl font-bold">{meeting.title}</h1>
      <RefreshStatus interval={5000} /><p>Aguardando o administrador iniciar a reunião. Você entrará automaticamente quando a sala estiver ao vivo.</p>
      <Link className="block underline" href="/dashboard">Voltar ao painel</Link>
    </div>
  )
  return <div className="w-full h-full bg-black overflow-hidden"><iframe title={meeting.title} src={`/zoom.html?meetingNumber=${encodeURIComponent(meetingId)}`} allow="camera; microphone; display-capture" referrerPolicy="no-referrer" className="w-full h-full border-none" /></div>
}
