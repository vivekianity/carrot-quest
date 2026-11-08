import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, createPraise, FIRST_TRY, AFTER_HELP, STREAKS } from '../src/engine/praise.js';
import { mulberry32 } from '../src/engine/questions.js';

test('the requested cheers are in the rotation', () => {
  for (const p of ['Hop-tastic!', 'Carrot power!', 'You did it!']) assert.ok(FIRST_TRY.includes(p), p);
  assert.ok(AFTER_HELP.includes('You did it!'));
});

test('deck: every phrase once before any repeats, never twice in a row', () => {
  const deck = createDeck(FIRST_TRY, mulberry32(9));
  let prev = null;
  for (let round = 0; round < 20; round++) {
    const seen = new Set();
    for (let i = 0; i < FIRST_TRY.length; i++) {
      const p = deck.next();
      assert.notEqual(p, prev, 'no immediate repeat (even across rounds)');
      seen.add(p);
      prev = p;
    }
    assert.equal(seen.size, FIRST_TRY.length, 'whole deck used each round');
  }
});

test('praise: first-try cheers, gentle words after help, streak cheers', () => {
  const p = createPraise(mulberry32(3));
  assert.ok(FIRST_TRY.includes(p.next(true).text));
  assert.equal(p.next(true).streak, 2);
  assert.equal(p.next(true).text, STREAKS[3]);
  const after = p.next(false);
  assert.ok(AFTER_HELP.includes(after.text));
  assert.equal(after.streak, 0, 'a miss starts the streak again');
  for (let i = 0; i < 4; i++) p.next(true);
  assert.equal(p.next(true).text, STREAKS[5]);
});

test('praise never shows anything negative', () => {
  for (const t of [...FIRST_TRY, ...AFTER_HELP, ...Object.values(STREAKS)]) {
    assert.doesNotMatch(t, /wrong|no\b|bad|fail|oops/i, t);
  }
});
