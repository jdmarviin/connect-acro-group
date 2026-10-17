import test from 'node:test'
import assert from 'node:assert/strict'
import { hotmartEmbedUrl } from '../src/lib/hotmart'
import { courseSlug, hasCourseAccess } from '../src/lib/courses'

const embed = 'https://player.hotmart.com/embed/Ab12_xY-9?signature=abc-_%3D%3D&token=aa2d356b-e2f0-45e8-9725-e0efc7b5d29c'

test('Hotmart Player accepts the embed URL or the copied iframe code', () => {
  assert.equal(hotmartEmbedUrl(` ${embed} `), embed)
  assert.equal(hotmartEmbedUrl(`<iframe width="560" src="${embed.replace('&', '&amp;')}" allowfullscreen></iframe>`), embed)
  assert.equal(hotmartEmbedUrl(`${embed}#t=10`), embed)
  assert.equal(hotmartEmbedUrl('<iframe src="https://cf-embed.play.hotmart.com/embed/Yq4xYVmzql" width="825"height="464" frameborder="0" allowfullscreen></iframe>'),
    'https://cf-embed.play.hotmart.com/embed/Yq4xYVmzql')
})

test('Hotmart Player rejects other hosts, schemes and paths', () => {
  for (const value of [
    '', 'not a url', 'javascript:alert(1)',
    'http://player.hotmart.com/embed/Ab12',
    'https://player.hotmart.com.evil.test/embed/Ab12',
    'https://evil.play.hotmart.com/embed/Ab12',
    'https://play.hotmart.com/library/media/Yq4xYVmzql/',
    'https://evil.test/?u=https://player.hotmart.com/embed/Ab12',
    'https://user@player.hotmart.com/embed/Ab12',
    'https://player.hotmart.com:8443/embed/Ab12',
    'https://player.hotmart.com/other/Ab12',
    'https://player.hotmart.com/embed/../Ab12',
    '<iframe src="https://www.youtube.com/embed/abc"></iframe>',
  ]) assert.equal(hotmartEmbedUrl(value), null, value)
})

test('course slugs are URL safe and access respects status and expiration', () => {
  assert.equal(courseSlug('  Introdução ao Day Trade: Módulo 1! '), 'introducao-ao-day-trade-modulo-1')
  assert.equal(courseSlug('!!!'), '')
  const now = Date.parse('2026-10-13T12:00:00Z')
  assert.equal(hasCourseAccess({ status: 'active', expires_at: null }, now), true)
  assert.equal(hasCourseAccess({ status: 'completed', expires_at: '2026-10-14T00:00:00Z' }, now), true)
  assert.equal(hasCourseAccess({ status: 'active', expires_at: '2026-10-13T11:59:59Z' }, now), false)
  assert.equal(hasCourseAccess({ status: 'cancelled', expires_at: null }, now), false)
})
