// Pure level-map helpers (no Phaser, no DOM) so they can be unit-tested with `node --test`.

export const TILE = 64;

// Edge-exposure bits used to pick the right ground tile.
export const EDGE = { T: 1, R: 2, B: 4, L: 8 };
export const GROUND_VARIANTS = 2;                     // 0..31  ground (2 variants × 16 edge masks)
export const PLATFORM_BASE = GROUND_VARIANTS * 16;    // 32..35 floating platform (L/R end flags)
export const ICE_BASE = PLATFORM_BASE + 4;            // 36..51 slippery ice (16 edge masks)
export const SLOPE_BASE = ICE_BASE + 16;              // 52..55 slopes: / \\ and rainbow ( )
export const TILE_COUNT = SLOPE_BASE + 4;

/**
 * Slopes. `/` and `\\` are solid ground slopes (Hoppy walks up and slides down them);
 * `(` and `)` are floating rainbow slides (land on them from above, then whoosh down).
 * rise +1 = the surface goes up to the right, -1 = down to the right.
 */
export const SLOPES = {
  '/': { rise: 1, solid: true, index: SLOPE_BASE },
  '\\': { rise: -1, solid: true, index: SLOPE_BASE + 1 },
  '(': { rise: 1, solid: false, index: SLOPE_BASE + 2 },
  ')': { rise: -1, solid: false, index: SLOPE_BASE + 3 },
};

/**
 * Map characters that place things rather than terrain (see src/levels/README.md).
 * Terrain characters: '#' ground, 'I' ice, '=' floating platform, '~' water (balloon rescue),
 * 'w' swimming water, slopes '/' '\\' '(' ')', '-' moving-platform path, '.' empty, 'P' start.
 */
export const OBJECTS = {
  G: 'gate',      // Stone Gate (stands on the ground)
  '?': 'qbox',    // Question Box (bump from below)
  _: 'plank',     // Broken Bridge plank spot (a run of _ over a water gap)
  L: 'log',       // Sleepy Log (bottom tile of a tunnel)
  K: 'lift',      // Carrot Lift base (beanstalk grows up the cliff to its right)
  B: 'boss',      // boss gate (the world's boss guards a fence gate)
  c: 'carrot',    // small carrot
  '*': 'star',    // hidden Star Carrot
  m: 'mushroom',  // bouncy mushroom
  F: 'flower',    // checkpoint flower
  C: 'goal',      // Golden Carrot
  T: 'turtle',    // swimming turtle platform (rides along its - path)
  D: 'cloud',     // drifting cloud platform (rides along its - path)
  S: 'snowball',  // snowballs roll down the slope from here
};
export const MOVERS = new Set(['turtle', 'cloud']);
export const TERRAIN = new Set(['#', 'I', '=', '~', 'w', ...Object.keys(SLOPES)]);
const SOLID = new Set(['#', 'I']);

/** Parse a text tile map into a grid of characters. */
export function parseLevel(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim().length > 0);
  const cols = Math.max(...lines.map((l) => l.length));
  const rows = lines.length;
  const grid = lines.map((l) => l.padEnd(cols, '.').split(''));
  let start = { col: 1, row: 0 };
  const objects = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (ch === 'P') { start = { col: c, row: r }; grid[r][c] = '.'; }
      else if (OBJECTS[ch]) {
        const o = { type: OBJECTS[ch], col: c, row: r };
        if (MOVERS.has(o.type)) {
          // The path is the run of '-' on either side of the mover: { min, max } columns of its centre.
          let lo = c, hi = c;
          while (lines[r][lo - 1] === '-') lo--;
          while (lines[r][hi + 1] === '-') hi++;
          o.min = lo; o.max = hi;
        }
        objects.push(o);
        grid[r][c] = '.';
      } else if (!TERRAIN.has(ch)) grid[r][c] = '.';
    }
  }
  // Things placed inside swimming water (carrots to collect underwater) keep the water around them.
  const terrainSide = (r, c, step) => {
    for (let x = c + step; x >= 0 && x < cols; x += step) {
      const ch = lines[r][x] ?? '.';
      if (!OBJECTS[ch] && ch !== 'P') return ch;
    }
    return '.';
  };
  for (const o of objects) {
    if (!MOVERS.has(o.type) && terrainSide(o.row, o.col, -1) === 'w' && terrainSide(o.row, o.col, 1) === 'w') grid[o.row][o.col] = 'w';
  }
  return { cols, rows, grid, start, objects, width: cols * TILE, height: rows * TILE };
}

export function charAt(level, c, r) {
  if (r < 0) return '.';
  if (r >= level.rows) return '#'; // ground continues below the map edge
  if (c < 0 || c >= level.cols) {
    // ground continues past the left/right edges (no outline at the world border)
    const cc = Math.max(0, Math.min(level.cols - 1, c));
    return SOLID.has(level.grid[r][cc]) ? '#' : '.';
  }
  return level.grid[r][c];
}

/** Solid ground (ordinary or ice). */
export const isGround = (level, c, r) => SOLID.has(charAt(level, c, r));
export const isIce = (level, c, r) => charAt(level, c, r) === 'I';
export const isWater = (level, c, r) => r >= 0 && r < level.rows && charAt(level, c, r) === '~';
export const isSwim = (level, c, r) => r >= 0 && r < level.rows && charAt(level, c, r) === 'w';
export const isPlatform = (level, c, r) => charAt(level, c, r) === '=';
export const isSlope = (level, c, r) => !!SLOPES[charAt(level, c, r)];
export const isStandable = (level, c, r) => { const ch = charAt(level, c, r); return SOLID.has(ch) || ch === '='; };
// For drawing edges: a solid slope hides the edge of the ground it leans on.
const joins = (level, c, r) => { const ch = charAt(level, c, r); return SOLID.has(ch) || ch === '/' || ch === '\\'; };

/** Tileset index for the tile at (c, r), or -1 for empty. */
export function tileIndexFor(level, c, r) {
  const ch = level.grid[r][c];
  if (ch === '#' || ch === 'I') {
    let mask = 0;
    if (!joins(level, c, r - 1)) mask |= EDGE.T;
    if (!joins(level, c + 1, r)) mask |= EDGE.R;
    if (!joins(level, c, r + 1)) mask |= EDGE.B;
    if (!joins(level, c - 1, r)) mask |= EDGE.L;
    if (ch === 'I') return ICE_BASE + mask;
    const variant = (c * 7 + r * 13) % 3 === 0 ? 1 : 0;
    return variant * 16 + mask;
  }
  if (SLOPES[ch]) return SLOPES[ch].index;
  if (ch === '=') {
    const left = !isPlatform(level, c - 1, r);
    const right = !isPlatform(level, c + 1, r);
    return PLATFORM_BASE + (left ? 1 : 0) + (right ? 2 : 0);
  }
  return -1;
}

/** 2D array of tile indices for a Phaser tilemap. */
export function tileData(level) {
  const data = [];
  for (let r = 0; r < level.rows; r++) {
    const row = [];
    for (let c = 0; c < level.cols; c++) row.push(tileIndexFor(level, c, r));
    data.push(row);
  }
  return data;
}

/** Surface height of a slope tile at world-x `x`. */
export function slopeY(ch, c, r, x) {
  const lx = Math.max(0, Math.min(TILE, x - c * TILE));
  return SLOPES[ch].rise > 0 ? (r + 1) * TILE - lx : r * TILE + lx;
}

/** The slope surface in the column under world-x `x` closest to world-y `y`: { y, ch, col, row, rise, solid } or null. */
export function slopeAt(level, x, y) {
  const c = Math.floor(x / TILE);
  if (c < 0 || c >= level.cols) return null;
  const r0 = Math.floor(y / TILE);
  let best = null;
  for (let r = r0 - 1; r <= r0 + 1; r++) {
    if (r < 0 || r >= level.rows) continue;
    const ch = level.grid[r][c];
    if (!SLOPES[ch]) continue;
    const sy = slopeY(ch, c, r, x);
    if (!best || Math.abs(sy - y) < Math.abs(best.y - y)) best = { y: sy, ch, col: c, row: r, rise: SLOPES[ch].rise, solid: SLOPES[ch].solid };
  }
  return best;
}

/** World-y of the first standable surface at or below world-y `y` in the column under world-x `x`; null if none (a pit). */
export function surfaceBelow(level, x, y) {
  const c = Math.floor(x / TILE);
  if (c < 0 || c >= level.cols) return null;
  for (let r = Math.max(0, Math.floor(y / TILE)); r < level.rows; r++) {
    const ch = level.grid[r][c];
    if (SLOPES[ch]) {
      const sy = slopeY(ch, c, r, x);
      if (sy >= y - 1) return sy;
      continue;
    }
    if (isStandable(level, c, r) && !isGround(level, c, r - 1) && !isSlope(level, c, r - 1)) {
      const top = r * TILE;
      if (top >= y - 1) return top;
    }
  }
  return null;
}

/** Row index of the top ground surface in column c, or -1. */
export function groundTopRow(level, c) {
  if (c < 0 || c >= level.cols) return -1;
  for (let r = 0; r < level.rows; r++) if (SOLID.has(level.grid[r][c])) return r;
  return -1;
}

/**
 * A safe place to put Hoppy back after a fall: solid ground with the same height
 * one tile either side, searching from `x` back in the direction opposite to `dir`.
 */
export function findSafeSpot(level, x, dir = 1) {
  const step = dir >= 0 ? -1 : 1;
  let c = Math.max(1, Math.min(level.cols - 2, Math.floor(x / TILE)));
  for (let i = 0; i < level.cols; i++, c += step) {
    if (c < 1 || c > level.cols - 2) break;
    const r = groundTopRow(level, c);
    if (r < 0) continue;
    if (groundTopRow(level, c - 1) === r && groundTopRow(level, c + 1) === r && calm(level, c, r)) {
      return { x: c * TILE + TILE / 2, y: r * TILE };
    }
  }
  const s = level.start;
  return { x: s.col * TILE + TILE / 2, y: (groundTopRow(level, s.col) || s.row + 1) * TILE };
}

// No water, slope or ice right there (a calm spot to land after a balloon ride).
function calm(level, c, r) {
  for (let dc = -1; dc <= 1; dc++) {
    if (isIce(level, c + dc, r)) return false;
    for (let rr = Math.max(0, r - 3); rr < r; rr++) {
      const ch = charAt(level, c + dc, rr);
      if (ch === 'w' || ch === '~' || SLOPES[ch]) return false;
    }
  }
  return true;
}

/** Group adjacent plank spots in the same row into bridges: [{ row, c0, c1 }]. */
export function bridgeRuns(level) {
  const planks = level.objects.filter((o) => o.type === 'plank').sort((a, b) => a.row - b.row || a.col - b.col);
  const runs = [];
  for (const p of planks) {
    const last = runs[runs.length - 1];
    if (last && last.row === p.row && last.c1 === p.col - 1) last.c1 = p.col;
    else runs.push({ row: p.row, c0: p.col, c1: p.col });
  }
  return runs;
}

/** A Sleepy Log fills its tunnel from its tile up to the ceiling: { topRow, bottomRow }. */
export function logSpan(level, col, row) {
  let top = row;
  while (top - 1 >= 0 && !isGround(level, col, top - 1)) top--;
  return { topRow: top, bottomRow: row };
}

/**
 * Carrot Lift stairs: leaves climb the cliff face to the right of the lift base.
 * Returns { cliffCol, cliffTopY, groundY, steps: [y...] } with steps no taller than `maxStep` px.
 */
export function liftSteps(level, col, row, maxStep = 112) {
  let cliffCol = col + 1;
  while (cliffCol < level.cols && !isGround(level, cliffCol, row)) cliffCol++;
  const cliffTopY = groundTopRow(level, cliffCol) * TILE;
  const groundY = (row + 1) * TILE;
  const rise = groundY - cliffTopY;
  const n = Math.max(1, Math.ceil(rise / maxStep));
  const steps = [];
  for (let i = 1; i <= n; i++) steps.push(Math.round(groundY - (rise * i) / n));
  return { cliffCol, cliffTopY, groundY, steps };
}

/** Moving platforms (turtles, clouds) with their paths in world px: { type, col, row, x0, x1, y }. */
export function movers(level) {
  return level.objects.filter((o) => MOVERS.has(o.type)).map((o) => ({
    ...o, x0: o.min * TILE + TILE / 2, x1: o.max * TILE + TILE / 2, y: (o.row + 1) * TILE,
  }));
}

/** Columns crossed by a moving platform's path (a wide gap there is fine: you ride across). */
export function moverColumns(level, width = 2) {
  const cols = new Set();
  for (const o of level.objects) {
    if (!MOVERS.has(o.type)) continue;
    for (let c = o.min - Math.ceil(width / 2); c <= o.max + Math.ceil(width / 2); c++) cols.add(c);
  }
  return cols;
}
