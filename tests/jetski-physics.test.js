import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceCraft, angleDelta, createCraftState, pointCraft, pressCraft } from '../src/scripts/jetski-physics.js';

test('a sharp turn finishes turning toward the last travel direction after stopping', () => {
  const s = createCraftState();
  pointCraft(s, 100, 100);
  pointCraft(s, 120, 100); advanceCraft(s, 1 / 60);
  pointCraft(s, 120, 120); advanceCraft(s, 1 / 60);
  for (let i = 0; i < 30; i++) advanceCraft(s, 1 / 60);
  assert.ok(Math.abs(angleDelta(s.heading, Math.PI / 2)) < 0.03);
});

test('U-turn steering is consistent at 30, 60 and 120Hz and does not overshoot', () => {
  const headings = [];
  for (const hz of [30, 60, 120]) {
    const s = createCraftState();
    pointCraft(s, 400, 200);
    pointCraft(s, 410, 200); advanceCraft(s, 1 / hz);
    for (let i = 1; i <= hz / 5; i++) {
      pointCraft(s, 410 - i * 600 / hz, 200);
      advanceCraft(s, 1 / hz);
    }
    headings.push(Math.abs(angleDelta(s.heading, Math.PI)));
    assert.ok(headings.at(-1) < 0.06);
    assert.ok(Math.abs(s.bank) <= 0.32);
  }
  assert.ok(Math.max(...headings) - Math.min(...headings) < 0.01);
});

test('a frame stall never produces NaNs, unbounded water or a giant wake bridge', () => {
  const s = createCraftState();
  pointCraft(s, 100, 100);
  for (let i = 1; i < 2000; i++) {
    pointCraft(s, 100 + i * 12, 100 + Math.sin(i / 20) * 70);
    advanceCraft(s, i % 31 === 0 ? 0.6 : 1 / 120);
    assert.ok(s.trail.length <= 128);
    assert.ok(s.spray.length <= 64);
    for (const value of [s.px, s.py, s.heading, s.speed, s.bank, s.sq]) assert.ok(Number.isFinite(value));
  }
  pointCraft(s, 50000, 50000); advanceCraft(s, 1 / 60);
  assert.equal(s.trail.length, 0);
});

test('click rings originate at the actual pointer and are bounded and expire', () => {
  const s = createCraftState(); pointCraft(s, 100, 100);
  pointCraft(s, 400, 450);
  pressCraft(s);
  assert.deepEqual({ x: s.rings[0].x, y: s.rings[0].y }, { x: 400, y: 450 });
  for (let i = 0; i < 40; i++) { s.down = false; pressCraft(s); }
  assert.ok(s.rings.length <= 8);
  for (let i = 0; i < 120; i++) advanceCraft(s, 1 / 60);
  assert.equal(s.rings.length, 0);
});

test('60Hz pointer input creates the same wake intensity on 60Hz and 120Hz displays', () => {
  const states = [];
  for (const hz of [60, 120]) {
    const s = createCraftState();
    pointCraft(s, 100, 100, 0);
    for (let i = 1; i <= hz; i++) {
      if (i % (hz / 60) === 0) pointCraft(s, 100 + i * 120 / hz, 100, i * 1000 / hz);
      advanceCraft(s, 1 / hz);
    }
    states.push(s);
    assert.equal(s.spray.length, 0, 'a slow 120px/s stroke must not emit high-speed spray');
    assert.ok(s.trail.every(p => Math.abs(p.speed - 120) < 0.1));
  }
  assert.equal(states[0].trail.length, states[1].trail.length);
});

test('newborn spray only advances for time since its birth', () => {
  const s = createCraftState();
  pointCraft(s, 0, 100, 0);
  pointCraft(s, 20, 100, 1000 / 60); advanceCraft(s, 1 / 60);
  // First sample born halfway through the frame; not 1.5 frames old.
  assert.ok(Math.abs(s.spray[0].age - 1 / 120) < 0.0001);
});
