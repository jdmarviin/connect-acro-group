import Link from 'next/link'
import { NotebookPen } from 'lucide-react'
import { getParticipantSurveys, participantContext, pendingSurveys } from '@/lib/participant'
import { participantText } from '@/i18n/participant'
import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function markRead(data: FormData) {
  'use server'
  const { user } = await participantContext()
  const client = await supabaseServer()
  const { error } = await client.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', String(data.get('id'))).eq('user_id', String(user.id))
  if (error) throw new Error('Não foi possível atualizar o aviso.')
  revalidatePath('/dashboard')
}

export default async function JourneyInbox() {
  const { user, locale } = await participantContext()
  const t = participantText(locale)
  const pending = pendingSurveys(await getParticipantSurveys())
  const client = await supabaseServer()
  const { data: notifications } = await client.from('notifications').select('id,title,body,action_url').eq('user_id', String(user.id)).is('read_at', null).neq('event_type', 'form_available').order('created_at', { ascending: false }).limit(3)
  if (!pending.length && !notifications?.length) return null
  return <section className="workspace-inbox">
    {pending.length > 0 && <div className="workspace-notice"><NotebookPen aria-hidden="true" /><div><strong>{t.daily} · {t.toAnswer}</strong><p>{t.dailyHint}</p></div><Link href="/dashboard/pesquisas" className="workspace-button">{t.reply}</Link></div>}
    {!!notifications?.length && <div className="workspace-card notifications-card"><h2>{t.notifications}</h2>{notifications.map(n => <article key={n.id}><div><strong>{n.title}</strong><p>{n.body}</p>{n.action_url?.startsWith('/') && !n.action_url.startsWith('//') && <Link href={n.action_url}>{t.open}</Link>}</div><form action={markRead}><input type="hidden" name="id" value={n.id} /><button className="workspace-text-button">{t.markRead}</button></form></article>)}</div>}
  </section>
}
