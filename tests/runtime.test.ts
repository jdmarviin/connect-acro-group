import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { encryptToken, decryptToken } from '../src/lib/zoom-api'

test('application dependencies and Next config do not load the archived Payload CMS', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const dependencies = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  assert.equal(dependencies.some(name => name === 'payload' || name.startsWith('@payloadcms/')), false)
  assert.equal(Object.values(pkg.scripts).some(command => /\bpayload (run|migrate)/.test(String(command))), false)
  const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(config, /withPayload|@payloadcms/)
  const auth = readFileSync(new URL('../src/lib/auth.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(auth, /getPayload|payload\.config|DATA_BACKEND/)
  assert.match(auth, /cache\(async/)
})

test('Zoom credentials retain authenticated encryption after removing Payload', () => {
  const secret = 'test-key-for-zoom-credential-encryption'
  const encrypted = encryptToken('private-provider-token', secret)
  assert.notEqual(encrypted, 'private-provider-token')
  assert.equal(decryptToken(encrypted, secret), 'private-provider-token')
  assert.throws(() => decryptToken(encrypted, 'another-key'))
  const parts = encrypted.split('.')
  const bytes = Buffer.from(parts[2], 'base64url')
  bytes[0] ^= 1
  parts[2] = bytes.toString('base64url')
  assert.throws(() => decryptToken(parts.join('.'), secret))
})
