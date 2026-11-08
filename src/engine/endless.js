// Endless Meadow (GAME_DESIGN §3, after 5-2): a new meadow level is generated for every round from
// hand-made chunks, so the run never ends. Pure: no Phaser, no DOM. The same (round, seed) always
// gives the same map, so a checkpoint can be resumed after leaving.
//
// Every chunk keeps the rules the hand-made levels follow (see src/levels/README.md):
// ground surface on row 13, pits ≤ 3 tiles, Question Boxes low enough to bump, tunnel hills too tall
// to jump with no high platform within 9 tiles to their left.
import { mulberry32 } from './questions.js';

export const ENDLESS_ID = 'endless';
const ROWS = 16;
const GROUND = 13;           // first ground row; Hoppy and blocks stand on row 12

export function endlessChallengeCount(round) {
  return 6 + Math.min(Math.max(round, 1) - 1, 2);   // 6 in round 1, up to 8 from round 3
}

/** Build the level definition for one round: { id, name, world, questions, round, seed, map }. */
export function makeEndlessLevel(round = 1, seed = 1) {
  const rng = mulberry32((seed * 7919 + round * 104729) >>> 0);
  const pick = (list) => list[Math.floor(rng() * list.length)];
  const cols = [];                                    // one array of ROWS chars per column

  const column = () => { const c = new Array(ROWS).fill('.'); cols.push(c); return c; };
  const ground = (n) => { const x = cols.length; for (let i = 0; i < n; i++) { const c = column(); for (let r = GROUND; r < ROWS; r++) c[r] = '#'; } return x; };
  const put = (x, r, ch) => { cols[x][r] = ch; };
  const carrots = (x, r, n) => { for (let i = 0; i < n; i++) put(x + i, r, 'c'); };

  // ---- Chunks ----------------------------------------------------------------------------------
  const chunks = {
    start() { const x = ground(10); put(x + 3, 12, 'P'); carrots(x + 6, 12, 3); },
    gate() { const x = ground(10); carrots(x + 1, 12, 3); put(x + 6, 12, 'G'); },
    qbox() {
      const x = ground(11);
      for (let i = 1; i <= 3; i++) put(x + i, 10, '=');
      carrots(x + 1, 9, 3);
      put(x + 7, 10, '?');
    },
    bridge() {
      const x = ground(3);
      const n = 4 + Math.floor(rng() * 2);
      for (let i = 0; i < n; i++) { const c = column(); c[GROUND] = '_'; c[GROUND + 1] = '~'; c[GROUND + 2] = '~'; }
      carrots(x + 3, 11, n);
      ground(4);
    },
    log() {
      // 10 calm tiles first, so nothing high is close enough to jump onto the hill from.
      const x = ground(10);
      carrots(x + 2, 12, 4);
      const h = ground(8);
      for (let i = 0; i < 8; i++) for (let r = 6; r <= 10; r++) put(h + i, r, '#');
      put(h + 2, 12, 'L');
      carrots(h + 4, 12, 3);
      ground(3);
    },
    flat() { const x = ground(6 + Math.floor(rng() * 3)); carrots(x + 2, 11 - Math.floor(rng() * 2), 3); },
    pit() {
      const x = ground(3);
      const n = 2 + Math.floor(rng() * 2);
      for (let i = 0; i < n; i++) column();
      ground(3);
      carrots(x + 2, 10, n + 2);
    },
    hills() {
      const x = ground(10);
      for (let i = 2; i <= 7; i++) put(x + i, 12, '#');
      for (let i = 4; i <= 5; i++) put(x + i, 11, '#');
      carrots(x + 4, 10, 2);
    },
    platforms() {
      const x = ground(10);
      for (let i = 1; i <= 3; i++) put(x + i, 10, '=');
      for (let i = 5; i <= 8; i++) put(x + i, 8, '=');
      carrots(x + 1, 9, 3);
      carrots(x + 5, 7, 4);
    },
    mushroom(star = false) {
      const x = ground(9);
      put(x + 3, 12, 'm');
      for (const r of [6, 8, 10]) put(x + 3, r, 'c');
      if (star) {                                   // super-bounce up to the hidden Star Carrot
        for (let i = 2; i <= 6; i++) put(x + i, 4, '=');
        carrots(x + 3, 3, 2);
        put(x + 5, 3, '*');
      }
    },
    flower() { const x = ground(6); put(x + 3, 12, 'F'); },
    end() {
      const x = ground(14);
      for (let i = 3; i < 14; i++) put(x + i, 12, '#');
      for (let i = 6; i < 14; i++) put(x + i, 11, '#');
      carrots(x + 3, 11, 2);
      put(x + 10, 10, 'C');
    },
  };

  // ---- The round: START → Gate → (filler · challenge)… with a checkpoint half-way → hill → Golden Carrot
  const n = endlessChallengeCount(round);
  const order = ['gate'];
  while (order.length < n) {
    const prev = order[order.length - 1];
    const logs = order.filter((t) => t === 'log').length;
    const options = ['gate', 'qbox', 'bridge', 'log', 'gate', 'qbox'].filter((t) => t !== prev && (t !== 'log' || logs < 2));
    order.push(pick(options));
  }
  const starAt = 2 + Math.floor(rng() * (n - 3));   // which challenge the Star Carrot mushroom comes after
  const half = Math.floor(n / 2);

  chunks.start();
  order.forEach((type, i) => {
    if (i === half) chunks.flower();
    chunks[type]();
    if (i === starAt) chunks.mushroom(true);
    else if (i < n - 1 && rng() < 0.4 && cols.length < 120) {   // a little extra fun, but keep rounds short
      const f = pick(['flat', 'pit', 'hills', 'platforms', 'mushroom', 'pit']);
      if (f === 'mushroom') chunks.mushroom(false); else chunks[f]();
    }
  });
  chunks.flat();
  chunks.end();

  const lines = [];
  for (let r = 0; r < ROWS; r++) lines.push(cols.map((c) => c[r]).join(''));
  return {
    id: ENDLESS_ID,
    name: `Endless Meadow · Round ${round}`,
    world: 'meadow',
    questions: ENDLESS_ID,
    round,
    seed,
    map: '\n' + lines.join('\n') + '\n',
  };
}

/** A new random seed for the next round (kept small so it saves neatly). */
export function newEndlessSeed(rng = Math.random) {
  return 1 + Math.floor(rng() * 999999);
}
