'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import { CalendarDays, ChartNoAxesCombined, ClipboardCheck, History, House, LogOut, Menu, Plus, Store, UsersRound, X } from 'lucide-react'
import type { Locale } from '@/i18n/dictionaries'
import { participantText } from '@/i18n/participant'
import LanguageSwitcher from './LanguageSwitcher'

export default function AppShell({ children, name, locale, manager = false }: { children: React.ReactNode; name: string; locale: Locale; manager?: boolean }) {
  const t = participantText(locale)
  const pathname = usePathname()
  const drawer = useRef<HTMLDialogElement>(null)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState('')
  const links = manager ? [
    { href: '/admin/dashboard', label: t.overview, icon: ChartNoAxesCombined },
    { href: '/admin/usuarios', label: t.members, icon: UsersRound },
    { href: '/admin/meetings/new', label: t.schedule, icon: Plus },
    { href: '/admin/produtos', label: t.products, icon: Store },
  ] : [
    { href: '/dashboard', label: t.overview, icon: ChartNoAxesCombined },
    { href: '/dashboard/reunioes', label: t.meetings, icon: CalendarDays },
    { href: '/dashboard/historico', label: t.history, icon: History },
    { href: '/dashboard/pesquisas', label: t.surveys, icon: ClipboardCheck },
    { href: '/dashboard/produtos', label: t.products, icon: Store },
  ]
  const active = (href: string) => pathname === href || (href === '/dashboard/historico' && pathname.startsWith(`${href}/`)) || (href === '/dashboard/pesquisas' && pathname.startsWith('/dashboard/diario/'))
  const current = links.find(link => active(link.href))?.label || (manager ? t.admin : t.space)
  async function logout() {
    setLeaving(true)
    setError('')
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Logout failed')
      window.location.assign('/')
    } catch { setError(t.logoutError); setLeaving(false) }
  }
  const navigation = <>
    <Link href="/" className="workspace-brand"><span>A</span><div>ACRO <b>GROUP</b><small>CONNECT</small></div></Link>
    <p className="workspace-nav-label">{manager ? t.admin : t.space}</p>
    <nav aria-label={t.navigation} className="workspace-nav">
      {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} prefetch={false} aria-current={active(href) ? 'page' : undefined} onClick={() => drawer.current?.close()}><Icon aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
    <div className="workspace-sidebar-bottom">
      <Link href="/"><House aria-hidden="true" />{t.home}</Link>
      <button onClick={logout} disabled={leaving}><LogOut aria-hidden="true" />{leaving ? '…' : t.logout}</button>
      {error && <p role="alert">{error}</p>}
      <div className="workspace-profile"><span>{name.charAt(0).toUpperCase()}</span><div><strong>{name}</strong><small>{manager ? t.admin : t.space}</small></div></div>
    </div>
  </>
  return <div className="workspace">
    <a href="#workspace-content" className="workspace-skip">{current}</a>
    <aside className="workspace-sidebar">{navigation}</aside>
    <dialog ref={drawer} className="workspace-drawer" aria-label={t.navigation} onClick={event => { if (event.target === event.currentTarget) drawer.current?.close() }}>
      <div className="workspace-drawer-body"><button className="workspace-drawer-close" onClick={() => drawer.current?.close()} aria-label={t.closeMenu}><X /></button>{navigation}</div>
    </dialog>
    <div className="workspace-main">
      <header className="workspace-topbar"><div><button className="workspace-menu-button" onClick={() => drawer.current?.showModal()} aria-label={t.openMenu}><Menu /></button><span>{manager ? t.admin : t.space}</span><i>/</i><strong>{current}</strong></div><LanguageSwitcher currentLocale={locale} /></header>
      <div id="workspace-content" className="workspace-content" tabIndex={-1}>{children}</div>
      <footer className="workspace-footer">ACRO GROUP <span>Connect · {t.space}</span></footer>
    </div>
  </div>
}
