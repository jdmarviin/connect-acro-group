'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getData } from '@/lib/data'
import { syncSupabaseRoom, zoomSupabaseRequest, saveZoomRoom } from '@/lib/supabase/zoom'
import type { ZoomMeeting } from '@/lib/zoom-api'

export async function syncPersonalRoomAction() {
  await requireAdmin()
  const reader = await getData()
  const { docs: owners } = await reader.find({ collection: 'users', where: { role: { equals: 'owner' } }, limit: 1 })
  if (!owners[0]) return { error: 'Configure o proprietário e conecte sua conta Zoom.' }
  try { await syncSupabaseRoom(owners[0]) }
  catch (error) { return { error: error instanceof Error ? error.message : 'Não foi possível sincronizar a sala.' } }
  revalidatePath('/dashboard')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function createMeetingAction(formData: FormData) {
  const host = await requireAdmin()
  const title = String(formData.get('title') || '').trim()
  const recurring = formData.get('kind') === 'recurring'
  const scheduledDate = new Date(String(formData.get('scheduledAt') || ''))
  const duration = Number(formData.get('durationMinutes') || 60)
  if (!title || title.length > 200 || (!recurring && (!Number.isFinite(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()))) return { error: 'Preencha título e uma data futura válidos.' }
  if (!Number.isInteger(duration) || duration < 1 || duration > 1440) return { error: 'Informe duração entre 1 e 1440 minutos.' }
  let zoom: ZoomMeeting
  try {
    zoom = await zoomSupabaseRequest(host, '/users/me/meetings', { method: 'POST', body: JSON.stringify({
      topic: title, type: recurring ? 3 : 2, ...(!recurring && { start_time: scheduledDate.toISOString(), timezone: 'UTC' }), duration,
      settings: { mute_upon_entry: true, join_before_host: false, waiting_room: true, use_pmi: false },
    }) })
  } catch (error) { return { error: error instanceof Error ? error.message : 'Falha ao criar reunião.' } }
  try {
    await saveZoomRoom({ host, title, kind: recurring ? 'recurring' : 'scheduled', zoomLink: zoom.join_url,
      date: recurring ? null : scheduledDate.toISOString(), duration, roomKey: recurring ? `zoom:${zoom.id}` : undefined })
  } catch {
    try { await zoomSupabaseRequest(host, `/meetings/${zoom.id}`, { method: 'DELETE' }) }
    catch { return { error: `A reunião ${zoom.id} foi criada no Zoom. Confira-a antes de tentar novamente.` } }
    return { error: 'Falha ao salvar; a criação no Zoom foi desfeita.' }
  }
  revalidatePath('/dashboard')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
