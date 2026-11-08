// Draws the app icon (src/art/icon.js) and saves the PNGs the PWA needs:
//   icons/icon-180.png       apple-touch-icon (iPad home screen)
//   icons/icon-192.png       manifest icon
//   icons/icon-512.png       manifest icon (and splash)
//   icons/icon-maskable-512.png  Android adaptive icon (Hoppy inside the safe zone)
//   icons/icon.svg           the source picture
// Run:  node tools/make-icons.js   (needs the dev dependency @resvg/resvg-js; not used at runtime)
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { iconSVG } from '../src/art/icon.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'icons');
mkdirSync(out, { recursive: true });

const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: '#6fc1fa' }).render().asPng();

const main = iconSVG();
const maskable = iconSVG({ zoom: 0.78 });
writeFileSync(join(out, 'icon.svg'), main);
for (const size of [180, 192, 512]) writeFileSync(join(out, `icon-${size}.png`), png(main, size));
writeFileSync(join(out, 'icon-maskable-512.png'), png(maskable, 512));
console.log('Wrote icons/icon.svg, icon-180.png, icon-192.png, icon-512.png, icon-maskable-512.png');
