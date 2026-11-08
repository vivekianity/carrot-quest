import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLevel, bridgeRuns, liftSteps, logSpan, groundTopRow, movers, moverColumns, SLOPES, TILE,
} from '../src/engine/level-map.js';
import { assertBlocksWork, assertPitsGenerous, MAX_REACH, MAX_JUMP_TILES, isSolid, surfaces, reachableFromLeft, slopeRuns } from './map-checks.js';
import { levelConfig, LEVEL_IDS } from '../src/engine/levels-config.js';
import { LEVEL_ORDER, LEVEL_MAPS, nextLevelId } from '../src/levels/index.js';

const GT = 13; // ground surface row

for (const id of LEVEL_ORDER) {
  const def = LEVEL_MAPS[id];
  const lvl = parseLevel(def.map);
  const cfg = levelConfig(def.questions);
  const of = (t) => lvl.objects.filter((o) => o.type === t);

  test(`${id}: shape and essentials`, () => {
    assert.equal(def.id, id);
    assert.equal(def.questions, id, 'uses its own level config');
    assert.equal(def.world, cfg.world, 'map world matches the config');
    assert.ok(def.name, 'has a name');
    assert.equal(lvl.rows, 16);
    assert.ok(lvl.cols >= 80 && lvl.cols <= 140, `${lvl.cols} columns`);
    assert.equal(of('goal').length, 1, 'one Golden Carrot');
    assert.equal(of('star').length, 1, 'one Star Carrot');
    assert.ok(of('flower').length >= 1, 'a checkpoint flower');
    assert.ok(of('carrot').length >= 20, 'plenty of carrots');
    const goal = of('goal')[0];
    assert.ok(goal.col > lvl.cols - 15, 'Golden Carrot at the end');
    assert.ok(of('flower').every((f) => f.col > lvl.cols * 0.3 && f.col < lvl.cols * 0.8), 'checkpoints in the middle');
    for (let c = 0; c < 6; c++) assert.equal(lvl.grid[GT][c], '#', 'a calm start on solid ground');
  });

  test(`${id}: 6–10 challenge blocks in the §5 order`, () => {
    const challenges = [...of('gate'), ...of('qbox'), ...of('log'), ...of('lift'), ...of('boss'),
      ...bridgeRuns(lvl).map((r) => ({ type: 'bridge', col: r.c0 }))].sort((a, b) => a.col - b.col);
    assert.ok(challenges.length >= 6 && challenges.length <= 10, `${challenges.length} challenges`);
    assert.equal(challenges[0].type, 'gate', 'starts with a Stone Gate');
    const order = challenges.map((c) => c.type);
    assert.ok(order.includes('qbox') && order.includes('bridge') && order.includes('log'));
    assert.ok(order.indexOf('bridge') > order.indexOf('qbox'), 'bridge after a Question Box');
    assert.ok(order.lastIndexOf('log') > order.indexOf('bridge'), 'log after the bridge');
    assert.ok(of('mushroom').some((m) => m.col > bridgeRuns(lvl)[0].c1), 'a mushroom bounce after the bridge');
    assert.ok(order.filter((t) => t === 'gate').length >= 2, 'Stone Gates along the way');
  });

  test(`${id}: boss gate only at the end of a world`, () => {
    assert.equal(of('boss').length, cfg.boss ? 1 : 0);
    if (cfg.boss) {
      const boss = of('boss')[0];
      assert.ok(boss.col > lvl.cols * 0.7, 'boss near the end');
      for (let c = boss.col - 2; c <= boss.col + 4; c++) assert.equal(lvl.grid[GT][c], '#', 'room for the fence, perch and boss');
    }
  });

  test(`${id}: blocks are placed so they work`, () => {
    assertBlocksWork(lvl);
    const star = of('star')[0];
    assert.ok(star.row <= 4, 'Star Carrot is above the normal view');
  });

  test(`${id}: pits are generous (≤ 3 tiles) unless you ride or slide across`, () => {
    assertPitsGenerous(lvl);
  });
}

// ---- Each world's new platform element (GAME_DESIGN §3) ----------------------------------------
const levelOf = (id) => parseLevel(LEVEL_MAPS[id].map);
const count = (lvl, t) => lvl.objects.filter((o) => o.type === t).length;

test('1-1: flat ground and small hops (no tall walls before the first gate)', () => {
  const lvl = levelOf('1-1');
  const gate = lvl.objects.find((o) => o.type === 'gate');
  for (let c = 0; c < gate.col; c++) assert.equal(groundTopRow(lvl, c), GT);
});

test('1-2: floating platforms and Question Boxes', () => {
  const lvl = levelOf('1-2');
  assert.ok(count(lvl, 'qbox') >= 2);
  assert.ok(lvl.grid.flat().filter((ch) => ch === '=').length >= 10);
});

test('2-1: bouncy mushrooms everywhere', () => {
  assert.ok(count(levelOf('2-1'), 'mushroom') >= 5);
});

test('2-2: several Broken Bridges', () => {
  assert.ok(bridgeRuns(levelOf('2-2')).length >= 3);
});

test('3-1: turtles carry Hoppy across open water, from bank to bank', () => {
  const lvl = levelOf('3-1');
  const turtles = movers(lvl).filter((m) => m.type === 'turtle');
  assert.ok(turtles.length >= 2);
  for (const t of turtles) {
    assert.equal(t.row, GT - 1, 'turtles swim at the water line');
    for (let c = t.min - 1; c <= t.max + 1; c++) assert.equal(lvl.grid[GT][c], '~', `open water under the turtle path at ${c}`);
    assert.equal(lvl.grid[GT][t.min - 2], '#', 'the ride starts at a bank');
    assert.equal(lvl.grid[GT][t.max + 2], '#', 'the ride ends at a bank');
    assert.ok(t.max - t.min >= 3, 'a real ride');
  }
});

test('3-2: swim under rock arches (too tall to jump, room to swim below)', () => {
  const lvl = levelOf('3-2');
  const swimCols = [...Array(lvl.cols).keys()].filter((c) => lvl.grid[GT][c] === 'w');
  assert.ok(swimCols.length >= 10);
  let arches = 0;
  for (const c of swimCols) {
    assert.ok(isSolid(lvl.grid[lvl.rows - 1][c]), 'the pool has a floor');
    if (isSolid(lvl.grid[GT - 1][c])) {
      arches++;
      let water = 0;
      for (let r = GT; r < lvl.rows && lvl.grid[r][c] === 'w'; r++) water++;
      assert.ok(water >= 2, 'at least 2 tiles of water to swim under the arch');
      assert.ok(GT * TILE - groundTopRow(lvl, c) * TILE > MAX_REACH, 'the arch is too tall to jump over');
    }
  }
  assert.ok(arches >= 4, 'there are arches to dive under');
});

test('4-1: slippery ice and snowball slopes', () => {
  const lvl = levelOf('4-1');
  assert.ok(lvl.grid.flat().filter((ch) => ch === 'I').length >= 10, 'ice');
  const runs = slopeRuns(lvl).filter((r) => r.solid);
  assert.ok(runs.length >= 2, 'slopes');
  const spawners = lvl.objects.filter((o) => o.type === 'snowball');
  assert.ok(spawners.length >= 1, 'snowballs');
  for (const s of spawners) {
    assert.ok(isSolid(lvl.grid[s.row + 1][s.col]), 'snowballs start on solid ground');
    assert.equal(lvl.grid[s.row + 1][s.col - 1], '/', 'snowballs start at the top of a slope and roll down it');
  }
  for (const run of runs) {
    for (let i = 0; i < run.n; i++) {
      const c = run.c0 + i, r = run.r0 - run.rise * i;
      assert.ok(isSolid(lvl.grid[r + 1][c]), 'solid ground under every slope tile');
    }
  }
});

test('4-2: Carrot Lifts', () => {
  assert.ok(count(levelOf('4-2'), 'lift') >= 2);
});

test('5-1: drifting clouds cross wide gaps', () => {
  const lvl = levelOf('5-1');
  const clouds = movers(lvl).filter((m) => m.type === 'cloud');
  assert.ok(clouds.length >= 2);
  for (const m of clouds) {
    assert.equal(lvl.grid[GT][m.min - 2], '#', 'the ride starts at the edge of the gap');
    assert.equal(lvl.grid[GT][m.max + 2], '#', 'the ride ends at the other side');
    for (let c = m.min - 1; c <= m.max + 1; c++) assert.ok(lvl.grid.every((row) => row[c] !== '#'), `a real gap at ${c}`);
  }
});

test('5-2: rainbow slides from a ledge down to the ground', () => {
  const lvl = levelOf('5-2');
  const rainbows = slopeRuns(lvl).filter((r) => !r.solid);
  assert.ok(rainbows.length >= 2);
  for (const rb of rainbows) {
    assert.ok(rb.n >= 5, 'a long slide');
    assert.equal(rb.rise, -1, 'slides go down to the right');
    assert.equal(groundTopRow(lvl, rb.c0 - 1), rb.r0, 'starts level with the ledge before it');
    const endRow = rb.r0 + rb.n;
    assert.equal(groundTopRow(lvl, rb.c0 + rb.n), endRow, 'lands level with the ground after it');
  }
});

test('level order and world order', () => {
  assert.deepEqual(LEVEL_ORDER, LEVEL_IDS);
  assert.equal(nextLevelId('1-1'), '1-2');
  assert.equal(nextLevelId('1-2'), '2-1');
  assert.equal(nextLevelId('4-2'), '5-1');
  assert.equal(nextLevelId('5-2'), null);
});
