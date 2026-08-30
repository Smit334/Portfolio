// Project overlay panels — open/close with shareable hash URLs (#/work/<id>),
// history integration, Esc/backdrop close, scroll lock, focus restore.

export function startOverlays() {
  const roots = new Map();
  document.querySelectorAll('.ov-root').forEach((el) => {
    roots.set(el.dataset.overlay, el);
  });
  if (!roots.size) return;

  let openId = null;
  let lastFocus = null;

  function show(id, pushHash) {
    const root = roots.get(id);
    if (!root || openId === id) return;
    if (openId) hide(false);
    openId = id;
    lastFocus = document.activeElement;
    root.classList.add('open');
    // double-rAF so the transition runs from the un-transitioned state
    // (timeout fallback: rAF is throttled in hidden/background tabs)
    const arm = () => root.classList.add('in');
    requestAnimationFrame(() => requestAnimationFrame(arm));
    setTimeout(arm, 120);
    document.body.classList.add('ov-lock');
    if (pushHash) history.pushState({ overlay: id }, '', `#/work/${id}`);
    root.querySelector('.ov-close')?.focus({ preventScroll: true });
  }

  function hide(popHash) {
    if (!openId) return;
    const root = roots.get(openId);
    openId = null;
    root.classList.remove('in');
    document.body.classList.remove('ov-lock');
    setTimeout(() => root.classList.remove('open'), 550);
    if (popHash && location.hash.startsWith('#/work/')) {
      history.pushState({}, '', location.pathname + location.search);
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open-overlay]').forEach((btn) => {
    btn.addEventListener('click', () => show(btn.dataset.openOverlay, true));
  });
  roots.forEach((root, id) => {
    root.querySelector('.ov-close')?.addEventListener('click', () => hide(true));
    root.querySelector('.ov-back')?.addEventListener('click', () => hide(true));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide(true);
  });
  window.addEventListener('popstate', () => {
    const m = location.hash.match(/^#\/work\/([\w-]+)$/);
    if (m && roots.has(m[1])) show(m[1], false);
    else hide(false);
  });

  // deep link on load
  const m = location.hash.match(/^#\/work\/([\w-]+)$/);
  if (m && roots.has(m[1])) show(m[1], false);
}
