export function hasCourseAccess(enrollment: { status: string; expires_at: string | null }, now = Date.now()) {
  return ['active', 'completed'].includes(enrollment.status) && (!enrollment.expires_at || new Date(enrollment.expires_at).getTime() > now)
}

export function courseSlug(title: string): string {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '')
}
