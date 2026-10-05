'use client'
import { useEffect, useState } from 'react'

export default function TrialCountdown({ endsAt, initialNow }: { endsAt: number; initialNow: number }) {
  const [now, setNow] = useState(initialNow)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const minutes = Math.max(0, Math.ceil((endsAt - now) / 60000))
  if (!minutes) return <p>Seu período gratuito de 30 dias terminou. Entre em contato com o trader para conhecer os produtos.</p>
  return <p>Restam {Math.floor(minutes / 1440)} dias, {Math.floor(minutes % 1440 / 60)} horas e {minutes % 60} minutos de acesso gratuito.</p>
}
