const embedHosts = new Set(['player.hotmart.com', 'cf-embed.play.hotmart.com'])

// Accepts the embed URL or the full <iframe> code copied from Hotmart Player.
export function hotmartEmbedUrl(input: string): string | null {
  const value = input.trim()
  const src = value.startsWith('<') ? /\bsrc\s*=\s*["']([^"']+)["']/i.exec(value)?.[1] : value
  if (!src) return null
  let url: URL
  try { url = new URL(src.replaceAll('&amp;', '&')) } catch { return null }
  if (url.protocol !== 'https:' || !embedHosts.has(url.hostname) || url.username || url.password || url.port) return null
  if (!/^\/embed\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return null
  url.hash = ''
  return url.toString()
}
