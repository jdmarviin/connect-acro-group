import 'server-only'
import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from './config'
import { withoutProviderTokens } from './cookies'

export const supabaseServer = cache(async () => {
  const store = await cookies()
  const { url, key } = supabaseConfig()
  return createServerClient(url, key, {
    db: { schema: 'connect' },
    cookies: {
      getAll: () => store.getAll(),
      setAll: values => {
        const safeValues = withoutProviderTokens(values)
        try { safeValues.forEach(({ name, value, options }) => store.set(name, value, options)) }
        catch { /* Server Components are read-only; middleware persists refreshed cookies. */ }
      },
    },
  })
})

export const authenticatedUser = cache(async () => {
  const store = await cookies()
  if (!store.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))) return null
  const client = await supabaseServer()
  const { data: { user }, error } = await client.auth.getUser()
  return error ? null : user
})
