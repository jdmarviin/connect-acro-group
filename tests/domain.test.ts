import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { hasMeetingAccess, isLeadLog, trialDaysRemaining, TRIAL_MS } from '../src/lib/access'
import { parseZoomLink } from '../src/lib/zoom-link'
import { durationMinutes, verifyZoomSignature, validateZoomEvent } from '../src/lib/zoom-webhook'
import { belongsToMeeting } from '../src/lib/reporting'

test('trial lasts exactly 30 days and cannot be reset by a fresh login', () => {
  const lead = { role: 'user', createdAt: '2026-08-01T12:00:00Z' }
  const start = Date.parse(lead.createdAt)
  assert.equal(hasMeetingAccess(lead, start + TRIAL_MS - 1), true)
  assert.equal(hasMeetingAccess(lead, start + TRIAL_MS), false)
  assert.equal(trialDaysRemaining(lead, start), 30)
  assert.equal(trialDaysRemaining(lead, start + TRIAL_MS), 0)
  assert.equal(hasMeetingAccess({ ...lead, role: 'admin' }, start + 10 * TRIAL_MS), true)
  assert.equal(hasMeetingAccess(null), false)
  assert.equal(hasMeetingAccess({ role: 'user' }), false)
})
test('commercial reports exclude admins, unidentified guests and old browser telemetry', () => {
  assert.equal(isLeadLog({ user: { role: 'user' }, source: 'zoom' }), true)
  assert.equal(isLeadLog({ user: { role: 'admin' }, source: 'zoom' }), false)
  assert.equal(isLeadLog({ user: { role: 'user' }, participantRole: 'admin' }), false)
  assert.equal(isLeadLog({ user: null }), false)
  assert.equal(isLeadLog({ user: 7 }), false)
  assert.equal(isLeadLog({ user: { role: 'user' }, zoomUserId: 'web-sdk-7' }), false)
})
test('webhook accepts only signed fresh requests, including validation challenges', () => {
  const body = '{"event":"meeting.started"}'
  const timestamp = '1800000000'
  const secret = 'test-secret'
  const signature = 'v0=' + crypto.createHmac('sha256', secret).update(`v0:${timestamp}:${body}`).digest('hex')
  assert.equal(verifyZoomSignature(body, timestamp, signature, secret, Number(timestamp) * 1000), true)
  assert.equal(verifyZoomSignature(body + ' ', timestamp, signature, secret, Number(timestamp) * 1000), false)
  assert.equal(verifyZoomSignature(body, timestamp, signature, secret, Number(timestamp) * 1000 + 301000), false)
  assert.equal(verifyZoomSignature(body, timestamp, null, secret), false)
  assert.equal(verifyZoomSignature(body, null, signature, secret), false)
  assert.equal(verifyZoomSignature(body, timestamp, signature, ''), false)
})
test('duration retains short sessions and rejects invalid/negative intervals', () => {
  assert.equal(durationMinutes('2026-01-01T10:00:00Z', '2026-01-01T10:00:15Z'), 0.25)
  assert.equal(durationMinutes('2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z'), 60)
  assert.throws(() => durationMinutes('2026-01-01T11:00:00Z', '2026-01-01T10:00:00Z'))
  assert.throws(() => durationMinutes('invalid', '2026-01-01T10:00:00Z'))
})
test('Zoom links retain encoded passcodes and reject unrelated hosts', () => {
  assert.deepEqual(parseZoomLink('https://us02web.zoom.us/j/12345678901?pwd=abc%2B123'), { meetingNumber: '12345678901', password: 'abc+123' })
  for (const link of ['https://zoom.us.attacker.test/j/123456789', 'http://zoom.us/j/123456789', 'https://example.org/j/123456789', 'https://zoom.us/j/123']) assert.throws(() => parseZoomLink(link))
})
test('reports separate recurring occurrences using UUID even across midnight', () => {
  const meeting = { zoomMeetingId: '123', meetingUUID: 'occurrence-a', date: '2026-09-15T23:00:00Z' }
  assert.equal(belongsToMeeting({ meetingId: '123', meetingUUID: 'occurrence-a', joinTime: '2026-09-16T04:00:00Z', createdAt: '' }, meeting), true)
  assert.equal(belongsToMeeting({ meetingId: '123', meetingUUID: 'occurrence-b', createdAt: meeting.date }, meeting), false)
})
test('participant events require an occurrence, connection identity and valid time', () => {
  assert.equal(validateZoomEvent({ event: 'meeting.participant_joined', payload: { object: { id: 123, uuid: 'abc', participant: { user_id: '1', join_time: '2026-09-15T10:00:00Z' } } } }), true)
  assert.equal(validateZoomEvent({ event: 'meeting.participant_joined', payload: { object: { id: 123, uuid: 'abc', participant: { user_name: 'Someone', join_time: '2026-09-15T10:00:00Z' } } } }), false)
})

test('owner is exempt from trial and is excluded from lead reports even after a role change', () => {
  assert.equal(hasMeetingAccess({ role: 'owner' }), true)
  assert.equal(isLeadLog({ user: { role: 'owner' }, source: 'zoom' }), false)
  assert.equal(isLeadLog({ user: { role: 'user' }, participantRole: 'owner', source: 'zoom' }), false)
})
test('permanent room reports aggregate all its occurrences without conflating other rooms', () => {
  const room = { zoomMeetingId: '123', kind: 'personal', date: null, meetingUUID: 'latest' }
  assert.equal(belongsToMeeting({ meetingId: '123', meetingUUID: 'older', createdAt: '' }, room), true)
  assert.equal(belongsToMeeting({ meetingId: '456', meetingUUID: 'older', createdAt: '' }, room), false)
})
