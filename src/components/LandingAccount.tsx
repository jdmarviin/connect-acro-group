'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Account = { name: string; role: 'user' | 'admin' | 'owner'; avatar_url?: string | null }

// Personalization loads after the public page. Its API route can safely persist
// refreshed cookies; public Server Components never consume a rotating refresh token.
export default function LandingAccount({ loginLabel, dashboardLabel }: { loginLabel: string; dashboardLabel: string }) {
  const [user, setUser] = useState<Account | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/auth/me', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : { user: null })
      .then(data => setUser(data.user))
      .catch(() => { /* Public content remains available if authentication is unavailable. */ })
    return () => controller.abort()
  }, [])
  if (!user) return <a href="/api/auth/zoom" className="text-sm font-medium hover:text-white transition-colors text-acro-silver">{loginLabel}</a>
  return <div className="flex items-center gap-4">
    <Link href={user.role === 'user' ? '/dashboard' : '/admin/dashboard'} prefetch={false} className="text-sm font-medium hover:text-white transition-colors text-acro-blue-light">{dashboardLabel}</Link>
    {user.avatar_url ? <Image src={user.avatar_url} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full border border-acro-blue/30" /> :
      <div className="w-8 h-8 rounded-full bg-acro-blue/20 flex items-center justify-center text-acro-blue-light font-bold text-sm">{user.name.charAt(0).toUpperCase()}</div>}
  </div>
}
