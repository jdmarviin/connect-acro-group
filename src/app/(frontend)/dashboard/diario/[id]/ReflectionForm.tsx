'use client'
import { useActionState } from 'react'
import { submitReflection } from './actions'
import { participantText } from '@/i18n/participant'
import type { Locale } from '@/i18n/dictionaries'
import { questionLabel, questionOptionLabel, type Question } from '@/lib/questionnaire'
export default function ReflectionForm({ id, questions, locale }: { id: string; questions: Question[]; locale: Locale }) {
  const [state, action, pending] = useActionState(submitReflection.bind(null, id), { error: '' })
  const t = participantText(locale)
  const optionLabel = (label: Record<string, string>, fallback: string) => questionOptionLabel(label, fallback, locale)
  return <form action={action} className="workspace-card reflection-form">
    {questions.map(q => {
      const label = <>{questionLabel(q, locale)}{q.is_required ? ' *' : <small>{t.optional}</small>}</>
      if (q.question_type === 'multiple_choice') return <fieldset className="reflection-field" key={q.id}><legend>{label}</legend>{q.form_question_options.map(o => <label key={o.value} className="reflection-checkbox"><input type="checkbox" name={q.question_key} value={o.value} />{optionLabel(o.label, o.value)}</label>)}</fieldset>
      return <div className="reflection-field" key={q.id}><label htmlFor={q.id}>{label}</label>
        {q.question_type === 'long_text' ? <textarea id={q.id} className="reflection-input" name={q.question_key} required={q.is_required} maxLength={q.validation?.max_length || 2000} rows={4} />
          : ['single_choice', 'boolean'].includes(q.question_type) ? <select id={q.id} className="reflection-input" name={q.question_key} required={q.is_required} defaultValue=""><option value="">{t.select}</option>{q.question_type === 'boolean' ? <><option value="true">{t.yes}</option><option value="false">{t.no}</option></> : q.form_question_options.map(o => <option key={o.value} value={o.value}>{optionLabel(o.label, o.value)}</option>)}</select>
          : <input id={q.id} className="reflection-input" name={q.question_key} type={q.question_type === 'date' ? 'date' : ['number', 'scale'].includes(q.question_type) ? 'number' : 'text'} required={q.is_required} min={q.validation?.min} max={q.validation?.max} maxLength={q.validation?.max_length || 2000} />}
      </div>
    })}
    {state.error && <p role="alert">{state.error}</p>}
    <p>{t.formHint}</p>
    <button disabled={pending} className="workspace-button">{pending ? t.sending : t.save}</button>
  </form>
}
