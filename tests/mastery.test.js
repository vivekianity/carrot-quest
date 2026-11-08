import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMastery, emptyMastery, MASTERY_RUN, MASTERY_MS, MISSED_WEIGHT, MASTERED_WEIGHT, RECENT_WINDOW,
} from '../src/engine/mastery.js';
import { createQuestionPicker, mulberry32, factId } from '../src/engine/questions.js';
import { levelConfig } from '../src/engine/levels-config.js';

const fast = { firstTry: true, ms: 2500 };
const answer = (m, a, b, res, times = 1) => { let out; for (let i = 0; i < times; i++) out = m.record(a, b, res); return out; };

test('tracks attempts, first-try correct, average time and last seen for each fact', () => {
  const m = createMastery();
  assert.equal(m.status(3, 4), 'new');
  m.record(3, 4, { firstTry: true, ms: 2000, now: 1000 });
  m.record(3, 4, { firstTry: false, ms: 8000, now: 5000 });
  const f = m.fact(3, 4);
  assert.equal(f.n, 2);
  assert.equal(f.ok, 1);
  assert.equal(f.ms, 5000);
  assert.equal(f.last, 5000);
  assert.equal(m.status(3, 4), 'learning');
  assert.equal(m.fact(4, 3), null, '4 × 3 is tracked separately');
});

test(`mastered = right first try ${MASTERY_RUN} times in a row, each under ${MASTERY_MS / 1000} s`, () => {
  const m = createMastery();
  assert.equal(answer(m, 6, 7, fast, MASTERY_RUN - 1).mastered, false);
  assert.equal(m.status(6, 7), 'learning');
  assert.equal(m.record(6, 7, fast).mastered, true, 'the third in a row masters it');
  assert.equal(m.status(6, 7), 'mastered');
  assert.equal(m.record(6, 7, fast).mastered, false, 'only reported once');
});

test('a miss or a slow answer starts the run again', () => {
  const m = createMastery();
  answer(m, 8, 7, fast, 2);
  m.record(8, 7, { firstTry: false, ms: 3000 });
  answer(m, 8, 7, fast, 2);
  assert.equal(m.status(8, 7), 'learning', 'miss reset the run');
  m.record(8, 7, { firstTry: true, ms: MASTERY_MS + 1 });
  answer(m, 8, 7, fast, 2);
  assert.equal(m.status(8, 7), 'learning', 'slow answer reset the run');
  m.record(8, 7, fast);
  assert.equal(m.status(8, 7), 'mastered');
});

test('missing a mastered fact makes it "learning" again', () => {
  const m = createMastery();
  answer(m, 9, 9, fast, MASTERY_RUN);
  assert.equal(m.record(9, 9, { firstTry: false, ms: 4000 }).lost, true);
  assert.equal(m.status(9, 9), 'learning');
});

test('weights: recently missed ×3, mastered still comes back now and then, others ×1', () => {
  const m = createMastery();
  m.record(2, 3, { firstTry: false, ms: 4000 });
  answer(m, 4, 5, fast, MASTERY_RUN);
  m.record(5, 5, fast);
  assert.equal(m.weight(2, 3), MISSED_WEIGHT);
  assert.equal(m.weight(4, 5), MASTERED_WEIGHT);
  assert.ok(MASTERED_WEIGHT > 0 && MASTERED_WEIGHT < 1);
  assert.equal(m.weight(5, 5), 1);
  assert.equal(m.weight(1, 1), 1, 'never-seen facts');
  m.record(2, 3, fast);
  assert.equal(m.weight(2, 3), 1, 'answered right again → no longer "recently missed"');
});

test('a miss stops counting as recent after a while', () => {
  const m = createMastery();
  m.record(2, 3, { firstTry: false });
  for (let i = 0; i < RECENT_WINDOW; i++) m.record(1, 1 + (i % 10), fast);
  assert.equal(m.recentlyMissed(2, 3), false);
  assert.equal(m.weight(2, 3), 1);
});

test('"flip it!": mastering 3 × 4 queues 4 × 3 (once, and never for 5 × 5)', () => {
  const m = createMastery();
  const res = answer(m, 3, 4, fast, MASTERY_RUN);
  assert.equal(res.flip, '4x3');
  assert.deepEqual(m.pendingFlips, ['4x3']);
  answer(m, 5, 5, fast, MASTERY_RUN);
  assert.deepEqual(m.pendingFlips, ['4x3'], 'no flip for a square');
  m.record(3, 4, { firstTry: false });
  answer(m, 3, 4, fast, MASTERY_RUN);
  assert.deepEqual(m.pendingFlips, ['4x3'], 'not queued twice');
  const flip = m.takeFlip();
  assert.deepEqual(flip, { a: 4, b: 3, from: { a: 3, b: 4 } });
  assert.deepEqual(m.pendingFlips, []);
});

test('no flip when the turned-around fact is already mastered', () => {
  const m = createMastery();
  answer(m, 4, 3, fast, MASTERY_RUN);
  m.takeFlip();
  const res = answer(m, 3, 4, fast, MASTERY_RUN);
  assert.equal(res.mastered, true);
  assert.equal(res.flip, null);
});

test('takeFlip only hands out flips the level accepts', () => {
  const m = createMastery();
  answer(m, 7, 2, fast, MASTERY_RUN);
  answer(m, 3, 9, fast, MASTERY_RUN);
  assert.equal(m.takeFlip((a, b) => a === 5 || b === 5), null);
  assert.deepEqual(m.takeFlip((a, b) => a === 9 || b === 9), { a: 9, b: 3, from: { a: 3, b: 9 } });
  assert.deepEqual(m.pendingFlips, ['2x7']);
});

test('saves to plain JSON and loads back (and ignores junk)', () => {
  const m = createMastery();
  answer(m, 3, 4, fast, MASTERY_RUN);
  m.record(6, 7, { firstTry: false, ms: 3000 });
  const json = JSON.parse(JSON.stringify(m.toJSON()));
  const back = createMastery(json);
  assert.equal(back.status(3, 4), 'mastered');
  assert.equal(back.weight(6, 7), MISSED_WEIGHT);
  assert.deepEqual(back.pendingFlips, ['4x3']);
  assert.deepEqual(createMastery({ facts: 7, flips: ['oops', '2x3'] }).pendingFlips, ['2x3']);
  assert.deepEqual(createMastery(null).toJSON(), emptyMastery());
});

test('grid and summary cover all 100 facts; a table is mastered when all ten facts are', () => {
  const m = createMastery();
  for (let k = 1; k <= 10; k++) answer(m, k, 2, fast, MASTERY_RUN);
  m.record(5, 6, { firstTry: false });
  const g = m.grid();
  assert.equal(g.length, 10);
  assert.ok(g.every((row) => row.length === 10));
  assert.equal(g[2][1], 'mastered');      // 3 × 2
  assert.equal(g[4][5], 'learning');      // 5 × 6
  assert.deepEqual(m.summary(), { new: 89, learning: 1, mastered: 10 });
  assert.equal(m.tableMastered(2), true);
  assert.equal(m.tableMastered(3), false);
});

// ---- The picker uses the learning engine ------------------------------------------------------

test('picker: a recently missed fact is about 3× as likely as the others', () => {
  const cfg = levelConfig('2-1');                       // ×5 (no review on the first pick of a fresh picker)
  const config = { ...cfg, reviewTables: [], reviewShare: 0, missingShare: 0 };
  const m = createMastery();
  m.record(7, 5, { firstTry: false });
  const rng = mulberry32(42);
  let hits = 0;
  const N = 6000;
  for (let i = 0; i < N; i++) if (createQuestionPicker(config, { rng, mastery: m }).next().key === '7x5') hits++;
  const expected = MISSED_WEIGHT / (9 + MISSED_WEIGHT);   // 10 facts, one weighted 3
  assert.ok(Math.abs(hits / N - expected) < 0.03, `share ${(hits / N).toFixed(3)} vs ${expected.toFixed(3)}`);
});

test('picker: mastered facts still appear, just less often', () => {
  const config = { ...levelConfig('2-1'), reviewTables: [], reviewShare: 0, missingShare: 0 };
  const m = createMastery();
  for (let k = 1; k <= 5; k++) answer(m, k, 5, fast, MASTERY_RUN);
  while (m.takeFlip()) { /* not testing flips here */ }
  const rng = mulberry32(7);
  let mastered = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const q = createQuestionPicker(config, { rng, mastery: m }).next();
    if (q.a <= 5) mastered++;
  }
  const expected = (5 * MASTERED_WEIGHT) / (5 * MASTERED_WEIGHT + 5);
  assert.ok(mastered > 0, 'mastered facts still come back');
  assert.ok(Math.abs(mastered / N - expected) < 0.03, `share ${(mastered / N).toFixed(3)} vs ${expected.toFixed(3)}`);
});

test('picker: a queued flip is served with its original, and not right after the same fact', () => {
  const config = levelConfig('3-1');                   // ×4
  const m = createMastery();
  answer(m, 6, 4, fast, MASTERY_RUN);                   // queues 4 × 6
  const picker = createQuestionPicker(config, { rng: mulberry32(3), mastery: m });
  const q = picker.next();
  assert.equal(q.key, '4x6');
  assert.deepEqual(q.flip, { a: 6, b: 4 });
  assert.equal(q.kind, 'product');
  assert.equal(q.answer, 24);
  assert.deepEqual(m.pendingFlips, []);
});

test('picker: flips wait for a level whose tables they fit, and never repeat the last fact', () => {
  const m = createMastery();
  answer(m, 3, 9, fast, MASTERY_RUN);                   // queues 9 × 3
  const ones = createQuestionPicker(levelConfig('1-1'), { rng: mulberry32(1), mastery: m });
  for (let i = 0; i < 10; i++) assert.equal(ones.next().flip, undefined, '1-1 (×1, ×2) does not take 9 × 3');
  assert.deepEqual(m.pendingFlips, ['9x3']);

  const nines = createQuestionPicker(levelConfig('5-1'), { rng: mulberry32(2), mastery: m });
  const seq = Array.from({ length: 12 }, () => nines.next());
  const at = seq.findIndex((q) => q.flip);
  assert.ok(at >= 0, 'served in a ×9 level');
  for (let i = 1; i < seq.length; i++) assert.notEqual(factId(seq[i].a, seq[i].b), factId(seq[i - 1].a, seq[i - 1].b), 'never the same fact twice in a row');
});
