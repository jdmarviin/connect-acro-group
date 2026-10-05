import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function markRead(data:FormData) {
  'use server'
  const client=await supabaseServer()
  const {error}=await client.from('notifications').update({read_at:new Date().toISOString()}).eq('id',String(data.get('id')))
  if(error) throw new Error('Não foi possível marcar o aviso como lido.')
  revalidatePath('/dashboard')
}
export default async function JourneyInbox() {
  const client=await supabaseServer()
  const [{data:notifications,error},{data:assignments,error:formError}]=await Promise.all([
    client.from('notifications').select('id,title,body,action_url,read_at').is('read_at',null).order('created_at',{ascending:false}).limit(10),
    client.from('form_assignments').select('id,meeting_id,meetings(title),form_submissions(status)').not('meeting_id','is',null).order('created_at',{ascending:false}).limit(30),
  ])
  if(error||formError) throw new Error('Não foi possível carregar seus avisos e atividades.')
  return <section className="space-y-5">
    <h2 className="text-xl font-semibold text-white">Avisos e diário</h2>
    {notifications?.map(n=><article key={n.id} className="glass-panel rounded-xl p-4 flex justify-between gap-4">
      <div><h3 className="font-semibold">{n.title}</h3><p>{n.body}</p>{n.action_url&&<Link className="underline" href={n.action_url}>Abrir</Link>}</div>
      <form action={markRead}><input type="hidden" name="id" value={n.id}/><button className="text-sm underline">Marcar como lido</button></form>
    </article>)}
    {!assignments?.length&&<p>Seu diário ficará disponível após a primeira reunião.</p>}
    {assignments?.map(a=><Link className="block glass-panel rounded-xl p-4" key={a.id} href={`/dashboard/diario/${a.id}`}>
      Diário · {Array.isArray(a.meetings)?a.meetings[0]?.title:(a.meetings as {title?:string}|null)?.title}
      {a.form_submissions?.some(s=>s.status==='submitted')?' — respondido':' — registrar aprendizado'}
    </Link>)}
  </section>
}
