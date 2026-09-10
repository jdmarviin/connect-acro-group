import { NextResponse } from 'next/server'

export async function GET() {

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/zoom/callback`

  const zoomAuthUrl = new URL('https://zoom.us/oauth/authorize')
  zoomAuthUrl.searchParams.set('response_type', 'code')
  zoomAuthUrl.searchParams.set('client_id', process.env.ZOOM_CLIENT_ID || '')
  zoomAuthUrl.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.redirect(zoomAuthUrl.toString())
}
