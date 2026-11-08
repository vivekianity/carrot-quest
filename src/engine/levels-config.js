// Level configs from GAME_DESIGN §3 (pure data + helpers; no Phaser, no DOM).
//
//  tables       the times tables this level teaches
//  multipliers  [lo, hi] range for the other factor
//  answer       'bubbles' (tap 1 of `choices`) or 'numpad' (type the answer)
//  review       true → about 40% of questions come from the tables of earlier levels
//  missingShare share of "missing number" questions (3 × ? = 12)
//  element      the new platform element this level introduces
//  boss         the world's boss at the end of the second level

export const WORLDS = {
  meadow:   { name: 'Meadow Hills',    emoji: '🌼', boss: 'crow' },
  mushroom: { name: 'Mushroom Forest', emoji: '🍄', boss: 'owl' },
  beach:    { name: 'Sunny Beach',     emoji: '🏖️', boss: 'crab' },
  snow:     { name: 'Snowy Peaks',     emoji: '❄️', boss: 'penguin' },
  candy:    { name: 'Candy Clouds',    emoji: '🍭', boss: 'raccoon' },
};

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const LEVELS = [
  { id: '1-1', world: 'meadow',   tables: [1, 2],  multipliers: [1, 5],  answer: 'bubbles', choices: 3, element: 'flat' },
  { id: '1-2', world: 'meadow',   tables: [2, 10], multipliers: [1, 10], answer: 'bubbles', choices: 3, element: 'platforms', boss: 'crow' },
  { id: '2-1', world: 'mushroom', tables: [5],     multipliers: [1, 10], answer: 'bubbles', choices: 3, element: 'mushrooms', review: true },
  { id: '2-2', world: 'mushroom', tables: [3],     multipliers: [1, 10], answer: 'bubbles', choices: 4, element: 'bridges', review: true, boss: 'owl' },
  { id: '3-1', world: 'beach',    tables: [4],     multipliers: [1, 10], answer: 'numpad', element: 'turtles', review: true },
  { id: '3-2', world: 'beach',    tables: [6],     multipliers: [1, 10], answer: 'numpad', element: 'swim', review: true, boss: 'crab' },
  { id: '4-1', world: 'snow',     tables: [7],     multipliers: [1, 10], answer: 'numpad', element: 'ice', review: true },
  { id: '4-2', world: 'snow',     tables: [8],     multipliers: [1, 10], answer: 'numpad', element: 'lifts', review: true, boss: 'penguin' },
  { id: '5-1', world: 'candy',    tables: [9],     multipliers: [1, 10], answer: 'numpad', element: 'clouds', review: true },
  { id: '5-2', world: 'candy',    tables: ALL,     multipliers: [1, 10], answer: 'numpad', element: 'rainbows', missingShare: 0.3, boss: 'raccoon' },
];

export const NEW_SHARE = 0.6;    // review levels: ~60% new table …
export const REVIEW_SHARE = 0.4; // … and ~40% earlier tables
export const NUMPAD_MAX_DIGITS = 3; // answers go up to 10 × 10 = 100

// After 5-2: Endless Meadow — a freshly generated level every round, with mixed facts from every table.
// The learning engine's weights (missed facts ×3) do most of the choosing here.
export const ENDLESS = {
  id: 'endless', world: 'meadow', tables: ALL, multipliers: [1, 10], answer: 'numpad', element: 'endless',
  missingShare: 0.15, unlockAfter: '5-2',
};

/** Full config for a level id, with the review tables worked out from earlier levels. */
export function levelConfig(id) {
  if (id === ENDLESS.id) {
    return {
      ...ENDLESS, tables: [...ENDLESS.tables], multipliers: [...ENDLESS.multipliers], choices: 3,
      review: false, reviewTables: [], reviewShare: 0, boss: null, worldName: 'Endless Meadow',
    };
  }
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i < 0) throw new Error(`Unknown level ${id}`);
  const base = LEVELS[i];
  const cfg = {
    ...base,
    tables: [...base.tables],
    multipliers: [...base.multipliers],
    choices: base.answer === 'bubbles' ? base.choices : 3, // numpad levels keep 3 spare choices (not shown)
    review: !!base.review,
    reviewTables: [],
    reviewShare: 0,
    missingShare: base.missingShare || 0,
    boss: base.boss || null,
    worldName: WORLDS[base.world].name,
  };
  if (cfg.review) {
    const earlier = new Set(LEVELS.slice(0, i).flatMap((l) => l.tables));
    cfg.tables.forEach((t) => earlier.delete(t));
    cfg.reviewTables = [...earlier].sort((a, b) => a - b);
    cfg.reviewShare = cfg.reviewTables.length ? REVIEW_SHARE : 0;
  }
  return cfg;
}

export const LEVEL_IDS = LEVELS.map((l) => l.id);
