// Image lightbox — click a gallery photo to view full size.
// Natural navigation: wheel zoom centered on the cursor, drag to pan,
// pinch on touch, double-click to reset/zoom, Esc or backdrop to close.

export function startLightbox() {
  const root = document.querySelector('.lb-root');
  if (!root) return;
  const img = root.querySelector('.lb-img');
  const stage = root.querySelector('.lb-stage');
  const closeBtn = root.querySelector('.lb-close');

  let open = false;
  let scale = 1, tx = 0, ty = 0;
  let lastFocus = null;
  const pointers = new Map();
  let lastDist = 0, dragging = false, lastPos = null;

  const apply = () => {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
  };
  const reset = () => { scale = 1; tx = 0; ty = 0; apply(); };

  function show(src, alt) {
    lastFocus = document.activeElement;
    img.src = src;
    img.alt = alt || '';
    reset();
    root.classList.add('open');
    const arm = () => root.classList.add('in');
    requestAnimationFrame(() => requestAnimationFrame(arm));
    setTimeout(arm, 120);
    open = true;
    closeBtn.focus({ preventScroll: true });
  }
  function hide() {
    if (!open) return;
    open = false;
    root.classList.remove('in');
    setTimeout(() => { root.classList.remove('open'); img.removeAttribute('src'); }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-lightbox]').forEach((el) => {
    el.addEventListener('click', () => show(el.dataset.lightbox, el.dataset.lightboxAlt));
  });
  closeBtn.addEventListener('click', hide);
  stage.addEventListener('click', (e) => { if (e.target === stage) hide(); });
  // capture phase so Esc closes the lightbox without also closing the overlay panel
  document.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') { e.stopPropagation(); hide(); }
  }, true);

  // wheel zoom, centered on the cursor
  root.addEventListener('wheel', (e) => {
    if (!open) return;
    e.preventDefault();
    const next = Math.min(6, Math.max(1, scale * Math.exp(-e.deltaY * 0.0016)));
    if (next === scale) return;
    const r = img.getBoundingClientRect();
    const cx = e.clientX - (r.left + r.width / 2);
    const cy = e.clientY - (r.top + r.height / 2);
    const f = next / scale - 1;
    tx -= cx * f;
    ty -= cy * f;
    scale = next;
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  // drag pan + two-finger pinch
  const dist = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  img.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    img.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      dragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
      if (scale > 1) img.style.cursor = 'grabbing';
    } else if (pointers.size === 2) {
      lastDist = dist();
    }
  });
  img.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const d = dist();
      if (lastDist) scale = Math.min(6, Math.max(1, scale * (d / lastDist)));
      lastDist = d;
      if (scale === 1) { tx = 0; ty = 0; }
      apply();
    } else if (dragging && scale > 1) {
      tx += e.clientX - lastPos.x;
      ty += e.clientY - lastPos.y;
      lastPos = { x: e.clientX, y: e.clientY };
      apply();
    }
  });
  const release = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastDist = 0;
    if (!pointers.size) { dragging = false; apply(); }
  };
  img.addEventListener('pointerup', release);
  img.addEventListener('pointercancel', release);

  img.addEventListener('dblclick', () => {
    if (scale > 1) reset();
    else { scale = 2.5; apply(); }
  });
}
