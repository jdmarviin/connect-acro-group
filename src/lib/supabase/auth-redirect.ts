// Only the configured public host and development loopback hosts can receive OAuth.
// Never use an arbitrary forwarded host as an authorization-code destination.
export function requestHost(request: Request): string {
  return (request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host).split(',')[0].trim()
}

export function authOrigin(request: Request, configured: string | undefined, development: boolean): string {
  const canonical = new URL(configured || 'http://localhost:3000').origin
  const host = requestHost(request)
  if (host === new URL(canonical).host) return canonical
  if (development) {
    try {
      const local = new URL(`${new URL(request.url).protocol}//${host}`)
      if (!local.username && !local.password && ['localhost', '127.0.0.1', '[::1]'].includes(local.hostname)) return local.origin
    } catch { /* Invalid/untrusted hosts fall back to the configured origin. */ }
  }
  return canonical
}

export function recoverOAuthCallback(url: URL): URL | null {
  if (url.pathname !== '/' || !url.searchParams.get('code')) return null
  const callback = new URL('/api/auth/zoom/callback', url.origin)
  callback.searchParams.set('code', url.searchParams.get('code')!)
  const flowId = url.searchParams.get('sb_flow_id')
  if (flowId) callback.searchParams.set('sb_flow_id', flowId)
  return callback
}
