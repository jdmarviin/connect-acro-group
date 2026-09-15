'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OnboardingForm({ user }: { user: any }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    whatsapp: user?.whatsapp || '',
    operatesInFinancialMarket: '',
    tradingKnowledgeTime: '',
    tookCoursesBefore: '',
    currentProfession: '',
    availableTime: '',
    mainGoal: '',
    tradingIntention: '',
    biggestDifficulty: '',
    expectations30Days: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.form?.reportValidity()) setStep(step + 1)
  }
  const handlePrev = () => setStep(step - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        const result = await res.json()
        alert(result.error || 'Ocorreu um erro ao salvar seus dados.')
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 p-8 sm:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Finalize seu cadastro
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Passo {step} de 3
        </p>
        <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded-full mt-4">
          <div 
            className="bg-black dark:bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de WhatsApp
              </label>
              <input
                type="text"
                name="whatsapp"
                required
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                Usaremos este número para enviar notificações importantes.
              </p>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.whatsapp}
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Você já opera no mercado financeiro?
              </label>
              <select
                name="operatesInFinancialMarket"
                required
                value={formData.operatesInFinancialMarket}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              >
                <option value="" disabled className="text-gray-900">Selecione...</option>
                <option value="yes" className="text-gray-900">Sim</option>
                <option value="no" className="text-gray-900">Não</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Há quanto tempo conhece trading?
              </label>
              <input
                type="text"
                name="tradingKnowledgeTime"
                required
                placeholder="Ex: 6 meses, 2 anos..."
                value={formData.tradingKnowledgeTime}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Já fez algum curso anteriormente?
              </label>
              <select
                name="tookCoursesBefore"
                required
                value={formData.tookCoursesBefore}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              >
                <option value="" disabled className="text-gray-900">Selecione...</option>
                <option value="yes" className="text-gray-900">Sim</option>
                <option value="no" className="text-gray-900">Não</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Qual é sua profissão atual?
              </label>
              <input
                type="text"
                name="currentProfession"
                required
                placeholder="Sua profissão"
                value={formData.currentProfession}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
            </div>
            
            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="px-8 py-3 text-gray-600 dark:text-gray-300 font-medium hover:text-black dark:hover:text-white transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.operatesInFinancialMarket || !formData.tradingKnowledgeTime || !formData.tookCoursesBefore || !formData.currentProfession}
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantas horas por dia ou semana teria disponível para estudar e operar?
              </label>
              <input
                type="text"
                name="availableTime"
                required
                placeholder="Ex: 2 horas por dia"
                value={formData.availableTime}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Qual seu principal objetivo com o mercado?
              </label>
              <input
                type="text"
                name="mainGoal"
                required
                placeholder="Seu objetivo"
                value={formData.mainGoal}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Você pretende transformar trading em profissão ou apenas renda complementar?
              </label>
              <select
                name="tradingIntention"
                required
                value={formData.tradingIntention}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              >
                <option value="" disabled className="text-gray-900">Selecione...</option>
                <option value="profession" className="text-gray-900">Profissão</option>
                <option value="extra_income" className="text-gray-900">Renda Complementar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Qual sua maior dificuldade hoje?
              </label>
              <textarea
                name="biggestDifficulty"
                required
                rows={2}
                placeholder="Descreva sua dificuldade..."
                value={formData.biggestDifficulty}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                O que você espera aprender nesses 30 dias?
              </label>
              <textarea
                name="expectations30Days"
                required
                rows={2}
                placeholder="Suas expectativas..."
                value={formData.expectations30Days}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
              />
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrev}
                className="px-8 py-3 text-gray-600 dark:text-gray-300 font-medium hover:text-black dark:hover:text-white transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.availableTime || !formData.mainGoal || !formData.tradingIntention || !formData.biggestDifficulty || !formData.expectations30Days}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Finalizar'
                )}
              </button>
            </div>
          </div>
        )}
        
      </form>
    </div>
  )
}
