/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test'
import assert from 'node:assert/strict'
import { Users } from '../src/collections/Users'
import { Meetings } from '../src/collections/Meetings'
import { MeetingLogs } from '../src/collections/MeetingLogs'

function context(user: any = null): any { return { req: { user }, data: {} } }
test('generated APIs deny anonymous writes and prevent participants from managing meetings or logs', async () => {
  for (const collection of [Users, Meetings, MeetingLogs]) assert.equal(await collection.access!.create!(context()), false)
  assert.equal(await Meetings.access!.update!(context({ id: 1, role: 'user' })), false)
  assert.equal(await MeetingLogs.access!.read!(context({ id: 1, role: 'user' })), false)
  assert.equal(await Meetings.access!.create!(context({ id: 1, role: 'admin' })), true)
})
test('leads can only read/update themselves and cannot promote their role or unlock another user', async () => {
  const req = context({ id: 42, role: 'user' })
  assert.deepEqual(await Users.access!.read!(req), { id: { equals: 42 } })
  assert.deepEqual(await Users.access!.update!(req), { id: { equals: 42 } })
  assert.equal(await Users.access!.unlock!(req), false)
  const role = Users.fields.find((field: any) => field.name === 'role') as any
  assert.equal(await role.access.update(req), false)
})
test('user updates preserve the original trial date even when a new date is supplied', async () => {
  const hook = Users.hooks!.beforeChange![0]
  const data: any = { createdAt: '2099-01-01T00:00:00Z' }
  await hook({ operation: 'update', data, originalDoc: { createdAt: '2026-08-01T00:00:00Z' } } as any)
  assert.equal(data.createdAt, '2026-08-01T00:00:00Z')
})
