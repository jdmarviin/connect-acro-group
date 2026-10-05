'use client'

// Keep every entry point on the same player, including the microphone hold control.
export default function ZoomPlayer({ meetingId }: {
  meetingId: string
  pwd?: string
  userName: string
  userEmail: string
  leaveUrl: string
}) {
  return <iframe
    title="Reunião Zoom"
    src={`/zoom.html?meetingNumber=${encodeURIComponent(meetingId)}`}
    allow="camera; microphone; display-capture"
    referrerPolicy="no-referrer"
    className="w-full h-full border-none"
  />
}
