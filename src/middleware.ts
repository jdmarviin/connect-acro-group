import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseConfig } from './lib/supabase/config'
import { withoutProviderTokens } from './lib/supabase/cookies'
import { recoverOAuthCallback } from './lib/supabase/auth-redirect'

export async function middleware(request: NextRequest) {
  const callback = recoverOAuthCallback(request.nextUrl)
  if (callback) return NextResponse.redirect(callback, {
    headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
  })
  // The landing page remains independent of Auth network latency.
  if (request.nextUrl.pathname === '/') return NextResponse.next()
  // The obsolete Payload API/admin must not remain available after cutover.
  if (request.nextUrl.pathname.startsWith('/admin/collections') || request.nextUrl.pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }
  let response = NextResponse.next({ request })
  // No Auth network request for anonymous visitors. Protected pages still enforce login.
  if (!request.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))) return response
  const { url, key } = supabaseConfig()
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: values => {
        const safeValues = withoutProviderTokens(values)
        safeValues.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        safeValues.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  await client.auth.getUser()
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
export const config = {
  matcher: ['/','/dashboard/:path*','/admin/:path*','/onboarding','/reuniao/:path*','/api/auth/:path*','/api/users/:path*','/api/zoom/:path*'],
}
