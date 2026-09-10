import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  
  let user = null;
  try {
    const cookieHeader = headers.get('cookie') || ''
    const match = cookieHeader.match(/payload-token=([^;]+)/)
    
    if (match && match[1]) {
      const token = match[1]
      const decoded = jwt.verify(token, process.env.PAYLOAD_SECRET!) as { id: string | number, collection: string }
      
      user = await payload.findByID({
        collection: 'users',
        id: decoded.id,
      })
    }
  } catch (error) {
    console.error('Erro ao verificar JWT manualmente no onboarding:', error)
  }

  if (!user) {
    redirect('/')
  }


  if (user.onboardingCompleted) {
    if (user.role === 'admin') {
      redirect('/admin/dashboard')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <OnboardingForm user={user} />
    </div>
  )
}
