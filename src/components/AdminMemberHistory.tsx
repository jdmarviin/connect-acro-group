import { supabaseServer } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

async function addNote(data:FormData) {
  'use server'
  const user=await requireAdmin()
  const client=await supabaseServer()
  const id=String(data.get('user_id'))
  const {error}=await client.from('admin_notes').insert({user_id:id,author_id:user.id,body:String(data.get('body')||'').trim()})
  if(error) throw new Error('Não foi possível salvar a observação.')
  revalidatePath(`/admin/users/${id}`)
}
async function changeStatus(data:FormData) {
  'use server'
  await requireAdmin()
  const client=await supabaseServer()
  const id=String(data.get('user_id'))
  const {error}=await client.rpc('manage_member',{target:id,new_status:String(data.get('status'))})
  if(error) throw new Error('Não foi possível alterar o status.')
  revalidatePath(`/admin/users/${id}`)
}
export default async function AdminMemberHistory({id}:{id:string|number}) {
  await requireAdmin()
  const client=await supabaseServer()
  const [{data:submissions,error},{data:notes},{data:journey}]=await Promise.all([
    client.from('form_submissions').select('id,submitted_at,form_answers(value_text,value_number,value_boolean,value_date,value_json,form_questions(label))').eq('user_id',id).eq('status','submitted').order('submitted_at',{ascending:false}),
    client.from('admin_notes').select('id,body,created_at').eq('user_id',id).order('created_at',{ascending:false}),
    client.from('user_journeys').select('status').eq('user_id',id).single(),
  ])
  if(error) throw new Error('Não foi possível carregar o histórico.')
  return <section className="space-y-6 mt-10">
    <h2 className="text-xl text-white font-semibold">Jornada, questionários e diário</h2>
    <form action={changeStatus} className="flex gap-4"><input type="hidden" name="user_id" value={id}/><select name="status" defaultValue={journey?.status} className="bg-zinc-900 p-3">
      {Object.entries({trial:'Em período gratuito',awaiting_evaluation:'Aguardando avaliação',approved:'Aprovado',needs_preparation:'Precisa de preparação',not_continuing:'Não continuará',active_student:'Aluno ativo',inactive_student:'Aluno inativo'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select><button className="underline">Atualizar status</button></form>
    {submissions?.map(s=><article key={s.id} className="glass-panel p-5 rounded-xl space-y-3"><p>Enviado em {new Date(s.submitted_at).toLocaleString('pt-BR')}</p>
      {s.form_answers.map((a,i)=><div key={i}><p className="font-semibold">{(Array.isArray(a.form_questions)?a.form_questions[0]:a.form_questions)?.label?.['pt-BR']}</p><p>{String(a.value_text??a.value_number??a.value_boolean??a.value_date??JSON.stringify(a.value_json))}</p></div>)}
    </article>)}
    <h2 className="text-xl text-white font-semibold">Observações internas</h2>
    {notes?.map(n=><p key={n.id} className="glass-panel p-4 rounded-xl">{n.body}</p>)}
    <form action={addNote} className="space-y-3"><input type="hidden" name="user_id" value={id}/><textarea name="body" required maxLength={10000} className="block w-full p-3 bg-zinc-900 rounded-xl" placeholder="Observação visível somente para gestores"/><button className="underline">Adicionar observação</button></form>
  </section>
}
