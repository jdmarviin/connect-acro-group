'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMeetingAction } from './actions'

export default function ScheduleMeeting() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [kind, setKind] = useState('scheduled')
  async function submit(form: FormData) {
    setLoading(true); setError('')
    try {
      if (kind === 'scheduled') {
        const date = new Date(`${form.get('date')}T${form.get('time')}:00`)
        if (!Number.isFinite(date.getTime())) throw new Error('Informe data e hora válidas.')
        form.set('scheduledAt', date.toISOString())
      }
      const result = await createMeetingAction(form)
      if (result.error) throw new Error(result.error)
      router.push('/admin/dashboard'); router.refresh()
    } catch (error) { setError(error instanceof Error ? error.message : 'Erro ao criar reunião.') }
    finally { setLoading(false) }
  }
  const input = 'block w-full mt-2 bg-acro-dark border border-white/20 rounded-xl p-3 text-white [color-scheme:dark]'
  return <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
    <Link href="/admin/dashboard">← Voltar ao painel</Link>
    <header><h1 className="text-3xl text-white font-bold">Criar reunião no Zoom</h1><p className="mt-2">A reunião será criada na sua conta Zoom e ficará visível no painel de todos os participantes.</p></header>
    <form action={submit} className="glass-panel p-8 rounded-3xl space-y-6">
      <label className="block">Título<input className={input} name="title" required maxLength={200} placeholder="Operacional de abertura" /></label>
      <label className="block">Tipo<select className={input} name="kind" value={kind} onChange={event => setKind(event.target.value)}><option value="scheduled">Agendada</option><option value="recurring">Recorrente sem data fixa</option></select></label>
      {kind === 'scheduled' && <div className="grid grid-cols-2 gap-4"><label>Data<input className={input} name="date" type="date" required /></label><label>Hora<input className={input} name="time" type="time" required /></label><p className="col-span-2 text-sm">Horário no fuso do seu navegador.</p></div>}
      <label className="block">Duração prevista (minutos)<input className={input} type="number" name="durationMinutes" defaultValue={60} min={1} max={1440} required /></label>
      <p className="text-sm">Os participantes aguardam até um administrador iniciar. A sala pessoal do owner aparece automaticamente após conectar sua conta Zoom.</p>
      {error && <p role="alert" className="text-red-400">{error} <a className="underline" href="/api/auth/zoom">Reconectar Zoom</a></p>}
      <button disabled={loading} className="bg-acro-blue text-white rounded-xl px-6 py-3 disabled:opacity-50">{loading ? 'Criando…' : 'Criar reunião'}</button>
    </form>
  </div>
}
