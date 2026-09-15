export function parseZoomLink(value: string) {
  let url: URL
  try { url = new URL(value) } catch { throw new Error('Informe um link válido de reunião do Zoom.') }
  if (url.protocol !== 'https:' || !(url.hostname === 'zoom.us' || url.hostname.endsWith('.zoom.us'))) {
    throw new Error('Use um link HTTPS do domínio zoom.us.')
  }
  const match = url.pathname.match(/^\/(?:j|s)\/(\d{9,11})\/?$/)
  if (!match) throw new Error('Use o link direto da reunião: https://zoom.us/j/ID.')
  return { meetingNumber: match[1], password: url.searchParams.get('pwd') || '' }
}
