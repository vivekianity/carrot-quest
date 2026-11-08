import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  numberWords, factId, factsFor, wrongAnswerCandidates, wrongAnswers, makeQuestion,
  createQuestionPicker, mulberry32,
} from '../src/engine/questions.js';
import { levelConfig, LEVELS } from '../src/engine/levels-config.js';

test('number words for speech', () => {
  assert.equal(numberWords(0), 'zero');
  assert.equal(numberWords(12), 'twelve');
  assert.equal(numberWords(20), 'twenty');
  assert.equal(numberWords(21), 'twenty-one');
  assert.equal(numberWords(100), 'one hundred');
  assert.equal(makeQuestion({ a: 3, b: 4 }).speech, 'three times four');
});

test('facts for level 1-1 are ×1 and ×2 with multipliers 1–5', () => {
  const facts = factsFor(levelConfig('1-1').tables, levelConfig('1-1').multipliers);
  assert.equal(facts.length, 10);
  for (const f of facts) {
    assert.ok([1, 2].includes(f.b));
    assert.ok(f.a >= 1 && f.a <= 5);
  }
});

test('flipped facts share an id', () => {
  assert.equal(factId(3, 4), factId(4, 3));
  assert.notEqual(factId(3, 4), factId(3, 5));
});

test('wrong answers are distinct, positive, never the answer — for every fact and choice count', () => {
  const rng = mulberry32(1);
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      for (const n of [2, 3]) {
        const w = wrongAnswers(a, b, n, rng);
        assert.equal(w.length, n);
        assert.equal(new Set(w).size, n, `duplicates for ${a}×${b}: ${w}`);
        for (const x of w) {
          assert.ok(Number.isInteger(x) && x > 0, `${x} for ${a}×${b}`);
          assert.notEqual(x, a * b);
          const believable = wrongAnswerCandidates(a, b).flat();
          assert.ok(believable.includes(x) || (x > a * b && x - a * b <= n), `${x} is not believable for ${a}×${b}`);
        }
      }
    }
  }
});

test('wrong answers are believable: neighbouring products, a+b, digit swaps', () => {
  const [t1, t2] = wrongAnswerCandidates(3, 4);
  assert.deepEqual(t1.sort((x, y) => x - y), [8, 9, 15, 16]);
  assert.ok(t2.includes(7));   // 3 + 4
  assert.ok(t2.includes(21));  // digit swap of 12
  // at least one neighbouring product is always used when one exists
  const rng = mulberry32(7);
  for (let i = 0; i < 50; i++) assert.ok(wrongAnswers(3, 4, 2, rng).some((x) => t1.includes(x)));
});

test('a question has the answer exactly once among its choices', () => {
  const rng = mulberry32(3);
  for (let i = 0; i < 100; i++) {
    const q = makeQuestion({ a: 1 + (i % 10), b: 1 + ((i * 7) % 10) }, { choices: i % 2 ? 3 : 4, rng });
    assert.equal(q.choices.length, i % 2 ? 3 : 4);
    assert.equal(q.choices.filter((c) => c === q.answer).length, 1);
    assert.equal(new Set(q.choices).size, q.choices.length);
  }
});

test('picker never gives the same fact (or its flip) twice in a row', () => {
  for (const id of LEVELS.map((l) => l.id)) {
    const cfg = levelConfig(id);
    const p = createQuestionPicker(cfg, { rng: mulberry32(11) });
    let last = null;
    for (let i = 0; i < 300; i++) {
      const q = p.next();
      assert.notEqual(q.id, last, `${id}: ${q.text} twice in a row`);
      if (i % 3 === 0) p.recordResult(q, false); // lots of misses must not break the rule either
      last = q.id;
    }
  }
});

test('picker stays inside the level config', () => {
  const cfg = levelConfig('1-1');
  const p = createQuestionPicker(cfg, { rng: mulberry32(5) });
  for (let i = 0; i < 100; i++) {
    const q = p.next();
    assert.ok(cfg.tables.includes(q.b) && q.a >= 1 && q.a <= 5, q.text);
    assert.equal(q.choices.length, 3);
  }
});

test('picker spreads facts out: 10 questions in 1-1 use at least 7 different facts', () => {
  const p = createQuestionPicker(levelConfig('1-1'), { rng: mulberry32(9) });
  const keys = new Set(Array.from({ length: 10 }, () => p.next().key));
  assert.ok(keys.size >= 7, `only ${keys.size}`);
});

test('review levels mix in ~40% earlier tables', () => {
  const cfg = levelConfig('2-1');
  assert.deepEqual(cfg.tables, [5]);
  assert.deepEqual(cfg.reviewTables, [1, 2, 10]);
  const p = createQuestionPicker(cfg, { rng: mulberry32(2) });
  let review = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) if (p.next().b !== 5) review++;
  assert.ok(review / N > 0.3 && review / N < 0.5, `review share ${review / N}`);
});

test('a missed fact comes back later, but not on the very next block', () => {
  const p = createQuestionPicker(levelConfig('1-2'), { rng: mulberry32(4) });
  const q1 = p.next();
  p.recordResult(q1, false);
  assert.deepEqual(p.pending, [q1.key]);
  const q2 = p.next();
  assert.notEqual(q2.key, q1.key);
  const q3 = p.next();
  assert.equal(q3.key, q1.key);
  assert.deepEqual(p.pending, []);
});

test('weight hook biases the choice', () => {
  const p = createQuestionPicker(levelConfig('1-2'), { rng: mulberry32(8), weight: (f) => (f.a === 7 && f.b === 10 ? 1000 : 1) });
  let hits = 0;
  for (let i = 0; i < 20; i++) if (p.next().key === '7x10') hits++;
  assert.ok(hits >= 5, `hits ${hits}`);
});

import { makeMissingQuestion, missingWrongAnswers } from '../src/engine/questions.js';

test('missing-number question: 3 × ? = 12', () => {
  const q = makeMissingQuestion({ a: 3, b: 4 }, { hide: 'b', rng: mulberry32(1) });
  assert.equal(q.kind, 'missing');
  assert.equal(q.answer, 4);
  assert.equal(q.text, '3 × ? = 12');
  assert.equal(q.before, '3 ×');
  assert.equal(q.after, '= 12');
  assert.equal(q.speech, 'three times what makes twelve');
  assert.equal(q.rows * q.perRow, 12);
  assert.equal(q.perRow, 3, 'count in threes');
  const q2 = makeMissingQuestion({ a: 3, b: 4 }, { hide: 'a' });
  assert.equal(q2.answer, 3);
  assert.equal(q2.text, '? × 4 = 12');
  assert.equal(q2.key, '3x4');
});

test('missing-number wrong answers are close, distinct and never the answer', () => {
  const rng = mulberry32(2);
  for (let ans = 1; ans <= 10; ans++) {
    for (let known = 1; known <= 10; known++) {
      const w = missingWrongAnswers(ans, known, 3, rng);
      assert.equal(new Set(w).size, 3);
      for (const x of w) { assert.notEqual(x, ans); assert.ok(x >= 1 && x <= 13, `${x} for ${ans}`); }
    }
  }
});

test('product questions describe the counting picture and the sign layout', () => {
  const q = makeQuestion({ a: 3, b: 4 });
  assert.equal(q.kind, 'product');
  assert.equal(q.before, '3 × 4 =');
  assert.equal(q.rows, 3);
  assert.equal(q.perRow, 4);
});
