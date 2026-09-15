import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { currentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await currentUser(request.headers)
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
    const payload = await getPayload({ config })

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        whatsapp: body.whatsapp,
        operatesInFinancialMarket: body.operatesInFinancialMarket,
        tradingKnowledgeTime: body.tradingKnowledgeTime,
        tookCoursesBefore: body.tookCoursesBefore,
        currentProfession: body.currentProfession,
        availableTime: body.availableTime,
        mainGoal: body.mainGoal,
        tradingIntention: body.tradingIntention,
        biggestDifficulty: body.biggestDifficulty,
        expectations30Days: body.expectations30Days,
        onboardingCompleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in onboarding submission:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
