// The sticker book (GAME_DESIGN §8) — pure: no Phaser, no DOM.
// One sticker per boss put to sleep (finishing that world's second level), and one per times table
// mastered ("×7 Champion": all ten facts of the table mastered, either way round).

import { LEVELS, WORLDS } from './levels-config.js';

const BOSS_NAMES = { crow: 'Crow', owl: 'Owl', crab: 'Crab', penguin: 'Penguin', raccoon: 'Raccoon' };

export const STICKERS = [
  ...LEVELS.filter((l) => l.boss).map((l) => ({
    id: `boss-${l.boss}`, kind: 'boss', boss: l.boss, level: l.id, world: l.world,
    name: `Sleepy ${BOSS_NAMES[l.boss]}`,
    hint: `Help ${BOSS_NAMES[l.boss]} fall asleep in level ${l.id}`,
    said: `${BOSS_NAMES[l.boss]} is fast asleep! Shh!`,
    worldName: WORLDS[l.world].name,
  })),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => ({
    id: `table-${t}`, kind: 'table', table: t,
    name: `×${t} Champion`,
    hint: `Learn all of the ${t} times table`,
    said: `${t} times table champion!`,
  })),
];

export const stickerById = (id) => STICKERS.find((s) => s.id === id) || null;

/**
 * Which stickers are earned. `isDone(levelId)` says if a level is finished;
 * `tableMastered(t)` says if a table is mastered (from the learning engine).
 */
export function earnedStickers({ isDone, tableMastered }) {
  return STICKERS.filter((s) => (s.kind === 'boss' ? isDone(s.level) : tableMastered(s.table))).map((s) => s.id);
}

/** Earned stickers the child hasn't looked at in the book yet (they get a "New!" badge and peel on). */
export function unseenStickers(earned, seen = []) {
  const s = new Set(seen);
  return earned.filter((id) => !s.has(id));
}

/** Tables that just became mastered by learning `a × b` (so a sticker toast can pop up in the level). */
export function newlyMasteredTables(a, b, before, after) {
  return [...new Set([a, b])].filter((t) => !before(t) && after(t)).sort((x, y) => x - y);
}
