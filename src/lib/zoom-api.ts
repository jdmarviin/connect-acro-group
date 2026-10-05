import crypto from 'node:crypto'

function key(secret: string) { return crypto.createHash('sha256').update(secret).digest() }
export function encryptToken(value: string, secret: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(secret), iv)
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), body].map(part => part.toString('base64url')).join('.')
}
export function decryptToken(value: string, secret: string) {
  const [iv, tag, body] = value.split('.').map(part => Buffer.from(part, 'base64url'))
  const cipher = crypto.createDecipheriv('aes-256-gcm', key(secret), iv)
  cipher.setAuthTag(tag)
  return Buffer.concat([cipher.update(body), cipher.final()]).toString('utf8')
}

export type ZoomMeeting = { id: number; host_id: string; join_url: string; duration?: number; type?: number }
