import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { currentUser } from './auth'
import { isManager, hasMeetingAccess } from './access'
import { getData } from './data'
import { transaction } from './supabase/database'
import { participantProgress } from './participant-progress'
import type { Locale } from '@/i18n/dictionaries'

export const participantContext = cache(async () => {
  const user = await currentUser()
  if (!user) redirect('/auth')
  if (isManager(user)) redirect('/admin/dashboard')
  if (!user.onboardingCompleted) redirect('/onboarding')
  const locale: Locale = (await cookies()).get('NEXT_LOCALE')?.value === 'pt' ? 'pt' : 'ht'
  return { user, locale }
})

export const getParticipantProgress = cache(async () => {
  const { user } = await participantContext()
  const db = await getData()
  const { docs } = await db.find({ collection: 'meeting-logs', where: { user: { equals: user.id } }, sort: '-joinTime', pagination: false })
  return participantProgress(docs)
})

export const getParticipantMeetings = cache(async () => {
  const { user } = await participantContext()
  if (!hasMeetingAccess(user)) return []
  const db = await getData()
  const { docs } = await db.find({ collection: 'meetings', where: { and: [
    { kind: { not_equals: 'occurrence' } },
    { or: [{ kind: { in: ['personal', 'recurring'] } }, { status: { not_in: ['ended', 'cancelled'] } }] },
  ] }, sort: 'date', pagination: false })
  return docs.filter(m => m.zoomMeetingId).sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live') || Number(b.kind === 'personal') - Number(a.kind === 'personal'))
})

export type ParticipantSurvey = { id: string; reflection_day: string | null; meeting_id: string | null; title: string | null; opens_at: string; closes_at: string | null; submitted_at: string | null }
export const getParticipantSurveys = cache(async () => {
  const { user } = await participantContext()
  return transaction(async db => {
    const { rows } = await db.query<ParticipantSurvey>(`select a.id,a.reflection_day::text,a.meeting_id,m.title,
      a.opens_at,a.closes_at,s.submitted_at from connect.form_assignments a
      left join connect.meetings m on m.id=a.meeting_id
      left join connect.form_submissions s on s.assignment_id=a.id and s.user_id=$1 and s.status='submitted'
      where (a.reflection_day is not null and a.user_id=$1) or s.id is not null
      order by coalesce(s.submitted_at,a.opens_at) desc`, [user.id])
    return rows.map(row => ({ ...row, opens_at: new Date(row.opens_at).toISOString(), closes_at: row.closes_at ? new Date(row.closes_at).toISOString() : null, submitted_at: row.submitted_at ? new Date(row.submitted_at).toISOString() : null }))
  }, String(user.id))
})

export const pendingSurveys = (surveys: ParticipantSurvey[], now = Date.now()) => surveys.filter(s => !s.submitted_at && new Date(s.opens_at).getTime() <= now && (!s.closes_at || new Date(s.closes_at).getTime() > now))
