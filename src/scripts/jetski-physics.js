// Cursor coordinates are input, not a spring target: the boat must never
// make the actual click location ambiguous. Momentum belongs to heading/water.
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const TAU = Math.PI * 2;
const SPACING = 10;
const WAKE_LIFE = 1.45;

function advanceSpray(p, dt) {
  p.age += dt;
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.z += p.vz * dt - 130 * dt * dt;
  p.vz -= 260 * dt;
}

export function createCraftState() {
  return {
    mx: 0, my: 0, px: 0, py: 0, seen: false, oriented: false, overText: false,
    vx: 0, vy: 0, speed: 0, heading: -Math.PI / 2, targetHeading: -Math.PI / 2, yawRate: 0, bank: 0, plane: 0,
    t: 0, down: false, sq: 1, trail: [], spray: [], rings: [],
    distance: 0, serial: 0,
    inputAt: 0, inputPeriod: 0, inputSpeed: null, inputVx: 0, inputVy: 0, sinceInput: 0,
  };
}

export function pointCraft(s, x, y, timeStamp = s.t * 1000) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const at = Number.isFinite(timeStamp) ? timeStamp : s.t * 1000;
  const period = Math.max(0, (at - s.inputAt) / 1000);
  const dx = x - s.mx, dy = y - s.my;
  if (s.seen && Math.hypot(dx, dy) > 0.01) {
    // Pointer sampling and display refresh are separate clocks. Using only
    // rAF dt here doubles spray speed on a 120Hz screen with a 60Hz mouse.
    s.inputSpeed = period > 0 ? Math.hypot(dx, dy) / period : null;
    s.inputVx = period > 0 ? dx / period : 0;
    s.inputVy = period > 0 ? dy / period : 0;
    s.inputPeriod = period;
    s.sinceInput = 0;
    s.inputAt = at;
  }
  s.mx = x; s.my = y;
  if (!s.seen) {
    s.px = x; s.py = y; s.seen = true;
    s.vx = s.vy = s.speed = s.yawRate = 0;
    s.oriented = false;
    s.distance = 0;
    s.inputAt = at; s.inputSpeed = null; s.inputPeriod = 0;
    s.inputVx = s.inputVy = s.sinceInput = 0;
  }
}

export function pressCraft(s) {
  if (!s.seen || s.overText || s.down) return;
  s.down = true;
  s.rings.push({ x: s.mx, y: s.my, age: 0 });
  if (s.rings.length > 8) s.rings.shift();
}

export function advanceCraft(s, elapsed) {
  // Analytic damping keeps steering stable at 30–144Hz, including long frames.
  const dt = clamp(Number.isFinite(elapsed) ? elapsed : 0, 0, 0.1);
  if (!dt) return;
  s.t += dt;
  const ox = s.px, oy = s.py;
  const dx = s.mx - ox, dy = s.my - oy;
  const distance = Math.hypot(dx, dy);
  s.px = s.mx; s.py = s.my;
  const gain = 1 - Math.exp(-30 * dt);
  const rawSpeed = distance / dt;
  s.sinceInput += dt;
  const recentInput = s.sinceInput <= Math.max(0.025, Math.min(0.06, s.inputPeriod * 1.5));
  const inputSpeed = s.inputSpeed ?? rawSpeed;
  const limited = Math.min(1, 2400 / (inputSpeed || 1));
  const vx = s.inputSpeed === null ? dx / dt : recentInput ? s.inputVx : 0;
  const vy = s.inputSpeed === null ? dy / dt : recentInput ? s.inputVy : 0;
  s.vx += (vx * limited - s.vx) * gain;
  s.vy += (vy * limited - s.vy) * gain;
  s.speed = Math.hypot(s.vx, s.vy);

  if (distance > 0.15) {
    s.targetHeading = Math.atan2(dy, dx);
    if (!s.oriented) {
      s.heading = s.targetHeading; s.oriented = true;
    }
  }
  if (s.oriented) {
    const error = angleDelta(s.heading, s.targetHeading);
    const w = 32, decay = Math.exp(-w * dt);
    const impulse = s.yawRate + w * error;
    s.heading = s.targetHeading + (error + impulse * dt) * decay;
    s.yawRate = (s.yawRate - w * impulse * dt) * decay;
  }
  s.heading = ((s.heading + Math.PI) % TAU + TAU) % TAU - Math.PI;
  const bank = clamp(s.yawRate * Math.min(s.speed / 700, 1) * 0.022, -0.32, 0.32);
  s.bank += (bank - s.bank) * (1 - Math.exp(-18 * dt));
  s.plane += (clamp(s.speed / 1400, 0, 1) - s.plane) * (1 - Math.exp(-12 * dt));
  s.sq += ((s.down ? 0.94 : 1) - s.sq) * (1 - Math.exp(-35 * dt));

  // Existing water advances by the whole frame. Newborns below only advance
  // by their within-frame age, not that age plus another full frame.
  for (let i = s.spray.length - 1; i >= 0; i--) {
    const p = s.spray[i];
    advanceSpray(p, dt);
    if (p.age >= p.ttl || p.z < 0) s.spray.splice(i, 1);
  }

  // Sample by distance, not refresh rate. Each wave direction is frozen at
  // birth; turning never swivels the old wake around with the hull.
  if (s.seen && !s.overText && distance > 0.15 && distance < Math.max(240, dt * 4500)) {
    const ux = dx / distance, uy = dy / distance;
    const speed = Math.min(inputSpeed, 2200);
    let next = SPACING - s.distance;
    for (; next <= distance; next += SPACING) {
      const f = next / distance;
      const age = Math.max(dt, Math.min(s.inputPeriod, 0.1)) * (1 - f);
      const sample = {
        x: ox + dx * f - ux * 17, y: oy + dy * f - uy * 17,
        ux, uy, speed, born: s.t - age, id: s.serial++,
      };
      s.trail.push(sample);
      if (speed > 170 && sample.id % 2 === 0) {
        const j = Math.sin(sample.id * 2.39996);
        const particle = {
          x: sample.x, y: sample.y, z: 0,
          vx: -ux * speed * 0.08 - uy * j * 38,
          vy: -uy * speed * 0.08 + ux * j * 38,
          vz: 48 + (j + 1) * 14 + speed * 0.025,
          age: 0, ttl: 0.42 + (j + 1) * 0.08,
        };
        advanceSpray(particle, age);
        s.spray.push(particle);
      }
    }
    s.distance = (s.distance + distance) % SPACING;
  } else if (distance > 0.15 || s.overText) {
    s.distance = 0;
    s.trail.length = 0; // no stripe on tab re-entry / pointer warp
  }
  while (s.trail.length && s.t - s.trail[0].born > WAKE_LIFE) s.trail.shift();
  if (s.trail.length > 128) s.trail.splice(0, s.trail.length - 128);
  if (s.spray.length > 64) s.spray.splice(0, s.spray.length - 64);
  for (let i = s.rings.length - 1; i >= 0; i--) {
    s.rings[i].age += dt;
    if (s.rings[i].age > 0.85) s.rings.splice(i, 1);
  }
}

export function craftIsActive(s) {
  return s.seen && (s.trail.length > 0 || s.spray.length > 0 || s.rings.length > 0 ||
    s.speed > 0.5 || Math.abs(s.yawRate) > 0.01 || Math.abs(s.bank) > 0.001 || Math.abs(s.sq - (s.down ? 0.94 : 1)) > 0.001);
}
