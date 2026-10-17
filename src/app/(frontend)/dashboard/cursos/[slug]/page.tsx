import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CirclePlay, LockKeyhole } from 'lucide-react'
import { participantContext } from '@/lib/participant'
import { participantText } from '@/i18n/participant'
import { supabaseServer } from '@/lib/supabase/server'
import { hasCourseAccess } from '@/lib/courses'
import { hotmartEmbedUrl } from '@/lib/hotmart'

type Lesson = { id: string; title: string; description: string | null; external_url: string | null; duration_seconds: number | null; position: number }
type Module = { id: string; title: string; position: number; course_lessons: Lesson[] }

export default async function CoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ aula?: string }> }) {
  const [{ locale }, { slug }, { aula }] = await Promise.all([participantContext(), params, searchParams])
  const t = participantText(locale)
  const client = await supabaseServer()
  const { data: course } = await client.from('courses').select('id,title,description').eq('slug', slug).eq('status', 'published').maybeSingle()
  if (!course) notFound()
  const [{ data: enrollment }, { data: modules, error }] = await Promise.all([
    client.from('course_enrollments').select('status,expires_at').eq('course_id', course.id).maybeSingle(),
    client.from('course_modules').select('id,title,position,course_lessons(id,title,description,external_url,duration_seconds,position)').eq('course_id', course.id).order('position'),
  ])
  if (error) throw new Error('Unable to load lessons')
  const heading = <><Link href="/dashboard/cursos" className="reflection-back">{t.backCourses}</Link>
    <header className="participant-page-heading"><div><p className="workspace-eyebrow">ACRO GROUP</p><h1>{course.title}</h1>{course.description && <p>{course.description}</p>}</div></header></>
  if (!enrollment || !hasCourseAccess(enrollment)) return <div className="participant-page">{heading}
    <div className="workspace-card workspace-empty"><LockKeyhole aria-hidden="true" /><strong>{t.courseLocked}</strong><p>{t.courseLockedHint}</p></div></div>

  const sections = ((modules || []) as Module[]).map(m => ({ ...m, course_lessons: [...m.course_lessons].sort((a, b) => a.position - b.position) }))
  const lessons = sections.flatMap(m => m.course_lessons)
  const current = lessons.find(lesson => lesson.id === aula) || lessons[0]
  const video = current?.external_url ? hotmartEmbedUrl(current.external_url) : null
  return <div className="participant-page">{heading}
    {current ? <div className="course-layout">
      <section className="workspace-card course-player">
        {video && <iframe src={video} title={current.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />}
        <div><p className="workspace-eyebrow">{t.currentLesson}</p><h2>{current.title}</h2>{current.description && <p>{current.description}</p>}</div>
      </section>
      <nav className="workspace-card course-lessons" aria-label={course.title}>
        {sections.map(m => <div key={m.id}><h3>{m.title}</h3><ol>{m.course_lessons.map(lesson =>
          <li key={lesson.id}><Link href={`?aula=${lesson.id}`} scroll={false} aria-current={lesson.id === current.id ? 'page' : undefined}>
            <CirclePlay aria-hidden="true" /><span>{lesson.title}</span>{lesson.duration_seconds ? <small>{Math.round(lesson.duration_seconds / 60)} min</small> : null}
          </Link></li>)}</ol></div>)}
      </nav>
    </div> : <div className="workspace-card workspace-empty"><CirclePlay aria-hidden="true" /><p>{t.noLessons}</p></div>}
  </div>
}
