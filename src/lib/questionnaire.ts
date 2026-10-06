import { participantText } from '@/i18n/participant'
import type { Locale } from '@/i18n/dictionaries'

export type Question = {
  id: string; question_key: string; label: Record<string, string>; question_type: string; is_required: boolean;
  validation?: { min?: number; max?: number; max_length?: number };
  form_question_options: { value: string; label: Record<string, string> }[];
}

export function questionLabel(question: Question, locale: Locale) {
  const t = participantText(locale)
  const knownKeys = ['learned_today', 'would_enter', 'would_change', 'main_learning', 'no_trade_reason', 'notes', 'operatesInFinancialMarket', 'tradingKnowledgeTime', 'tookCoursesBefore', 'currentProfession', 'availableTime', 'mainGoal', 'tradingIntention', 'biggestDifficulty', 'expectations30Days']
  return question.label[locale === 'ht' ? 'ht' : 'pt-BR'] || (knownKeys.includes(question.question_key) ? t[question.question_key as keyof typeof t] : question.label['pt-BR']) || question.question_key
}

export function questionOptionLabel(label: Record<string, string>, value: string, locale: Locale) {
  const t = participantText(locale)
  const translated = ['yes', 'no', 'profession', 'extra_income'].includes(value) ? t[value as keyof typeof t] : null
  return label[locale === 'ht' ? 'ht' : 'pt-BR'] || translated || label['pt-BR'] || value
}
