// Save data: up to 4 child profiles, each with its own progress, checkpoints, learning record and
// control mode. Music and speech are shared by the whole iPad.
//
// Everything lives under one localStorage key. Every access is guarded: if storage is unavailable
// (private mode, blocked, or Node in the tests) we keep an in-memory copy for this session.
//
//  { profiles: [{ id, name, avatar, created }], current: id | null, music, speech,
//    'p:<id>': { levels, carrotBank, checkpoints, mastery, controlMode, lastLevel, endless,
//               wardrobe, stickersSeen } }
import { normaliseWardrobe } from './engine/shop.js';

const KEY = 'carrotquest.v1';
export const MAX_PROFILES = 4;
export const NAME_MAX = 10;
const GUEST = 'guest';            // used when no profile is picked (e.g. a ?level= test link)

let cache = null;

function storage() {
  try { return window.localStorage; } catch (e) { return null; }
}

function readAll() {
  if (cache) return cache;
  cache = {};
  try {
    const raw = storage()?.getItem(KEY);
    if (raw) cache = JSON.parse(raw) || {};
  } catch (e) { cache = {}; }
  return cache;
}

function writeAll() {
  try { storage()?.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* in-memory only */ }
}

export function load(key, fallback) {
  const all = readAll();
  return key in all ? all[key] : fallback;
}

export function save(key, value) {
  readAll()[key] = value;
  writeAll();
}

/** For tests: forget everything (memory and storage). */
export function resetAll() {
  cache = {};
  try { storage()?.removeItem(KEY); } catch (e) { /* ignore */ }
}

// ---- Profiles ------------------------------------------------------------------------------------
const blankProfileData = () => ({
  levels: {}, carrotBank: 0, checkpoints: {}, mastery: null, controlMode: 'easy', lastLevel: '1-1', endless: null,
  wardrobe: null, stickersSeen: [],
});

function currentId() {
  const id = load('current', null);
  return id && load('profiles', []).some((p) => p.id === id) ? id : GUEST;
}

function data(id = currentId()) {
  const k = `p:${id}`;
  const all = readAll();
  if (!all[k]) all[k] = blankProfileData();
  return { ...blankProfileData(), ...all[k] };
}

function update(fn, id = currentId()) {
  const d = data(id);
  fn(d);
  save(`p:${id}`, d);
  return d;
}

export const profiles = {
  list() { return load('profiles', []).map((p) => ({ ...p })); },
  get current() {
    const id = currentId();
    return id === GUEST ? null : this.list().find((p) => p.id === id);
  },
  get canAdd() { return this.list().length < MAX_PROFILES; },

  /** Add a child. Returns the new profile, or null when all 4 places are taken. */
  create({ name = '', avatar = 'bunny' } = {}) {
    const list = this.list();
    if (list.length >= MAX_PROFILES) return null;
    const clean = String(name).replace(/[^\p{L}\p{N} '-]/gu, '').trim().slice(0, NAME_MAX);
    let n = 1;
    while (list.some((p) => p.id === `k${n}`)) n++;
    const p = { id: `k${n}`, name: clean, avatar, created: Date.now() };
    const all = readAll();
    const fresh = blankProfileData();
    // The very first profile takes over progress saved before profiles existed.
    if (!list.length && (all.levels || all.carrotBank || all.checkpoints)) {
      fresh.levels = all.levels || {};
      fresh.carrotBank = all.carrotBank || 0;
      fresh.checkpoints = all.checkpoints || {};
      if (all.controlMode) fresh.controlMode = all.controlMode;
      delete all.levels; delete all.carrotBank; delete all.checkpoints; delete all.controlMode;
    }
    all[`p:${p.id}`] = fresh;
    save('profiles', [...list, p]);
    return p;
  },

  select(id) {
    if (!this.list().some((p) => p.id === id)) return false;
    save('current', id);
    return true;
  },

  /** Remove a child and all their progress (for the parent corner). */
  remove(id) {
    const all = readAll();
    delete all[`p:${id}`];
    save('profiles', this.list().filter((p) => p.id !== id));
    if (load('current', null) === id) save('current', null);
  },

  /** Total stars and finished levels, for the profile cards. */
  summary(id) {
    const d = readAll()[`p:${id}`] || blankProfileData();
    const levels = Object.values(d.levels || {});
    return { stars: levels.reduce((s, l) => s + (l.stars || 0), 0), done: levels.length, carrots: d.carrotBank || 0 };
  },
};

// ---- Settings ------------------------------------------------------------------------------------
export const settings = {
  get controlMode() { return data().controlMode === 'classic' ? 'classic' : 'easy'; },
  set controlMode(v) { update((d) => { d.controlMode = v === 'classic' ? 'classic' : 'easy'; }); },
  get speech() { return load('speech', true) !== false; },
  set speech(v) { save('speech', !!v); },
  get sound() { return load('sound', true) !== false; },
  set sound(v) { save('sound', !!v); },
  get music() { return load('music', true) !== false; },
  set music(v) { save('music', !!v); },
};

// ---- Progress: best stars per level, carrots banked for the Burrow shop, where Hoppy is on the map --
export const progress = {
  get levels() { return { ...data().levels }; },
  bestStars(id) { const l = data().levels[id]; return l ? l.stars : 0; },
  isDone(id) { return !!data().levels[id]; },
  /** The first level is always open; every other one opens when the one before it is finished. */
  isUnlocked(id, order) {
    const i = order.indexOf(id);
    return i <= 0 || !!data().levels[order[i - 1]];
  },
  /** Record a finished level; returns true if this was a new best. */
  complete(id, stars, carrots) {
    let prev = 0;
    update((d) => {
      prev = d.levels[id] ? d.levels[id].stars : 0;
      d.levels = { ...d.levels, [id]: { stars: Math.max(prev, stars), done: true } };
      d.carrotBank = (d.carrotBank || 0) + carrots;
    });
    return stars > prev;
  },
  addCarrots(n) { update((d) => { d.carrotBank = (d.carrotBank || 0) + n; }); },
  /** Spend carrots in the Burrow shop; false (and nothing spent) if there aren't enough. */
  spend(n) {
    if (!(n >= 0) || (data().carrotBank || 0) < n) return false;
    update((d) => { d.carrotBank -= n; });
    return true;
  },
  get carrotBank() { return data().carrotBank || 0; },
  get lastLevel() { return data().lastLevel || '1-1'; },
  set lastLevel(id) { update((d) => { d.lastLevel = id; }); },

  /** Endless Meadow: the round being played (with its map seed) and the best round reached. */
  get endless() { return { round: 1, seed: null, best: 0, ...(data().endless || {}) }; },
  set endless(v) { update((d) => { d.endless = { ...(d.endless || {}), ...v }; }); },
};

// ---- Checkpoints: where to resume a level the child left part-way --------------------------------
export const checkpoints = {
  get(id) { return data().checkpoints[id] || null; },
  set(id, cp) { update((d) => { d.checkpoints = { ...d.checkpoints, [id]: cp }; }); },
  clear(id) { update((d) => { const c = { ...d.checkpoints }; delete c[id]; d.checkpoints = c; }); },
};

// ---- Learning record (src/engine/mastery.js data) --------------------------------------------------
export const masteryStore = {
  load() { return data().mastery; },
  save(json) { update((d) => { d.mastery = json; }); },
};

// ---- Burrow wardrobe (src/engine/shop.js data) ------------------------------------------------------
export const wardrobeStore = {
  load() { return normaliseWardrobe(data().wardrobe); },
  save(w) { update((d) => { d.wardrobe = normaliseWardrobe(w); }); },
  /** Another child's wardrobe (Profiles screen dresses Hoppy before the map opens). */
  of(id) { return normaliseWardrobe(data(id).wardrobe); },
};

// ---- Sticker book: which earned stickers the child has already seen in the book -----------------------
export const stickerStore = {
  get seen() { return [...(data().stickersSeen || [])]; },
  markSeen(ids) { update((d) => { d.stickersSeen = [...new Set([...(d.stickersSeen || []), ...ids])]; }); },
};
