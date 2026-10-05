/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test'
import assert from 'node:assert/strict'
import { installMicrophoneGate, createPushToTalk, bindHoldButton } from '../public/zoom-push-to-talk.js'

class Track extends EventTarget {
  kind = 'audio'
  readyState = 'live'
  value = true
  get enabled() { return this.value }
  set enabled(value) { this.value = value }
  clone() { const clone = new Track(); clone.enabled = this.enabled; return clone }
  stop() { this.readyState = 'ended' }
}
const stream = (track: Track) => ({ getAudioTracks: () => [track], getTracks: () => [track] })
const flush = () => new Promise(resolve => setImmediate(resolve))

test('microphones start closed and native SDK controls cannot open them without holding', async () => {
  const track = new Track()
  const devices = { getUserMedia: async () => stream(track) }
  const gate = installMicrophoneGate(devices, Track)
  await devices.getUserMedia()
  assert.equal(track.enabled, false)
  track.enabled = true
  assert.equal(track.enabled, false)
  gate.setOpen(true)
  assert.equal(track.enabled, true)
  gate.setOpen(false)
  assert.equal(track.enabled, false)
  track.enabled = false // Preserve a mute from Zoom itself, even while holding.
  gate.setOpen(true)
  assert.equal(track.enabled, false)
  gate.dispose()
  assert.equal(track.readyState, 'ended')
})

test('late permission grants, replacement microphones and cloned tracks remain closed after release', async () => {
  const track = new Track()
  let grant!: (value: any) => void
  const devices = { getUserMedia: () => new Promise<any>(resolve => { grant = resolve }) }
  const gate = installMicrophoneGate(devices, Track)
  gate.setOpen(true)
  const pending = devices.getUserMedia()
  gate.setOpen(false)
  grant(stream(track))
  await pending
  assert.equal(track.enabled, false)
  const clone = track.clone()
  assert.equal(clone.enabled, false)
  gate.setOpen(true)
  assert.equal(clone.enabled, true)
  gate.setOpen(false)
  assert.equal(clone.enabled, false)
  gate.dispose()
  assert.equal(clone.readyState, 'ended')
  const late = new Track()
  const last = devices.getUserMedia()
  grant(stream(late)); await last
  assert.equal(late.enabled, false)
  assert.equal(late.readyState, 'ended')
})

function controller(sdk: any) {
  let open = true
  let time = 0
  let state: any
  let tick: (() => void) | undefined
  const control = createPushToTalk({ sdk,
    gate: { setOpen: (value: boolean) => { open = value }, dispose: () => { open = false } },
    onState: (value: any) => { state = value }, now: () => time,
    setTimer: ((callback: () => void) => { tick = callback; return 1 }) as any,
    clearTimer: (() => { tick = undefined }) as any,
  })
  return { control, open: () => open, state: () => state, tick: async () => { time += 1100; tick?.(); await flush() } }
}

test('release closes audio immediately even when unmute is pending and respects SDK rate limit', async () => {
  let muted = true
  let complete!: () => void
  const calls: boolean[] = []
  const c = controller({ currentUser: async () => ({ userId: 7, muted }), mute: async (_id: number, value: boolean) => {
    calls.push(value)
    if (!value) await new Promise<void>(resolve => { complete = resolve })
    muted = value
  } })
  assert.equal(c.open(), false)
  c.control.press(); assert.equal(c.open(), false) // Before joining.
  c.control.joined(); await flush()
  c.control.press(); await flush()
  assert.equal(c.open(), true)
  assert.deepEqual(calls, [false])
  c.control.release()
  assert.equal(c.open(), false)
  complete(); await flush()
  assert.equal(c.open(), false)
  await c.tick()
  assert.deepEqual(calls, [false, true])
  assert.equal(c.open(), false)
  c.control.dispose()
})

test('release during identity lookup never issues a stale unmute; SDK failures close the gate', async () => {
  let resolveUser!: (value: any) => void
  const calls: boolean[] = []
  const c = controller({ currentUser: () => new Promise(resolve => { resolveUser = resolve }), mute: async (_id: number, muted: boolean) => { calls.push(muted) } })
  c.control.joined(); c.control.press(); c.control.release()
  resolveUser({ userId: 7, muted: true }); await flush()
  assert.deepEqual(calls, [])
  assert.equal(c.open(), false)
  c.control.dispose()
  const failed = controller({ currentUser: async () => ({ userId: 7, muted: true }), mute: async () => { throw new Error('Host disallows unmute') } })
  failed.control.joined(); await flush()
  failed.control.press(); await flush()
  assert.equal(failed.open(), false)
  assert.equal(failed.state().held, false)
  assert.match(failed.state().message, /anfitrião/)
  failed.control.dispose()
})

class Button extends EventTarget {
  disabled = false
  focus() {}
  setPointerCapture() {}
}
function emit(target: EventTarget, type: string, detail = {}) {
  const event = new Event(type, { cancelable: true })
  Object.assign(event, detail)
  target.dispatchEvent(event)
}
test('mouse/touch release, cancellation, lost capture, blur and hidden tab all close the microphone', () => {
  for (const ending of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur', 'visibilitychange', 'pagehide']) {
    const button = new Button(), win = new EventTarget(), doc = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    let held = false
    const unbind = bindHoldButton(button as any, { press: () => { held = true }, release: () => { held = false } }, win as any, doc as any)
    emit(button, 'pointerdown', { pointerId: 1, isPrimary: true, button: 0 })
    assert.equal(held, true)
    if (ending === 'visibilitychange') { doc.visibilityState = 'hidden'; emit(doc, ending) }
    else emit(ending === 'lostpointercapture' ? button : win, ending, { pointerId: 1 })
    assert.equal(held, false, ending)
    unbind()
  }
})
test('keyboard requires a held Space/Enter, ignores repeats and never latches on click', () => {
  const button = new Button(), win = new EventTarget(), doc = new EventTarget()
  let presses = 0, held = false
  const unbind = bindHoldButton(button as any, { press: () => { presses++; held = true }, release: () => { held = false } }, win as any, doc as any)
  for (const code of ['Space', 'Enter']) {
    emit(button, 'keydown', { code, repeat: false })
    emit(button, 'keydown', { code, repeat: true })
    assert.equal(held, true)
    emit(win, 'keyup', { code })
    assert.equal(held, false)
    emit(button, 'click')
    assert.equal(held, false)
  }
  assert.equal(presses, 2)
  unbind()
})
