import Link from 'next/link'
import { GraduationCap, LockKeyhole } from 'lucide-react'
import { participantContext } from '@/lib/participant'
import { participantText } from '@/i18n/participant'
import { supabaseServer } from '@/lib/supabase/server'
import { hasCourseAccess } from '@/lib/courses'

export default async function CoursesPage() {
  const { locale } = await participantContext()
  const t = participantText(locale)
  const client = await supabaseServer()
  const [{ data: courses, error }, { data: enrollments }] = await Promise.all([
    client.from('courses').select('id,slug,title,description').eq('status', 'published').order('published_at', { ascending: false }),
    client.from('course_enrollments').select('course_id,status,expires_at'),
  ])
  if (error) throw new Error('Unable to load courses')
  const allowed = new Set((enrollments || []).filter(e => hasCourseAccess(e)).map(e => e.course_id))
  return <div className="participant-page"><header className="participant-page-heading"><div><p className="workspace-eyebrow">ACRO GROUP</p><h1>{t.coursesTitle}</h1><p>{t.coursesIntro}</p></div></header>
    {courses?.length ? <div className="workspace-products">{courses.map(course => <article className="workspace-card workspace-product" key={course.id}>
      <div><h2>{course.title}</h2>{course.description && <p>{course.description}</p>}
        {allowed.has(course.id) ? <Link className="workspace-button" href={`/dashboard/cursos/${course.slug}`}>{t.courseWatch}</Link>
          : <span className="workspace-button secondary" aria-disabled="true"><LockKeyhole aria-hidden="true" />{t.courseLocked}</span>}
      </div>
    </article>)}</div> : <div className="workspace-card workspace-empty"><GraduationCap aria-hidden="true" /><p>{t.noCourses}</p></div>}
  </div>
}
