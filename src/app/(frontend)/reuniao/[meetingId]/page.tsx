import { currentUser } from '@/lib/auth'
import { hasMeetingAccess } from '@/lib/access'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReuniaoPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const user = await currentUser()
  if (!user) redirect('/auth')
  if (!hasMeetingAccess(user)) redirect('/dashboard?expired=1')
  if (user.role !== 'admin' && !user.onboardingCompleted) redirect('/onboarding')
  const { meetingId } = await params
  const payload = await getPayload({ config })
  const meetings = await payload.find({ collection: 'meetings', where: { zoomMeetingId: { equals: meetingId } }, sort: '-date', limit: 1 })
  const meeting = meetings.docs[0]
  if (!meeting) notFound()
  if (meeting.status !== 'live') return (
    <div className="max-w-xl mx-auto p-10 text-white space-y-6">
      <h1 className="text-2xl font-bold">{meeting.title}</h1>
      <p>{meeting.status === 'ended' ? 'Esta reunião foi encerrada.' : 'Aguarde o trader iniciar a reunião. Depois, atualize esta página.'}</p>
      {user.role === 'admin' && <a className="block underline" href={meeting.zoomLink} target="_blank" rel="noopener noreferrer">Abrir no Zoom com a conta do anfitrião</a>}
      <Link className="block underline" href="/dashboard">Voltar ao painel</Link>
    </div>
  )
  return <div className="w-full h-full bg-black overflow-hidden"><iframe title={meeting.title} src={`/zoom.html?meetingNumber=${encodeURIComponent(meetingId)}`} allow="camera; microphone; display-capture" referrerPolicy="no-referrer" className="w-full h-full border-none" /></div>
}
