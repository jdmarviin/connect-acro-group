'use client'
import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// Refresh server-owned meeting status; this is not a notification delivery channel.
export default function RefreshStatus({ interval = 30000 }: { interval?: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!pending && document.visibilityState === 'visible') startTransition(() => router.refresh())
    }, interval)
    return () => window.clearInterval(timer)
  }, [router, interval, pending])
  return null
}
