import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { isManager } from './access'
import { authenticatedUser } from './supabase/server'
import { readUser } from './supabase/read'
import type { AppUser } from './data/types'

// Request-scoped memoization: never share authentication across users.
export const currentUser = cache(async (): Promise<AppUser | null> => {
  const user = await authenticatedUser()
  if (!user) return null
  const profile = await readUser(user.id)
  return profile && !profile.isBlocked ? profile : null
})

export const requireAdmin = cache(async () => {
  const user = await currentUser()
  if (!user) redirect('/auth')
  if (!isManager(user)) redirect('/dashboard')
  return user
})
