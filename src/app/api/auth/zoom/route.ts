import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/zoom/callback`

  if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) return NextResponse.json({ error: 'Configure o OAuth do Zoom.' }, { status: 503 })
  const state = crypto.randomBytes(32).toString('hex')
  const zoomAuthUrl = new URL('https://zoom.us/oauth/authorize')
  zoomAuthUrl.searchParams.set('response_type', 'code')
  zoomAuthUrl.searchParams.set('client_id', process.env.ZOOM_CLIENT_ID || '')
  zoomAuthUrl.searchParams.set('redirect_uri', redirectUri)

  zoomAuthUrl.searchParams.set('state', state)
  const response = NextResponse.redirect(zoomAuthUrl.toString())
  response.cookies.set('zoom-oauth-state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 })
  return response
}
