'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'

type Session = {
  entryTime: string
  exitTime: string
  durationMs: number
}

export default function RelatorioReuniao({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params)
  const [sessions, setSessions] = useState<Session[]>([])
  
  useEffect(() => {
    const key = `zoom_sessions_${meetingId}`
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        setSessions(JSON.parse(stored))
      }
    } catch (e) {
      console.error(e)
    }
  }, [meetingId])

  const totalDurationMs = sessions.reduce((acc, curr) => acc + curr.durationMs, 0)
  const totalMinutes = Math.floor(totalDurationMs / 60000)
  const totalSeconds = Math.floor((totalDurationMs % 60000) / 1000)

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatório de Presença</h1>
            <p className="text-lg text-neutral-400">
              Reunião ID: <span className="text-white font-mono">{meetingId}</span>
            </p>
          </div>
          <Link href={`/reuniao/${meetingId}`} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition">
            Voltar para Reunião
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-neutral-400 text-sm font-semibold uppercase tracking-wider">Acessos à Sala</h3>
            </div>
            <p className="text-5xl font-bold text-white mt-4">{sessions.length}</p>
            <p className="text-neutral-500 text-sm mt-2">Vezes que entrou e saiu</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 className="text-neutral-400 text-sm font-semibold uppercase tracking-wider">Tempo Total Acumulado</h3>
            </div>
            <p className="text-5xl font-bold text-white mt-4 flex items-baseline gap-2">
              {totalMinutes}<span className="text-2xl text-neutral-500 font-medium">m</span> 
              {totalSeconds}<span className="text-2xl text-neutral-500 font-medium">s</span>
            </p>
            <p className="text-neutral-500 text-sm mt-2">Soma de todas as sessões</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold">Histórico de Sessões</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950/50">
                <th className="p-4 border-b border-neutral-800 text-sm font-medium text-neutral-400">Entrada</th>
                <th className="p-4 border-b border-neutral-800 text-sm font-medium text-neutral-400">Saída</th>
                <th className="p-4 border-b border-neutral-800 text-sm font-medium text-neutral-400">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {sessions.map((session, i) => {
                const entry = new Date(session.entryTime)
                const exit = new Date(session.exitTime)
                const mins = Math.floor(session.durationMs / 60000)
                const secs = Math.floor((session.durationMs % 60000) / 1000)

                return (
                  <tr key={i} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 text-neutral-300">{entry.toLocaleTimeString()} - {entry.toLocaleDateString()}</td>
                    <td className="p-4 text-neutral-300">{exit.toLocaleTimeString()} - {exit.toLocaleDateString()}</td>
                    <td className="p-4 text-neutral-300 font-mono">
                      {mins}m {secs}s
                    </td>
                  </tr>
                )
              })}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-neutral-500 italic">
                    Nenhum acesso registrado ainda. Entre na reunião e saia para gerar os logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
