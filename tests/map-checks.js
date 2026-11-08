// Shared map checks for the hand-made levels and the generated Endless Meadow rounds.
import assert from 'node:assert/strict';
import { bridgeRuns, liftSteps, logSpan, groundTopRow, moverColumns, SLOPES, TILE } from '../src/engine/level-map.js';
import { PHYS } from '../src/engine/jump.js';

const GT = 13; // ground surface row
// Highest a jump + double jump can lift Hoppy's feet (px), ignoring the floaty apex bonus.
export const MAX_REACH = (PHYS.jumpVelocity ** 2 + PHYS.doubleJumpVelocity ** 2) / (2 * PHYS.gravity) + 30;
// Furthest Hoppy can travel sideways in one jump + double jump at the same height (generous: 9 tiles).
export const MAX_JUMP_TILES = 9;

export const isSolid = (ch) => ch === '#' || ch === 'I';

/** Top y of every surface Hoppy can stand on in column c. */
export function surfaces(lvl, c) {
  const out = [];
  for (let r = 0; r < lvl.rows; r++) {
    const ch = lvl.grid[r][c];
    const above = r > 0 ? lvl.grid[r - 1][c] : '.';
    if ((isSolid(ch) || ch === '=') && !isSolid(above)) out.push(r * TILE);
  }
  return out;
}

/** Columns of the solid block containing (c, topRow), scanning left from c. */
export function blockStart(lvl, c, row) {
  while (c > 0 && isSolid(lvl.grid[row][c - 1])) c--;
  return c;
}

/**
 * Can Hoppy jump onto the top of a block (top y `topY`, first column c0) from a surface to its left?
 * A higher surface within MAX_JUMP_TILES is always a way on; a lower one only if it's within MAX_REACH.
 */
export function reachableFromLeft(lvl, c0, topY) {
  for (let c = Math.max(0, c0 - MAX_JUMP_TILES); c < c0; c++) {
    for (const y of surfaces(lvl, c)) if (y - topY <= MAX_REACH) return { c, y };
  }
  return null;
}

/** Runs of slope tiles: [{ ch, c0, r0, n, solid }]. */
export function slopeRuns(lvl) {
  const runs = [];
  for (let r = 0; r < lvl.rows; r++) {
    for (let c = 0; c < lvl.cols; c++) {
      const ch = lvl.grid[r][c];
      const sl = SLOPES[ch];
      if (!sl || (c > 0 && lvl.grid[r + sl.rise]?.[c - 1] === ch)) continue;
      let n = 1;
      while (lvl.grid[r - sl.rise * n]?.[c + n] === ch) n++;
      runs.push({ ch, c0: c, r0: r, n, ...sl });
    }
  }
  return runs;
}


/** Gates and bosses on the ground, boxes low enough, bridges over water, tunnels and lifts can't be skipped. */
export function assertBlocksWork(lvl) {
  const of = (t) => lvl.objects.filter((o) => o.type === t);
  for (const g of [...of('gate'), ...of('boss')]) assert.equal(lvl.grid[g.row + 1][g.col], '#', `gate/boss at ${g.col} on ground`);
  for (const b of of('qbox')) {
    let r = b.row + 1; while (lvl.grid[r][b.col] === '.') r++;
    assert.ok(r - b.row - 1 <= 3, `box at ${b.col} low enough to bump`);
  }
  for (const run of bridgeRuns(lvl)) {
    assert.equal(lvl.grid[run.row][run.c0 - 1], '#', 'bridge starts at a ledge');
    assert.equal(lvl.grid[run.row][run.c1 + 1], '#', 'bridge ends at a ledge');
    for (let c = run.c0; c <= run.c1; c++) assert.equal(lvl.grid[run.row + 1][c], '~', 'water under the bridge');
  }
  for (const l of of('log')) {
    const span = logSpan(lvl, l.col, l.row);
    assert.equal(span.bottomRow - span.topRow + 1, 2, 'tunnel is 2 tiles high');
    const hillTopRow = groundTopRow(lvl, l.col);
    const hillTop = hillTopRow * TILE;
    assert.ok((l.row + 1) * TILE - hillTop > MAX_REACH, 'the hill over the tunnel is too tall to jump');
    const from = reachableFromLeft(lvl, blockStart(lvl, l.col, hillTopRow), hillTop);
    assert.equal(from, null, `the tunnel hill at ${l.col} can be reached by jumping from column ${from?.c}`);
  }
  for (const k of of('lift')) {
    const lift = liftSteps(lvl, k.col, k.row);
    assert.equal(lift.cliffCol, k.col + 1, 'lift is right next to its cliff');
    assert.ok(lift.groundY - lift.cliffTopY > MAX_REACH, 'cliff is too tall to jump without the beanstalk');
    const from = reachableFromLeft(lvl, lift.cliffCol, lift.cliffTopY);
    assert.equal(from, null, `the cliff at ${lift.cliffCol} can be reached from column ${from?.c}`);
  }
}

/** Pits are ≤ 3 tiles wide unless a turtle, cloud or rainbow carries Hoppy across. */
export function assertPitsGenerous(lvl) {
  const ride = moverColumns(lvl);
  for (const run of slopeRuns(lvl)) if (!run.solid) for (let c = run.c0; c < run.c0 + run.n; c++) ride.add(c);
  let pit = 0;
  for (let c = 0; c < lvl.cols; c++) {
    const empty = lvl.grid.every((row) => !isSolid(row[c]) && row[c] !== '~' && row[c] !== 'w' && !SLOPES[row[c]]);
    pit = empty && !ride.has(c) ? pit + 1 : 0;
    assert.ok(pit <= 3, `pit wider than 3 tiles at column ${c}`);
  }
}
