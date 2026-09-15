import { NextResponse } from 'next/server'

// Attendance is authoritative only when received from a signed Zoom webhook.
export async function POST() {
  return NextResponse.json({ error: 'Presença é registrada exclusivamente pelo webhook do Zoom.' }, { status: 410 })
}
