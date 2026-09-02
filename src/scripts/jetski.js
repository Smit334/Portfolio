// Jetski cursor — the atmosphere is water; the cursor is a personal
// watercraft riding it.
//
// Physics: spring-follow position, angular-inertia steering (turn-in with
// a little overshoot), banking from yaw rate × speed. The wake is built
// from a trail of stern samples so it bends with the path: a dense white
// wash ribbon off the transom, faint feathered Kelvin arms (19.47°), a
// rooster-tail plume with pseudo-3D height and a bright core streak at
// speed, bow spray when really moving, a drop shadow + underglow on the
// water. Nearby cards dip on a damped spring as the craft passes and as
// its wake reaches them (independent CSS `translate` channel).
//
// Water (wake) renders UNDER the page glass; the craft rides above
// everything as the cursor. Mouse-only; never runs under reduced motion.

const KELVIN = Math.tan(19.47 * Math.PI / 180);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const WHITE = '236,243,252';

export function startJetski({ reducedMotion, fine }) {
  if (reducedMotion || !fine) return null;

  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const mk = (z) => {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.className = 'jetski-layer';
    c.style.cssText = `position:fixed;inset:0;width:100%;height:100%;z-index:${z};pointer-events:none;`;
    document.body.appendChild(c);
    return c;
  };
  const water = mk(1);
  const craft = mk(40);
  const wx = water.getContext('2d');
  const cx = craft.getContext('2d');
  if (!wx || !cx) return null;

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

  const S = {
    mx: W / 2, my: H * 0.4, seen: false, overText: false,
    px: W / 2, py: H * 0.4, vx: 0, vy: 0, speed: 0,
    heading: -Math.PI / 2, yawRate: 0, bank: 0, plane: 0,
    t: 0, idleTimer: 1.5,
    down: false, sq: 1, sqv: 0, pulses: [],
    trail: [], rings: [], spray: [], bow: [],
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    setPointer(e.clientX, e.clientY);
  }, { passive: true });
  // click: press the craft into the water — three staggered ripples in
  // sync with the hull squashing, then a springy rebound on release
  const isMouse = (e) => !e.pointerType || e.pointerType === 'mouse';
  function press() {
    S.down = true;
    S.pulses.push(S.t, S.t + 0.09, S.t + 0.18);
  }
  function release() {
    if (!S.down) return;
    S.down = false;
    S.pulses.push(S.t + 0.02);
  }
  addEventListener('pointerdown', (e) => { if (isMouse(e)) press(); }, { passive: true });
  addEventListener('pointerup', (e) => { if (isMouse(e)) release(); }, { passive: true });
  addEventListener('pointercancel', release, { passive: true });
  addEventListener('blur', release);
  document.addEventListener('pointerover', (e) => {
    S.overText = !!(e.target.closest && e.target.closest('input, textarea, select'));
  });
  function setPointer(x, y) {
    S.mx = x; S.my = y;
    if (!S.seen) { S.px = x; S.py = y; S.seen = true; }
  }

  const targets = [...document.querySelectorAll('.card, .edu, .hero-photo .media, .about-photo .media, .vignette')]
    .map((el) => ({ el, y: 0, vy: 0, live: false }));

  const accent = { a1: '110,230,180', aL: '169,240,207', at: -1e9 };
  const readAccent = (now) => {
    if (now - accent.at < 400) return;
    const cs = getComputedStyle(document.documentElement);
    accent.a1 = cs.getPropertyValue('--a1').trim() || accent.a1;
    accent.aL = cs.getPropertyValue('--aL').trim() || accent.aL;
    accent.at = now;
  };

  // ================= physics =================
  function step(dt, now) {
    dt = clamp(dt, 0.001, 0.05);
    S.t += dt;
    readAccent(now);

    const k = 1 - Math.exp(-dt * 8.5);
    const nx = S.px + (S.mx - S.px) * k;
    const ny = S.py + (S.my - S.py) * k;
    S.vx = (nx - S.px) / dt; S.vy = (ny - S.py) / dt;
    S.px = nx; S.py = ny;
    S.speed = Math.hypot(S.vx, S.vy);

    if (S.speed > 25) {
      const target = Math.atan2(S.vy, S.vx);
      let d = target - S.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const stiffness = 55 + Math.min(60, S.speed * 0.05);
      S.yawRate += (d * stiffness - S.yawRate * 11) * dt;
    } else {
      S.yawRate += (-S.yawRate * 6) * dt;
    }
    S.yawRate = clamp(S.yawRate, -9, 9);
    S.heading += S.yawRate * dt;
    const bankTarget = clamp(S.yawRate * (0.09 + S.speed / 4000), -0.9, 0.9);
    S.bank = lerp(S.bank, bankTarget, 1 - Math.exp(-dt * 7));
    // planing: bow lifts with speed
    S.plane = lerp(S.plane, clamp((S.speed - 200) / 900, 0, 1), 1 - Math.exp(-dt * 4));
    // press pulse: underdamped spring so the release bounces back past 1
    const sqTarget = S.down ? 0.84 : 1;
    S.sqv += ((sqTarget - S.sq) * 420 - S.sqv * 13) * dt;
    S.sq += S.sqv * dt;
    for (let i = S.pulses.length - 1; i >= 0; i--) {
      if (S.t >= S.pulses[i]) {
        S.rings.push({ x: S.px, y: S.py, r: 9, a: 0.5, click: true });
        S.pulses.splice(i, 1);
      }
    }

    const dx = Math.cos(S.heading), dy = Math.sin(S.heading);
    const sternX = S.px - dx * 17, sternY = S.py - dy * 17;
    const bowX = S.px + dx * 16, bowY = S.py + dy * 16;

    if (S.seen) {
      S.trail.push({ x: sternX, y: sternY, hd: S.heading, spd: S.speed, t: now, j: Math.random() - 0.5, k: 0.7 + Math.random() * 0.6 });
      if (S.trail.length > 150) S.trail.shift();
    }

    // rooster tail plume
    if (S.seen && S.speed > 240) {
      const n = clamp(Math.round((S.speed - 240) / 140), 1, 7);
      for (let i = 0; i < n; i++) {
        const back = S.speed * (0.18 + Math.random() * 0.3);
        const side = (Math.random() - 0.5) * (26 + S.speed * 0.045);
        S.spray.push({
          x: sternX + (Math.random() - 0.5) * 3, y: sternY + (Math.random() - 0.5) * 3,
          vx: -dx * back + -dy * side, vy: -dy * back + dx * side,
          z: 2, vz: 120 + Math.random() * 220 + S.speed * 0.1,
          life: 0, ttl: 0.75 + Math.random() * 0.45,
        });
      }
      if (S.spray.length > 260) S.spray.splice(0, S.spray.length - 260);
    }
    // bow spray
    if (S.seen && S.speed > 600 && Math.random() < 0.8) {
      const s = Math.random() < 0.5 ? 1 : -1;
      S.bow.push({
        x: bowX - dx * 4 + -dy * s * 6, y: bowY - dy * 4 + dx * s * 6,
        vx: dx * S.speed * 0.12 + -dy * s * (90 + Math.random() * 90),
        vy: dy * S.speed * 0.12 + dx * s * (90 + Math.random() * 90),
        life: 0, ttl: 0.3 + Math.random() * 0.2,
      });
      if (S.bow.length > 80) S.bow.shift();
    }
    // idle ripples
    S.idleTimer -= dt;
    if (S.seen && S.speed < 40 && S.idleTimer <= 0) {
      S.rings.push({ x: S.px, y: S.py + 4, r: 8, a: 0.14 });
      S.idleTimer = 2.8 + Math.random();
    }

    for (let i = S.spray.length - 1; i >= 0; i--) {
      const p = S.spray[i];
      p.life += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.8); p.vy *= Math.exp(-dt * 1.8);
      p.vz -= 560 * dt; p.z += p.vz * dt;
      if (p.z < 0 || p.life > p.ttl) {
        if (p.z < 0 && S.rings.length < 24 && Math.random() < 0.1)
          S.rings.push({ x: p.x, y: p.y, r: 1.5, a: 0.07, splash: true });
        S.spray.splice(i, 1);
      }
    }
    for (let i = S.bow.length - 1; i >= 0; i--) {
      const p = S.bow[i];
      p.life += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 3); p.vy *= Math.exp(-dt * 3);
      if (p.life > p.ttl) S.bow.splice(i, 1);
    }
    for (let i = S.rings.length - 1; i >= 0; i--) {
      const r = S.rings[i];
      if (r.click) { r.r += 110 * dt; r.a *= Math.exp(-dt * 2.6); }
      else if (r.splash) { r.r += 26 * dt; r.a *= Math.exp(-dt * 3.2); }
      else { r.r += 30 * dt; r.a *= Math.exp(-dt * 2.0); }
      if (r.a < 0.01 || r.r > (r.click ? 120 : r.splash ? 16 : 44)) S.rings.splice(i, 1);
    }
    while (S.trail.length && now - S.trail[0].t > 1600) S.trail.shift();

    // floating cards: craft proximity + wake arrival
    for (const tg of targets) {
      const r = tg.el.getBoundingClientRect();
      let f = 0;
      if (S.seen && r.bottom > -60 && r.top < H + 60) {
        const dist = (x, y) => Math.hypot(x - clamp(x, r.left, r.right), y - clamp(y, r.top, r.bottom));
        if (S.speed > 120) {
          const d = dist(S.px, S.py);
          if (d < 150) f += (1 - d / 150) * clamp(S.speed / 1200, 0, 1) * 360;
        }
        for (let i = S.trail.length - 4; i >= 0 && f < 420; i -= 4) {
          const s = S.trail[i];
          const age = (now - s.t) / 1000;
          if (age < 0.15) continue;
          if (age > 1.1) break;
          if (s.spd < 250) continue;
          const d = dist(s.x, s.y);
          const reach = 30 + age * s.spd * KELVIN * 0.25;
          if (d < reach) f += (1 - d / reach) * (1 - age / 1.1) * clamp(s.spd / 1400, 0, 1) * 150;
        }
        f = Math.min(f, 420);
      }
      tg.vy += (-90 * tg.y - 9 * tg.vy + f) * dt;
      tg.y += tg.vy * dt;
    }
    for (const tg of targets) {
      const active = Math.abs(tg.y) > 0.03 || Math.abs(tg.vy) > 0.03;
      if (active || tg.live) tg.el.style.setProperty('--by', tg.y.toFixed(2) + 'px');
      tg.live = active;
    }
  }

  // ================= rendering =================
  function softDot(ctx, x, y, r, rgb, a, mid = 0.45) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`);
    g.addColorStop(mid, `rgba(${rgb},${(a * 0.45).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function drawWater(now) {
    wx.clearRect(0, 0, W, H);
    if (!S.seen) return;
    const dx = Math.cos(S.heading), dy = Math.sin(S.heading);
    const px = -dy, py = dx; // perpendicular

    // drop shadow: offset back and to the side of the lean; deeper when planing
    wx.globalCompositeOperation = 'source-over';
    wx.save();
    wx.translate(S.px - dx * (2 + S.plane * 4) + px * (S.bank * 6 + 3), S.py + 4 + S.plane * 2);
    wx.rotate(S.heading + Math.PI / 2);
    wx.scale(S.sq, S.sq);
    wx.filter = 'blur(3.5px)';
    wx.fillStyle = `rgba(2,3,8,${(0.38 + S.plane * 0.12).toFixed(2)})`;
    wx.beginPath(); wx.ellipse(0, 2, 8.5, 18, 0, 0, Math.PI * 2); wx.fill();
    wx.restore();

    wx.globalCompositeOperation = 'lighter';
    // underglow brightens as the hull is pressed into the water
    if (!S.overText) softDot(wx, S.px, S.py, 44 + (1 - S.sq) * 60, accent.a1, 0.13 + (1 - S.sq) * 0.9, 0.4);

    const tr = S.trail;
    const sternX = S.px - dx * 17, sternY = S.py - dy * 17;

    // ---- core jet streak (bright, tapered, right off the transom) ----
    if (S.speed > 220) {
      const len = clamp((S.speed - 220) * 0.09, 6, 70);
      const a = clamp((S.speed - 220) / 900, 0, 0.75);
      const g = wx.createLinearGradient(sternX, sternY, sternX - dx * len, sternY - dy * len);
      g.addColorStop(0, `rgba(${WHITE},${a.toFixed(3)})`);
      g.addColorStop(0.35, `rgba(${accent.aL},${(a * 0.55).toFixed(3)})`);
      g.addColorStop(1, `rgba(${accent.aL},0)`);
      wx.strokeStyle = g;
      wx.lineCap = 'round';
      wx.lineWidth = 5 + S.plane * 3;
      wx.beginPath(); wx.moveTo(sternX, sternY); wx.lineTo(sternX - dx * len, sternY - dy * len); wx.stroke();
    }

    // ---- rooster tail body: a tapered plume straight off the transom ----
    if (S.speed > 260) {
      const len = clamp((S.speed - 260) * 0.12, 10, 120);
      const a = clamp((S.speed - 260) / 800, 0, 0.5);
      const ex = sternX - dx * len, ey = sternY - dy * len;
      const g = wx.createLinearGradient(sternX, sternY, ex, ey);
      g.addColorStop(0, `rgba(${WHITE},${a.toFixed(3)})`);
      g.addColorStop(0.5, `rgba(${WHITE},${(a * 0.5).toFixed(3)})`);
      g.addColorStop(1, `rgba(${WHITE},0)`);
      wx.fillStyle = g;
      wx.beginPath();
      wx.moveTo(sternX + px * 3, sternY + py * 3);
      wx.lineTo(ex + px * (6 + len * 0.16), ey + py * (6 + len * 0.16));
      wx.lineTo(ex - px * (6 + len * 0.16), ey - py * (6 + len * 0.16));
      wx.lineTo(sternX - px * 3, sternY - py * 3);
      wx.closePath();
      wx.filter = 'blur(2px)';
      wx.fill();
      wx.filter = 'none';
    }

    // ---- wash ribbon: the recent trail as ONE polyline per layer, faded
    //      along its length with a gradient (no per-segment seams) ----
    const pts = [];
    for (let i = tr.length - 1; i >= 0; i--) {
      const s = tr[i];
      const age = (now - s.t) / 1000;
      if (age > 1.05 || s.spd < 90) break;
      const spx = -Math.sin(s.hd), spy = Math.cos(s.hd);
      pts.push({ x: s.x + spx * s.j * age * 12, y: s.y + spy * s.j * age * 12, sp: clamp((s.spd - 90) / 700, 0, 1) });
    }
    if (pts.length > 2) {
      const head = pts[0], tail = pts[pts.length - 1];
      const spHead = head.sp;
      const path = new Path2D();
      path.moveTo(sternX, sternY);
      for (const p of pts) path.lineTo(p.x, p.y);
      const layer = (width, a0, a1, stop) => {
        const g = wx.createLinearGradient(sternX, sternY, tail.x, tail.y);
        g.addColorStop(0, `rgba(${WHITE},${a0.toFixed(3)})`);
        g.addColorStop(stop, `rgba(${WHITE},${a1.toFixed(3)})`);
        g.addColorStop(1, `rgba(${WHITE},0)`);
        wx.strokeStyle = g;
        wx.lineWidth = width;
        wx.stroke(path);
      };
      wx.lineCap = 'round';
      wx.lineJoin = 'round';
      layer(26, 0.09 + spHead * 0.11, 0.045, 0.45); // wide soft wash
      layer(13, 0.14 + spHead * 0.18, 0.05, 0.35);  // mid wash
      layer(5, 0.30 + spHead * 0.40, 0.02, 0.22);   // bright core at the transom
    }

    // ---- Kelvin arms: feathered crests along the 19.47° edges ----
    let prevL = null, prevR = null, prevOk = false;
    for (let i = 0; i < tr.length; i++) {
      const s = tr[i];
      const age = (now - s.t) / 1000;
      const ok = s.spd > 120 && age < 1.3;
      if (!ok) { prevOk = false; continue; }
      const spx = -Math.sin(s.hd), spy = Math.cos(s.hd);
      const sp = clamp((s.spd - 120) / 700, 0, 1);
      const spread = 7 + Math.min(58, age * s.spd * KELVIN * 0.22);
      const L = { x: s.x + spx * spread, y: s.y + spy * spread };
      const R = { x: s.x - spx * spread, y: s.y - spy * spread };
      if (prevOk && age > 0.1 && (i % 2) === 0) {
        const fade = Math.pow(1 - age / 1.3, 1.6) * sp * 0.42;
        wx.strokeStyle = `rgba(${WHITE},${fade.toFixed(3)})`;
        wx.lineWidth = 1;
        wx.lineCap = 'round';
        // short crest ticks angled back along each arm
        for (const [a, b, sgn] of [[prevL, L, 1], [prevR, R, -1]]) {
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const ax = b.x - a.x, ay = b.y - a.y;
          const len = Math.hypot(ax, ay) || 1;
          const ux = ax / len, uy = ay / len;
          const tick = 3 + age * 5;
          wx.beginPath();
          wx.moveTo(mx - ux * tick * 0.5 + spx * sgn * tick * 0.35, my - uy * tick * 0.5 + spy * sgn * tick * 0.35);
          wx.lineTo(mx + ux * tick * 0.5 - spx * sgn * tick * 0.35, my + uy * tick * 0.5 - spy * sgn * tick * 0.35);
          wx.stroke();
        }
      }
      prevL = L; prevR = R; prevOk = true;
    }

    // ---- rooster tail plume ----
    for (const p of S.spray) {
      const h = clamp(p.z / 80, 0, 1.5);
      const lifeF = 1 - p.life / p.ttl;
      const a = clamp(lifeF * (0.35 + 0.65 * Math.min(1, h)), 0, 1);
      const r = 2 + h * 2.6;
      softDot(wx, p.x, p.y, r * 2.4, WHITE, a, 0.3);
    }
    for (const p of S.bow) {
      const a = (1 - p.life / p.ttl) * 0.75;
      wx.fillStyle = `rgba(${WHITE},${a.toFixed(3)})`;
      wx.beginPath(); wx.arc(p.x, p.y, 1.3, 0, Math.PI * 2); wx.fill();
    }
    for (const r of S.rings) {
      wx.strokeStyle = r.click
        ? `rgba(${WHITE},${(r.a * 0.8).toFixed(3)})`
        : `rgba(${accent.aL},${(r.a * 0.7).toFixed(3)})`;
      wx.lineWidth = r.click ? 1.5 : 1.1;
      wx.beginPath(); wx.arc(r.x, r.y, r.r, 0, Math.PI * 2); wx.stroke();
      if (r.click) {
        wx.strokeStyle = `rgba(${accent.aL},${(r.a * 0.35).toFixed(3)})`;
        wx.lineWidth = 5;
        wx.stroke();
      }
    }
  }

  function drawCraft() {
    cx.clearRect(0, 0, W, H);
    if (!S.seen || S.overText) return;
    const idle = clamp(1 - S.speed / 120, 0, 1);
    const bobY = Math.sin(S.t * 2.1) * 1.2 * idle;
    const wobble = Math.sin(S.t * 1.3) * 0.03 * idle;

    cx.save();
    cx.translate(S.px, S.py + bobY);
    cx.rotate(S.heading + Math.PI / 2 + wobble);
    const sc = (1 + S.plane * 0.05) * S.sq;
    cx.scale(sc, sc);
    // banking: foreshorten across the beam and tilt
    cx.transform(1 - Math.abs(S.bank) * 0.24, 0, S.bank * 0.16, 1, 0, 0);

    // tight rim light, not a halo
    softDot(cx, 0, 0, 22, accent.a1, 0.12, 0.5);

    // hull silhouette: V bow, full shoulders, squared transom
    // rounded nose (not a rocket), full shoulders, broad squared transom
    const hull = new Path2D();
    hull.moveTo(0, -18);
    hull.bezierCurveTo(3.4, -18, 7.6, -11, 8.4, -1);
    hull.bezierCurveTo(8.8, 5, 8.4, 11.5, 7.6, 15);
    hull.quadraticCurveTo(7.3, 17, 5.4, 17);
    hull.lineTo(-5.4, 17);
    hull.quadraticCurveTo(-7.3, 17, -7.6, 15);
    hull.bezierCurveTo(-8.4, 11.5, -8.8, 5, -8.4, -1);
    hull.bezierCurveTo(-7.6, -11, -3.4, -18, 0, -18);
    const hg = cx.createLinearGradient(-8, 0, 8, 0);
    hg.addColorStop(0, 'rgba(248,250,255,1)');
    hg.addColorStop(0.45, 'rgba(230,234,247,1)');
    hg.addColorStop(1, 'rgba(172,181,210,1)');
    cx.fillStyle = hg;
    cx.fill(hull);
    const hv = cx.createLinearGradient(0, -18, 0, 17);
    hv.addColorStop(0, 'rgba(255,255,255,.35)');
    hv.addColorStop(0.35, 'rgba(255,255,255,0)');
    hv.addColorStop(1, `rgba(${accent.a1},.32)`);
    cx.fillStyle = hv;
    cx.fill(hull);
    cx.lineWidth = 0.9;
    cx.strokeStyle = 'rgba(255,255,255,.7)';
    cx.stroke(hull);

    // hood: V crease from the bow, and a soft hood panel
    cx.strokeStyle = 'rgba(120,130,170,.55)';
    cx.lineWidth = 0.8;
    cx.beginPath(); cx.moveTo(0, -16.5); cx.lineTo(-4.6, -6.5); cx.moveTo(0, -16.5); cx.lineTo(4.6, -6.5); cx.stroke();
    cx.strokeStyle = 'rgba(255,255,255,.75)';
    cx.beginPath(); cx.moveTo(0, -16); cx.lineTo(0, -8); cx.stroke();

    // accent bumper stripe along each side
    cx.strokeStyle = `rgba(${accent.a1},.75)`;
    cx.lineWidth = 1.1;
    cx.beginPath(); cx.moveTo(-7.6, -2); cx.lineTo(-6.9, 13); cx.moveTo(7.6, -2); cx.lineTo(6.9, 13); cx.stroke();

    // footwells
    cx.fillStyle = 'rgba(14,16,28,.6)';
    for (const sgn of [-1, 1]) {
      cx.beginPath(); cx.roundRect(sgn * 4.4 - 1.2, 2, 2.4, 12.5, 1.1); cx.fill();
    }
    // seat
    cx.fillStyle = 'rgba(12,14,24,.92)';
    cx.beginPath(); cx.roundRect(-2.8, -2, 5.6, 17, 2.6); cx.fill();
    cx.fillStyle = 'rgba(60,64,90,.5)';
    cx.beginPath(); cx.roundRect(-1.6, 7, 3.2, 8, 1.4); cx.fill();

    // handlebars with grips
    cx.strokeStyle = 'rgba(18,20,34,.9)';
    cx.lineWidth = 1.5;
    cx.beginPath(); cx.moveTo(-7, -7); cx.quadraticCurveTo(0, -9.6, 7, -7); cx.stroke();
    cx.fillStyle = 'rgba(40,44,66,1)';
    cx.beginPath(); cx.arc(-7, -7, 1.2, 0, Math.PI * 2); cx.arc(7, -7, 1.2, 0, Math.PI * 2); cx.fill();

    // rider: arms to the grips, shoulders, helmet
    cx.strokeStyle = 'rgba(24,26,44,.95)';
    cx.lineWidth = 1.7;
    cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(-4, 3); cx.lineTo(-6.6, -6.2); cx.moveTo(4, 3); cx.lineTo(6.6, -6.2); cx.stroke();
    cx.fillStyle = 'rgba(22,24,42,1)';
    cx.beginPath(); cx.ellipse(0, 4.2, 5.4, 3, 0, 0, Math.PI * 2); cx.fill();
    const helm = cx.createRadialGradient(-1, -0.3, 0.3, 0, 1, 3.6);
    helm.addColorStop(0, 'rgba(255,255,255,1)');
    helm.addColorStop(0.5, 'rgba(214,220,240,1)');
    helm.addColorStop(1, 'rgba(110,118,152,1)');
    cx.fillStyle = helm;
    cx.beginPath(); cx.arc(0, 1, 3.05, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = 'rgba(30,34,54,.6)';
    cx.lineWidth = 0.7;
    cx.stroke();

    // pump nozzle + jet glow
    cx.fillStyle = 'rgba(30,34,54,.9)';
    cx.beginPath(); cx.roundRect(-2.2, 16, 4.4, 2.2, 1); cx.fill();
    if (S.speed > 220) {
      const ja = clamp((S.speed - 220) / 1000, 0, 0.6);
      softDot(cx, 0, 19, 9, accent.aL, ja, 0.4);
    }
    cx.restore();
  }

  // ================= loop =================
  let rafId = null, last = null;
  const loop = (now) => {
    const dt = last === null ? 1 / 60 : (now - last) / 1000;
    last = now;
    step(dt, now);
    drawWater(now);
    drawCraft();
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

  const api = { S, step, drawWater, drawCraft, setPointer, press, release, water, craft, get size() { return { W, H }; } };
  window.__silkJetski = api;
  return api;
}
