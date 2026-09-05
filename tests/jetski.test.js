import test from 'node:test';
import assert from 'node:assert/strict';
import { startJetski } from '../src/scripts/jetski.js';
import { cursorBrowser } from './helpers/cursor-browser.js';

function setup(t, options = {}) {
  const browser = cursorBrowser();
  t.after(() => browser.restore());
  const api = startJetski({ fine: true, reducedMotion: false, ...options });
  return { ...browser, api };
}

test('cursor stays within 4px of the actual click target during a fast sweep', t => {
  const { api } = setup(t);
  api.setPointer(100, 200);
  for (let i = 1; i <= 60; i++) {
    api.setPointer(100 + i * 1000 / 60, 200);
    api.step(1 / 60, i * 1000 / 60);
    assert.ok(Math.abs(api.S.px - api.S.mx) <= 4, `cursor lag: ${api.S.mx - api.S.px}px`);
  }
});

test('a stationary pointer does not emit new wake samples', t => {
  const { api } = setup(t);
  api.setPointer(400, 400);
  for (let i = 1; i <= 180; i++) api.step(1 / 60, i * 1000 / 60);
  assert.equal(api.S.trail.length, 0);
});

test('water emission is consistent across 30, 60, and 120Hz', t => {
  const env = cursorBrowser();
  t.after(() => env.restore());
  const counts = [];
  for (const hz of [30, 60, 120]) {
    const api = startJetski({ fine: true, reducedMotion: false });
    api.setPointer(100, 200);
    for (let i = 1; i <= hz; i++) {
      api.setPointer(100 + i * 900 / hz, 200);
      api.step(1 / hz, i * 1000 / hz);
    }
    counts.push(api.S.trail.length);
  }
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 3, `wake samples at each refresh rate: ${counts}`);
});

test('card geometry is cached while the document is stationary', t => {
  const { api, counts, resetCounts } = setup(t);
  api.setPointer(100, 100);
  api.step(1 / 60, 0);
  resetCounts();
  for (let i = 1; i <= 60; i++) {
    api.setPointer(100 + i * 4, 100);
    api.step(1 / 60, i * 1000 / 60);
  }
  assert.ok(counts.measure <= 30, `layout measurements in one second: ${counts.measure}`);
});

test('craft rendering uses a small surface, not a second full-screen canvas', t => {
  const { api } = setup(t);
  assert.ok(api.craft.width * api.craft.height <= 65536);
});

test('the moving renderer reuses cached gradients and sprites', t => {
  const { api, counts, resetCounts } = setup(t);
  api.setPointer(100, 300);
  for (let i = 1; i <= 60; i++) {
    api.setPointer(100 + i * 14, 300);
    api.step(1 / 60, i * 1000 / 60);
  }
  api.drawWater(1000);
  api.drawCraft();
  resetCounts();
  api.drawWater(1000);
  api.drawCraft();
  assert.ok(counts.gradient <= 2, `new gradients in a warm frame: ${counts.gradient}`);
});

test('boat stops scheduling frames when idle, and restarts on mouse movement', t => {
  const { emit, tick, frames } = setup(t);
  emit('pointermove', { pointerType: 'mouse', clientX: 400, clientY: 400 });
  for (let i = 0; i < 360; i++) tick();
  assert.equal(frames.size, 0);
  emit('pointermove', { pointerType: 'mouse', clientX: 450, clientY: 400 });
  assert.equal(frames.size, 1);
});

test('no cursor layers or animation loop on touch or reduced motion', t => {
  const { canvases, frames } = setup(t, { fine: false });
  assert.equal(startJetski({ fine: true, reducedMotion: true }), null);
  assert.equal(canvases.length, 0);
  assert.equal(frames.size, 0);
});

test('opening a photo without moving the mouse immediately restores native pan cursor', t => {
  const { api, setViewer, tick, doc } = setup(t);
  api.setPointer(500, 350); tick();
  assert.equal(doc.documentElement.classList.contains('jetski'), true);
  setViewer(true);
  assert.equal(doc.documentElement.classList.contains('jetski'), false);
  assert.equal(api.craft.style.visibility, 'hidden');
  setViewer(false); tick();
  assert.equal(api.craft.style.visibility, 'visible');
});

test('leaving the tab releases the native cursor, clears water and stops the loop', t => {
  const { api, emit, tick, frames, doc } = setup(t);
  api.setPointer(100, 100); tick(); api.setPointer(160, 120); tick();
  emit('blur');
  assert.equal(frames.size, 0);
  assert.equal(doc.documentElement.classList.contains('jetski'), false);
  assert.equal(api.craft.style.visibility, 'hidden');
  assert.equal(api.S.trail.length, 0);
  emit('pointermove', { pointerType: 'mouse', clientX: 50, clientY: 50 }); tick();
  assert.equal(api.S.px, 50);
  assert.equal(api.craft.style.visibility, 'visible');
});

test('unrelated touch events do not release or hide an active mouse cursor', t => {
  const { api, emit, tick, doc } = setup(t);
  emit('pointermove', { pointerType: 'mouse', clientX: 100, clientY: 100 });
  emit('pointerdown', { pointerType: 'mouse', clientX: 100, clientY: 100 }); tick();
  emit('pointerup', { pointerType: 'touch' });
  assert.equal(api.S.down, true);
  emit('pointerover', { pointerType: 'touch', target: { closest: () => true } });
  assert.equal(api.S.overText, false);
  emit('pointerout', { pointerType: 'touch', relatedTarget: null });
  emit('pointercancel', { pointerType: 'touch' });
  assert.equal(api.S.seen, true);
  assert.equal(doc.documentElement.classList.contains('jetski'), true);
});
