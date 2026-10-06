import test from 'node:test'
import assert from 'node:assert/strict'
import { participantProgress, trialProgress } from '../src/lib/participant-progress'
import type { AppLog } from '../src/lib/data/types'

const log = (id: string, changes: Partial<AppLog> = {}): AppLog => ({ id, user: { id: 'member', name: 'Member', email: 'member@example.test', role: 'user', createdAt: '', updatedAt: '' }, meetingId: 'room', meetingTitle: 'Sala', meetingUUID: 'session', source: 'zoom', participantRole: 'user', joinTime: '2026-10-06T10:00:00Z', leaveTime: '2026-10-06T10:10:00Z', durationMinutes: 10, createdAt: '', updatedAt: '', ...changes })

test('participant dashboard groups reconnects and only sums confirmed durations', () => {
  const progress = participantProgress([log('first'), log('reconnect'), log('pending', { leaveTime: null, durationMinutes: 90 }), log('admin', { participantRole: 'admin' }), log('legacy', { source: 'browser' }), log('next', { meetingUUID: 'second', joinTime: '2026-10-07T02:00:00Z', leaveTime: '2026-10-07T02:01:00Z', durationMinutes: 1 })], Date.parse('2026-10-07T02:10:00Z'))
  assert.equal(progress.history.length, 2)
  assert.equal(progress.minutes, 21)
  assert.equal(progress.activeDays, 1)
  assert.equal(progress.chart.at(-1)?.day, '2026-10-06')
  assert.equal(progress.chart.at(-1)?.minutes, 21)
  assert.equal(progress.history.find(item => item.id === 'session')?.connections, 3)
  assert.equal(progress.history.find(item => item.id === 'session')?.pending, true)
})

test('trial progress uses the authoritative expiry and stays in range', () => {
  const user = { createdAt: '2026-08-01T00:00:00Z', trialEndsAt: '2026-10-31T00:00:00Z' }
  assert.equal(trialProgress(user, Date.parse('2026-10-06T00:00:00Z')).elapsed, 5)
  assert.equal(trialProgress(user, Date.parse('2026-10-06T00:00:00Z')).remaining, 25)
  assert.equal(trialProgress(user, Date.parse('2026-12-01T00:00:00Z')).percent, 100)
  assert.equal(trialProgress(user, Date.parse('2026-12-01T00:00:00Z')).remaining, 0)
})
