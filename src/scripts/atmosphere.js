// Silk atmosphere — 4 radial blobs on a low-res canvas, CSS-blurred, composited
// 'lighter' over near-black. Journey mode: scroll blends Glacier → Nordlys,
// driving both the blob colors and the --a1/--a2 accent vars.

const GLACIER = {
  blobs: [[36, 86, 190], [28, 140, 185], [120, 150, 190], [52, 58, 150]],
  a1: '120,170,255',
  a2: '140,225,255',
};
const NORDLYS = {
  blobs: [[14, 140, 104], [18, 112, 146], [58, 76, 188], [10, 84, 66]],
  a1: '110,230,180',
  a2: '110,170,255',
};

// per blob: [cx, cy, ampX, ampY, wX, wY, phase, alpha, radius]
const GEO = [
  [.36, .30, .30, .22, .29, .23, 0.0, .50, .72],
  [.74, .44, .26, .26, .21, .26, 2.1, .44, .66],
  [.50, .88, .30, .18, .16, .19, 4.2, .26, .58],
  [.18, .70, .24, .24, .24, .31, 1.1, .28, .52],
];

export function startAtmosphere({ reducedMotion }) {
  // film grain (kills banding)
  const g = document.createElement('canvas');
  g.width = g.height = 144;
  const gc = g.getContext('2d');
  const im = gc.createImageData(144, 144);
  const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 16;
  }
  gc.putImageData(im, 0, 0);
  document.getElementById('grain').style.backgroundImage = `url(${g.toDataURL()})`;

  const cv = document.getElementById('silk');
  const cx = cv.getContext('2d');
  const root = document.documentElement;
  let cw, ch;

  function calc() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = .16 * Math.min(dpr, 1.4);
    return [
      Math.max(140, Math.round(cv.clientWidth * s)),
      Math.max(100, Math.round(cv.clientHeight * s)),
    ];
  }
  function size() {
    const c = calc();
    cw = cv.width = c[0];
    ch = cv.height = c[1];
  }

  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  function mixStr(a, b, f) {
    const pa = a.split(',').map(Number), pb = b.split(',').map(Number);
    return pa.map((v, i) => Math.round(v + (pb[i] - v) * f)).join(',');
  }
  function journeyFrac() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    return h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
  }

  let cur = GLACIER.blobs.map((c) => c.slice());
  let tgt = GLACIER.blobs.map((c) => c.slice());
  let lastJF = -1;

  function applyJourney() {
    const f = journeyFrac();
    tgt = GLACIER.blobs.map((c, j) => mix(c, NORDLYS.blobs[j], f));
    if (Math.abs(f - lastJF) > .02) {
      lastJF = f;
      root.style.setProperty('--a1', mixStr(GLACIER.a1, NORDLYS.a1, f));
      root.style.setProperty('--a2', mixStr(GLACIER.a2, NORDLYS.a2, f));
    }
  }

  function frame(t) {
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = '#07070c';
    cx.fillRect(0, 0, cw, ch);
    cx.globalCompositeOperation = 'lighter';
    const m = Math.max(cw, ch);
    for (let j = 0; j < GEO.length; j++) {
      const b = GEO[j], c = cur[j];
      const x = (b[0] + b[2] * Math.sin(t * b[4] + b[6])) * cw;
      const y = (b[1] + b[3] * Math.cos(t * b[5] + b[6] * 1.7)) * ch;
      const r = b[8] * m * (1 + .12 * Math.sin(t * .12 + b[6] * 2.3));
      const rgb = `${c[0] | 0},${c[1] | 0},${c[2] | 0}`;
      const gr = cx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${rgb},${b[7]})`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      cx.fillStyle = gr;
      cx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  function lerpColors(dt) {
    const k = 1 - Math.exp(-dt * 2.6);
    for (let j = 0; j < cur.length; j++)
      for (let i = 0; i < 3; i++)
        cur[j][i] += (tgt[j][i] - cur[j][i]) * k;
  }

  size();

  if (reducedMotion) {
    // static composed frame; scroll still shifts the palette (cheap, discrete)
    const journeyRM = () => {
      const f = journeyFrac();
      cur = GLACIER.blobs.map((c, j) => mix(c, NORDLYS.blobs[j], f));
      root.style.setProperty('--a1', mixStr(GLACIER.a1, NORDLYS.a1, f));
      root.style.setProperty('--a2', mixStr(GLACIER.a2, NORDLYS.a2, f));
      frame(47);
    };
    journeyRM();
    window.addEventListener('scroll', journeyRM, { passive: true });
    window.addEventListener('resize', () => { size(); frame(47); });
    window.addEventListener('load', () => {
      const c = calc();
      if (c[0] !== cv.width || c[1] !== cv.height) { size(); frame(47); }
    });
    return;
  }

  let lastT = null;
  const t0 = performance.now();
  let fN = 0;
  let rafId = null;

  const loop = (now) => {
    if ((fN++ & 31) === 0) {
      const c = calc();
      if (c[0] !== cv.width || c[1] !== cv.height) size();
    }
    const dt = lastT === null ? .016 : Math.min(.1, (now - lastT) / 1000);
    lastT = now;
    applyJourney();
    lerpColors(dt);
    frame((now - t0) / 1000 + 30);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  // pause when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      lastT = null;
    } else if (rafId === null) {
      rafId = requestAnimationFrame(loop);
    }
  });
}
