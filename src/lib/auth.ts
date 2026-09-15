import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'

export async function currentUser(requestHeaders?: Headers) {
  const authHeaders = requestHeaders || await headers()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: authHeaders })
  return user
}
export async function requireAdmin() {
  const user = await currentUser()
  if (!user) redirect('/auth')
  if (user.role !== 'admin') redirect('/dashboard')
  return user
}
