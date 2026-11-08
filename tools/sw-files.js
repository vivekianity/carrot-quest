// The list of files the service worker caches, and a version made from their contents.
// Shared by tools/update-sw.js (writes them into service-worker.js) and tests/pwa.test.js
// (fails if service-worker.js is out of date — e.g. a file changed but the cache version didn't).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';

const KEEP = /\.(js|html|webmanifest|png|svg)$/;

function walk(root, dir, out) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(root, p, out);
    else if (KEEP.test(name)) out.push(relative(root, p).split(sep).join('/'));
  }
  return out;
}

/** Every file the game needs offline, relative to the project root. */
export function appFiles(root) {
  return ['index.html', 'manifest.webmanifest', ...['lib', 'src', 'icons'].flatMap((d) => walk(root, join(root, d), []))];
}

/** A short hash of all those files' contents (changes whenever any of them changes). */
export function contentVersion(root, files = appFiles(root)) {
  const h = createHash('sha256');
  for (const f of files) { h.update(f); h.update(readFileSync(join(root, f))); }
  return h.digest('hex').slice(0, 10);
}
