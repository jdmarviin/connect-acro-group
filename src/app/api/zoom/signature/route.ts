import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { meetingNumber, role } = await request.json()
    
    if (!meetingNumber) {
      return NextResponse.json({ error: 'Meeting Number is required' }, { status: 400 })
    }

    const zoomClientId = process.env.ZOOM_CLIENT_ID!
    const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET!

    if (!zoomClientId || !zoomClientSecret) {
      return NextResponse.json({ error: 'Zoom Client credentials are not configured' }, { status: 500 })
    }

    const iat = Math.round((new Date().getTime() - 30000) / 1000)
    const exp = iat + 60 * 60 * 2 // 2 hours
    const oHeader = { alg: 'HS256', typ: 'JWT' }

    const payload = {
      sdkKey: zoomClientId,
      appKey: zoomClientId, // required by some SDK versions
      mn: meetingNumber,
      role: role || 0, // 0 for attendee, 1 for host
      iat: iat,
      exp: exp,
      tokenExp: exp
    }

    // sign using HS256
    const signature = jwt.sign(payload, zoomClientSecret, { algorithm: 'HS256' })

    return NextResponse.json({ signature, sdkKey: zoomClientId })
  } catch (error) {
    console.error('Error generating Zoom SDK signature:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
