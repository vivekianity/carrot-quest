// Question generation (pure: no Phaser, no DOM). Pass an `rng` for repeatable results in tests.

/** Small seeded random generator (returns 0 ≤ x < 1). */
export function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0..100 in words, for speech ("twenty-one"). */
export function numberWords(n) {
  if (n < 0 || !Number.isInteger(n)) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n === 100) return 'one hundred';
  return String(n);
}

/** 3×4 and 4×3 are the same fact family. */
export const factId = (a, b) => (a <= b ? `${a}x${b}` : `${b}x${a}`);

/** Every fact `m × t` for the given tables and multiplier range [lo, hi]. */
export function factsFor(tables, [lo, hi]) {
  const out = [];
  const keys = new Set();
  for (const t of tables) {
    for (let m = lo; m <= hi; m++) {
      const key = `${m}x${t}`;
      if (!keys.has(key)) { keys.add(key); out.push({ a: m, b: t }); }
    }
  }
  return out;
}

function swapDigits(n) {
  if (n < 10 || n > 99 || n % 10 === 0) return null;
  const s = String(n);
  return Number(s[1] + s[0]);
}

/**
 * Believable wrong answers in three tiers:
 * 1) neighbouring products, 2) a+b, digit swap, off-by-one, 3) a little further away (nearest first).
 */
export function wrongAnswerCandidates(a, b) {
  const ans = a * b;
  const ok = (n) => Number.isInteger(n) && n > 0 && n !== ans && n <= 120;
  const used = new Set();
  const tier = (list) => list.filter((n) => ok(n) && !used.has(n) && used.add(n));
  const t1 = tier([(a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1)]);
  const t2 = tier([a + b, swapDigits(ans), ans + 1, ans - 1]);
  const t3 = tier([ans + 2, ans - 2, (a + 2) * b, a * (b + 2), ans + 3, ans - 3, ans + 10, ans - 10])
    .sort((x, y) => Math.abs(x - ans) - Math.abs(y - ans));
  return [t1, t2, t3];
}

/** `count` distinct wrong answers: at least one neighbouring product when possible. */
export function wrongAnswers(a, b, count, rng = Math.random) {
  const ans = a * b;
  const [t1, t2, t3] = wrongAnswerCandidates(a, b);
  const out = [];
  const s1 = shuffle(t1, rng);
  if (s1.length) out.push(s1.shift());
  for (const n of shuffle([...s1, ...t2], rng)) if (out.length < count) out.push(n);
  for (const n of t3) if (out.length < count) out.push(n);
  for (let k = 1; out.length < count; k++) if (!out.includes(ans + k)) out.push(ans + k);
  return out;
}

/** A ready-to-show question with shuffled answer choices. `before ▢ after` is how the sign lays it out. */
export function makeQuestion({ a, b }, { choices = 3, rng = Math.random } = {}) {
  const answer = a * b;
  return {
    kind: 'product',
    a, b, answer,
    id: factId(a, b),
    key: `${a}x${b}`,
    text: `${a} × ${b}`,
    before: `${a} × ${b} =`,
    after: '',
    speech: `${numberWords(a)} times ${numberWords(b)}`,
    choices: shuffle([answer, ...wrongAnswers(a, b, choices - 1, rng)], rng),
    // Counting picture: `rows` rows of `perRow` carrots.
    rows: a, perRow: b,
  };
}

/** Believable wrong answers for a missing factor: neighbours of the right one (1–10 first). */
export function missingWrongAnswers(answer, known, count, rng = Math.random) {
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3, answer - 3, known]
    .filter((n, i, arr) => n >= 1 && n !== answer && arr.indexOf(n) === i);
  const inRange = near.filter((n) => n <= 10);
  const firstTwo = shuffle(inRange.slice(0, 2), rng);
  const out = [];
  for (const n of [...firstTwo, ...inRange.slice(2), ...near]) if (out.length < count && !out.includes(n)) out.push(n);
  for (let k = 1; out.length < count; k++) if (!out.includes(answer + k)) out.push(answer + k);
  return out;
}

/**
 * Missing-number question: `3 × ? = 12` (hide 'b') or `? × 4 = 12` (hide 'a').
 * The answer is the hidden factor; the counting picture counts in groups of the known factor.
 */
export function makeMissingQuestion({ a, b }, { choices = 3, rng = Math.random, hide = null } = {}) {
  const product = a * b;
  const which = hide || (rng() < 0.5 ? 'a' : 'b');
  const answer = which === 'b' ? b : a;
  const known = which === 'b' ? a : b;
  const pw = numberWords(product);
  return {
    kind: 'missing',
    hide: which,
    a, b, answer, product,
    id: factId(a, b),
    key: `${a}x${b}`,
    text: which === 'b' ? `${a} × ? = ${product}` : `? × ${b} = ${product}`,
    before: which === 'b' ? `${a} ×` : '',
    after: which === 'b' ? `= ${product}` : `× ${b} = ${product}`,
    speech: which === 'b' ? `${numberWords(a)} times what makes ${pw}` : `what times ${numberWords(b)} makes ${pw}`,
    choices: shuffle([answer, ...missingWrongAnswers(answer, known, choices - 1, rng)], rng),
    rows: answer, perRow: known,
  };
}

/**
 * Picks the questions for one play-through of a level.
 *  - never the same fact (or its flip) on two blocks in a row
 *  - review levels mix in earlier tables (config.reviewShare, ~40%)
 *  - facts used less often in this level are preferred
 *  - a fact missed on the first try comes back later (after at least one other block)
 *  - levels with `missingShare` mix in missing-number questions (3 × ? = 12)
 *  - `weight(fact)` lets the learning engine bias choices (e.g. recently missed ×3)
 *  - `mastery` (src/engine/mastery.js): its weights are used, and its queued "flip it!" facts
 *    (4 × 3 after 3 × 4 is mastered) are served as soon as one fits this level
 */
export function createQuestionPicker(config, { rng = Math.random, weight = () => 1, mastery = null } = {}) {
  const levelTables = new Set([...config.tables, ...(config.reviewTables || [])]);
  const [, hiMult] = config.multipliers;
  const fits = (a, b) => (levelTables.has(a) && b <= Math.max(hiMult, 10)) || (levelTables.has(b) && a <= Math.max(hiMult, 10));
  const factWeight = mastery ? (f) => weight(f) * mastery.weight(f.a, f.b) : weight;
  const main = factsFor(config.tables, config.multipliers);
  const mainKeys = new Set(main.map((f) => `${f.a}x${f.b}`));
  const review = factsFor(config.reviewTables || [], config.multipliers).filter((f) => !mainKeys.has(`${f.a}x${f.b}`));
  const reviewShare = review.length ? (config.reviewShare ?? 0) : 0;
  const missingShare = config.missingShare || 0;
  const choices = config.choices || 3;

  let lastId = null;
  let served = 0;
  const seen = new Map();
  const comeBack = [];

  function pickFrom(pool, allowRepeat = false) {
    const cands = pool.filter((f) => allowRepeat || factId(f.a, f.b) !== lastId);
    if (!cands.length) return null;
    const ws = cands.map((f) => Math.max(0, factWeight(f)) / (1 + 2 * (seen.get(`${f.a}x${f.b}`) || 0)));
    const total = ws.reduce((s, w) => s + w, 0);
    if (total <= 0) return cands[Math.floor(rng() * cands.length)];
    let r = rng() * total;
    for (let i = 0; i < cands.length; i++) { r -= ws[i]; if (r < 0) return cands[i]; }
    return cands[cands.length - 1];
  }

  return {
    next() {
      served++;
      let fact = null;
      const due = comeBack.findIndex((c) => c.due <= served && c.id !== lastId);
      if (due >= 0) fact = comeBack.splice(due, 1)[0].fact;
      if (!fact && mastery) {
        const flip = mastery.takeFlip((a, b) => fits(a, b) && factId(a, b) !== lastId);
        if (flip) {
          const key = `${flip.a}x${flip.b}`;
          lastId = factId(flip.a, flip.b);
          seen.set(key, (seen.get(key) || 0) + 1);
          return { ...makeQuestion(flip, { choices, rng }), flip: flip.from };
        }
      }
      if (!fact) {
        const useReview = reviewShare > 0 && rng() < reviewShare;
        fact = pickFrom(useReview ? review : main) || pickFrom(useReview ? main : review) || pickFrom(main, true);
      }
      const key = `${fact.a}x${fact.b}`;
      lastId = factId(fact.a, fact.b);
      seen.set(key, (seen.get(key) || 0) + 1);
      const missing = missingShare > 0 && rng() < missingShare;
      return missing ? makeMissingQuestion(fact, { choices, rng }) : makeQuestion(fact, { choices, rng });
    },
    /** Tell the picker how it went; a first-try miss brings the fact back later in the level. */
    recordResult(q, firstTry) {
      if (firstTry || comeBack.some((c) => c.key === q.key)) return;
      comeBack.push({ fact: { a: q.a, b: q.b }, id: q.id, key: q.key, due: served + 2 });
    },
    get pending() { return comeBack.map((c) => c.key); },
  };
}
