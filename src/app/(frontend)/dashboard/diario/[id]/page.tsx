import { supabaseServer } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCheck } from 'lucide-react'
import { participantContext } from '@/lib/participant'
import { participantDate, participantText } from '@/i18n/participant'
import ReflectionForm from './ReflectionForm'
import { type Question, questionLabel, questionOptionLabel } from '@/lib/questionnaire'

export default async function DiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, locale } = await participantContext()
  const t = participantText(locale)
  const { id } = await params
  const client = await supabaseServer()
  const { data: assignment, error } = await client.from('form_assignments').select('id,form_version_id,meeting_id,reflection_day,opens_at,closes_at').eq('id', id).single()
  if (error || !assignment) notFound()
  const [{ data: questions, error: questionError }, { data: submission, error: submissionError }] = await Promise.all([
    client.from('form_questions').select('id,question_key,label,question_type,is_required,validation,form_question_options(value,label)').eq('form_version_id', assignment.form_version_id).order('position').returns<Question[]>(),
    client.from('form_submissions').select('id,status,submitted_at').eq('assignment_id', id).eq('user_id', user.id).maybeSingle(),
  ])
  if (questionError || submissionError) throw new Error(t.unavailable)
  const submitted = submission?.status === 'submitted'
  if (!assignment.meeting_id && !submitted) notFound()
  const { data: answers, error: answerError } = submission ? await client.from('form_answers').select('*').eq('submission_id', submission.id) : { data: [], error: null }
  if (answerError) throw new Error(t.unavailable)
  const closed = new Date(assignment.opens_at).getTime() > Date.now() || (assignment.closes_at && new Date(assignment.closes_at).getTime() <= Date.now())
  return <div className="participant-page reflection-page">
    <Link href="/dashboard/pesquisas" className="reflection-back">{t.backSurveys}</Link>
    <header className="participant-page-heading"><div><p className="workspace-eyebrow">{assignment.reflection_day ? participantDate(assignment.reflection_day, locale) : t.surveys}</p><h1>{assignment.meeting_id ? t.daily : t.initial}</h1><p>{submitted ? t.savedHint : t.dailyHint}</p></div></header>
    {submitted ? <>
      <div className="workspace-notice"><CheckCheck aria-hidden="true" /><div><strong>{t.saved}</strong><p>{t.submittedAt} {participantDate(submission.submitted_at!, locale, true)}</p></div></div>
      {questions?.map(q => {
        const answer = answers?.find(a => a.question_id === q.id)
        const optionLabel = (value: string) => {
          const option = q.form_question_options.find(o => o.value === value)
          return option ? questionOptionLabel(option.label, value, locale) : value
        }
        let value = t.noAnswer
        if (answer) {
          if (answer.value_boolean !== null) value = answer.value_boolean ? t.yes : t.no
          else if (answer.value_text !== null) value = optionLabel(answer.value_text)
          else if (Array.isArray(answer.value_json)) value = answer.value_json.map(item => optionLabel(String(item))).join(', ')
          else value = String(answer.value_number ?? answer.value_date ?? t.noAnswer)
        }
        return <article key={q.id} className="workspace-card reflection-answer"><h2>{questionLabel(q, locale)}</h2><p>{value}</p></article>
      })}
    </> : closed ? <div className="workspace-card workspace-empty"><p>{t.closed}</p></div> : <ReflectionForm id={id} questions={questions || []} locale={locale} />}
  </div>
}
