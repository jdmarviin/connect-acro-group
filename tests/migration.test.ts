import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const file = readdirSync(new URL('../src/migrations/', import.meta.url)).find(name => name.endsWith('_initial_schema.ts'))!
const source = readFileSync(new URL(`../src/migrations/${file}`, import.meta.url), 'utf8')
const migrationSQL = source.split('await db.execute(sql`')[1].split('`)')[0]

test('migration initializes a PostgreSQL database, preserves prototype records and can be retried', async () => {
  const db = new PGlite()
  try {
    await db.exec(migrationSQL)
    await db.exec(`INSERT INTO users (name, role, email) VALUES ('Trader', 'admin', 'admin@example.test'), ('Lead', 'user', 'lead@example.test');
      INSERT INTO meeting_logs (user_id, meeting_id, zoom_user_id, duration_minutes) VALUES (1, '123456789', 'host', 12), (2, '123456789', 'web-sdk-2', 9);
      INSERT INTO meetings (title, date, zoom_link, zoom_meeting_id) VALUES ('Live', now(), 'https://zoom.us/j/123456789', '123456789');`)
    // Simulate the old prototype shape while retaining its actual users, meetings and attendance.
    await db.exec(`DROP TABLE meeting_tickets CASCADE; DROP TABLE zoom_events CASCADE;
      ALTER TABLE meeting_logs DROP COLUMN session_key, DROP COLUMN meeting_u_u_i_d, DROP COLUMN participant_role, DROP COLUMN source;
      ALTER TABLE meetings DROP COLUMN status, DROP COLUMN meeting_u_u_i_d, DROP COLUMN started_at, DROP COLUMN ended_at;
      ALTER TABLE payload_locked_documents_rels DROP COLUMN zoom_events_id, DROP COLUMN meeting_tickets_id;`)
    await db.exec(migrationSQL)
    await db.exec(migrationSQL)
    const users = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM users')
    assert.equal(users.rows[0].count, 2)
    const logs = await db.query<{ participant_role: string; source: string; duration_minutes: string }>('SELECT participant_role, source, duration_minutes FROM meeting_logs ORDER BY id')
    assert.equal(logs.rows[0].participant_role, 'admin')
    assert.equal(logs.rows[1].source, 'browser')
    assert.equal(Number(logs.rows[0].duration_minutes), 12)
    await db.exec(`INSERT INTO zoom_events (event_key, event, body) VALUES ('same-event', 'meeting.started', '{}');`)
    await assert.rejects(db.exec(`INSERT INTO zoom_events (event_key, event, body) VALUES ('same-event', 'meeting.started', '{}');`), /duplicate key/)
  } finally { await db.close() }
})
