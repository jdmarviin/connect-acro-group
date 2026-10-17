import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { hotmartEmbedUrl } from '@/lib/hotmart'
import { supabaseServer } from '@/lib/supabase/server'

type Lesson = { id: string; title: string; description: string | null; external_url: string | null; duration_seconds: number | null; position: number }
type Module = { id: string; title: string; position: number; course_lessons: Lesson[] }
const input = 'block p-2 bg-zinc-900 w-full'
const button = 'bg-acro-blue text-white px-5 py-2 rounded-xl'

function refresh(courseId: string) {
  revalidatePath(`/admin/cursos/${courseId}`); revalidatePath('/admin/cursos'); revalidatePath('/dashboard/cursos', 'layout')
}
function lessonFields(data: FormData) {
  const title = String(data.get('title') || '').trim()
  const video = hotmartEmbedUrl(String(data.get('video') || ''))
  const minutes = Number(data.get('minutes') || 0)
  if (!title || title.length > 200) throw new Error('Informe o título da aula.')
  if (!video) throw new Error('Cole o código de incorporação do Hotmart Player (<iframe src="https://cf-embed.play.hotmart.com/embed/...">). O link da biblioteca (play.hotmart.com/library/...) não funciona.')
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) throw new Error('Informe a duração em minutos inteiros.')
  return { title, description: String(data.get('description') || '').trim() || null, content_type: 'video', external_url: video, duration_seconds: minutes ? minutes * 60 : null }
}

async function saveCourse(data: FormData) {
  'use server'
  await requireAdmin()
  const id = String(data.get('courseId'))
  const title = String(data.get('title') || '').trim()
  const status = String(data.get('status'))
  if (!title || title.length > 200 || !['draft', 'published', 'archived'].includes(status)) throw new Error('Informe título e situação válidos.')
  const client = await supabaseServer()
  const { data: current } = await client.from('courses').select('published_at').eq('id', id).single()
  const { error } = await client.from('courses').update({ title, status, description: String(data.get('description') || '').trim() || null,
    published_at: status === 'published' ? current?.published_at || new Date().toISOString() : current?.published_at || null }).eq('id', id)
  if (error) throw new Error('Não foi possível salvar o curso.')
  refresh(id)
}
async function addModule(data: FormData) {
  'use server'
  await requireAdmin()
  const courseId = String(data.get('courseId'))
  const title = String(data.get('title') || '').trim()
  if (!title || title.length > 200) throw new Error('Informe o título do módulo.')
  const client = await supabaseServer()
  const { data: last } = await client.from('course_modules').select('position').eq('course_id', courseId).order('position', { ascending: false }).limit(1).maybeSingle()
  const { error } = await client.from('course_modules').insert({ course_id: courseId, title, position: (last?.position || 0) + 1 })
  if (error) throw new Error('Não foi possível criar o módulo.')
  refresh(courseId)
}
async function renameModule(data: FormData) {
  'use server'
  await requireAdmin()
  const title = String(data.get('title') || '').trim()
  if (!title || title.length > 200) throw new Error('Informe o título do módulo.')
  const client = await supabaseServer()
  const { error } = await client.from('course_modules').update({ title }).eq('id', String(data.get('moduleId')))
  if (error) throw new Error('Não foi possível salvar o módulo.')
  refresh(String(data.get('courseId')))
}
async function addLesson(data: FormData) {
  'use server'
  await requireAdmin()
  const moduleId = String(data.get('moduleId'))
  const fields = lessonFields(data)
  const client = await supabaseServer()
  const { data: last } = await client.from('course_lessons').select('position').eq('module_id', moduleId).order('position', { ascending: false }).limit(1).maybeSingle()
  const { error } = await client.from('course_lessons').insert({ ...fields, module_id: moduleId, position: (last?.position || 0) + 1 })
  if (error) throw new Error('Não foi possível criar a aula.')
  refresh(String(data.get('courseId')))
}
async function saveLesson(data: FormData) {
  'use server'
  await requireAdmin()
  const client = await supabaseServer()
  const { error } = await client.from('course_lessons').update(lessonFields(data)).eq('id', String(data.get('lessonId')))
  if (error) throw new Error('Não foi possível salvar a aula.')
  refresh(String(data.get('courseId')))
}
async function deleteLesson(data: FormData) {
  'use server'
  await requireAdmin()
  const client = await supabaseServer()
  const { error } = await client.from('course_lessons').delete().eq('id', String(data.get('lessonId')))
  if (error?.code === '23503') throw new Error('Esta aula já tem progresso de participantes e não pode ser excluída.')
  if (error) throw new Error('Não foi possível excluir a aula.')
  refresh(String(data.get('courseId')))
}
async function setEnrollment(data: FormData) {
  'use server'
  await requireAdmin()
  const courseId = String(data.get('courseId'))
  const client = await supabaseServer()
  const { error } = await client.rpc('set_course_enrollment', { course: courseId, member_email: String(data.get('email') || ''), active: data.get('active') === 'true' })
  if (error?.code === 'P0002') throw new Error('Nenhum participante encontrado com esse e-mail.')
  if (error) throw new Error('Não foi possível alterar o acesso.')
  refresh(courseId)
}

export default async function CourseAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const client = await supabaseServer()
  const [{ data: course }, { data: modules, error }, { data: enrollments }] = await Promise.all([
    client.from('courses').select('id,title,description,status').eq('id', id).maybeSingle(),
    client.from('course_modules').select('id,title,position,course_lessons(id,title,description,external_url,duration_seconds,position)').eq('course_id', id).order('position'),
    client.from('course_enrollments').select('id,status,source,profiles(email,full_name)').eq('course_id', id).order('enrolled_at', { ascending: false }),
  ])
  if (!course) notFound()
  if (error) throw new Error('Não foi possível carregar os módulos.')
  return <div className="max-w-3xl mx-auto p-8 pb-32 space-y-8">
    <Link href="/admin/cursos" className="text-zinc-400 hover:text-white">← Cursos</Link>
    <form action={saveCourse} className="glass-panel rounded-xl p-6 space-y-4">
      <h1 className="text-3xl font-bold text-white">{course.title}</h1><input type="hidden" name="courseId" value={course.id}/>
      <label className="block">Título<input name="title" required maxLength={200} defaultValue={course.title} className={input}/></label>
      <label className="block">Descrição<textarea name="description" defaultValue={course.description || ''} className={input}/></label>
      <select name="status" defaultValue={course.status} className="bg-zinc-900 p-2"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select>
      <button className={`block ${button}`}>Salvar curso</button>
    </form>

    {((modules || []) as Module[]).map(m => <section key={m.id} className="glass-panel rounded-xl p-6 space-y-4">
      <form action={renameModule} className="flex gap-3 items-end"><input type="hidden" name="courseId" value={course.id}/><input type="hidden" name="moduleId" value={m.id}/>
        <label className="block flex-1">Módulo {m.position}<input name="title" required maxLength={200} defaultValue={m.title} className={input}/></label><button className={button}>Salvar</button>
      </form>
      {[...m.course_lessons].sort((a, b) => a.position - b.position).map(lesson => <details key={lesson.id} className="border border-zinc-800 rounded-xl p-4">
        <summary className="cursor-pointer text-white">Aula {lesson.position}: {lesson.title}</summary>
        <form action={saveLesson} className="space-y-3 mt-4"><LessonFields courseId={course.id} lesson={lesson}/><input type="hidden" name="lessonId" value={lesson.id}/><button className={button}>Salvar aula</button></form>
        <form action={deleteLesson} className="mt-3"><input type="hidden" name="courseId" value={course.id}/><input type="hidden" name="lessonId" value={lesson.id}/><button className="text-red-400 hover:text-red-300">Excluir aula</button></form>
      </details>)}
      <details className="border border-dashed border-zinc-700 rounded-xl p-4"><summary className="cursor-pointer">Nova aula</summary>
        <form action={addLesson} className="space-y-3 mt-4"><LessonFields courseId={course.id}/><input type="hidden" name="moduleId" value={m.id}/><button className={button}>Adicionar aula</button></form>
      </details>
    </section>)}

    <form action={addModule} className="glass-panel rounded-xl p-6 flex gap-3 items-end"><input type="hidden" name="courseId" value={course.id}/>
      <label className="block flex-1">Novo módulo<input name="title" required maxLength={200} className={input}/></label><button className={button}>Adicionar módulo</button>
    </form>

    <section className="glass-panel rounded-xl p-6 space-y-4"><h2 className="text-xl text-white">Participantes com acesso</h2>
      <form action={setEnrollment} className="flex gap-3 items-end"><input type="hidden" name="courseId" value={course.id}/><input type="hidden" name="active" value="true"/>
        <label className="block flex-1">E-mail do participante<input name="email" type="email" required className={input}/></label><button className={button}>Liberar acesso</button>
      </form>
      {(enrollments || []).map(e => {
        const profile = (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles) as { email: string; full_name: string } | null
        return <div key={e.id} className="flex justify-between gap-4 items-center border-t border-zinc-800 pt-3">
          <span>{profile?.full_name || profile?.email} <small className="text-zinc-400">{profile?.email} · {e.source === 'purchase' ? 'compra' : 'manual'}</small></span>
          {e.status === 'active' ? <form action={setEnrollment}><input type="hidden" name="courseId" value={course.id}/><input type="hidden" name="email" value={profile?.email || ''}/><input type="hidden" name="active" value="false"/><button className="text-red-400 hover:text-red-300">Remover acesso</button></form>
            : <span className="text-zinc-500">{e.status === 'cancelled' ? 'Removido' : e.status}</span>}
        </div>
      })}
    </section>
  </div>
}

function LessonFields({ courseId, lesson }: { courseId: string; lesson?: Lesson }) {
  return <>
    <input type="hidden" name="courseId" value={courseId}/>
    <label className="block">Título<input name="title" required maxLength={200} defaultValue={lesson?.title} className={input}/></label>
    <label className="block">Descrição<textarea name="description" defaultValue={lesson?.description || ''} className={input}/></label>
    <label className="block">Vídeo do Hotmart Player (link ou código de incorporação)<textarea name="video" required defaultValue={lesson?.external_url || ''} placeholder='<iframe src="https://cf-embed.play.hotmart.com/embed/..."></iframe>' className={input}/></label>
    <label className="block">Duração em minutos (opcional)<input name="minutes" type="number" min={0} max={1440} defaultValue={lesson?.duration_seconds ? Math.round(lesson.duration_seconds / 60) : ''} className={input}/></label>
  </>
}
