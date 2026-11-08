import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { appFiles, contentVersion } from '../tools/sw-files.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

test('manifest: landscape, standalone, with 192 and 512 px icons that exist', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.orientation, 'landscape');
  assert.equal(m.start_url, './');
  for (const size of ['192x192', '512x512']) assert.ok(m.icons.some((i) => i.sizes === size), size);
  for (const i of m.icons) assert.ok(existsSync(join(root, i.src)), i.src);
});

test('index.html: iOS meta tags, manifest, touch icon, service worker', () => {
  const html = read('index.html');
  for (const s of ['apple-mobile-web-app-capable', 'viewport-fit=cover', 'rel="manifest"', 'rel="apple-touch-icon" href="icons/icon-180.png"', "register('service-worker.js')"]) {
    assert.ok(html.includes(s), s);
  }
  assert.ok(existsSync(join(root, 'icons/icon-180.png')));
  assert.doesNotMatch(html, /https?:\/\//, 'no CDN or other network URLs');
});

test('PNG icons are the right sizes', () => {
  for (const [f, size] of [['icon-180.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512]]) {
    const b = readFileSync(join(root, 'icons', f));
    assert.equal(b.toString('ascii', 1, 4), 'PNG', f);
    assert.equal(b.readUInt32BE(16), size, `${f} width`);
    assert.equal(b.readUInt32BE(20), size, `${f} height`);
  }
});

test('service worker caches every game file (Phaser included) with an up-to-date version', () => {
  const sw = read('service-worker.js');
  const listed = [...sw.matchAll(/^ {2}'([^']+)',$/gm)].map((m) => m[1]);
  const files = appFiles(root);
  assert.ok(files.includes('lib/phaser.min.js'));
  assert.ok(files.includes('src/main.js') && files.includes('icons/icon-180.png'));
  assert.deepEqual(listed, ['./', ...files], 'file list is current — run: node tools/update-sw.js');
  const v = sw.match(/const VERSION = '([0-9a-f]+)'/);
  assert.ok(v, 'has a VERSION');
  assert.equal(v[1], contentVersion(root, files), 'cache version is stale — run: node tools/update-sw.js');
  assert.match(sw, /caches\.match|cache\.match/, 'cache-first');
});

test('every src module the game imports is in the cache list', () => {
  const files = new Set(appFiles(root));
  const seen = new Set();
  const visit = (f) => {
    if (seen.has(f)) return;
    seen.add(f);
    assert.ok(files.has(f), `${f} is cached`);
    const dir = f.split('/').slice(0, -1).join('/');
    for (const m of read(f).matchAll(/from\s+'(\.[^']+)'|import\('(\.[^']+)'\)/g)) {
      const rel = m[1] || m[2];
      const parts = [...dir.split('/'), ...rel.split('/')];
      const out = [];
      for (const p of parts) { if (p === '..') out.pop(); else if (p !== '.' && p) out.push(p); }
      visit(out.join('/'));
    }
  };
  visit('src/main.js');
  assert.ok(seen.size > 30, `${seen.size} modules`);
});
