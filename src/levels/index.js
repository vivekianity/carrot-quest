// All playable levels, in order. "Next level" follows this list.
import L11 from './1-1.js';
import L12 from './1-2.js';
import L21 from './2-1.js';
import L22 from './2-2.js';
import L31 from './3-1.js';
import L32 from './3-2.js';
import L41 from './4-1.js';
import L42 from './4-2.js';
import L51 from './5-1.js';
import L52 from './5-2.js';
import { LEVEL_TEST } from './test.js';

const ALL = [L11, L12, L21, L22, L31, L32, L41, L42, L51, L52];

export const LEVEL_ORDER = ALL.map((l) => l.id);
export const LEVEL_MAPS = Object.fromEntries(ALL.map((l) => [l.id, l]));
LEVEL_MAPS.test = { ...LEVEL_TEST, questions: '1-1' };

export function nextLevelId(id) {
  const i = LEVEL_ORDER.indexOf(id);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}
