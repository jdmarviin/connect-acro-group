import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  
  const user = await currentUser();

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
      <OnboardingForm user={{ whatsapp: user.whatsapp }} />
    </div>
  )
}
