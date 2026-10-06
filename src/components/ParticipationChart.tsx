'use client'
import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import type { Locale } from '@/i18n/dictionaries'
import { participantDate, participantText } from '@/i18n/participant'

export default function ParticipationChart({ data, locale }: { data: { day: string; minutes: number }[]; locale: Locale }) {
  const [period, setPeriod] = useState(14)
  const t = participantText(locale)
  const points = data.slice(-period)
  const max = Math.max(30, ...points.map(point => point.minutes))
  const total = points.reduce((sum, point) => sum + point.minutes, 0)
  return <section className="workspace-card participation-chart">
    <div className="workspace-card-heading"><div><h2>{t.activity}</h2><p>{t.activityHint}</p></div><div className="workspace-segments" aria-label={t.days}>{[7, 14, 30].map(days => <button key={days} aria-pressed={days === period} onClick={() => setPeriod(days)}>{days} {t.days}</button>)}</div></div>
    <div className="chart-total"><strong>{Math.round(total)}</strong><span>{t.minutes} / {period} {t.days}</span></div>
    {total === 0 ? <div className="workspace-empty chart-empty"><BarChart3 aria-hidden="true" /><strong>{t.noActivity}</strong><p>{t.noActivityHint}</p></div> : <div className="participation-plot">
      <div className="participation-axis" aria-hidden="true"><span>{Math.ceil(max)}</span><span>{Math.ceil(max / 2)}</span><span>0</span></div>
      <div className="participation-bars" role="list" aria-label={t.activity}>
        {points.map(point => <div className="participation-column" key={point.day} role="listitem" tabIndex={0} aria-label={`${participantDate(point.day, locale)}: ${Math.round(point.minutes)} ${t.minutes}`}>
          <div className="participation-bar" style={{ height: `${Math.max(point.minutes > 0 ? 2 : 0, point.minutes / max * 100)}%` }} />
          <span className="participation-tooltip">{participantDate(point.day, locale)}<b>{Math.round(point.minutes)} {t.minutes}</b></span>
        </div>)}
      </div>
    </div>}
    <div className="participation-dates"><span>{participantDate(points[0].day, locale)}</span><span>{participantDate(points[points.length - 1].day, locale)}</span></div>
  </section>
}
