'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Refresh server-owned meeting status; this is not a notification delivery channel.
export default function RefreshStatus() {
  const router = useRouter()
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, 30000)
    return () => window.clearInterval(timer)
  }, [router])
  return null
}
