import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/zoom/callback`

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const clientId = process.env.ZOOM_CLIENT_ID!
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!

  // 1. Get access token from Zoom
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  
  const tokenResponse = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json()
    console.error('Zoom token error:', errorData)
    return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
  }

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token

  // 2. Get user profile from Zoom
  const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!userResponse.ok) {
    return NextResponse.json({ error: 'Failed to fetch user data from Zoom' }, { status: 500 })
  }

  const zoomUser = await userResponse.json()
  console.log('--- ZOOM LOGIN DATA ---', zoomUser);
  
  const email = zoomUser.email
  const name = `${zoomUser.first_name || ''} ${zoomUser.last_name || ''}`.trim()
  const zoomId = zoomUser.id
  const avatar_url = zoomUser.pic_url || ''
  const whatsapp = zoomUser.phone_number || '' // If zoom provides phone number

  // 3. Find or Create Payload User
  const payload = await getPayload({ config })
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null

  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: email,
      },
    },
  })

  if (existingUsers.docs.length > 0) {
    user = existingUsers.docs[0]
  } else {
    // Generate a random password since payload auth requires it
    const randomPassword = crypto.randomBytes(20).toString('hex')
    
    user = await payload.create({
      collection: 'users',
      data: {
        email,
        password: randomPassword,
        name,
        zoomId,
        avatar_url,
        whatsapp, // Best effort from Zoom data
      },
    })
  }

  // 4. Log the user in to Payload (create session)
  const token = jwt.sign(
    { 
      email: user.email, 
      id: user.id, 
      collection: 'users' 
    },
    process.env.PAYLOAD_SECRET!,
    {
      expiresIn: '24h',
    }
  )

  const response = NextResponse.redirect(`${appUrl}/onboarding`)
  
  response.cookies.set('payload-token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
  })

  return response
}
