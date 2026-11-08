// Carrot Quest service worker: cache-first, so the game works offline once it has loaded.
// Every file is cached on install; the cache name carries a version made from the files' contents
// (tools/update-sw.js), so any change makes a fresh cache and the old one is removed.
// No network requests are made except to this site, and only for files not yet cached.

// <files> (written by tools/update-sw.js — do not edit by hand)
const VERSION = 'b2956080fc';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'lib/phaser.min.js',
  'src/anims.js',
  'src/art/avatars.js',
  'src/art/blocks.js',
  'src/art/bosses.js',
  'src/art/burrow.js',
  'src/art/hoppy.js',
  'src/art/icon.js',
  'src/art/map.js',
  'src/art/outfits.js',
  'src/art/stickers.js',
  'src/art/tiles.js',
  'src/art/ui.js',
  'src/art/worlds.js',
  'src/audio.js',
  'src/blocks.js',
  'src/controls.js',
  'src/elements.js',
  'src/engine/endless.js',
  'src/engine/jump.js',
  'src/engine/level-map.js',
  'src/engine/levels-config.js',
  'src/engine/mastery.js',
  'src/engine/praise.js',
  'src/engine/questions.js',
  'src/engine/scoring.js',
  'src/engine/shop.js',
  'src/engine/stickers.js',
  'src/engine/voices.js',
  'src/levels/1-1.js',
  'src/levels/1-2.js',
  'src/levels/2-1.js',
  'src/levels/2-2.js',
  'src/levels/3-1.js',
  'src/levels/3-2.js',
  'src/levels/4-1.js',
  'src/levels/4-2.js',
  'src/levels/5-1.js',
  'src/levels/5-2.js',
  'src/levels/index.js',
  'src/levels/test.js',
  'src/main.js',
  'src/menu.js',
  'src/save.js',
  'src/scenes/Boot.js',
  'src/scenes/Burrow.js',
  'src/scenes/Level.js',
  'src/scenes/LevelComplete.js',
  'src/scenes/MathSign.js',
  'src/scenes/Profiles.js',
  'src/scenes/Stickers.js',
  'src/scenes/Title.js',
  'src/scenes/WorldMap.js',
  'src/skin.js',
  'src/speech.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/icon.svg',
];
// </files>

const CACHE = `carrot-quest-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('carrot-quest-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Test links such as ?level=2-1 or ?map are the same page: ignore the query string.
    const hit = await cache.match(req, { ignoreSearch: true })
      || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  })());
});
