import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, LEVEL_IDS, WORLDS, levelConfig, REVIEW_SHARE, NEW_SHARE } from '../src/engine/levels-config.js';
import { createQuestionPicker, mulberry32 } from '../src/engine/questions.js';

// GAME_DESIGN §3, copied as a table so any drift in levels-config.js is caught.
const SPEC = {
  '1-1': { world: 'meadow',   tables: [1, 2],  mult: [1, 5],  answer: 'bubbles', choices: 3, review: false },
  '1-2': { world: 'meadow',   tables: [2, 10], mult: [1, 10], answer: 'bubbles', choices: 3, review: false, boss: 'crow' },
  '2-1': { world: 'mushroom', tables: [5],     mult: [1, 10], answer: 'bubbles', choices: 3, review: true },
  '2-2': { world: 'mushroom', tables: [3],     mult: [1, 10], answer: 'bubbles', choices: 4, review: true, boss: 'owl' },
  '3-1': { world: 'beach',    tables: [4],     mult: [1, 10], answer: 'numpad', review: true },
  '3-2': { world: 'beach',    tables: [6],     mult: [1, 10], answer: 'numpad', review: true, boss: 'crab' },
  '4-1': { world: 'snow',     tables: [7],     mult: [1, 10], answer: 'numpad', review: true },
  '4-2': { world: 'snow',     tables: [8],     mult: [1, 10], answer: 'numpad', review: true, boss: 'penguin' },
  '5-1': { world: 'candy',    tables: [9],     mult: [1, 10], answer: 'numpad', review: true },
  '5-2': { world: 'candy',    tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], mult: [1, 10], answer: 'numpad', review: false, missing: true, boss: 'raccoon' },
};

test('10 levels: 5 worlds × 2, in order', () => {
  assert.deepEqual(LEVEL_IDS, Object.keys(SPEC));
  assert.equal(Object.keys(WORLDS).length, 5);
  for (const w of Object.keys(WORLDS)) assert.equal(LEVELS.filter((l) => l.world === w).length, 2, w);
});

for (const [id, spec] of Object.entries(SPEC)) {
  test(`${id}: matches §3 (world, tables, multipliers, answer method, boss)`, () => {
    const cfg = levelConfig(id);
    assert.equal(cfg.world, spec.world);
    assert.deepEqual(cfg.tables, spec.tables);
    assert.deepEqual(cfg.multipliers, spec.mult);
    assert.equal(cfg.answer, spec.answer);
    if (spec.choices) assert.equal(cfg.choices, spec.choices);
    assert.equal(cfg.review, spec.review);
    assert.equal(cfg.boss, spec.boss || null);
    if (cfg.boss) assert.equal(cfg.boss, WORLDS[cfg.world].boss, 'boss belongs to its world');
    assert.ok(cfg.missingShare > 0 === !!spec.missing, 'missing-number questions only in 5-2');
    assert.ok(cfg.element, 'introduces a platform element');
  });

  test(`${id}: review mix`, () => {
    const cfg = levelConfig(id);
    const i = LEVEL_IDS.indexOf(id);
    if (!spec.review) { assert.deepEqual(cfg.reviewTables, []); assert.equal(cfg.reviewShare, 0); return; }
    const earlier = new Set(LEVELS.slice(0, i).flatMap((l) => l.tables));
    spec.tables.forEach((t) => earlier.delete(t));
    assert.deepEqual(cfg.reviewTables, [...earlier].sort((a, b) => a - b), 'review = every earlier table');
    assert.ok(cfg.reviewTables.length > 0);
    assert.equal(cfg.reviewShare, REVIEW_SHARE);
    assert.equal(NEW_SHARE + REVIEW_SHARE, 1);
  });

  test(`${id}: the picker stays inside the config and mixes ~60/40`, () => {
    const cfg = levelConfig(id);
    const p = createQuestionPicker(cfg, { rng: mulberry32(id.charCodeAt(0) * 31 + id.charCodeAt(2)) });
    const allowed = new Set([...cfg.tables, ...cfg.reviewTables]);
    const [lo, hi] = cfg.multipliers;
    let review = 0, missing = 0;
    const N = 1500;
    for (let i = 0; i < N; i++) {
      const q = p.next();
      assert.ok(allowed.has(q.b), `${q.text}: ×${q.b} is not in this level`);
      assert.ok(q.a >= lo && q.a <= hi, `${q.text}: multiplier out of range`);
      if (!cfg.tables.includes(q.b)) review++;
      if (q.kind === 'missing') missing++;
      assert.ok(q.answer >= 1 && q.answer <= 100);
      if (cfg.answer === 'numpad') assert.ok(String(q.answer).length <= 3);
      assert.equal(q.choices.length, cfg.choices);
      assert.equal(q.choices.filter((c) => c === q.answer).length, 1);
    }
    if (cfg.review) assert.ok(Math.abs(review / N - REVIEW_SHARE) < 0.07, `review share ${(review / N).toFixed(2)}`);
    else assert.equal(review, 0);
    if (cfg.missingShare) assert.ok(Math.abs(missing / N - cfg.missingShare) < 0.06, `missing share ${(missing / N).toFixed(2)}`);
    else assert.equal(missing, 0);
  });
}

test('unknown level throws', () => {
  assert.throws(() => levelConfig('9-9'));
});
