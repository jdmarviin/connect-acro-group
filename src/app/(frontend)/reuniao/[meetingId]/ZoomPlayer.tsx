'use client'

import { useEffect, useState, useRef } from 'react'
import '@zoom/meetingsdk/dist/ui/zoom-meetingsdk.css'

export default function ZoomPlayer({ 
  meetingId, 
  pwd, 
  userName, 
  userEmail,
  leaveUrl
}: { 
  meetingId: string, 
  pwd?: string, 
  userName: string, 
  userEmail: string,
  leaveUrl: string
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const entryTimeRef = useRef<Date | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialized = typeof window !== 'undefined' ? (window as any).__zoomInitialized : false;

  useEffect(() => {
    const handleExit = () => {
      if (entryTimeRef.current) {
        const exitTime = new Date()
        const durationMs = exitTime.getTime() - entryTimeRef.current.getTime()
        const durationMinutes = (durationMs / 60000).toFixed(2)
        const durationSeconds = Math.round(durationMs / 1000)
        
        console.log(`%c[Reunião Analytics] Usuário saiu às: ${exitTime.toLocaleTimeString()}`, 'color: orange; font-weight: bold;')
        console.log(`%c[Reunião Analytics] Duração: ${durationMinutes} minutos (${durationSeconds} segundos)`, 'color: cyan; font-weight: bold;')
        
        // Clear to avoid duplicate logs if unmount and beforeunload both fire
        entryTimeRef.current = null 
      }
    }

    window.addEventListener('beforeunload', handleExit)
    return () => {
      handleExit()
      window.removeEventListener('beforeunload', handleExit)
    }
  }, [])

  useEffect(() => {
    if (initialized) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__zoomInitialized = true;

    // Fetch signature
    fetch('/api/zoom/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingNumber: meetingId,
        role: 0 // 0 = attendee
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      const signature = data.signature
      const sdkKey = data.sdkKey

      // Import Component View dynamically
      import('@zoom/meetingsdk/embedded').then((ZoomMtgEmbeddedModule) => {
        const ZoomMtgEmbedded = ZoomMtgEmbeddedModule.default
        const client = ZoomMtgEmbedded.createClient()

        let rootElement = document.getElementById('meetingSDKElement')
        if (!rootElement) {
            rootElement = document.createElement('div')
            rootElement.id = 'meetingSDKElement'
            document.body.appendChild(rootElement)
        }

        client.init({
          zoomAppRoot: rootElement,
          language: 'pt-PT',
          customize: {
            video: {
              isResizable: true,
              viewSizes: {
                default: {
                  width: window.innerWidth,
                  height: window.innerHeight
                }
              }
            }
          }
        }).then(() => {
          setLoading(false)
          client.join({
            sdkKey: sdkKey,
            signature: signature,
            meetingNumber: meetingId,
            password: pwd || '',
            userName: userName,
            userEmail: userEmail,
          }).then(() => {
            entryTimeRef.current = new Date()
            console.log(`%c[Reunião Analytics] Usuário entrou às: ${entryTimeRef.current.toLocaleTimeString()}`, 'color: #00ff00; font-weight: bold;')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }).catch((err: any) => {
            console.error('Join Meeting Error', err)
            setError('Erro ao entrar na reunião.')
          })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).catch((err: any) => {
          console.error('Zoom SDK Init Error', err)
          setError('Erro ao inicializar o player do Zoom.')
          setLoading(false)
        })

      }).catch(err => {
        console.error('Error loading Zoom Embedded SDK', err)
        setError('Erro ao carregar o SDK do Zoom.')
        setLoading(false)
      })

    })
    .catch(err => {
      console.error('Error fetching signature', err)
      setError('Erro ao obter assinatura do Zoom.')
      setLoading(false)
    })

  }, [meetingId, pwd, userName, userEmail, leaveUrl, initialized])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Ops! Alguma coisa deu errado.</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.href = leaveUrl}
          className="mt-6 px-6 py-2 bg-white text-black font-semibold rounded-lg"
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Conectando à reunião...</p>
        </div>
      )}
      <div id="meetingSDKElement" className="w-full h-full absolute inset-0"></div>
    </>
  )
}
