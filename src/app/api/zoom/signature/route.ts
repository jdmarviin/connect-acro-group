import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { currentUser } from '@/lib/auth'
import { findJoinableMeeting } from '@/lib/meetings'
import { zoomSupabaseRequest, issueSupabaseTicket } from '@/lib/supabase/zoom'
import { hasMeetingAccess, isManager } from '@/lib/access'
import { getData } from '@/lib/data'

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Faça login para participar.' }, { status: 401 })
  if (!hasMeetingAccess(user)) return NextResponse.json({ error: 'Seu período de 30 dias terminou.' }, { status: 403 })
  if (!isManager(user) && !user.onboardingCompleted) return NextResponse.json({ error: 'Conclua seu cadastro.' }, { status: 403 })
  let input
  try { input = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }
  const meetingNumber = String(input?.meetingNumber || '')
  if (!/^\d{9,11}$/.test(meetingNumber)) return NextResponse.json({ error: 'Reunião inválida.' }, { status: 400 })
  const db = await getData()
  const meeting = await findJoinableMeeting(db, meetingNumber)
  if (!meeting) return NextResponse.json({ error: 'Reunião não encontrada.' }, { status: 404 })
  if (meeting.status !== 'live' && !isManager(user)) return NextResponse.json({ error: 'Aguarde o trader iniciar esta reunião.' }, { status: 403 })
  if (meeting.status === 'ended' || meeting.status === 'cancelled') return NextResponse.json({ error: 'Esta reunião foi encerrada ou cancelada.' }, { status: 409 })
  const sdkKey = process.env.ZOOM_CLIENT_ID
  const sdkSecret = process.env.ZOOM_CLIENT_SECRET
  if (!sdkKey || !sdkSecret) return NextResponse.json({ error: 'Configure ZOOM_CLIENT_ID e ZOOM_CLIENT_SECRET para usar o Meeting SDK.' }, { status: 503 })
  const iat = Math.floor(Date.now() / 1000) - 30
  const exp = iat + 1800
  const role = isManager(user) ? 1 : 0
  let zak: string | undefined
  if (role === 1) {
    try {
      const hostId = typeof meeting.host === 'object' ? meeting.host?.id : meeting.host
      if (!hostId) throw new Error('Esta reunião foi cadastrada sem anfitrião vinculado. Inicie pelo aplicativo Zoom.')
      const host = await db.findByID({ collection: 'users', id: hostId })
      if (!host.zoomId || host.zoomId !== meeting.zoomHostId) throw new Error('O anfitrião da reunião não corresponde à conta Zoom vinculada.')
      const result = await zoomSupabaseRequest<{ token: string }>(host, '/users/me/token?type=zak')
      if (!result.token) throw new Error('O Zoom não retornou a autorização do anfitrião.')
      zak = result.token
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível iniciar a reunião.' }, { status: 503 })
    }
  }
  const signature = jwt.sign({ sdkKey, appKey: sdkKey, mn: meetingNumber, role, iat, exp, tokenExp: exp }, sdkSecret, { algorithm: 'HS256' })
  const customerKey = crypto.randomUUID()
  const password = await issueSupabaseTicket(String(user.id), meetingNumber, customerKey, new Date(exp * 1000).toISOString())
  return NextResponse.json({ signature, sdkKey, zak, customerKey, userName: user.name, userEmail: user.email, password }, { headers: { 'Cache-Control': 'no-store' } })
}
