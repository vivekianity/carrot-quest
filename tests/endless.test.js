import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEndlessLevel, endlessChallengeCount, newEndlessSeed, ENDLESS_ID } from '../src/engine/endless.js';
import { parseLevel, bridgeRuns } from '../src/engine/level-map.js';
import { levelConfig, ENDLESS } from '../src/engine/levels-config.js';
import { createQuestionPicker, mulberry32 } from '../src/engine/questions.js';
import { assertBlocksWork, assertPitsGenerous } from './map-checks.js';

const GT = 13;
const challengesOf = (lvl) => [
  ...lvl.objects.filter((o) => ['gate', 'qbox', 'log', 'lift', 'boss'].includes(o.type)),
  ...bridgeRuns(lvl).map((r) => ({ type: 'bridge', col: r.c0 })),
].sort((a, b) => a.col - b.col);

test('Endless Meadow config: every table, number pad, some missing-number questions, unlocked after 5-2', () => {
  const cfg = levelConfig(ENDLESS_ID);
  assert.deepEqual(cfg.tables, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(cfg.multipliers, [1, 10]);
  assert.equal(cfg.answer, 'numpad');
  assert.ok(cfg.missingShare > 0 && cfg.missingShare < 0.3);
  assert.equal(cfg.boss, null);
  assert.equal(ENDLESS.unlockAfter, '5-2');
  const p = createQuestionPicker(cfg, { rng: mulberry32(5) });
  const tables = new Set();
  for (let i = 0; i < 300; i++) { const q = p.next(); tables.add(q.b); }
  assert.equal(tables.size, 10, 'mixed facts from every table');
});

test('the same round and seed always give the same map; new seeds give new maps', () => {
  assert.equal(makeEndlessLevel(3, 1234).map, makeEndlessLevel(3, 1234).map);
  assert.notEqual(makeEndlessLevel(3, 1234).map, makeEndlessLevel(3, 999).map);
  assert.notEqual(makeEndlessLevel(1, 1234).map, makeEndlessLevel(2, 1234).map);
  const s = newEndlessSeed(mulberry32(1));
  assert.ok(Number.isInteger(s) && s >= 1 && s < 1e6);
});

test('rounds get a little longer, up to 8 challenges', () => {
  assert.equal(endlessChallengeCount(1), 6);
  assert.equal(endlessChallengeCount(2), 7);
  assert.equal(endlessChallengeCount(3), 8);
  assert.equal(endlessChallengeCount(50), 8);
});

for (let i = 0; i < 60; i++) {
  const round = 1 + (i % 6);
  const seed = 1 + i * 7717;
  test(`endless round ${round}, seed ${seed}: a fair, finishable meadow level`, () => {
    const def = makeEndlessLevel(round, seed);
    assert.equal(def.id, ENDLESS_ID);
    assert.equal(def.world, 'meadow');
    assert.equal(def.questions, ENDLESS_ID);
    assert.match(def.name, new RegExp(`Round ${round}$`));
    const lvl = parseLevel(def.map);
    const of = (t) => lvl.objects.filter((o) => o.type === t);
    assert.equal(lvl.rows, 16);
    assert.ok(lvl.cols >= 80 && lvl.cols <= 200, `${lvl.cols} columns`);
    for (let c = 0; c < 6; c++) assert.equal(lvl.grid[GT][c], '#', 'a calm start');
    assert.equal(lvl.start.row, 12);
    assert.equal(of('goal').length, 1);
    assert.ok(of('goal')[0].col > lvl.cols - 15, 'Golden Carrot at the end');
    assert.equal(of('star').length, 1);
    assert.ok(of('star')[0].row <= 4, 'Star Carrot above the normal view');
    assert.equal(of('flower').length, 1);
    const f = of('flower')[0];
    assert.ok(f.col > lvl.cols * 0.25 && f.col < lvl.cols * 0.8, 'checkpoint near the middle');
    assert.ok(of('carrot').length >= 20, 'plenty of carrots');
    const ch = challengesOf(lvl);
    assert.equal(ch.length, endlessChallengeCount(round));
    assert.equal(ch[0].type, 'gate', 'starts with a Stone Gate');
    assert.equal(of('boss').length, 0);
    assertBlocksWork(lvl);
    assertPitsGenerous(lvl);
  });
}
