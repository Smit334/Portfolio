// Minimal browser boundary for deterministic tests of the real cursor engine.
// No physics or rendering decisions are replaced here; canvas calls are counted.
export function cursorBrowser() {
  const counts = { measure: 0, gradient: 0, clearPixels: 0, drawImage: 0 };
  const canvases = [];
  const frames = new Map();
  const listeners = new Map();
  let id = 0;
  let time = 0;
  const mutations = [];
  const viewer = { classList: { contains: () => false } };
  const classes = new Set();
  const classList = {
    add: (...names) => names.forEach(n => classes.add(n)),
    remove: (...names) => names.forEach(n => classes.delete(n)),
    contains: n => classes.has(n),
    toggle(n, enabled) { if (enabled) classes.add(n); else classes.delete(n); },
  };
  function listen(name, fn) {
    if (!listeners.has(name)) listeners.set(name, []);
    listeners.get(name).push(fn);
  }
  function style() {
    return { setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; } };
  }
  function canvas() {
    const ctx = new Proxy({
      createLinearGradient() { counts.gradient++; return { addColorStop() {} }; },
      createRadialGradient() { counts.gradient++; return { addColorStop() {} }; },
      clearRect(x, y, w, h) { counts.clearPixels += w * h; },
      drawImage() { counts.drawImage++; },
    }, { get(target, key) { return key in target ? target[key] : () => {}; } });
    const c = { width: 300, height: 150, style: style(), setAttribute() {}, remove() {}, getContext: () => ctx };
    ctx.canvas = c;
    return c;
  }
  const targets = Array.from({ length: 15 }, (_, n) => ({
    style: style(), classList,
    getBoundingClientRect() {
      counts.measure++;
      return { left: 50, right: 450, top: 200 + n * 200, bottom: 380 + n * 200, width: 400, height: 180 };
    },
  }));
  const doc = {
    hidden: false,
    documentElement: { classList, contains: () => true },
    body: { classList: { contains: () => false }, appendChild: c => canvases.push(c) },
    createElement: canvas,
    querySelectorAll: () => targets,
    querySelector: selector => selector === '.lb-root' ? viewer : null,
    addEventListener: listen,
  };
  const globals = {
    document: doc,
    window: { devicePixelRatio: 2, scrollY: 0, addEventListener: listen },
    innerWidth: 1440, innerHeight: 900, scrollY: 0,
    addEventListener: listen,
    getComputedStyle: () => ({ getPropertyValue: n => n === '--a1' ? '110,230,180' : '169,240,207' }),
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: n => frames.delete(n),
    ResizeObserver: class { observe() {} disconnect() {} },
    MutationObserver: class { constructor(fn) { mutations.push(fn); } observe() {} disconnect() {} },
    Path2D: class { constructor() { return new Proxy({}, { get: () => () => {} }); } },
  };
  const previous = new Map(Object.keys(globals).map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  for (const [k, v] of Object.entries(globals)) Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  return {
    counts, canvases, frames, doc,
    setViewer(open) { viewer.classList.contains = () => open; mutations.forEach(fn => fn([])); },
    emit(name, e = {}) { for (const fn of listeners.get(name) || []) fn(e); },
    tick(dt = 1 / 60) {
      time += dt * 1000;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(fn => fn(time));
    },
    resetCounts() { for (const k in counts) counts[k] = 0; },
    restore() {
      for (const [k, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, k, descriptor);
        else delete globalThis[k];
      }
    },
  };
}
