import 'server-only'
import { NextResponse } from 'next/server'
import { supabaseServer } from './server'
import { query } from './database'
import { encryptToken } from '../zoom-api'
import { isManager } from '../access'
import { readUser } from './read'
import { authOrigin, requestHost } from './auth-redirect'

export async function startSupabaseLogin(request: Request) {
  const origin = authOrigin(request, process.env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV !== 'production')
  // Create the verifier only on the domain that will receive its callback.
  if (requestHost(request) !== new URL(origin).host) return NextResponse.redirect(new URL('/api/auth/zoom', origin))
  const client = await supabaseServer()
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'zoom',
    options: { redirectTo: `${origin}/api/auth/zoom/callback` },
  })
  if (error || !data.url) return NextResponse.json({ error: 'Não foi possível iniciar o login Zoom.' }, { status: 503 })
  return NextResponse.redirect(data.url)
}
export async function finishSupabaseLogin(request: Request) {
  const url = new URL(request.url)
  const origin = authOrigin(request, process.env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV !== 'production')
  const failure = (reason: string) => NextResponse.redirect(new URL(`/auth?error=${reason}`, origin))
  if (url.searchParams.has('error')) return failure('oauth_provider')
  const code = url.searchParams.get('code')
  if (!code) return failure('oauth_code_missing')
  const client = await supabaseServer()
  const flowId = url.searchParams.get('sb_flow_id')
  const { data, error } = await client.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined)
  if (error || !data.user || !data.session) {
    console.error('OAuth session exchange failed', { code: error?.code || 'missing_session' })
    return failure('oauth_session')
  }
  // Identity comes from the verified OAuth identity, never editable user_metadata.
  const zoomIdentity = data.user.identities?.find(identity => identity.provider === 'zoom')
  const zoomId = zoomIdentity?.identity_data?.sub
  if (!zoomId) { await client.auth.signOut(); return failure('oauth_identity') }
  const user = await readUser(data.user.id)
  if (!user || user.isBlocked || (user.zoomId && user.zoomId !== String(zoomId))) {
    await client.auth.signOut()
    return failure('oauth_identity')
  }
  await query('update connect.profiles set zoom_user_id=$1 where id=$2', [String(zoomId), data.user.id])
  const { provider_token, provider_refresh_token } = data.session
  if (isManager(user) && provider_token && provider_refresh_token) {
    const secret = process.env.ZOOM_TOKEN_ENCRYPTION_KEY
    if (!secret) throw new Error('Configure ZOOM_TOKEN_ENCRYPTION_KEY.')
    // Force a provider refresh on first API call; Supabase session expiry is not Zoom token expiry.
    await query(`insert into private.zoom_credentials(user_id,access_token_encrypted,refresh_token_encrypted,expires_at)
      values($1,$2,$3,now()) on conflict(user_id) do update set access_token_encrypted=excluded.access_token_encrypted,
      refresh_token_encrypted=excluded.refresh_token_encrypted,expires_at=excluded.expires_at,updated_at=now()`,
      [user.id, encryptToken(provider_token,secret), encryptToken(provider_refresh_token,secret)])
  }
  await client.rpc('record_visit')
  const destination = isManager(user) ? '/admin/dashboard' : user.onboardingCompleted ? '/dashboard' : '/onboarding'
  return NextResponse.redirect(new URL(destination, origin))
}
