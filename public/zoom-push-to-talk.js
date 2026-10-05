// Gate only microphone tracks acquired by this iframe. Zoom's mute API is rate-limited;
// disabling the local track closes audio immediately, even while an SDK request is pending.
export function installMicrophoneGate(mediaDevices, Track) {
  const enabled = Object.getOwnPropertyDescriptor(Track?.prototype || {}, 'enabled');
  if (!mediaDevices?.getUserMedia || !enabled?.get || !enabled?.set) {
    throw new Error('Este navegador não oferece o controle de microfone necessário. Use uma versão atual do Chrome, Edge, Firefox ou Safari.');
  }
  const capture = mediaDevices.getUserMedia;
  const tracks = new Map();
  let open = false;
  let disposed = false;
  function guard(track, initialRequested = enabled.get.call(track)) {
    if (tracks.has(track) || track.kind !== 'audio') return track;
    let requested = initialRequested;
    const apply = () => enabled.set.call(track, !disposed && open && requested);
    const clone = track.clone.bind(track);
    try {
      // Preserve the SDK's own mute state while preventing it from bypassing push-to-talk.
      Object.defineProperty(track, 'enabled', {
        configurable: false,
        get() { return enabled.get.call(track); },
        set(value) { requested = Boolean(value); apply(); },
      });
      Object.defineProperty(track, 'clone', { value: () => guard(clone(), requested), configurable: false });
      tracks.set(track, apply);
      track.addEventListener('ended', () => tracks.delete(track), { once: true });
      apply();
      return track;
    } catch (error) { track.stop(); throw error; }
  }
  mediaDevices.getUserMedia = async function (...args) {
    const stream = await capture.apply(this, args);
    try {
      for (const track of stream.getAudioTracks()) guard(track);
      if (disposed) for (const track of stream.getAudioTracks()) track.stop();
      return stream;
    } catch (error) {
      for (const track of stream.getTracks()) track.stop();
      throw error;
    }
  };
  return {
    setOpen(value) {
      open = !disposed && Boolean(value);
      for (const [track, apply] of tracks) {
        if (track.readyState === 'ended') tracks.delete(track);
        else apply();
      }
    },
    dispose() {
      disposed = true;
      open = false;
      for (const [track, apply] of tracks) { apply(); track.stop(); }
      tracks.clear();
      // Keep the closed wrapper until the iframe is unloaded: late SDK captures stay silent.
    },
  };
}

export function createPushToTalk({ sdk, gate, onState, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let ready = false;
  let held = false;
  let disposed = false;
  let busy = false;
  let timer;
  let lastCommand = -Infinity;
  let message = 'Conectando à reunião…';
  const publish = () => onState({ ready, held, message });
  function release() {
    held = false;
    gate.setOpen(false);
    message = ready ? 'Microfone fechado. Segure o botão para falar.' : 'Conectando à reunião…';
    publish();
    void reconcile();
  }
  async function reconcile() {
    if (busy || disposed || !ready) return;
    busy = true;
    try {
      const user = await sdk.currentUser();
      if (disposed) return;
      // Always read the current intent AFTER async work; never execute a queued stale unmute.
      const mute = !held;
      if (user.muted !== mute && now() - lastCommand >= 1100) {
        lastCommand = now();
        await sdk.mute(user.userId, mute);
      }
    } catch {
      held = false;
      gate.setOpen(false);
      message = 'Microfone fechado. Conecte o áudio, permita o microfone e tente segurar novamente. O anfitrião precisa permitir sua fala.';
      if (!disposed) publish();
    } finally {
      busy = false;
      if (!disposed) {
        clearTimer(timer);
        timer = setTimer(() => { void reconcile(); }, 1100);
      }
    }
  }
  gate.setOpen(false);
  publish();
  return {
    joined() { if (!disposed) { ready = true; release(); } },
    press() {
      if (!ready || disposed || held) return;
      held = true;
      gate.setOpen(true);
      message = 'Segurando para falar. Solte para fechar o microfone.';
      publish();
      void reconcile();
    },
    release,
    dispose() {
      held = false;
      ready = false;
      disposed = true;
      gate.dispose();
      clearTimer(timer);
    },
  };
}

export function bindHoldButton(button, controller, win = window, doc = document) {
  let input = null;
  const listeners = [];
  const listen = (target, event, handler) => {
    target.addEventListener(event, handler, true);
    listeners.push(() => target.removeEventListener(event, handler, true));
  };
  function release() { input = null; controller.release(); }
  listen(button, 'pointerdown', event => {
    if (button.disabled || input !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    button.focus({ preventScroll: true });
    input = { pointer: event.pointerId };
    button.setPointerCapture(event.pointerId);
    controller.press();
  });
  listen(win, 'pointerup', event => { if (input?.pointer === event.pointerId) release(); });
  listen(win, 'pointercancel', event => { if (input?.pointer === event.pointerId) release(); });
  listen(button, 'lostpointercapture', () => { if (input?.pointer !== undefined) release(); });
  listen(button, 'keydown', event => {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (button.disabled || event.repeat || input !== null) return;
    input = { key: event.code };
    controller.press();
  });
  listen(win, 'keyup', event => {
    if (input?.key !== event.code) return;
    event.preventDefault(); event.stopImmediatePropagation(); release();
  });
  listen(button, 'click', event => { event.preventDefault(); event.stopImmediatePropagation(); });
  listen(button, 'contextmenu', event => event.preventDefault());
  listen(button, 'blur', release);
  listen(win, 'blur', release);
  listen(win, 'pagehide', release);
  listen(doc, 'visibilitychange', () => { if (doc.visibilityState !== 'visible') release(); });
  listen(doc, 'fullscreenchange', release);
  return () => { release(); listeners.forEach(remove => remove()); };
}

// Zoom's callbacks are bounded so a failed or throttled request cannot hold the controller forever.
export function zoomAudioAdapter(zoom) {
  function call(invoke) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Zoom audio timed out')), 3000);
      invoke({
        success: value => { clearTimeout(timeout); resolve(value); },
        error: error => { clearTimeout(timeout); reject(error); },
      });
    });
  }
  return {
    async currentUser() {
      const response = await call(callbacks => zoom.getCurrentUser(callbacks));
      const user = response?.result?.currentUser;
      if (!user?.userId) throw new Error('O áudio ainda não está disponível.');
      return user;
    },
    mute(userId, mute) { return call(callbacks => zoom.mute({ userId, mute, ...callbacks })); },
  };
}
