import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { supportedEvents, validateZoomEvent, verifyZoomSignature } from '@/lib/zoom-webhook'
import { transaction } from '@/lib/supabase/database'
import { persistZoomEvent } from '@/lib/supabase/process-event'

export async function POST(request: Request) {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN
  if (!secret) return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 503 })
  const text = await request.text()
  if (!verifyZoomSignature(text, request.headers.get('x-zm-request-timestamp'), request.headers.get('x-zm-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature or timestamp' }, { status: 401 })
  }
  let body
  try { body = JSON.parse(text) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (body?.event === 'endpoint.url_validation') {
    const plainToken = body.payload?.plainToken
    if (typeof plainToken !== 'string') return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    return NextResponse.json({ plainToken, encryptedToken: crypto.createHmac('sha256', secret).update(plainToken).digest('hex') })
  }
  if (!supportedEvents.includes(body?.event)) return NextResponse.json({ ignored: true })
  if (!validateZoomEvent(body)) return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 })
  if (process.env.ZOOM_ACCOUNT_ID && body.payload.account_id !== process.env.ZOOM_ACCOUNT_ID) {
    return NextResponse.json({ error: 'Unexpected Zoom account' }, { status: 403 })
  }
  const eventKey = crypto.createHash('sha256').update(JSON.stringify([body.event, body.payload])).digest('hex')
  try {
    return NextResponse.json(await transaction(db => persistZoomEvent(db, body, eventKey)))
  } catch {
    console.error('Zoom webhook failed', { eventKey })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
