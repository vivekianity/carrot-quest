// Learning engine (GAME_DESIGN §7) — pure: no Phaser, no DOM. One instance per child profile.
//
//  - Every fact `a × b` is tracked on its own (3 × 4 and 4 × 3 separately): attempts, right first try,
//    average answer time, last seen.
//  - Mastered = right on the first try MASTERY_RUN times in a row, each in under MASTERY_MS.
//    A first-try miss (or a slow answer) starts the run again; a miss on a mastered fact makes it
//    "learning" again, so it gets practised.
//  - Recently missed facts are MISSED_WEIGHT× more likely to be picked; mastered facts still come back
//    now and then (MASTERED_WEIGHT).
//  - 3 × 4 and 4 × 3 are linked: once one is mastered, the other is queued as a "flip it!" question.
//
// Saved shape (plain JSON):
//  { v: 1, seq, facts: { '3x4': { n, ok, ms, last, run, m, miss } }, flips: ['4x3', …] }
//    n    attempts (questions seen)        ok   right on the first try
//    ms   average answer time (ms)         last time last seen (ms since epoch)
//    run  first-try-fast streak            m    1 when mastered
//    miss answer number (`seq`) of the last first-try miss, or null once answered right again

export const MASTERY_RUN = 3;
export const MASTERY_MS = 6000;
export const MISSED_WEIGHT = 3;
export const MASTERED_WEIGHT = 0.3;
export const RECENT_WINDOW = 30;     // a miss counts as "recent" for this many answers
export const MAX_FACTOR = 10;

const key = (a, b) => `${a}x${b}`;
const parse = (k) => { const [a, b] = k.split('x').map(Number); return { a, b }; };

function emptyFact() {
  return { n: 0, ok: 0, ms: 0, last: 0, run: 0, m: 0, miss: null };
}

/** A fresh, empty record (what a new profile starts with). */
export function emptyMastery() {
  return { v: 1, seq: 0, facts: {}, flips: [] };
}

export function createMastery(saved = null) {
  const data = emptyMastery();
  if (saved && typeof saved === 'object') {
    data.seq = Number(saved.seq) || 0;
    if (saved.facts && typeof saved.facts === 'object') {
      for (const [k, f] of Object.entries(saved.facts)) data.facts[k] = { ...emptyFact(), ...f };
    }
    if (Array.isArray(saved.flips)) data.flips = saved.flips.filter((k) => /^\d+x\d+$/.test(k));
  }

  const get = (a, b) => data.facts[key(a, b)] || null;

  const api = {
    /** 'new' (never seen), 'learning' or 'mastered'. */
    status(a, b) {
      const f = get(a, b);
      if (!f || !f.n) return 'new';
      return f.m ? 'mastered' : 'learning';
    },

    fact(a, b) { const f = get(a, b); return f ? { ...f } : null; },

    /** True if this fact was missed on the first try recently and not yet answered right since. */
    recentlyMissed(a, b) {
      const f = get(a, b);
      return !!f && f.miss !== null && data.seq - f.miss < RECENT_WINDOW;
    },

    /** Picking weight for a fact: missed ×3, mastered ×0.3, everything else ×1. */
    weight(a, b) {
      if (api.recentlyMissed(a, b)) return MISSED_WEIGHT;
      if (api.status(a, b) === 'mastered') return MASTERED_WEIGHT;
      return 1;
    },

    /**
     * Record how a question went. `firstTry`: right on the first try; `ms`: time to answer.
     * Returns what changed: { mastered, lost, flip } (flip = 'bxa' key newly queued, or null).
     */
    record(a, b, { firstTry, ms = 0, now = Date.now() } = {}) {
      const k = key(a, b);
      const f = data.facts[k] || (data.facts[k] = emptyFact());
      data.seq++;
      f.n++;
      f.ms = Math.round(f.ms + ((Math.max(0, ms) - f.ms) / f.n));
      f.last = now;
      const out = { mastered: false, lost: false, flip: null };
      if (firstTry) {
        f.ok++;
        f.miss = null;
        f.run = ms < MASTERY_MS ? f.run + 1 : 0;
        if (!f.m && f.run >= MASTERY_RUN) {
          f.m = 1;
          out.mastered = true;
          out.flip = api.queueFlip(a, b);
        }
      } else {
        f.run = 0;
        f.miss = data.seq;
        if (f.m) { f.m = 0; out.lost = true; }
      }
      return out;
    },

    /** Queue the turned-around fact (b × a) unless it is the same fact, already mastered or queued. */
    queueFlip(a, b) {
      if (a === b) return null;
      const fk = key(b, a);
      if (api.status(b, a) === 'mastered' || data.flips.includes(fk)) return null;
      data.flips.push(fk);
      return fk;
    },

    get pendingFlips() { return [...data.flips]; },

    /**
     * Take the first queued flip that `allowed(a, b)` accepts (e.g. it fits the level's tables).
     * Returns { a, b, from: { a: b, b: a } } and removes it from the queue, or null.
     */
    takeFlip(allowed = () => true) {
      const i = data.flips.findIndex((k) => { const { a, b } = parse(k); return allowed(a, b); });
      if (i < 0) return null;
      const { a, b } = parse(data.flips.splice(i, 1)[0]);
      return { a, b, from: { a: b, b: a } };
    },

    /** Status of every fact 1–10 × 1–10, as rows[a-1][b-1] (for the parent corner grid). */
    grid() {
      const rows = [];
      for (let a = 1; a <= MAX_FACTOR; a++) {
        const row = [];
        for (let b = 1; b <= MAX_FACTOR; b++) row.push(api.status(a, b));
        rows.push(row);
      }
      return rows;
    },

    /** Counts of new / learning / mastered facts among the 100. */
    summary() {
      const out = { new: 0, learning: 0, mastered: 0 };
      for (const row of api.grid()) for (const s of row) out[s]++;
      return out;
    },

    /** A table is mastered when all ten of its facts (t × 1 … t × 10, either way round) are. */
    tableMastered(t) {
      for (let m = 1; m <= MAX_FACTOR; m++) if (api.status(m, t) !== 'mastered' && api.status(t, m) !== 'mastered') return false;
      return true;
    },

    toJSON() {
      return { v: 1, seq: data.seq, facts: JSON.parse(JSON.stringify(data.facts)), flips: [...data.flips] };
    },
  };
  return api;
}
