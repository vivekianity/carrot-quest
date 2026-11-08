// The app icon: Hoppy hugging a big carrot in front of a sunny meadow. Built from Hoppy's own sprite
// drawing (hoppy.js) so the icon always matches the game. Square and full-bleed (iOS rounds the
// corners itself). `zoom` < 1 leaves more margin, for the Android "maskable" icon's safe zone.
import { hoppySVG } from './hoppy.js';

const OUT = '#4a3127';
const S = 1024;

// Paws forward, hugging something; big happy face.
const HUG = {
  dy: 0, tilt: 0, headDy: 0,
  earBack: { a: -18, bend: -6, len: 47 }, earFront: { a: 22, bend: 12, len: 45 },
  eyes: 'happy', mouth: 'open',
  armBack: [70, 90, 60], armFront: [88, 92, -60],
};

function carrot(x, y, s, angle) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})">
    <path d="M -10 -60 C -26 -80 -30 -104 -18 -118 C -8 -102 -4 -84 -2 -62 Z" fill="#6fcd4b" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 4 -62 C 6 -92 20 -114 40 -116 C 34 -94 22 -76 10 -60 Z" fill="#5ab83a" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -3 -62 C -4 -96 4 -124 14 -136 C 18 -114 12 -88 4 -62 Z" fill="#7ad95a" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -32 -60 Q 0 -74 32 -60 Q 30 20 4 112 Q 0 120 -4 112 Q -30 20 -32 -60 Z" fill="url(#carrot)" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -20 -30 L -6 -26 M 8 0 L 22 4 M -16 28 L -4 32 M 4 62 L 14 66" stroke="#d96b1c" stroke-width="5" stroke-linecap="round"/>
    <path d="M -18 -50 Q -22 -10 -12 36" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.45"/>
  </g>`;
}

const sparkle = (x, y, r) => `<path transform="translate(${x} ${y}) scale(${r / 12})" d="M 0 -12 Q 1.6 -1.6 12 0 Q 1.6 1.6 0 12 Q -1.6 1.6 -12 0 Q -1.6 -1.6 0 -12 Z" fill="#fff6b0" stroke="#f0b93a" stroke-width="1.5"/>`;

export function iconSVG({ zoom = 1 } = {}) {
  // Hoppy's sprite: 128 × 154 units (viewBox y from -26); place her centred with feet near the bottom.
  const s = 6.1 * zoom;
  const w = 128 * s, h = 154 * s;
  const x0 = S / 2 - 61 * s;                    // body centre (x = 61) in the middle
  const y0 = S / 2 + (S * 0.43) * zoom - (121 + 26) * s;   // feet (y = 121) low in the frame
  const at = (hx, hy) => [x0 + hx * s, y0 + (hy + 26) * s];
  const hoppy = hoppySVG(HUG).replace(/^<svg([^>]*?)width="\d+" height="\d+"/, `<svg$1x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"`);
  const [cx, cy] = at(84, 86);
  const [p1x, p1y] = at(74, 88);
  const [p2x, p2y] = at(90, 96);
  const paw = (x, y, rot) => `<ellipse cx="${x}" cy="${y}" rx="${6.8 * s}" ry="${9.5 * s}" transform="rotate(${rot} ${x} ${y})" fill="url(#paw)" stroke="${OUT}" stroke-width="${3 * s}"/>`;
  const hill = (zoom < 1 ? 0.92 : 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc1fa"/><stop offset="0.7" stop-color="#c9ecff"/><stop offset="1" stop-color="#f3fbff"/></linearGradient>
    <radialGradient id="sun"><stop offset="0" stop-color="#fff7c2"/><stop offset="0.55" stop-color="#ffe066"/><stop offset="1" stop-color="#ffe066" stop-opacity="0"/></radialGradient>
    <linearGradient id="carrot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#f77f1c"/></linearGradient>
    <radialGradient id="paw" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#efdcc8"/></radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#sky)"/>
  <circle cx="${S * 0.8}" cy="${S * 0.2}" r="${S * 0.2}" fill="url(#sun)"/>
  <circle cx="${S * 0.8}" cy="${S * 0.2}" r="${S * 0.075}" fill="#ffe680" stroke="#f0b93a" stroke-width="8"/>
  <g fill="#fff" opacity="0.95">
    <ellipse cx="${S * 0.2}" cy="${S * 0.2}" rx="${S * 0.11}" ry="${S * 0.04}"/><ellipse cx="${S * 0.25}" cy="${S * 0.17}" rx="${S * 0.07}" ry="${S * 0.045}"/>
  </g>
  <ellipse cx="${S * 0.18}" cy="${S * (1.02 * hill)}" rx="${S * 0.55}" ry="${S * 0.26}" fill="#8fd36a"/>
  <ellipse cx="${S * 0.9}" cy="${S * (1.04 * hill)}" rx="${S * 0.5}" ry="${S * 0.24}" fill="#6fbf4f"/>
  <rect y="${S * 0.9}" width="${S}" height="${S * 0.1}" fill="#5ab83a"/>
  <ellipse cx="${S / 2}" cy="${y0 + 147 * s - 4 * s}" rx="${30 * s}" ry="${6 * s}" fill="#2b4a1c" opacity="0.25"/>
  ${hoppy}
  ${carrot(cx, cy, s / 3.5, 32)}
  ${paw(p1x, p1y, 35)}${paw(p2x, p2y, -40)}
  ${sparkle(S * 0.14, S * 0.42, 26 * zoom)}${sparkle(S * 0.88, S * 0.5, 32 * zoom)}${sparkle(S * 0.78, S * 0.36, 18 * zoom)}
</svg>`;
}
