// Outfits for Hoppy (Burrow shop): SVG pieces drawn in Hoppy's own coordinates (see hoppy.js), so
// they move with every pose — hats and glasses with her head, capes flutter like her scarf.
// Also small icon pictures of each item for the shop cards.

const OUT = '#4a3127';

// ---- Scarf colours: main, dark fold, light top of the gradient, tail stripes ---------------------
export const SCARVES = {
  'scarf-red': { main: '#e9443b', dark: '#b92d26', top: '#ff6a5c', stripe: '#ffd2cc' },
  'scarf-blue': { main: '#3d8fe0', dark: '#2563a8', top: '#6fb4ff', stripe: '#d7ecff' },
  'scarf-green': { main: '#45b046', dark: '#2d7d2f', top: '#76d66a', stripe: '#dcf7cf' },
  'scarf-sunny': { main: '#f5b523', dark: '#c4850c', top: '#ffd65a', stripe: '#fff3c2' },
  'scarf-purple': { main: '#9a5ad8', dark: '#6d38a6', top: '#bd86f2', stripe: '#efdcff' },
  'scarf-rainbow': { main: 'url(#rainbow)', dark: '#8a4fc0', top: null, stripe: '#ffffff', rainbow: true },
};
export const RAINBOW_STOPS = ['#ff5a5a', '#ffa53a', '#ffe14a', '#5fd35b', '#4aa8ff', '#9a6bff'];
export const rainbowGradient = (id = 'rainbow', vertical = false) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">
  ${RAINBOW_STOPS.map((c, i) => `<stop offset="${(i / (RAINBOW_STOPS.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;

// ---- Hats: drawn around (0, 0) = top of Hoppy's head; placed by hoppy.js -----------------------
const flower = (x, y, petal, r = 4.2) => `<g transform="translate(${x} ${y})">
  ${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos(a * Math.PI / 180) * r).toFixed(1)}" cy="${(Math.sin(a * Math.PI / 180) * r).toFixed(1)}" r="${r * 0.8}" fill="${petal}" stroke="${OUT}" stroke-width="1.3"/>`).join('')}
  <circle r="${r * 0.62}" fill="#ffd23f" stroke="${OUT}" stroke-width="1.2"/></g>`;

export const HATS = {
  'hat-party': () => `
    <path d="M -15 3 L 1 -36 L 16 1 Q 1 8 -15 3 Z" fill="#ff7eb0" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M -9 -12 Q 2 -8 11 -13 M -4 -24 Q 2 -21 7 -25" stroke="#fff3a0" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <circle cx="-5" cy="-3" r="2.2" fill="#5ec2ff"/><circle cx="7" cy="-6" r="2.2" fill="#6fcd4b"/><circle cx="1" cy="-18" r="2" fill="#5ec2ff"/>
    <path d="M -15 3 Q 1 9 16 1" fill="none" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/>
    <circle cx="1" cy="-37" r="5.5" fill="#ffd23f" stroke="${OUT}" stroke-width="2.4"/>
    <circle cx="-0.5" cy="-38.5" r="1.8" fill="#fff" opacity="0.8"/>`,
  'hat-flowers': () => `
    <path d="M -30 8 Q 0 -8 31 6" fill="none" stroke="#5aa83a" stroke-width="4" stroke-linecap="round"/>
    <path d="M -22 2 q -4 -6 2 -8 M 13 -1 q 6 -5 8 2" fill="#7ccf54" stroke="${OUT}" stroke-width="1.4"/>
    ${flower(-26, 6, '#ff9ec2')}${flower(-13, -1, '#fff', 4.6)}${flower(1, -3.5, '#ffb43f', 5)}${flower(15, -1.5, '#c9a2ff', 4.6)}${flower(28, 5, '#ff9ec2')}`,
  'hat-sun': () => `
    <ellipse cx="0" cy="4" rx="35" ry="8.5" fill="#f4d58a" stroke="${OUT}" stroke-width="3"/>
    <path d="M -17 4 Q -17 -19 0 -20 Q 17 -19 17 4 Z" fill="#f7dc96" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M -17 -1 Q 0 4 17 -1 L 17 -6 Q 0 -1 -17 -6 Z" fill="#ff7a6b" stroke="${OUT}" stroke-width="2"/>
    ${flower(12, -3, '#fff', 3.6)}
    <path d="M -26 5 Q -10 9 6 9 M -8 -14 q 6 -3 12 -1" stroke="#d9b264" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.8"/>`,
  'hat-beanie': () => `
    <path d="M -27 9 Q -28 -22 0 -24 Q 28 -22 27 9 Z" fill="#5ec2ff" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M -18 -8 Q 0 -15 18 -8 M -22 0 Q 0 -7 22 0" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.85"/>
    <rect x="-29" y="2" width="58" height="12" rx="6" fill="#3a9be0" stroke="${OUT}" stroke-width="3"/>
    ${[-20, -10, 0, 10, 20].map((x) => `<path d="M ${x} 4 L ${x} 12" stroke="#2a78b8" stroke-width="2"/>`).join('')}
    <circle cx="0" cy="-26" r="8" fill="#fff" stroke="${OUT}" stroke-width="2.6"/>
    <circle cx="-2.5" cy="-28.5" r="2.6" fill="#fff" opacity="0.9"/>`,
  'hat-crown': () => `
    <path d="M -18 6 L -21 -16 L -10 -6 L 0 -22 L 10 -6 L 21 -16 L 18 6 Q 0 10 -18 6 Z" fill="url(#gold)" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M -18 1 Q 0 5 18 1" fill="none" stroke="#c48a12" stroke-width="2.4"/>
    <circle cx="0" cy="-4" r="4" fill="#ff5a7a" stroke="${OUT}" stroke-width="1.6"/>
    <circle cx="-11" cy="0" r="2.8" fill="#5ec2ff" stroke="${OUT}" stroke-width="1.4"/>
    <circle cx="11" cy="0" r="2.8" fill="#6fcd4b" stroke="${OUT}" stroke-width="1.4"/>
    ${[[-21, -16], [0, -22], [21, -16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff3a0" stroke="${OUT}" stroke-width="1.5"/>`).join('')}
    <path d="M -13 -8 L -10 -1" stroke="#fffbe0" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>`,
};

// ---- Glasses: drawn in head space, over the eyes at (63, 51) and (79, 51) ------------------------
const heart = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M 0 7 C -9 0 -10 -5 -7 -8 C -4 -11 -1 -9 0 -6 C 1 -9 4 -11 7 -8 C 10 -5 9 0 0 7 Z"/>`;
const star = (x, y, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" stroke-linejoin="round"/>`;
};
export const GLASSES = {
  'glasses-round': () => `
    <path d="M 54.5 49 L 41 45" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="63" cy="51" r="8.6" fill="#dff3ff" fill-opacity="0.35" stroke="${OUT}" stroke-width="2.8"/>
    <circle cx="80.5" cy="51" r="8.2" fill="#dff3ff" fill-opacity="0.35" stroke="${OUT}" stroke-width="2.8"/>
    <path d="M 71.4 50 Q 71.8 47.6 72.4 50" stroke="${OUT}" stroke-width="2.4" fill="none"/>
    <path d="M 58.5 46.5 q 2 -2 4.5 -1.6 M 76.5 46.5 q 2 -2 4.5 -1.6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  'glasses-star': () => `
    <path d="M 53 49 L 41 45" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/>
    <g fill="#ffd23f" stroke="${OUT}" stroke-width="2.4">${star(63, 51, 12)}${star(80.5, 51, 11.4)}</g>
    <g fill="#3b2d58">${star(63, 51.6, 7.2)}${star(80.5, 51.6, 6.8)}</g>
    <path d="M 60 48.5 l 2.5 -1.6 M 77.5 48.5 l 2.5 -1.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
  'glasses-heart': () => `
    <path d="M 54 49 L 41 45" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/>
    <g fill="#ff6f9c" stroke="${OUT}" stroke-width="2.4">${heart(63, 51, 1.25)}${heart(80.5, 51, 1.2)}</g>
    <path d="M 70.8 49.5 Q 71.8 47.8 72.8 49.5" stroke="${OUT}" stroke-width="2.4" fill="none"/>
    <path d="M 58.5 47.5 q 1.5 -1.8 3.5 -1.4 M 76 47.5 q 1.5 -1.8 3.5 -1.4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
};

// ---- Capes: behind the body, from the neck back and down; `f` = flutter (same as the scarf tail) --
const capePath = (f) => `M 60 70 C 40 68, 16 ${80 + f * 0.5}, 2 ${102 + f * 1.4} Q -2 ${117 + f * 1.5}, 10 ${119 + f * 1.1}
  C 28 ${122 + f * 0.5}, 46 120, 60 114 C 64 100, 64 84, 62 72 Z`;
const CAPES = {
  'cape-hero': { fill: '#e6413a', lining: '#ffd23f', deco: () => '' },
  'cape-stars': {
    fill: '#3a5bd1', lining: '#ffe58a',
    deco: (f) => `<g fill="#fff3a0">${star(20, 96 + f * 0.9, 4.5)}${star(10, 110 + f * 1.3, 3.2)}${star(28, 110 + f * 0.7, 3)}${star(32, 86 + f * 0.4, 2.8)}</g>`,
  },
  'cape-rainbow': { fill: 'url(#rainbowV)', lining: '#ffffff', deco: () => '' },
};
export function capeSVG(id, f = 0) {
  const c = CAPES[id];
  if (!c) return '';
  return `<path d="${capePath(f)}" fill="${c.fill}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 8 ${115 + f * 1.3} C 26 ${118 + f * 0.6}, 44 117, 58 111" fill="none" stroke="${c.lining}" stroke-width="4" stroke-linecap="round" opacity="0.95"/>
    ${c.deco(f)}
    <path d="M 44 76 C 32 80, 18 ${90 + f * 0.6}, 10 ${104 + f}" fill="none" stroke="#fff" stroke-width="2.6" opacity="0.35" stroke-linecap="round"/>`;
}
export const OUTFIT_DEFS = `${rainbowGradient('rainbow')}${rainbowGradient('rainbowV', true)}
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#f2a91c"/></linearGradient>`;

// ---- Shop icons: each item on its own little picture ---------------------------------------------
const icon = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="${vb}"><defs>${OUTFIT_DEFS}</defs>${body}</svg>`;

function scarfIcon(c) {
  const fill = c.rainbow ? 'url(#rainbow)' : c.main;
  return icon('0 0 100 100', `
    <path d="M 14 34 Q 50 52 86 34 L 88 50 Q 50 70 12 50 Z" fill="${fill}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 22 46 Q 50 60 78 46" fill="none" stroke="${c.dark}" stroke-width="2.5" opacity="0.6"/>
    <path d="M 30 52 L 22 88 L 40 90 L 44 56 Z" fill="${fill}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 26 76 L 41 78 M 28 66 L 42 68" stroke="${c.stripe}" stroke-width="3" stroke-linecap="round"/>`);
}

// A cape seen from the back: collar, flowing sides and a curved hem with its lining showing.
function capeIcon(id) {
  const c = CAPES[id];
  return icon('0 0 100 100', `
    <path d="M 36 16 Q 50 22 64 16 L 66 24 C 74 44 86 66 90 86 Q 70 96 50 90 Q 30 96 10 86 C 14 66 26 44 34 24 Z" fill="${c.fill}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 12 84 Q 30 92 50 87 Q 70 92 88 84" fill="none" stroke="${c.lining}" stroke-width="4" stroke-linecap="round"/>
    <path d="M 40 30 C 34 46 26 62 20 78" fill="none" stroke="#fff" stroke-width="3" opacity="0.4" stroke-linecap="round"/>
    ${id === 'cape-stars' ? `<g fill="#fff3a0">${star(42, 50, 5)}${star(62, 64, 4)}${star(36, 72, 3.5)}${star(58, 40, 3)}</g>` : ''}
    <rect x="34" y="10" width="32" height="10" rx="5" fill="#ffd23f" stroke="${OUT}" stroke-width="3"/>`);
}

export function itemIconSVG(id) {
  if (HATS[id]) return icon('-40 -46 80 80', HATS[id]());
  if (GLASSES[id]) return icon('34 26 56 50', `<g transform="translate(0 0)">${GLASSES[id]()}</g>`);
  if (CAPES[id]) return capeIcon(id);
  if (SCARVES[id]) return scarfIcon(SCARVES[id]);
  return null;
}
