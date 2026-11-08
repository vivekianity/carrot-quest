import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STICKERS, earnedStickers, unseenStickers, newlyMasteredTables, stickerById } from '../src/engine/stickers.js';
import { LEVELS } from '../src/engine/levels-config.js';

test('one sticker per boss and one per table', () => {
  const bosses = LEVELS.filter((l) => l.boss).length;
  assert.equal(STICKERS.filter((s) => s.kind === 'boss').length, bosses);
  assert.equal(STICKERS.filter((s) => s.kind === 'table').length, 10);
  assert.equal(stickerById('table-7').name, '×7 Champion');
  assert.equal(stickerById('boss-crow').level, '1-2');
});

test('earned: bosses by finishing their level, tables by mastering them', () => {
  const done = new Set(['1-1', '1-2', '2-1']);
  const ids = earnedStickers({ isDone: (id) => done.has(id), tableMastered: (t) => t === 2 || t === 7 });
  assert.deepEqual(ids, ['boss-crow', 'table-2', 'table-7']);
  assert.deepEqual(unseenStickers(ids, ['boss-crow']), ['table-2', 'table-7']);
});

test('a table sticker toast only when that answer finished the table', () => {
  const before = (t) => t === 3;
  const after = (t) => t === 3 || t === 7;
  assert.deepEqual(newlyMasteredTables(7, 3, before, after), [7]);
  assert.deepEqual(newlyMasteredTables(4, 4, () => false, () => true), [4]);
  assert.deepEqual(newlyMasteredTables(2, 5, () => false, () => false), []);
});
