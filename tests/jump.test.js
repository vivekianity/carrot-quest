import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JumpAssist, PHYS, cutJump, gravityMult, approach } from '../src/engine/jump.js';

const run = (ja, frames, s) => { let r; for (let i = 0; i < frames; i++) r = ja.step(16, s); return r; };
const idle = { grounded: false, pressed: false, held: false, vy: 200 };

test('jumps from the ground on press', () => {
  const ja = new JumpAssist();
  ja.step(16, { grounded: true, pressed: false, held: false, vy: 0 });
  assert.equal(ja.step(16, { grounded: true, pressed: true, held: true, vy: 0 }).jump, 'ground');
});

test('coyote time: a press ~80 ms after leaving the ledge is still a ground jump', () => {
  const ja = new JumpAssist();
  ja.step(16, { grounded: true, pressed: false, held: false, vy: 0 });
  run(ja, 5, idle); // 80 ms
  const r = ja.step(16, { ...idle, pressed: true, held: true });
  assert.equal(r.jump, 'ground');
  // and the double jump is still available afterwards
  assert.equal(ja.step(16, { ...idle, vy: -500, pressed: true, held: true }).jump, 'double');
});

test('after coyote time runs out, a press becomes the double jump', () => {
  const ja = new JumpAssist();
  ja.step(16, { grounded: true, pressed: false, held: false, vy: 0 });
  run(ja, 10, idle); // 160 ms
  assert.equal(ja.step(16, { ...idle, pressed: true, held: true }).jump, 'double');
});

test('only one double jump per air time', () => {
  const ja = new JumpAssist();
  ja.step(16, { grounded: true, pressed: true, held: true, vy: 0 });
  assert.equal(ja.step(16, { ...idle, vy: -800, pressed: true, held: true }).jump, 'double');
  assert.equal(ja.step(16, { ...idle, vy: -600, pressed: true, held: true }).jump, null);
});

test('jump buffer: a press just before landing jumps on touchdown', () => {
  const ja = new JumpAssist();
  ja.step(16, { grounded: true, pressed: true, held: true, vy: 0 });
  ja.step(16, { ...idle, vy: -800, pressed: true, held: true }); // uses the double jump
  run(ja, 30, idle);
  ja.step(16, { ...idle, pressed: true, held: true });            // too early for anything in the air
  run(ja, 5, { ...idle, held: true });                            // 80 ms later…
  assert.equal(ja.step(16, { grounded: true, pressed: false, held: true, vy: 0 }).jump, 'ground');
});

test('jump buffer expires after ~120 ms', () => {
  const ja = new JumpAssist();
  ja.step(16, { grounded: true, pressed: true, held: true, vy: 0 });
  ja.step(16, { ...idle, vy: -800, pressed: true, held: true });
  run(ja, 30, idle);
  ja.step(16, { ...idle, pressed: true, held: true });
  run(ja, 10, idle); // 160 ms
  assert.equal(ja.step(16, { grounded: true, pressed: false, held: false, vy: 0 }).jump, null);
});

test('variable height: releasing while rising asks for a cut, once', () => {
  const ja = new JumpAssist();
  ja.step(16, { grounded: true, pressed: true, held: true, vy: 0 });
  assert.equal(ja.step(16, { ...idle, vy: -900, held: true }).cut, false);
  assert.equal(ja.step(16, { ...idle, vy: -850, held: false }).cut, true);
  assert.equal(ja.step(16, { ...idle, vy: -500, held: false }).cut, false);
  assert.equal(cutJump(-900), -PHYS.cutVelocity);
  assert.equal(cutJump(-300), -300);
});

test('no cut when the button is held to the apex', () => {
  const ja = new JumpAssist();
  ja.step(16, { grounded: true, pressed: true, held: true, vy: 0 });
  ja.step(16, { ...idle, vy: -100, held: true });
  assert.equal(ja.step(16, { ...idle, vy: 50, held: false }).cut, false);
});

test('gravity: floatier near the apex when held, heavier when falling', () => {
  assert.equal(gravityMult(-800, true), 1);
  assert.equal(gravityMult(-50, true), PHYS.apexGravityMult);
  assert.equal(gravityMult(50, true), PHYS.apexGravityMult);
  assert.equal(gravityMult(400, true), PHYS.fallGravityMult);
  assert.equal(gravityMult(50, false), PHYS.fallGravityMult);
  assert.equal(approach(0, 100, 30), 30);
  assert.equal(approach(90, 100, 30), 100);
  assert.equal(approach(0, -100, 30), -30);
});
