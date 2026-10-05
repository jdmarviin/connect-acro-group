import test from 'node:test'
import assert from 'node:assert/strict'
import { authOrigin, recoverOAuthCallback } from '../src/lib/supabase/auth-redirect'

const canonical = 'https://connect.example.test'
test('OAuth preserves the development origin instead of moving localhost cookies to the tunnel', () => {
  assert.equal(authOrigin(new Request('http://localhost:3000/api/auth/zoom'), canonical, true), 'http://localhost:3000')
  assert.equal(authOrigin(new Request('http://127.0.0.1:3000/api/auth/zoom'), canonical, true), 'http://127.0.0.1:3000')
  assert.equal(authOrigin(new Request(`${canonical}/api/auth/zoom`), canonical, true), canonical)
  assert.equal(authOrigin(new Request('http://localhost:3000/api/auth/zoom', { headers: { 'x-forwarded-host': 'connect.example.test' } }), canonical, true), canonical)
})
test('untrusted hosts cannot change the OAuth destination', () => {
  assert.equal(authOrigin(new Request('https://attacker.example/api/auth/zoom'), canonical, false), canonical)
  assert.equal(authOrigin(new Request(`${canonical}/api/auth/zoom`, { headers: { 'x-forwarded-host': 'attacker.example' } }), canonical, false), canonical)
  assert.equal(authOrigin(new Request('http://localhost:3000/api/auth/zoom'), canonical, false), canonical)
})
test('a PKCE code returned to the landing is forwarded only to the local callback', () => {
  const callback = recoverOAuthCallback(new URL(`${canonical}/?code=test-code&sb_flow_id=test-flow&next=https://attacker.example`))!
  assert.equal(callback.origin, canonical)
  assert.equal(callback.pathname, '/api/auth/zoom/callback')
  assert.equal(callback.searchParams.get('code'), 'test-code')
  assert.equal(callback.searchParams.get('sb_flow_id'), 'test-flow')
  assert.equal(callback.searchParams.has('next'), false)
  assert.equal(recoverOAuthCallback(new URL(canonical)), null)
  assert.equal(recoverOAuthCallback(new URL(`${canonical}/dashboard?code=test`)), null)
})
