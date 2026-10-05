export function isManager(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'owner' || user?.role === 'admin'
}

export const TRIAL_MS = 30 * 24 * 60 * 60 * 1000
export function trialEndsAt(user: { createdAt?: string; trialEndsAt?: string }): number {
  if (user.trialEndsAt) return new Date(user.trialEndsAt).getTime()
  return new Date(user.createdAt || '').getTime() + TRIAL_MS
}
export function hasMeetingAccess(user: { role?: string; createdAt?: string; trialEndsAt?: string; isBlocked?: boolean; journeyStatus?: string } | null | undefined, now = Date.now()): boolean {
  return Boolean(user && !user.isBlocked && (isManager(user) || user.journeyStatus === 'active_student' || now < trialEndsAt(user)))
}
export function trialDaysRemaining(user: { createdAt?: string }, now = Date.now()): number {
  return Math.max(0, Math.ceil((trialEndsAt(user) - now) / 86400000))
}

export function isLeadLog(log: { user?: unknown; participantRole?: unknown; source?: unknown; zoomUserId?: unknown }): boolean {
  return log.source !== 'browser' && !String(log.zoomUserId || '').startsWith('web-sdk-') && !['admin', 'owner'].includes(String(log.participantRole)) &&
    typeof log.user === 'object' && log.user !== null && 'role' in log.user && log.user.role === 'user'
}
