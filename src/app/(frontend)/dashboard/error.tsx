'use client'
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [creole, setCreole] = useState(true)
  useEffect(() => { setCreole(document.documentElement.lang !== 'pt-BR') }, [])
  return <div className="workspace-card workspace-empty" role="alert"><RefreshCw aria-hidden="true" /><h1>{creole ? 'Nou pa t ka chaje espas ou a.' : 'Não foi possível carregar seu espaço.'}</h1><p>{creole ? 'Done ou yo an sekirite. Eseye chaje paj la ankò.' : 'Seus dados continuam salvos. Tente carregar a página novamente.'}</p><button className="workspace-button" onClick={reset}>{creole ? 'Eseye ankò' : 'Tentar novamente'}</button></div>
}
