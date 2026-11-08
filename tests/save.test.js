import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  profiles, progress, checkpoints, settings, masteryStore, resetAll, save, load, MAX_PROFILES,
} from '../src/save.js';
import { LEVEL_ORDER } from '../src/levels/index.js';

beforeEach(() => resetAll());

test('works without localStorage (in-memory fallback)', () => {
  save('x', 5);
  assert.equal(load('x', 0), 5);
});

test(`up to ${MAX_PROFILES} child profiles`, () => {
  const made = ['Ava', 'Ben', 'Cleo', 'Dev'].map((name, i) => profiles.create({ name, avatar: ['fox', 'bear', 'cat', 'frog'][i] }));
  assert.ok(made.every(Boolean));
  assert.equal(new Set(made.map((p) => p.id)).size, 4);
  assert.equal(profiles.canAdd, false);
  assert.equal(profiles.create({ name: 'Eve' }), null, 'a fifth is refused');
  assert.deepEqual(profiles.list().map((p) => p.name), ['Ava', 'Ben', 'Cleo', 'Dev']);
});

test('names are tidied and kept short', () => {
  const p = profiles.create({ name: '  Maximilian<script>  ' });
  assert.equal(p.name, 'Maximilian');
  assert.ok(profiles.create({ name: 'A'.repeat(30) }).name.length <= 10);
});

test('progress, checkpoints, settings and learning are saved per profile', () => {
  const a = profiles.create({ name: 'Ava' });
  const b = profiles.create({ name: 'Ben' });
  profiles.select(a.id);
  assert.equal(profiles.current.name, 'Ava');
  progress.complete('1-1', 3, 20);
  checkpoints.set('1-2', { x: 100 });
  settings.controlMode = 'easy';
  masteryStore.save({ v: 1, seq: 4, facts: {}, flips: ['4x3'] });
  progress.lastLevel = '1-2';

  profiles.select(b.id);
  assert.equal(progress.bestStars('1-1'), 0);
  assert.equal(progress.isUnlocked('1-2', LEVEL_ORDER), false);
  assert.equal(checkpoints.get('1-2'), null);
  assert.equal(settings.controlMode, 'classic');
  assert.equal(masteryStore.load(), null);
  assert.equal(progress.carrotBank, 0);
  assert.equal(progress.lastLevel, '1-1');

  profiles.select(a.id);
  assert.equal(progress.bestStars('1-1'), 3);
  assert.equal(progress.isUnlocked('1-2', LEVEL_ORDER), true);
  assert.deepEqual(checkpoints.get('1-2'), { x: 100 });
  assert.equal(settings.controlMode, 'easy');
  assert.deepEqual(masteryStore.load().flips, ['4x3']);
  assert.equal(progress.carrotBank, 20);
  assert.equal(progress.lastLevel, '1-2');
  assert.deepEqual(profiles.summary(a.id), { stars: 3, done: 1, carrots: 20 });
});

test('best stars are kept; finishing a level unlocks the next one', () => {
  profiles.select(profiles.create({ name: 'Ava' }).id);
  assert.equal(progress.isUnlocked('1-1', LEVEL_ORDER), true);
  assert.equal(progress.isUnlocked('2-1', LEVEL_ORDER), false);
  assert.equal(progress.complete('1-1', 2, 5), true);
  assert.equal(progress.complete('1-1', 1, 5), false);
  assert.equal(progress.bestStars('1-1'), 2);
  assert.equal(progress.isUnlocked('1-2', LEVEL_ORDER), true);
  assert.equal(progress.carrotBank, 10);
});

test('Endless Meadow round and best are remembered', () => {
  profiles.select(profiles.create({ name: 'Ava' }).id);
  assert.deepEqual(progress.endless, { round: 1, seed: null, best: 0 });
  progress.endless = { round: 3, seed: 77, best: 2 };
  assert.deepEqual(progress.endless, { round: 3, seed: 77, best: 2 });
});

test('removing a profile deletes its progress and frees the place', () => {
  const a = profiles.create({ name: 'Ava' });
  profiles.select(a.id);
  progress.complete('1-1', 3, 5);
  profiles.remove(a.id);
  assert.equal(profiles.current, null);
  const again = profiles.create({ name: 'Zed' });
  profiles.select(again.id);
  assert.equal(progress.bestStars('1-1'), 0);
});

test('progress saved before profiles existed moves into the first profile', () => {
  save('levels', { '1-1': { stars: 2, done: true } });
  save('carrotBank', 42);
  const p = profiles.create({ name: 'Ava' });
  profiles.select(p.id);
  assert.equal(progress.bestStars('1-1'), 2);
  assert.equal(progress.carrotBank, 42);
  assert.equal(load('levels', null), null);
  const second = profiles.create({ name: 'Ben' });
  profiles.select(second.id);
  assert.equal(progress.bestStars('1-1'), 0);
});

test('music and speech are shared settings', () => {
  const a = profiles.create({ name: 'Ava' });
  const b = profiles.create({ name: 'Ben' });
  profiles.select(a.id);
  settings.music = false;
  profiles.select(b.id);
  assert.equal(settings.music, false);
  assert.equal(settings.speech, true);
});

test('Burrow: wardrobe and spending are per profile, and spending never goes below zero', async () => {
  const { wardrobeStore } = await import('../src/save.js');
  const a = profiles.create({ name: 'Ava' });
  const b = profiles.create({ name: 'Ben' });
  profiles.select(a.id);
  progress.addCarrots(40);
  assert.equal(progress.spend(50), false);
  assert.equal(progress.carrotBank, 40);
  assert.equal(progress.spend(30), true);
  assert.equal(progress.carrotBank, 10);
  wardrobeStore.save({ owned: ['hat-party'], wearing: { hat: 'hat-party' } });
  assert.equal(wardrobeStore.load().wearing.hat, 'hat-party');
  profiles.select(b.id);
  assert.equal(wardrobeStore.load().wearing.hat, null);
  assert.equal(wardrobeStore.of(a.id).wearing.hat, 'hat-party');
});

test('sticker book: seen stickers are remembered per profile', async () => {
  const { stickerStore } = await import('../src/save.js');
  const a = profiles.create({ name: 'Ava' });
  const b = profiles.create({ name: 'Ben' });
  profiles.select(a.id);
  stickerStore.markSeen(['boss-crow', 'table-2']);
  stickerStore.markSeen(['boss-crow']);
  assert.deepEqual(stickerStore.seen, ['boss-crow', 'table-2']);
  profiles.select(b.id);
  assert.deepEqual(stickerStore.seen, []);
});

test('controls default to Classic, even for profiles saved with the old default', () => {
  const p = profiles.create({ name: 'Cleo' });
  profiles.select(p.id);
  assert.equal(settings.controlMode, 'classic');
  settings.controlMode = 'easy';
  assert.equal(settings.controlMode, 'easy');
  settings.controlMode = 'classic';
  assert.equal(settings.controlMode, 'classic');
});
