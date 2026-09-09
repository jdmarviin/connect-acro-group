'use server';

import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createMeetingAction(formData: FormData) {

  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const zoomLink = formData.get('zoomLink') as string;
  const notify = formData.get('notify') === 'on';

  if (!title || !date || !time) {
    throw new Error('Preencha os campos obrigatórios');
  }

  // Convert date and time to ISO Date
  const dateTimeStr = `${date}T${time}:00`;
  const scheduledDate = new Date(dateTimeStr);

  const payload = await getPayload({ config: configPromise });

  let finalZoomLink = zoomLink;
  let zoomMeetingId = '';

  // If no zoom link was provided, we would ideally call Zoom API here to create one.
  // Since we don't have the Zoom Server-to-Server OAuth setup readily available here for creating meetings
  // (usually requires Zoom Server-to-Server OAuth app, different from the login OAuth app),
  // we will generate a placeholder or assume it's an internal meeting link.
  if (!finalZoomLink) {
    // Simulated Zoom meeting generation for prototype
    const randomMeetingId = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    zoomMeetingId = randomMeetingId;
    finalZoomLink = `https://zoom.us/j/${randomMeetingId}`;
  } else {
    // Try to extract meeting ID from link if pasted
    const match = finalZoomLink.match(/\/j\/(\d+)/);
    if (match && match[1]) {
      zoomMeetingId = match[1];
    }
  }

  // Create meeting in Payload
  await payload.create({
    collection: 'meetings',
    data: {
      title,
      date: scheduledDate.toISOString(),
      zoomLink: finalZoomLink,
      zoomMeetingId,
      notifyParticipants: notify,
      durationMinutes: 60,
    }
  });

  // Revalidate dashboards so the new meeting appears
  revalidatePath('/dashboard');
  revalidatePath('/admin/dashboard');

  redirect('/admin/dashboard');
}
