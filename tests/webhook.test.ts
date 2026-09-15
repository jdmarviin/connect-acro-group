/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test'
import assert from 'node:assert/strict'
import { processZoomEvent, type ZoomEvent } from '../src/lib/zoom-webhook'

// Repository double exercises the actual event processor, including query ordering and persisted results.
function database() {
  const tables: Record<string, any[]> = { users: [], 'meeting-logs': [], meetings: [], 'meeting-tickets': [] }
  function matches(doc: any, where: any): boolean {
    if (!where) return true
    return Object.entries(where).every(([key, condition]: [string, any]) => {
      if (key === 'and') return condition.every((clause: any) => matches(doc, clause))
      if (key === 'or') return condition.some((clause: any) => matches(doc, clause))
      return Object.entries(condition).every(([operator, value]: [string, any]) => {
        if (operator === 'equals') return doc[key] === value
        if (operator === 'exists') return (doc[key] !== undefined && doc[key] !== null) === value
        if (operator === 'less_than_equal') return doc[key] != null && doc[key] <= value
        if (operator === 'greater_than_equal') return doc[key] != null && doc[key] >= value
        throw new Error(`Unhandled operator ${operator}`)
      })
    })
  }
  const payload: any = {
    find: async ({ collection, where, sort, limit }: any) => {
      let docs = tables[collection].filter(doc => matches(doc, where))
      if (sort) {
        const key = sort.replace(/^-/, '')
        docs = [...docs].sort((a, b) => String(a[key]).localeCompare(String(b[key])) * (sort.startsWith('-') ? -1 : 1))
      }
      return { docs: limit ? docs.slice(0, limit) : docs }
    },
    create: async ({ collection, data }: any) => {
      const doc = { ...data, id: tables[collection].length + 1 }
      tables[collection].push(doc)
      return doc
    },
    update: async ({ collection, id, data }: any) => {
      const doc = tables[collection].find(d => d.id === id)
      Object.assign(doc, data)
      return doc
    },
  }
  return { tables, payload }
}
function event(type: 'joined' | 'left', participant: object, uuid = 'occurrence-a'): ZoomEvent {
  return { event: `meeting.participant_${type}`, payload: { object: { id: 123456789, uuid, host_id: 'host', participant: { user_id: 'connection-1', ...participant } } } }
}
const joined = '2026-09-15T10:00:00Z'
const left = '2026-09-15T10:01:15Z'

test('join, duplicate join and departure persist one accurate admin session', async () => {
  const { tables, payload } = database()
  tables.users.push({ id: 1, zoomId: 'host', role: 'admin', name: 'Trader' })
  const join = event('joined', { participant_user_id: 'host', join_time: joined })
  await processZoomEvent(payload, join, {} as any)
  await processZoomEvent(payload, join, {} as any)
  await processZoomEvent(payload, event('left', { participant_user_id: 'host', leave_time: left }), {} as any)
  assert.equal(tables['meeting-logs'].length, 1)
  assert.equal(tables['meeting-logs'][0].durationMinutes, 1.25)
  assert.equal(tables['meeting-logs'][0].participantRole, 'admin')
  assert.equal(tables['meeting-logs'][0].user, 1)
})
test('departure before arrival is reconciled, keeping the closed status', async () => {
  const { tables, payload } = database()
  await processZoomEvent(payload, event('left', { leave_time: left }), {} as any)
  await processZoomEvent(payload, event('joined', { join_time: joined }), {} as any)
  assert.equal(tables['meeting-logs'].length, 1)
  assert.equal(tables['meeting-logs'][0].durationMinutes, 1.25)
  assert.equal(tables['meeting-logs'][0].webhookStatus, 'left')
})
test('reconnection and repeated meeting number create distinct sessions', async () => {
  const { tables, payload } = database()
  await processZoomEvent(payload, event('joined', { join_time: joined }), {} as any)
  await processZoomEvent(payload, event('left', { leave_time: left }), {} as any)
  await processZoomEvent(payload, event('joined', { join_time: '2026-09-15T10:02:00Z' }), {} as any)
  await processZoomEvent(payload, event('left', { leave_time: '2026-09-15T10:03:00Z' }), {} as any)
  await processZoomEvent(payload, event('joined', { join_time: joined }, 'occurrence-b'), {} as any)
  assert.equal(tables['meeting-logs'].length, 3)
  assert.equal(tables['meeting-logs'].reduce((sum, log) => sum + log.durationMinutes, 0), 2.25)
})
test('display names never associate a guest with a lead', async () => {
  const { tables, payload } = database()
  tables.users.push({ id: 1, name: 'Same Name', role: 'user', zoomId: 'account-1' })
  await processZoomEvent(payload, event('joined', { user_name: 'Same Name', join_time: joined }), {} as any)
  assert.equal(tables['meeting-logs'][0].user, null)
})
test('server-issued customer key identifies an SDK attendee even without email', async () => {
  const { tables, payload } = database()
  tables['meeting-tickets'].push({ key: 'random-ticket', meetingId: '123456789', user: { id: 42, role: 'user' } })
  await processZoomEvent(payload, event('joined', { customer_key: 'random-ticket', join_time: joined }), {} as any)
  assert.equal(tables['meeting-logs'][0].user, 42)
})
test('late meeting.started never reopens an ended occurrence', async () => {
  const { tables, payload } = database()
  tables.meetings.push({ id: 1, zoomMeetingId: '123456789', date: joined, status: 'scheduled' })
  const object = { id: 123456789, uuid: 'occurrence-a', start_time: joined, end_time: left }
  await processZoomEvent(payload, { event: 'meeting.ended', payload: { object } }, {} as any)
  await processZoomEvent(payload, { event: 'meeting.started', payload: { object: { ...object, end_time: undefined } } }, {} as any)
  assert.equal(tables.meetings[0].status, 'ended')
  assert.equal(tables.meetings[0].meetingUUID, 'occurrence-a')
})
