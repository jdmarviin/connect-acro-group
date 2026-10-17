import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { courseSlug } from '@/lib/courses'
import { supabaseServer } from '@/lib/supabase/server'

const statusLabel: Record<string, string> = { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' }

async function createCourse(data: FormData) {
  'use server'
  await requireAdmin()
  const title = String(data.get('title') || '').trim()
  const slug = courseSlug(title)
  if (!title || title.length > 200 || !slug) throw new Error('Informe um título válido.')
  const client = await supabaseServer()
  const { data: course, error } = await client.from('courses').insert({ title, slug, description: String(data.get('description') || '').trim() || null }).select('id').single()
  if (error?.code === '23505') throw new Error('Já existe um curso com esse título.')
  if (error || !course) throw new Error('Não foi possível criar o curso.')
  revalidatePath('/admin/cursos')
  redirect(`/admin/cursos/${course.id}`)
}

export default async function CoursesAdmin() {
  await requireAdmin()
  const client = await supabaseServer()
  const { data: courses, error } = await client.from('courses').select('id,title,status,course_modules(course_lessons(id))').order('created_at', { ascending: false })
  if (error) throw new Error('Não foi possível carregar os cursos.')
  return <div className="max-w-3xl mx-auto p-8 pb-32 space-y-8"><h1 className="text-3xl font-bold text-white">Cursos</h1>
    <form action={createCourse} className="glass-panel rounded-xl p-6 space-y-4">
      <h2>Novo curso</h2>
      <label className="block">Título<input name="title" required maxLength={200} className="block p-2 bg-zinc-900 w-full"/></label>
      <label className="block">Descrição<textarea name="description" className="block p-2 bg-zinc-900 w-full"/></label>
      <button className="block bg-acro-blue text-white px-5 py-2 rounded-xl">Criar curso</button>
    </form>
    {(courses || []).map(course => {
      const lessons = course.course_modules.reduce((total, m) => total + m.course_lessons.length, 0)
      return <Link key={course.id} href={`/admin/cursos/${course.id}`} className="glass-panel rounded-xl p-6 flex justify-between gap-4 hover:border-acro-blue">
        <span className="text-white font-semibold">{course.title}</span>
        <span className="text-zinc-400">{lessons} aulas · {statusLabel[course.status] || course.status}</span>
      </Link>
    })}
  </div>
}
