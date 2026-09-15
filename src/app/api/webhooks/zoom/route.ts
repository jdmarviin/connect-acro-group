import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createLocalReq, getPayload } from 'payload'
import config from '@/payload.config'
import { processZoomEvent, supportedEvents, validateZoomEvent, verifyZoomSignature } from '@/lib/zoom-webhook'

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
  if (process.env.ZOOM_ACCOUNT_ID && body.payload.account_id !== process.env.ZOOM_ACCOUNT_ID) return NextResponse.json({ error: 'Unexpected Zoom account' }, { status: 403 })
  const eventKey = crypto.createHash('sha256').update(JSON.stringify([body.event, body.payload])).digest('hex')
  const payload = await getPayload({ config })
  const duplicate = await payload.find({ collection: 'zoom-events', where: { eventKey: { equals: eventKey } }, limit: 1 })
  if (duplicate.docs.length) return NextResponse.json({ success: true, duplicate: true })
  const transactionID = await payload.db.beginTransaction()
  if (transactionID == null) return NextResponse.json({ error: 'Database transaction unavailable' }, { status: 503 })
  const req = await createLocalReq({}, payload)
  req.transactionID = transactionID
  try {
    await payload.create({ collection: 'zoom-events', data: { eventKey, event: body.event, body }, req })
    await processZoomEvent(payload, body, req)
    await payload.db.commitTransaction(transactionID)
    return NextResponse.json({ success: true })
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    // A competing delivery may have committed the same receipt while we were processing.
    const delivered = await payload.find({ collection: 'zoom-events', where: { eventKey: { equals: eventKey } }, limit: 1 })
    if (delivered.docs.length) return NextResponse.json({ success: true, duplicate: true })
    payload.logger.error({ err: error, eventKey }, 'Zoom webhook failed; delivery may be retried')
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
