import { clamp } from './jetski-physics.js';

function surface(size, dpr = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

// All gradients and hull geometry are drawn once into small textures.
export function createBoatSprites(accent, dpr) {
  const { canvas: hull, ctx: c } = surface(64, dpr);
  c.translate(32, 32);
  const shape = new Path2D('M0 -22 C4 -20 9 -11 9.5 -2 L9 12 Q9 17 6 18 L-6 18 Q-9 17 -9 12 L-9.5 -2 C-9 -11 -4 -20 0 -22Z');
  const shell = c.createLinearGradient(-10, 0, 10, 0);
  shell.addColorStop(0, '#8dabb5'); shell.addColorStop(0.24, '#f0f6f5');
  shell.addColorStop(0.54, '#fffefd'); shell.addColorStop(0.8, '#c3d2d6'); shell.addColorStop(1, '#647e8b');
  c.fillStyle = shell; c.fill(shape);
  c.strokeStyle = 'rgba(242,251,255,.85)'; c.lineWidth = 0.65; c.stroke(shape);
  // Recessed carbon deck, pearl shoulders, narrow theme-colored waterline.
  c.fillStyle = '#142b35';
  c.fill(new Path2D('M0 -15 Q5 -12 6 -3 L6 13 Q0 17 -6 13 L-6 -3 Q-5 -12 0 -15Z'));
  c.strokeStyle = `rgb(${accent})`; c.lineWidth = 1.35;
  c.beginPath(); c.moveTo(-7, -6); c.quadraticCurveTo(-8, 4, -7, 13);
  c.moveTo(7, -6); c.quadraticCurveTo(8, 4, 7, 13); c.stroke();
  c.fillStyle = '#c0d5dc'; c.fill(new Path2D('M0 -16 L4 -10 Q0 -6 -4 -10Z'));
  c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 0.65;
  c.beginPath(); c.moveTo(0, -20); c.lineTo(0, -16.5); c.stroke();
  // Saddle, grip pads and brushed-metal stern platform.
  c.fillStyle = '#07141b'; c.beginPath(); c.roundRect(-3, -1, 6, 16, 2.8); c.fill();
  c.fillStyle = '#395463'; c.beginPath(); c.roundRect(-1.8, 7, 3.6, 6, 1.4); c.fill();
  c.fillStyle = '#66818b'; c.fillRect(-5, 15, 10, 1.1);
  c.fillStyle = '#0b1c26'; c.fillRect(-2.2, 17, 4.4, 2);
  // Rider silhouette deliberately readable at cursor scale.
  c.lineCap = 'round'; c.strokeStyle = '#0b1b23'; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(-6, -5); c.lineTo(-3.5, 3); c.moveTo(6, -5); c.lineTo(3.5, 3); c.stroke();
  c.strokeStyle = '#bad1d8'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-6, -5); c.quadraticCurveTo(0, -8, 6, -5); c.stroke();
  c.fillStyle = '#243e4b'; c.beginPath(); c.ellipse(0, 4, 4.4, 5.5, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = `rgba(${accent},.75)`; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(-3, 3); c.quadraticCurveTo(0, 5, 3, 3); c.stroke();
  const helmet = c.createRadialGradient(-1, -1, 0, 0, 0, 3.7);
  helmet.addColorStop(0, '#ffffff'); helmet.addColorStop(0.6, '#dbe8e9'); helmet.addColorStop(1, '#6f8995');
  c.fillStyle = helmet; c.beginPath(); c.ellipse(0, -0.8, 3.2, 3.7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#142d3c'; c.beginPath(); c.ellipse(0, -2.3, 2.5, 1.1, 0, 0, Math.PI * 2); c.fill();

  const { canvas: foam, ctx: f } = surface(32);
  const mist = f.createRadialGradient(16, 16, 0, 16, 16, 16);
  mist.addColorStop(0, 'rgba(237,249,252,.85)');
  mist.addColorStop(0.28, 'rgba(221,243,246,.5)'); mist.addColorStop(1, 'rgba(221,243,246,0)');
  f.fillStyle = mist; f.fillRect(0, 0, 32, 32);
  return { hull, foam, accent };
}

export function drawBoat(c, s, sprites) {
  c.save(); c.translate(40, 40);
  c.rotate(s.heading + Math.PI / 2);
  // A small contact shadow instead of a full-screen blur pass.
  c.fillStyle = 'rgba(1,10,17,.28)'; c.beginPath(); c.ellipse(2, 3, 10, 21, 0, 0, Math.PI * 2); c.fill();
  c.transform(1 - Math.abs(s.bank) * 0.22, 0, s.bank * 0.18, 1 + s.plane * 0.025, 0, 0);
  c.scale(s.sq, s.sq);
  c.drawImage(sprites.hull, -32, -32, 64, 64);
  c.restore();
}

export function drawWake(c, s, sprites) {
  if (!s.seen) return;
  c.save();
  c.globalCompositeOperation = 'source-over';
  c.lineCap = 'round'; c.lineJoin = 'round';
  const trail = s.trail;
  // Local opacity per segment: no global gradient that flips or cuts out when
  // the wake curls back on itself. Old wash remains after the boat stops.
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1], b = trail[i];
    if (b.id !== a.id + 1 || Math.hypot(a.x - b.x, a.y - b.y) > 55) continue;
    const age = s.t - b.born;
    const fade = Math.pow(Math.max(0, 1 - age / 1.45), 2);
    const strength = clamp(b.speed / 750, 0, 1);
    c.strokeStyle = `rgba(216,239,244,${fade * strength * 0.1})`;
    c.lineWidth = 6 + age * 13;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.strokeStyle = `rgba(242,250,252,${fade * strength * 0.24})`;
    c.lineWidth = Math.max(1, 3 - age); c.stroke();
    // Paired crests expand in the normal direction of the path at emission.
    for (const side of [-1, 1]) {
      const oldAge = s.t - a.born;
      const spreadA = 6 + oldAge * (23 + Math.min(a.speed, 900) * 0.018);
      const spreadB = 6 + age * (23 + Math.min(b.speed, 900) * 0.018);
      c.strokeStyle = `rgba(215,240,245,${fade * strength * 0.25})`;
      c.lineWidth = 0.8 + age * 0.6;
      c.beginPath();
      c.moveTo(a.x - a.uy * side * spreadA, a.y + a.ux * side * spreadA);
      c.lineTo(b.x - b.uy * side * spreadB, b.y + b.ux * side * spreadB); c.stroke();
    }
  }
  for (const p of s.spray) {
    const fade = Math.max(0, 1 - p.age / p.ttl);
    const r = 2.5 + p.age * 5;
    c.globalAlpha = fade * 0.55;
    c.drawImage(sprites.foam, p.x - r, p.y - p.z * 0.3 - r, r * 2, r * 2);
  }
  c.globalAlpha = 1;
  for (const r of s.rings) {
    const fade = Math.pow(1 - r.age / 0.85, 2);
    c.strokeStyle = `rgba(228,245,248,${fade * 0.4})`; c.lineWidth = 1;
    c.beginPath(); c.ellipse(r.x, r.y, 8 + r.age * 75, 6 + r.age * 58, 0, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
}
