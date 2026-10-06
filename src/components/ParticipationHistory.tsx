'use client'
import { useState } from 'react'
import Link from 'next/link'
import { History, Search } from 'lucide-react'
import type { Participation } from '@/lib/participant-progress'
import type { Locale } from '@/i18n/dictionaries'
import { participantDate, participantText } from '@/i18n/participant'
import { formatDuration } from '@/lib/format'

export default function ParticipationHistory({ history, locale, searchable = false }: { history: Participation[]; locale: Locale; searchable?: boolean }) {
  const [search, setSearch] = useState('')
  const t = participantText(locale)
  const filtered = history.filter(item => `${item.title} ${item.meetingId}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  if (!history.length) return <div className="workspace-card workspace-empty"><History aria-hidden="true" /><strong>{t.noHistory}</strong><p>{t.noHistoryHint}</p><Link className="workspace-button secondary" href="/dashboard/reunioes">{t.meetings}</Link></div>
  return <section className="workspace-card history-card">
    {searchable && <label className="workspace-search"><Search aria-hidden="true" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} aria-label={t.search} type="search" /></label>}
    {filtered.length === 0 ? <p className="workspace-empty" role="status">{t.noResults}</p> : <div className="workspace-table-scroll"><table className="workspace-table"><thead><tr><th>{t.meeting}</th><th>{t.date}</th><th>{t.duration}</th><th>{t.status}</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><Link href={`/dashboard/historico/${encodeURIComponent(item.id)}`}>{item.title}</Link><small>{item.connections} {t.connections}</small></td><td>{participantDate(item.date, locale, true)}</td><td>{formatDuration(item.minutes)}</td><td><span className={`workspace-badge ${item.pending ? 'pending' : 'success'}`}>{item.pending ? t.pending : t.complete}</span></td></tr>)}</tbody></table></div>}
  </section>
}
