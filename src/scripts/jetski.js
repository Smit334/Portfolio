// Jetski cursor — the atmosphere is water; the cursor is a small craft
// riding it. Spring-follow physics with heading + banking, stern foam
// forming a spreading wake, expanding ripple rings, spray at speed, and
// a gentle idle bob. Nearby cards dip on a damped spring as the wash
// passes (via the independent CSS `translate` channel, so it never
// fights the tilt/hover transforms).
//
// Water (wake) renders UNDER the page glass; the craft rides above
// everything as the cursor. Mouse-only; never runs under reduced motion.

export function startJetski({ reducedMotion, fine }) {
  if (reducedMotion || !fine) return;

  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const mk = (z) => {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.className = 'jetski-layer';
    c.style.cssText = `position:fixed;inset:0;width:100%;height:100%;z-index:${z};pointer-events:none;`;
    document.body.appendChild(c);
    return c;
  };
  const water = mk(1);   // wake + ripples — under .page (z2), over the veil
  const craft = mk(40);  // the craft — above everything, it IS the cursor
  const wx = water.getContext('2d');
  const cx = craft.getContext('2d');
  if (!wx || !cx) return;

  let W, H;
  const size = () => {
    W = innerWidth; H = innerHeight;
    for (const c of [water, craft]) {
      c.width = Math.round(W * DPR);
      c.height = Math.round(H * DPR);
      c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    }
  };
  size();
  addEventListener('resize', size);

  document.documentElement.classList.add('jetski');

  // ---- pointer ----
  let mx = W / 2, my = H * 0.4, seen = false, overText = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    if (!seen) { px = mx; py = my; seen = true; }
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    overText = !!(e.target.closest && e.target.closest('input, textarea, select'));
  });

  // ---- physics state ----
  let px = mx, py = my, vx = 0, vy = 0;
  let heading = -Math.PI / 2, bank = 0;
  let t = 0, last = null, ringTimer = 0, idleTimer = 1.5;
  const rings = [], foam = [], sprays = [];

  // ---- floating elements (dip on the wash) ----
  const targets = [...document.querySelectorAll('.card, .edu, .hero-photo .media, .about-photo .media, .vignette')]
    .map((el) => ({ el, y: 0, vy: 0, live: false }));

  // ---- live theme accent (cheap cached read) ----
  const accent = { a1: '110,230,180', aL: '169,240,207', at: -1e9 };
  const readAccent = (now) => {
    if (now - accent.at < 400) return;
    const cs = getComputedStyle(document.documentElement);
    accent.a1 = cs.getPropertyValue('--a1').trim() || accent.a1;
    accent.aL = cs.getPropertyValue('--aL').trim() || accent.aL;
    accent.at = now;
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function drawCraft(x, y, hd, bnk, speed) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(hd + Math.PI / 2); // hull drawn nose-up
    cx.scale(1 - Math.abs(bnk) * 0.16, 1);
    cx.rotate(bnk * 0.12);

    // soft accent glow around the craft
    const g = cx.createRadialGradient(0, 0, 0, 0, 0, 30);
    g.addColorStop(0, `rgba(${accent.a1},.26)`);
    g.addColorStop(1, `rgba(${accent.a1},0)`);
    cx.fillStyle = g;
    cx.fillRect(-30, -30, 60, 60);

    // hull
    cx.beginPath();
    cx.moveTo(0, -14);
    cx.bezierCurveTo(5.5, -9, 6.5, -2, 6, 10);
    cx.quadraticCurveTo(6, 13, 3.4, 13);
    cx.lineTo(-3.4, 13);
    cx.quadraticCurveTo(-6, 13, -6, 10);
    cx.bezierCurveTo(-6.5, -2, -5.5, -9, 0, -14);
    const hg = cx.createLinearGradient(0, -14, 0, 13);
    hg.addColorStop(0, 'rgba(240,242,250,.96)');
    hg.addColorStop(0.55, 'rgba(208,214,236,.92)');
    hg.addColorStop(1, `rgba(${accent.a1},.88)`);
    cx.fillStyle = hg;
    cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,.55)';
    cx.lineWidth = 0.75;
    cx.stroke();

    // seat + handlebar hints
    cx.fillStyle = 'rgba(10,12,20,.78)';
    cx.beginPath();
    cx.ellipse(0, 5.5, 2.9, 5.6, 0, 0, Math.PI * 2);
    cx.fill();
    cx.strokeStyle = 'rgba(10,12,20,.55)';
    cx.lineWidth = 1.1;
    cx.beginPath();
    cx.moveTo(-3.5, -4.2);
    cx.lineTo(3.5, -4.2);
    cx.stroke();

    // stern jet glow when moving
    if (speed > 250) {
      const ja = clamp((speed - 250) / 1200, 0, 0.5);
      const jg = cx.createRadialGradient(0, 14, 0, 0, 14, 9);
      jg.addColorStop(0, `rgba(${accent.aL},${ja})`);
      jg.addColorStop(1, `rgba(${accent.aL},0)`);
      cx.fillStyle = jg;
      cx.fillRect(-9, 6, 18, 18);
    }
    cx.restore();
  }

  let rafId = null;
  const loop = (now) => {
    const dt = last === null ? 1 / 60 : clamp((now - last) / 1000, 0.001, 0.05);
    last = now;
    t += dt;
    readAccent(now);

    // ---- craft physics ----
    const k = 1 - Math.exp(-dt * 9);
    const nx = px + (mx - px) * k;
    const ny = py + (my - py) * k;
    vx = (nx - px) / dt; vy = (ny - py) / dt;
    px = nx; py = ny;
    const speed = Math.hypot(vx, vy);

    if (speed > 30) {
      const target = Math.atan2(vy, vx);
      let d = target - heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      heading += d * (1 - Math.exp(-dt * 7));
      bank += (clamp(d * 1.2, -0.6, 0.6) - bank) * (1 - Math.exp(-dt * 6));
    } else {
      bank *= Math.exp(-dt * 3);
    }

    const sternX = px - Math.cos(heading) * 14;
    const sternY = py - Math.sin(heading) * 14;

    // ---- spawn wake ----
    if (seen && speed > 90) {
      foam.push({ x: sternX, y: sternY, r: 2.2 + speed * 0.003, a: 0.5, hd: heading });
      if (foam.length > 140) foam.shift();
    }
    ringTimer -= dt;
    if (seen && speed > 260 && ringTimer <= 0) {
      rings.push({ x: px, y: py, r: 6, a: 0.38 });
      ringTimer = 0.12;
    }
    if (seen && speed > 800) {
      for (let i = 0; i < 2; i++) {
        const sa = heading + Math.PI + (Math.random() - 0.5) * 1.1;
        const sv = 90 + Math.random() * 160;
        sprays.push({ x: sternX, y: sternY, vx: Math.cos(sa) * sv, vy: Math.sin(sa) * sv, a: 0.55 });
      }
      if (sprays.length > 90) sprays.splice(0, sprays.length - 90);
    }
    // idle: the craft floats — occasional small ring
    idleTimer -= dt;
    if (seen && speed < 40 && idleTimer <= 0) {
      rings.push({ x: px, y: py + 6, r: 4, a: 0.22 });
      idleTimer = 2.8;
    }

    // ---- water layer ----
    wx.clearRect(0, 0, W, H);
    wx.globalCompositeOperation = 'lighter';
    if (seen && !overText) {
      // light in the water under the craft
      const ug = wx.createRadialGradient(px, py, 0, px, py, 48);
      ug.addColorStop(0, `rgba(${accent.a1},.12)`);
      ug.addColorStop(1, `rgba(${accent.a1},0)`);
      wx.fillStyle = ug;
      wx.fillRect(px - 48, py - 48, 96, 96);
    }
    for (let i = foam.length - 1; i >= 0; i--) {
      const f = foam[i];
      f.r += 15 * dt;
      f.a *= Math.exp(-dt * 1.5);
      if (f.a < 0.012) { foam.splice(i, 1); continue; }
      wx.save();
      wx.translate(f.x, f.y);
      wx.rotate(f.hd);
      wx.fillStyle = `rgba(215,232,250,${f.a * 0.4})`;
      wx.beginPath();
      wx.ellipse(0, 0, f.r * 0.7, f.r * 1.8, 0, 0, Math.PI * 2);
      wx.fill();
      wx.restore();
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r += 62 * dt;
      r.a *= Math.exp(-dt * 1.15);
      if (r.a < 0.012) { rings.splice(i, 1); continue; }
      wx.strokeStyle = `rgba(${accent.aL},${r.a * 0.55})`;
      wx.lineWidth = 1.1;
      wx.beginPath();
      wx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      wx.stroke();
    }
    for (let i = sprays.length - 1; i >= 0; i--) {
      const s = sprays[i];
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.vx *= Math.exp(-dt * 2.4); s.vy *= Math.exp(-dt * 2.4);
      s.a *= Math.exp(-dt * 2.6);
      if (s.a < 0.02) { sprays.splice(i, 1); continue; }
      wx.fillStyle = `rgba(235,242,252,${s.a})`;
      wx.beginPath();
      wx.arc(s.x, s.y, 1.3, 0, Math.PI * 2);
      wx.fill();
    }

    // ---- floating cards: read rects, then write springs ----
    const dips = [];
    for (const tg of targets) {
      const r = tg.el.getBoundingClientRect();
      let f = 0;
      if (seen && r.bottom > -60 && r.top < H + 60 && speed > 120) {
        const cxp = clamp(px, r.left, r.right);
        const cyp = clamp(py, r.top, r.bottom);
        const dist = Math.hypot(px - cxp, py - cyp);
        if (dist < 150) f = (1 - dist / 150) * clamp(speed / 1200, 0, 1) * 380;
      }
      tg.vy += (-90 * tg.y - 9 * tg.vy + f) * dt;
      tg.y += tg.vy * dt;
      dips.push(tg);
    }
    for (const tg of dips) {
      const active = Math.abs(tg.y) > 0.03 || Math.abs(tg.vy) > 0.03;
      if (active || tg.live) tg.el.style.setProperty('--by', tg.y.toFixed(2) + 'px');
      tg.live = active;
    }

    // ---- craft layer ----
    cx.clearRect(0, 0, W, H);
    if (seen && !overText) {
      const idle = clamp(1 - speed / 120, 0, 1);
      drawCraft(px, py + Math.sin(t * 2.2) * 1.4 * idle, heading, bank, speed);
    }

    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      last = null;
    } else if (rafId === null) {
      rafId = requestAnimationFrame(loop);
    }
  });
}
