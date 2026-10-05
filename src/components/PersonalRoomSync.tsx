'use client'
import { useState } from 'react'
import { syncPersonalRoomAction } from '@/app/(frontend)/admin/meetings/new/actions'

export default function PersonalRoomSync() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  return <div className="space-y-2"><button className="underline disabled:opacity-50" disabled={busy} onClick={async () => {
    setBusy(true)
    try { const result = await syncPersonalRoomAction(); setMessage(result.error || 'Sala pessoal sincronizada.') }
    catch { setMessage('Não foi possível sincronizar a sala. Tente novamente.') }
    finally { setBusy(false) }
  }}>{busy ? 'Sincronizando…' : 'Sincronizar sala pessoal do owner'}</button><p role="status">{message}</p></div>
}
