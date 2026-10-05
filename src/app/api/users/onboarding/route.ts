import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }
  const requiredFields = ['whatsapp', 'operatesInFinancialMarket', 'tradingKnowledgeTime', 'tookCoursesBefore', 'currentProfession', 'availableTime', 'mainGoal', 'tradingIntention', 'biggestDifficulty', 'expectations30Days']
  if (!body || requiredFields.some(field => typeof body[field] !== 'string' || !body[field].trim() || body[field].length > 2000)) {
    return NextResponse.json({ error: 'Preencha todos os campos do cadastro (até 2.000 caracteres por campo).' }, { status: 400 })
  }
  if (!['yes', 'no'].includes(body.operatesInFinancialMarket) || !['yes', 'no'].includes(body.tookCoursesBefore) || !['profession', 'extra_income'].includes(body.tradingIntention)) {
    return NextResponse.json({ error: 'Selecione opções válidas no questionário.' }, { status: 400 })
  }
  const client = await supabaseServer()
  const { data: assignments, error: lookupError } = await client.from('form_assignments')
    .select('id,form_versions!inner(form_templates!inner(slug))')
    .eq('form_versions.form_templates.slug', 'initial-onboarding')
    .is('meeting_id', null).is('user_id', null).order('created_at', { ascending: false }).limit(1)
  if (lookupError || !assignments?.[0]) return NextResponse.json({ error: 'Onboarding indisponível.' }, { status: 503 })
  const answers = Object.fromEntries(requiredFields.filter(field => field !== 'whatsapp').map(field => [field, body[field]]))
  const { error } = await client.rpc('submit_form', { assignment: assignments[0].id, answers, whatsapp_number: body.whatsapp })
  return NextResponse.json(error ? { error: 'Não foi possível enviar. Verifique as respostas ou se o cadastro já foi concluído.' } : { success: true }, { status: error ? 400 : 200 })
}
