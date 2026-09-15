'use server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { parseZoomLink } from '@/lib/zoom-link'

export async function createMeetingAction(formData: FormData) {
  await requireAdmin()
  const title = String(formData.get('title') || '').trim()
  const zoomLink = String(formData.get('zoomLink') || '').trim()
  const { meetingNumber } = parseZoomLink(zoomLink)
  const scheduledDate = new Date(String(formData.get('scheduledAt') || ''))
  if (!title || !Number.isFinite(scheduledDate.getTime())) throw new Error('Preencha título, data e horário válidos.')
  const payload = await getPayload({ config })
  await payload.create({ collection: 'meetings', data: {
    title, date: scheduledDate.toISOString(), zoomLink, zoomMeetingId: meetingNumber,
    notifyParticipants: false, durationMinutes: 60, status: 'scheduled',
  } })
  revalidatePath('/dashboard')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
