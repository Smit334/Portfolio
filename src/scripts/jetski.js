import { advanceCraft, clamp, craftIsActive, createCraftState, pointCraft, pressCraft } from './jetski-physics.js';
import { createBoatSprites, drawBoat, drawWake } from './jetski-render.js';

// One low-resolution water surface + a small, translated craft surface.
// No full-screen craft raster, no layout reads on pointermove, no idle loop.
export function startJetski({ reducedMotion, fine }) {
  if (reducedMotion || !fine) return null;
  const root = document.documentElement;
  const water = document.createElement('canvas');
  const craft = document.createElement('canvas');
  const wx = water.getContext('2d');
  const cx = craft.getContext('2d');
  if (!wx || !cx) return null; // Keep native cursor if canvas is unavailable.
  for (const c of [water, craft]) {
    c.className = 'jetski-layer';
    c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
  }
  water.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';
  craft.style.cssText = 'position:fixed;left:0;top:0;width:80px;height:80px;z-index:40;pointer-events:none;visibility:hidden;will-change:transform;';
  const S = createCraftState();
  const targets = [...document.querySelectorAll('.card, .edu, .hero-photo .media, .about-photo .media, .vignette')]
    .map(el => ({ el, rect: null, y: 0, vy: 0, live: false }));
  let W, H, dpr, dirty = true, measuredAt = -Infinity;
  let rafId = null, last = null;
  let accent = '110,230,180', accentAt = -Infinity;
  let sprites;
  let overInput = false;
  const viewer = document.querySelector('.lb-root');

  function size() {
    W = innerWidth; H = innerHeight;
    // Foam tolerates downsampling, while the tiny boat stays crisp at 2x.
    const scale = Math.min(window.devicePixelRatio || 1, 1.25, Math.sqrt(1500000 / Math.max(1, W * H)));
    water.width = Math.max(1, Math.round(W * scale));
    water.height = Math.max(1, Math.round(H * scale));
    wx.setTransform(scale, 0, 0, scale, 0, 0);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    craft.width = craft.height = 80 * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sprites = createBoatSprites(accent, dpr);
    dirty = true;
  }
  size();
  function wake() {
    if (rafId === null && !document.hidden && S.seen) rafId = requestAnimationFrame(loop);
  }
  function setPointer(x, y, timeStamp) {
    pointCraft(S, x, y, timeStamp);
    if (!S.overText) root.classList.add('jetski');
    wake();
  }
  function press() { pressCraft(S); wake(); }
  function release() { S.down = false; wake(); }
  function leave() {
    S.seen = false; S.down = false;
    S.trail.length = S.spray.length = S.rings.length = 0;
    craft.style.visibility = 'hidden';
    root.classList.remove('jetski');
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = last = null;
    wx.clearRect(0, 0, W, H);
    for (const tg of targets) {
      tg.y = tg.vy = 0;
      if (tg.live) tg.el.style.removeProperty('--by');
      tg.live = false;
    }
  }
  function invalidate() { dirty = true; wake(); }
  function nativeContext() {
    S.overText = overInput || !!viewer?.classList.contains('open');
    root.classList.toggle('jetski', S.seen && !S.overText);
    if (S.overText) craft.style.visibility = 'hidden';
    wake();
  }
  if (viewer && typeof MutationObserver !== 'undefined') {
    new MutationObserver(nativeContext).observe(viewer, { attributes: true, attributeFilter: ['class'] });
    nativeContext();
  }
  const isMouse = e => !e.pointerType || e.pointerType === 'mouse';
  addEventListener('pointermove', e => {
    if (!isMouse(e)) return;
    setPointer(e.clientX, e.clientY, e.timeStamp);
  }, { passive: true });
  addEventListener('pointerdown', e => {
    if (!isMouse(e)) return;
    setPointer(e.clientX, e.clientY, e.timeStamp); press();
  }, { passive: true });
  addEventListener('pointerup', e => { if (isMouse(e)) release(); }, { passive: true });
  addEventListener('pointercancel', e => { if (isMouse(e)) leave(); }, { passive: true });
  addEventListener('blur', leave);
  document.addEventListener('pointerout', e => { if (isMouse(e) && !e.relatedTarget) leave(); }, { passive: true });
  document.addEventListener('pointerover', e => {
    if (!isMouse(e)) return;
    // Image pan/zoom and text entry retain native cursor semantics.
    overInput = !!e.target.closest?.('input, textarea, select, [contenteditable="true"]');
    nativeContext();
  });
  addEventListener('resize', () => { size(); wake(); });
  addEventListener('scroll', invalidate, { passive: true });
  document.addEventListener('load', invalidate, true);
  document.addEventListener('transitionend', invalidate);
  document.addEventListener('animationend', invalidate);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(invalidate);
    for (const tg of targets) observer.observe(tg.el);
  }

  function step(dt, now) {
    advanceCraft(S, dt);
    if (now - accentAt > 400) {
      const next = getComputedStyle(root).getPropertyValue('--a1').trim() || accent;
      if (next !== accent) { accent = next; sprites = createBoatSprites(accent, dpr); }
      accentAt = now;
    }
    // Read one batch only after layout/scroll changes. Subtract our own bob
    // to avoid feedback drift. All style writes occur after measurements.
    if (dirty && now - measuredAt >= 100) {
      for (const tg of targets) {
        const r = tg.el.getBoundingClientRect();
        tg.rect = { left: r.left, right: r.right, top: r.top - tg.y, bottom: r.bottom - tg.y };
      }
      dirty = false; measuredAt = now;
    }
    const h = clamp(dt, 0, 0.05);
    const locked = document.body.classList.contains('ov-lock');
    for (const tg of targets) {
      const r = tg.rect;
      let force = 0;
      if (r && !locked && S.seen && !S.overText && r.bottom > 0 && r.top < H && S.speed > 80) {
        const distance = Math.hypot(S.px - clamp(S.px, r.left, r.right), S.py - clamp(S.py, r.top, r.bottom));
        force = Math.max(0, 1 - distance / 110) * Math.min(S.speed / 1000, 1) * 115;
      }
      const target = force / 100;
      const error = tg.y - target, w = 12, decay = Math.exp(-w * h);
      const impulse = tg.vy + w * error;
      tg.y = target + (error + impulse * h) * decay;
      tg.vy = (tg.vy - w * impulse * h) * decay;
    }
    for (const tg of targets) {
      const active = Math.abs(tg.y) > 0.015 || Math.abs(tg.vy) > 0.03;
      if (active) tg.el.style.setProperty('--by', tg.y.toFixed(2) + 'px');
      else if (tg.live) { tg.el.style.removeProperty('--by'); tg.y = tg.vy = 0; }
      tg.live = active;
    }
  }
  function drawWater() {
    wx.clearRect(0, 0, W, H);
    drawWake(wx, S, sprites);
  }
  function drawCraft() {
    craft.style.visibility = S.seen && !S.overText ? 'visible' : 'hidden';
    if (!S.seen || S.overText) return;
    craft.style.transform = `translate3d(${S.px - 40}px,${S.py - 40}px,0)`;
    cx.clearRect(0, 0, 80, 80);
    drawBoat(cx, S, sprites);
  }
  function loop(now) {
    rafId = null;
    const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
    last = now;
    step(dt, now); drawWater(); drawCraft();
    if (craftIsActive(S) || targets.some(tg => tg.live) || dirty) wake();
    else last = null;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  // Returned controller supports deterministic tests; no production window API.
  return { S, step, drawWater, drawCraft, setPointer, press, release, water, craft };
}
