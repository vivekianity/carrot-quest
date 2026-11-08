// Refreshes the file list and cache version inside service-worker.js. Run after changing any file:
//   node tools/update-sw.js
// (tests/pwa.test.js fails until you do, so a stale cache can't ship.)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { appFiles, contentVersion } from './sw-files.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const swPath = join(root, 'service-worker.js');
const files = appFiles(root);
const version = contentVersion(root, files);
const block = `// <files> (written by tools/update-sw.js — do not edit by hand)
const VERSION = '${version}';
const FILES = [
  './',
${files.map((f) => `  '${f}',`).join('\n')}
];
// </files>`;
const sw = readFileSync(swPath, 'utf8');
const next = sw.replace(/\/\/ <files>[\s\S]*?\/\/ <\/files>/, block);
if (next === sw && !sw.includes(`'${version}'`)) throw new Error('No <files> block found in service-worker.js');
writeFileSync(swPath, next);
console.log(`service-worker.js: ${files.length + 1} files, cache carrot-quest-${version}`);
