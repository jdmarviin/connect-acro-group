import type { AppLog, AppUser } from './data/types'
import { isLeadLog, trialEndsAt, TRIAL_MS } from './access'
import { meetingDay } from './reporting'

export type Participation = { id: string; meetingId: string; title: string; date: string; minutes: number; connections: number; pending: boolean }
export function participantProgress(logs: AppLog[], now = Date.now()) {
  const groups = new Map<string, Participation>()
  const days = new Map<string, number>()
  for (const log of logs.filter(isLeadLog)) {
    if (!log.joinTime) continue
    const date = log.joinTime
    const day = meetingDay(date)
    const minutes = log.leaveTime ? Math.max(0, Number(log.durationMinutes) || 0) : 0
    days.set(day, (days.get(day) || 0) + minutes)
    const id = log.meetingUUID || `${log.meetingId}:${day}`
    const group = groups.get(id) || { id, meetingId: log.meetingId, title: log.meetingTitle || `Reyinyon ${log.meetingId}`, date, minutes: 0, connections: 0, pending: false }
    group.minutes += minutes
    group.connections++
    group.pending ||= !log.leaveTime
    if (date < group.date) group.date = date
    groups.set(id, group)
  }
  const history = [...groups.values()].sort((a, b) => b.date.localeCompare(a.date))
  const today = meetingDay(new Date(now).toISOString())
  const chart = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() - (29 - index))
    const day = date.toISOString().slice(0, 10)
    return { day, minutes: days.get(day) || 0 }
  })
  return { history, chart, minutes: history.reduce((total, item) => total + item.minutes, 0), activeDays: days.size }
}

export function trialProgress(user: Pick<AppUser, 'createdAt' | 'trialEndsAt'>, now = Date.now()) {
  const end = trialEndsAt(user)
  const elapsed = Math.min(TRIAL_MS, Math.max(0, now - (end - TRIAL_MS)))
  return { elapsed: Math.floor(elapsed / 86400000), remaining: Math.max(0, Math.ceil((end - now) / 86400000)), percent: Math.round(elapsed / TRIAL_MS * 100), end }
}
