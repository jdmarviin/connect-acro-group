import type { Access } from 'payload'

export const adminOnly: Access = ({ req }) => req.user?.role === 'admin'
export const ownerOrAdmin: Access = ({ req }) => {
  if (req.user?.role === 'admin') return true
  return req.user ? { id: { equals: req.user.id } } : false
}

export const TRIAL_MS = 30 * 24 * 60 * 60 * 1000
export function trialEndsAt(user: { createdAt?: string }): number {
  return new Date(user.createdAt || '').getTime() + TRIAL_MS
}
export function hasMeetingAccess(user: { role?: string; createdAt?: string } | null | undefined, now = Date.now()): boolean {
  return Boolean(user && (user.role === 'admin' || now < trialEndsAt(user)))
}
export function trialDaysRemaining(user: { createdAt?: string }, now = Date.now()): number {
  return Math.max(0, Math.ceil((trialEndsAt(user) - now) / 86400000))
}
export const activeMember: Access = ({ req }) => hasMeetingAccess(req.user)

// Only identified leads belong in commercial analytics. Admins and unresolved guests stay in the audit log.
export function isLeadLog(log: { user?: unknown; participantRole?: unknown; source?: unknown; zoomUserId?: unknown }): boolean {
  return log.source !== 'browser' && !String(log.zoomUserId || '').startsWith('web-sdk-') && log.participantRole !== 'admin' &&
    typeof log.user === 'object' && log.user !== null && 'role' in log.user && log.user.role === 'user'
}
