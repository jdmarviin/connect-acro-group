import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.PAYLOAD_SECRET!) as { id: string | number, collection: string }
    
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const payload = await getPayload({ config })

    const updatedUser = await payload.update({
      collection: 'users',
      id: decoded.id,
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

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error in onboarding submission:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
