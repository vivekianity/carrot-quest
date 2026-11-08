import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOGUE, CATEGORIES, SLOTS, emptyWardrobe, normaliseWardrobe, buy, use, outfitOf, outfitKey, isUsing, itemsIn,
} from '../src/engine/shop.js';

test('the shop has hats, glasses, capes, scarves in new colours and burrow decorations', () => {
  for (const c of CATEGORIES) assert.ok(itemsIn(c.id).length >= 3, c.id);
  assert.ok(itemsIn('scarf').length >= 5);
  assert.equal(new Set(CATALOGUE.map((i) => i.id)).size, CATALOGUE.length, 'unique ids');
  for (const i of CATALOGUE) assert.ok(Number.isInteger(i.price) && i.price >= 0 && i.price <= 200, i.id);
  // Six cards fit on a shop page.
  for (const c of CATEGORIES) assert.ok(itemsIn(c.id).length <= 6, c.id);
});

test('a new wardrobe: the red scarf, nothing else', () => {
  const w = emptyWardrobe();
  assert.deepEqual(w.owned, ['scarf-red']);
  assert.deepEqual(outfitOf(w), { hat: null, glasses: null, cape: null, scarf: 'scarf-red' });
});

test('buying takes exactly the price, then wears the item', () => {
  const r = buy(emptyWardrobe(), 'hat-party', 45);
  assert.equal(r.ok, true);
  assert.equal(r.bank, 15);
  assert.equal(outfitOf(r.wardrobe).hat, 'hat-party');
  const again = buy(r.wardrobe, 'hat-party', r.bank);
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'owned');
  assert.equal(again.bank, 15, 'nothing spent twice');
});

test('not enough carrots: nothing changes and it says how many more', () => {
  const r = buy(emptyWardrobe(), 'cape-hero', 52);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'short');
  assert.equal(r.need, 18);
  assert.equal(r.bank, 52);
  assert.equal(r.wardrobe.owned.includes('cape-hero'), false);
  assert.equal(buy(emptyWardrobe(), 'nope', 999).reason, 'unknown');
});

test('wear, swap and take off; the scarf swaps but never comes off', () => {
  let w = buy(emptyWardrobe(), 'hat-party', 100).wardrobe;
  w = buy(w, 'hat-sun', 100).wardrobe;
  assert.equal(outfitOf(w).hat, 'hat-sun', 'one hat at a time');
  w = use(w, 'hat-party');
  assert.equal(outfitOf(w).hat, 'hat-party');
  w = use(w, 'hat-party');
  assert.equal(outfitOf(w).hat, null, 'tapping again takes it off');
  w = buy(w, 'scarf-blue', 100).wardrobe;
  assert.equal(outfitOf(w).scarf, 'scarf-blue');
  w = use(w, 'scarf-blue');
  assert.equal(outfitOf(w).scarf, 'scarf-blue', 'still wearing a scarf');
  w = use(w, 'cape-hero');
  assert.equal(outfitOf(w).cape, null, 'cannot wear what is not owned');
});

test('decorations are put out and away', () => {
  let w = buy(emptyWardrobe(), 'decor-rug', 30).wardrobe;
  assert.ok(isUsing(w, 'decor-rug'));
  w = use(w, 'decor-rug');
  assert.ok(!isUsing(w, 'decor-rug'));
  assert.ok(w.owned.includes('decor-rug'));
});

test('try-on preview changes only the outfit shown, and the key tracks the look', () => {
  const w = emptyWardrobe();
  const o = outfitOf(w, 'glasses-star');
  assert.equal(o.glasses, 'glasses-star');
  assert.equal(outfitOf(w).glasses, null);
  assert.notEqual(outfitKey(o), outfitKey(outfitOf(w)));
  assert.equal(outfitKey(outfitOf(w, 'decor-rug')), outfitKey(outfitOf(w)));
  assert.equal(outfitKey(outfitOf(w)).split('|').length, SLOTS.length);
});

test('broken or tampered saves are tidied', () => {
  const w = normaliseWardrobe({ owned: ['hat-crown', 'bogus'], wearing: { hat: 'hat-crown', cape: 'cape-hero', scarf: null }, decor: ['decor-rug'] });
  assert.deepEqual(w.owned.sort(), ['hat-crown', 'scarf-red']);
  assert.equal(w.wearing.cape, null);
  assert.equal(w.wearing.scarf, 'scarf-red');
  assert.deepEqual(w.decor, []);
  assert.deepEqual(normaliseWardrobe('junk'), emptyWardrobe());
});
