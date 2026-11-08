import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, tileIndexFor, tileData, surfaceBelow, findSafeSpot, TILE, EDGE, PLATFORM_BASE } from '../src/engine/level-map.js';
import { LEVEL_TEST } from '../src/levels/test.js';

const small = parseLevel(`
..c...
.P.==G
###..#
###..#
`);

test('parses size, start and pads rows', () => {
  assert.equal(small.cols, 6);
  assert.equal(small.rows, 4);
  assert.deepEqual(small.start, { col: 1, row: 1 });
  assert.equal(small.grid[1][1], '.');
});

test('collects gates, question boxes and carrots as objects', () => {
  assert.deepEqual(small.objects, [
    { type: 'carrot', col: 2, row: 0 },
    { type: 'gate', col: 5, row: 1 },
  ]);
  assert.equal(small.grid[1][5], '.');
});

test('auto-tiles ground edges', () => {
  const mask = (c, r) => tileIndexFor(small, c, r) % 16;
  assert.equal(mask(0, 2), EDGE.T);              // left world edge: no outline
  assert.equal(mask(2, 2), EDGE.T | EDGE.R);     // ledge at the gap
  assert.equal(mask(2, 3), EDGE.R);
  assert.equal(mask(5, 2), EDGE.T | EDGE.L);
  assert.equal(tileIndexFor(small, 3, 1), PLATFORM_BASE + 1);
  assert.equal(tileIndexFor(small, 4, 1), PLATFORM_BASE + 2);
  assert.equal(tileIndexFor(small, 0, 0), -1);
});

test('surfaceBelow finds ground, platforms and pits', () => {
  assert.equal(surfaceBelow(small, 0.5 * TILE, 0), 2 * TILE);
  assert.equal(surfaceBelow(small, 3.5 * TILE, 0), 1 * TILE);
  assert.equal(surfaceBelow(small, 3.5 * TILE, 1.5 * TILE), null); // below the platform → pit
});

test('findSafeSpot backs away from the gap onto flat ground', () => {
  const s = findSafeSpot(small, 2.9 * TILE, 1);
  assert.equal(s.x, 1 * TILE + TILE / 2);
  assert.equal(s.y, 2 * TILE);
});

test('test level is well formed', () => {
  const lvl = parseLevel(LEVEL_TEST.map);
  assert.equal(lvl.rows, 12);
  assert.ok(lvl.cols >= 80);
  const data = tileData(lvl);
  assert.equal(data.length, lvl.rows);
  // there is a gap that falls all the way through
  const gapCols = [...Array(lvl.cols).keys()].filter((c) => lvl.grid.every((row) => row[c] === '.'));
  assert.ok(gapCols.length >= 2 && gapCols.length <= 4, 'one generous gap');
  // the safe spot before the gap is on ground
  const s = findSafeSpot(lvl, gapCols[0] * TILE - 10, 1);
  assert.ok(s.x < gapCols[0] * TILE);
  const count = (t) => lvl.objects.filter((o) => o.type === t).length;
  assert.ok(count('gate') >= 2 && count('qbox') >= 1 && count('carrot') >= 10);
  // every gate stands on ground and every question box can be bumped from the ground below
  for (const o of lvl.objects.filter((o) => o.type === 'gate')) assert.equal(lvl.grid[o.row + 1][o.col], '#');
  for (const o of lvl.objects.filter((o) => o.type === 'qbox')) {
    let r = o.row + 1; while (lvl.grid[r][o.col] === '.') r++;
    assert.ok(r - o.row - 1 <= 3, 'box is low enough to bump');
  }
});

import { bridgeRuns, logSpan, liftSteps, isWater } from '../src/engine/level-map.js';

const blocks = parseLevel(`
..............
.......#######
.......#######
.......L......
P....K.#......
###__####..###
###~~####..###
`);

test('bridge runs, water, log tunnel and lift geometry', () => {
  assert.deepEqual(bridgeRuns(blocks), [{ row: 5, c0: 3, c1: 4 }]);
  assert.ok(isWater(blocks, 3, 6));
  assert.ok(!isWater(blocks, 3, 5));
  assert.deepEqual(logSpan(blocks, 7, 3), { topRow: 3, bottomRow: 3 });
  const lift = liftSteps(blocks, 5, 4, 64);
  assert.equal(lift.cliffCol, 7);
  assert.equal(lift.groundY, 5 * TILE);
  assert.equal(lift.cliffTopY, 1 * TILE);
  assert.equal(lift.steps.length, 4);
  assert.equal(lift.steps[lift.steps.length - 1], lift.cliffTopY);
  for (let i = 1; i < lift.steps.length; i++) assert.ok(lift.steps[i - 1] - lift.steps[i] <= 64);
});
