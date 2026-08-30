// Project overlay panels — open/close with shareable hash URLs (#/work/<id>),
// clean history integration (Esc/close/backdrop pop the entry they pushed),
// Esc close, scroll lock, background inert + focus restore.

export function startOverlays() {
  const roots = new Map();
  document.querySelectorAll('.ov-root').forEach((el) => {
    roots.set(el.dataset.overlay, el);
  });
  if (!roots.size) return;

  const page = document.querySelector('.page');
  const timers = new Map();
  let openId = null;
  let lastFocus = null;

  function show(id, viaPush) {
    const root = roots.get(id);
    if (!root || openId === id) return;
    if (openId) hide();
    openId = id;
    lastFocus = document.activeElement;
    clearTimeout(timers.get(id));
    root.classList.add('open');
    // double-rAF so the transition runs from the un-transitioned state
    // (timeout fallback: rAF is throttled in hidden/background tabs)
    const arm = () => root.classList.add('in');
    requestAnimationFrame(() => requestAnimationFrame(arm));
    setTimeout(arm, 120);
    document.body.classList.add('ov-lock');
    page?.setAttribute('inert', '');
    if (viaPush) history.pushState({ overlay: id }, '', `#/work/${id}`);
    root.querySelector('.ov-close')?.focus({ preventScroll: true });
  }

  function hide() {
    if (!openId) return;
    const id = openId;
    const root = roots.get(id);
    openId = null;
    root.classList.remove('in');
    document.body.classList.remove('ov-lock');
    page?.removeAttribute('inert');
    timers.set(id, setTimeout(() => root.classList.remove('open'), 550));
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // Esc / close button / backdrop: pop the history entry we pushed so Back
  // stays sane; fall back to a plain hide for deep-linked opens.
  function requestClose() {
    if (!openId) return;
    if (history.state && history.state.overlay === openId) {
      history.back(); // popstate handler hides
    } else {
      hide();
      if (location.hash.startsWith('#/work/')) {
        history.replaceState({}, '', location.pathname + location.search);
      }
    }
  }

  document.querySelectorAll('[data-open-overlay]').forEach((btn) => {
    btn.addEventListener('click', () => show(btn.dataset.openOverlay, true));
  });
  roots.forEach((root) => {
    root.querySelector('.ov-close')?.addEventListener('click', requestClose);
    root.querySelector('.ov-back')?.addEventListener('click', requestClose);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') requestClose();
  });
  window.addEventListener('popstate', () => {
    const m = location.hash.match(/^#\/work\/([\w-]+)$/);
    if (m && roots.has(m[1])) show(m[1], false);
    else hide();
  });

  // deep link on load
  const m = location.hash.match(/^#\/work\/([\w-]+)$/);
  if (m && roots.has(m[1])) show(m[1], false);
}
