// Sticker book art: the open book, sticker backings (die-cut white edge with a shiny peel) and
// a rosette badge for each times-table champion. Boss stickers reuse the bosses' sleeping frames.

const OUT = '#6b4424';
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

export const TABLE_COLOURS = {
  1: ['#ffb3c7', '#e0567f'], 2: ['#ffc98a', '#e07a1c'], 3: ['#fff08a', '#d1a400'], 4: ['#b8f09a', '#3f9a2a'],
  5: ['#9ee6d8', '#1f9a86'], 6: ['#a8d8ff', '#2f7fcf'], 7: ['#c8b6ff', '#6d4fd1'], 8: ['#f5b0ff', '#b043c7'],
  9: ['#ffb0a0', '#d0442c'], 10: ['#ffe36b', '#c48a12'],
};

function book() {
  const lines = (x0) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<path d="M ${x0 + 40} ${120 + i * 48} L ${x0 + 520} ${120 + i * 48}" stroke="#efdcb8" stroke-width="2"/>`).join('');
  return svg(1220, 640, `
    <rect x="10" y="22" width="1200" height="612" rx="40" fill="#000" opacity="0.2"/>
    <rect x="10" y="10" width="1200" height="612" rx="40" fill="#d9534f" stroke="${OUT}" stroke-width="7"/>
    <path d="M 40 32 Q 320 20 598 40 L 598 600 Q 320 580 40 596 Z" fill="#fffaf0" stroke="#c9a77a" stroke-width="3"/>
    <path d="M 622 40 Q 900 20 1180 32 L 1180 596 Q 900 580 622 600 Z" fill="#fffaf0" stroke="#c9a77a" stroke-width="3"/>
    ${lines(40)}${lines(622)}
    <path d="M 598 40 Q 610 30 622 40 L 622 600 Q 610 610 598 600 Z" fill="#e9d3a6"/>
    <path d="M 588 40 L 588 600 M 632 40 L 632 600" stroke="#000" stroke-width="10" opacity="0.06"/>
    <path d="M 1126 10 L 1126 112 L 1144 94 L 1162 112 L 1162 10 Z" fill="#ffd23f" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>`);
}

const back = svg(172, 172, `
  <circle cx="86" cy="92" r="76" fill="#000" opacity="0.18"/>
  <circle cx="86" cy="86" r="78" fill="#fff" stroke="#e6d6bc" stroke-width="3"/>
  <circle cx="86" cy="86" r="66" fill="url(#bk)"/>
  <path d="M 40 46 Q 60 26 92 24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.8"/>`,
`<radialGradient id="bk" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#ffe7a8"/></radialGradient>`);

const empty = svg(172, 172, `
  <circle cx="86" cy="86" r="74" fill="#f4e6cc" stroke="#c9a77a" stroke-width="4" stroke-dasharray="12 9"/>`);

function rosette(t) {
  const [light, dark] = TABLE_COLOURS[t];
  const petals = [];
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    petals.push(`<circle cx="${(86 + Math.cos(a) * 52).toFixed(1)}" cy="${(80 + Math.sin(a) * 52).toFixed(1)}" r="17" fill="${light}" stroke="${dark}" stroke-width="3"/>`);
  }
  return svg(172, 200, `
    <path d="M 56 120 L 40 192 L 62 178 L 76 198 L 86 128 Z" fill="${dark}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 116 120 L 132 192 L 110 178 L 96 198 L 86 128 Z" fill="${dark}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    ${petals.join('')}
    <circle cx="86" cy="80" r="50" fill="#fff" stroke="${dark}" stroke-width="5"/>
    <circle cx="86" cy="80" r="41" fill="${light}"/>
    <path d="M 56 60 Q 70 44 92 42" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.8"/>`);
}

export const STICKER_ART = {
  'sticker-book': book(),
  'sticker-back': back,
  'sticker-empty': empty,
};
for (let t = 1; t <= 10; t++) STICKER_ART[`badge-${t}`] = rosette(t);
