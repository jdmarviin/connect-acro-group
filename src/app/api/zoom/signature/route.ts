import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { currentUser } from '@/lib/auth'
import { hasMeetingAccess } from '@/lib/access'
import { parseZoomLink } from '@/lib/zoom-link'

export async function POST(request: Request) {
  const user = await currentUser(request.headers)
  if (!user) return NextResponse.json({ error: 'Faça login para participar.' }, { status: 401 })
  if (!hasMeetingAccess(user)) return NextResponse.json({ error: 'Seu período de 30 dias terminou.' }, { status: 403 })
  if (user.role !== 'admin' && !user.onboardingCompleted) return NextResponse.json({ error: 'Conclua seu cadastro.' }, { status: 403 })
  let input
  try { input = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }
  const meetingNumber = String(input?.meetingNumber || '')
  if (!/^\d{9,11}$/.test(meetingNumber)) return NextResponse.json({ error: 'Reunião inválida.' }, { status: 400 })
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'meetings', where: { and: [
    { zoomMeetingId: { equals: meetingNumber } }, { status: { equals: 'live' } },
  ] }, limit: 1 })
  const meeting = result.docs[0]
  if (!meeting) return NextResponse.json({ error: 'Aguarde o trader iniciar esta reunião.' }, { status: 403 })
  const sdkKey = process.env.ZOOM_SDK_KEY || process.env.ZOOM_CLIENT_ID
  const sdkSecret = process.env.ZOOM_SDK_SECRET || process.env.ZOOM_CLIENT_SECRET
  if (!sdkKey || !sdkSecret) return NextResponse.json({ error: 'Meeting SDK não configurado.' }, { status: 503 })
  const iat = Math.floor(Date.now() / 1000) - 30
  const exp = iat + 1800
  // The trader starts the meeting using their authenticated Zoom app. Embedded access is attendee-only.
  const signature = jwt.sign({ sdkKey, appKey: sdkKey, mn: meetingNumber, role: 0, iat, exp, tokenExp: exp }, sdkSecret, { algorithm: 'HS256' })
  const customerKey = crypto.randomUUID()
  await payload.create({ collection: 'meeting-tickets', data: { key: customerKey, user: user.id, meetingId: meetingNumber, expiresAt: new Date(exp * 1000).toISOString() } })
  return NextResponse.json({ signature, sdkKey, customerKey, userName: user.name, userEmail: user.email, password: parseZoomLink(meeting.zoomLink).password }, { headers: { 'Cache-Control': 'no-store' } })
}
