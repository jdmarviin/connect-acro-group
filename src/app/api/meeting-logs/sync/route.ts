import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (!text) return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    
    const data = JSON.parse(text);
    
    if (!data.userId || !data.meetingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payload = await getPayload({ config: configPromise })
    
    await payload.create({
      collection: 'meeting-logs',
      data: {
        user: data.userId,
        zoomUserId: `web-sdk-${data.userId}`,
        meetingId: data.meetingId.toString(),
        joinTime: data.joinTime,
        leaveTime: data.leaveTime,
        durationMinutes: data.durationMinutes || 0,
        webhookStatus: 'left'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in internal meeting log sync:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
