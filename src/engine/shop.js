// The Burrow carrot shop (GAME_DESIGN §8) — pure: no Phaser, no DOM.
// Carrots collected in levels buy outfits for Hoppy (hats, glasses, capes, scarves in new colours)
// and decorations for her burrow. Outfits show up in every level; decorations show up in the burrow.
//
// Wardrobe (saved per child):
//  { owned: ['scarf-red', …], wearing: { hat, glasses, cape, scarf }, decor: ['rug', …] (put out) }

export const SLOTS = ['hat', 'glasses', 'cape', 'scarf'];
export const CATEGORIES = [
  { id: 'hat', name: 'Hats' },
  { id: 'glasses', name: 'Glasses' },
  { id: 'cape', name: 'Capes' },
  { id: 'scarf', name: 'Scarves' },
  { id: 'decor', name: 'Burrow' },
];

// Prices: a level gives roughly 30–45 carrots, so the first treat is one level away and the
// fanciest things take a few worlds of saving up.
export const CATALOGUE = [
  { id: 'hat-party', slot: 'hat', name: 'Party Hat', price: 30 },
  { id: 'hat-flowers', slot: 'hat', name: 'Flower Crown', price: 40 },
  { id: 'hat-sun', slot: 'hat', name: 'Sun Hat', price: 50 },
  { id: 'hat-beanie', slot: 'hat', name: 'Woolly Hat', price: 60 },
  { id: 'hat-crown', slot: 'hat', name: 'Royal Crown', price: 120 },

  { id: 'glasses-round', slot: 'glasses', name: 'Clever Specs', price: 25 },
  { id: 'glasses-star', slot: 'glasses', name: 'Star Shades', price: 45 },
  { id: 'glasses-heart', slot: 'glasses', name: 'Heart Shades', price: 45 },

  { id: 'cape-hero', slot: 'cape', name: 'Hero Cape', price: 70 },
  { id: 'cape-stars', slot: 'cape', name: 'Starry Cape', price: 90 },
  { id: 'cape-rainbow', slot: 'cape', name: 'Rainbow Cape', price: 150 },

  { id: 'scarf-red', slot: 'scarf', name: 'Red Scarf', price: 0 },
  { id: 'scarf-blue', slot: 'scarf', name: 'Blue Scarf', price: 15 },
  { id: 'scarf-green', slot: 'scarf', name: 'Green Scarf', price: 15 },
  { id: 'scarf-sunny', slot: 'scarf', name: 'Sunny Scarf', price: 20 },
  { id: 'scarf-purple', slot: 'scarf', name: 'Purple Scarf', price: 20 },
  { id: 'scarf-rainbow', slot: 'scarf', name: 'Rainbow Scarf', price: 60 },

  { id: 'decor-rug', slot: 'decor', name: 'Cosy Rug', price: 20 },
  { id: 'decor-plant', slot: 'decor', name: 'Happy Plant', price: 25 },
  { id: 'decor-lamp', slot: 'decor', name: 'Carrot Lamp', price: 35 },
  { id: 'decor-picture', slot: 'decor', name: 'Carrot Picture', price: 40 },
  { id: 'decor-shelf', slot: 'decor', name: 'Toy Shelf', price: 50 },
  { id: 'decor-garland', slot: 'decor', name: 'Star Garland', price: 60 },
];

const BY_ID = Object.fromEntries(CATALOGUE.map((i) => [i.id, i]));
export const itemById = (id) => BY_ID[id] || null;
export const itemsIn = (category) => CATALOGUE.filter((i) => i.slot === category);

export function emptyWardrobe() {
  return { owned: ['scarf-red'], wearing: { hat: null, glasses: null, cape: null, scarf: 'scarf-red' }, decor: [] };
}

/** Tidy a saved wardrobe: unknown items are dropped, and only owned things can be worn or put out. */
export function normaliseWardrobe(saved) {
  const w = emptyWardrobe();
  if (!saved || typeof saved !== 'object') return w;
  const owned = new Set(['scarf-red', ...(Array.isArray(saved.owned) ? saved.owned : []).filter((id) => BY_ID[id])]);
  w.owned = [...owned];
  for (const slot of SLOTS) {
    const id = saved.wearing && saved.wearing[slot];
    if (id && owned.has(id) && BY_ID[id].slot === slot) w.wearing[slot] = id;
  }
  if (!w.wearing.scarf) w.wearing.scarf = 'scarf-red';      // Hoppy always has a scarf on
  w.decor = (Array.isArray(saved.decor) ? saved.decor : []).filter((id) => owned.has(id) && BY_ID[id].slot === 'decor');
  return w;
}

export const owns = (w, id) => w.owned.includes(id);
export const isUsing = (w, id) => {
  const item = BY_ID[id];
  if (!item) return false;
  return item.slot === 'decor' ? w.decor.includes(id) : w.wearing[item.slot] === id;
};

/**
 * Buy an item. Returns { ok, wardrobe, bank } — on success the item is owned and straight away worn
 * (or put out in the burrow). Otherwise `reason` is 'owned', 'short' (with `need`: carrots still to
 * collect) or 'unknown'. Never takes carrots it shouldn't.
 */
export function buy(wardrobe, id, bank) {
  const w = normaliseWardrobe(wardrobe);
  const item = BY_ID[id];
  if (!item) return { ok: false, reason: 'unknown', wardrobe: w, bank };
  if (owns(w, id)) return { ok: false, reason: 'owned', wardrobe: w, bank };
  if (bank < item.price) return { ok: false, reason: 'short', need: item.price - bank, wardrobe: w, bank };
  w.owned = [...w.owned, id];
  return { ok: true, wardrobe: use(w, id, true), bank: bank - item.price };
}

/** Wear / take off (or put out / put away) an owned item. The scarf can be swapped but not taken off. */
export function use(wardrobe, id, on = !isUsing(wardrobe, id)) {
  const w = normaliseWardrobe(wardrobe);
  const item = BY_ID[id];
  if (!item || !owns(w, id)) return w;
  if (item.slot === 'decor') {
    w.decor = on ? [...new Set([...w.decor, id])] : w.decor.filter((d) => d !== id);
  } else if (on) {
    w.wearing = { ...w.wearing, [item.slot]: id };
  } else if (item.slot !== 'scarf') {
    w.wearing = { ...w.wearing, [item.slot]: null };
  }
  return w;
}

/** What Hoppy has on, ready for the art: { hat, glasses, cape, scarf } (ids or null). */
export function outfitOf(wardrobe, preview = null) {
  const w = normaliseWardrobe(wardrobe);
  const o = { ...w.wearing };
  const p = preview && BY_ID[preview];
  if (p && p.slot !== 'decor') o[p.slot] = preview;
  return o;
}

/** A short key that changes whenever the outfit looks different (to skip needless redraws). */
export const outfitKey = (o) => SLOTS.map((s) => o[s] || '-').join('|');
