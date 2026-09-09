import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: Request) {
  try {
    const zoomWebhookSecret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN
    const signature = request.headers.get('x-zm-signature')
    const timestamp = request.headers.get('x-zm-request-timestamp')
    
    const bodyText = await request.text()
    let body: any = {}
    try {
      body = JSON.parse(bodyText)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // 1. Validation Logic for Zoom URL setup
    if (body.event === 'endpoint.url_validation') {
      const plainToken = body.payload.plainToken
      const hashForValidate = crypto.createHmac('sha256', zoomWebhookSecret || '')
        .update(plainToken)
        .digest('hex')
      
      return NextResponse.json({
        plainToken: plainToken,
        encryptedToken: hashForValidate
      })
    }

    // 2. Security validation for actual events
    // https://developers.zoom.us/docs/api/rest/webhook-reference/#verify-webhook-events
    if (zoomWebhookSecret && signature && timestamp) {
      const message = `v0:${timestamp}:${bodyText}`
      const hashForVerify = crypto.createHmac('sha256', zoomWebhookSecret)
        .update(message)
        .digest('hex')
      
      const signatureHash = `v0=${hashForVerify}`
      
      if (signature !== signatureHash) {
        return NextResponse.json({ error: 'Unauthorized signature' }, { status: 401 })
      }
    }

    const payload = await getPayload({ config })
    const { event, payload: eventPayload } = body
    
    // Zoom sends participant joined
    if (event === 'meeting.participant_joined') {
      const { object } = eventPayload
      const { id: meetingId, participant } = object
      
      // We try to find the user in our system by zoom userId (if logged in with zoom) or email
      let userId = null
      
      const users = await payload.find({
        collection: 'users',
        where: {
          or: [
            { zoomId: { equals: participant.user_id } },
            { email: { equals: participant.email } }
          ]
        }
      })
      
      if (users.docs.length > 0) {
        userId = users.docs[0].id
      }
      
      await payload.create({
        collection: 'meeting-logs',
        data: {
          user: userId,
          zoomUserId: participant.user_id,
          meetingId: meetingId.toString(),
          joinTime: new Date(participant.join_time).toISOString(),
          webhookStatus: 'joined'
        }
      })
    }
    
    // Zoom sends participant left
    if (event === 'meeting.participant_left') {
      const { object } = eventPayload
      const { id: meetingId, participant } = object
      
      // Find the open log for this user & meeting
      const openLogs = await payload.find({
        collection: 'meeting-logs',
        where: {
          and: [
            { meetingId: { equals: meetingId.toString() } },
            { zoomUserId: { equals: participant.user_id } },
            { webhookStatus: { equals: 'joined' } }
          ]
        },
        sort: '-createdAt', // Get the latest one
        limit: 1
      })
      
      if (openLogs.docs.length > 0) {
        const log = openLogs.docs[0]
        const joinTime = new Date(log.joinTime as string).getTime()
        const leaveTime = new Date(participant.leave_time).getTime()
        const durationMinutes = Math.round((leaveTime - joinTime) / 60000)
        
        await payload.update({
          collection: 'meeting-logs',
          id: log.id,
          data: {
            leaveTime: new Date(participant.leave_time).toISOString(),
            durationMinutes: durationMinutes,
            webhookStatus: 'left'
          }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in Zoom webhook:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
