'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRefresh({ every = 4000, stopAfter = 10 * 60 * 1000 }: { every?: number; stopAfter?: number }) {
  const router = useRouter()
  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - started > stopAfter) clearInterval(timer)
      else router.refresh()
    }, every)
    return () => clearInterval(timer)
  }, [router, every, stopAfter])
  return null
}
