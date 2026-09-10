import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
// Tipagem correta para o App Router no Next.js 15
export default async function ReuniaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ meetingId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const meetingId = resolvedParams.meetingId
  const pwd = typeof resolvedSearchParams.pwd === 'string' ? resolvedSearchParams.pwd : undefined

  const payload = await getPayload({ config: configPromise })
  const headersList = await getHeaders()
  
  let user = null;
  try {
    const cookieHeader = headersList.get('cookie') || ''
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
    console.error('Erro ao verificar JWT na página de reunião:', error)
  }

  if (!user) {
    redirect('/')
  }


  if (!user.onboardingCompleted) {
    redirect('/onboarding')
  }

  // O Zoom precisa de um email válido e um nome
  const userEmail = user.email || 'user@example.com'

  const userName = user.name || 'Usuário'

  const xForwardedProto = headersList.get('x-forwarded-proto')
  const protocol = xForwardedProto || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const leaveUrl = `${protocol}://${host}/welcome`

  // Calcula a assinatura (signature) do lado do servidor para maior segurança
  const iat = Math.round((new Date().getTime() - 30000) / 1000)
  const exp = iat + 60 * 60 * 2
  const zoomClientId = process.env.ZOOM_CLIENT_ID!
  const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET!

  const payloadToken = {
    sdkKey: zoomClientId,
    appKey: zoomClientId,
    mn: meetingId,

    role: user.role === 'admin' ? 1 : 0,
    iat: iat,
    exp: exp,
    tokenExp: exp
  }

  const signature = jwt.sign(payloadToken, zoomClientSecret, { algorithm: 'HS256' })

  // URL do Iframe passando os parâmetros de forma limpa
  const iframeUrl = `/zoom.html?meetingNumber=${meetingId}&pwd=${pwd || ''}&userName=${encodeURIComponent(userName)}&userEmail=${encodeURIComponent(userEmail)}&userId=${user.id}&signature=${signature}&sdkKey=${zoomClientId}&leaveUrl=${encodeURIComponent(leaveUrl)}`

  return (
    <div className="w-full h-full bg-black overflow-hidden">
      <iframe 
        src={iframeUrl}
        allow="camera; microphone; display-capture"
        className="w-full h-full border-none"
      />
    </div>
  )
}
