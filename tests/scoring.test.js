import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starsFor, firstTryRate, nextStarHint } from '../src/engine/scoring.js';

test('1 star for reaching the Golden Carrot', () => {
  assert.equal(starsFor({ challenges: 8, firstTry: 2 }), 1);
  assert.equal(starsFor({ challenges: 8, firstTry: 5, starCarrot: true }), 1); // 62%
});

test('2 stars from 75% first-try', () => {
  assert.equal(starsFor({ challenges: 8, firstTry: 6 }), 2);  // exactly 75%
  assert.equal(starsFor({ challenges: 10, firstTry: 9 }), 2); // 90% but no Star Carrot
});

test('3 stars need 90% AND the Star Carrot', () => {
  assert.equal(starsFor({ challenges: 10, firstTry: 9, starCarrot: true }), 3);
  assert.equal(starsFor({ challenges: 12, firstTry: 10, starCarrot: true }), 2); // 83%
  assert.equal(starsFor({ challenges: 12, firstTry: 11, starCarrot: true }), 3); // 92%
});

test('no challenges counts as perfect', () => {
  assert.equal(firstTryRate({ challenges: 0, firstTry: 0 }), 1);
  assert.equal(starsFor({ challenges: 0, firstTry: 0, starCarrot: true }), 3);
});

test('next-star hint', () => {
  assert.equal(nextStarHint({ challenges: 10, firstTry: 9 }), 'star');
  assert.equal(nextStarHint({ challenges: 10, firstTry: 5, starCarrot: true }), 'firstTry');
  assert.equal(nextStarHint({ challenges: 10, firstTry: 10, starCarrot: true }), null);
});
