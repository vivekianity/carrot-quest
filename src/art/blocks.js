// Challenge blocks and pickups as SVG strings: Stone Gate, Question Box, small carrot, rubble.

const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

const STONE_OUT = '#4f5866';
const STONES = ['#aab6c4', '#b9c4d0', '#9eabba', '#b2bdca'];

export const GATE_W = 120;
export const GATE_H = 1100;         // drawn tall so the top never shows; origin is bottom-centre at the grass line
/** Plaque centre (for the carved fact), measured up from the bottom of the gate. */
export const GATE_PLAQUE = { fromBottom: 160, h: 214, w: 92 };

export function gateSVG() {
  const W = GATE_W, H = GATE_H;
  let bricks = '';
  let k = 0;
  for (let y = H - 6; y > -60; y -= 46, k++) {
    const offset = k % 2 ? -26 : 0;
    for (let x = 8 + offset; x < W - 8; x += 54) {
      const x0 = Math.max(8, x), x1 = Math.min(W - 8, x + 52);
      if (x1 - x0 < 14) continue;
      const fill = STONES[(k * 3 + Math.round(x)) % STONES.length];
      bricks += `<rect x="${x0}" y="${y - 44}" width="${x1 - x0}" height="44" rx="11" fill="${fill}" stroke="${STONE_OUT}" stroke-width="3.5"/>
        <path d="M ${x0 + 9} ${y - 36} q ${(x1 - x0) / 3} -3 ${(x1 - x0) / 1.6} 0" stroke="#e3e9ef" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    }
  }
  const p = GATE_PLAQUE, px = (W - p.w) / 2, py = H - p.fromBottom - p.h / 2;
  return svg(W, H, `
    <rect x="6" y="-10" width="${W - 12}" height="${H + 4}" rx="14" fill="#8e9aa9" stroke="${STONE_OUT}" stroke-width="5"/>
    ${bricks}
    <rect x="${px}" y="${py}" width="${p.w}" height="${p.h}" rx="18" fill="#dde3ea" stroke="${STONE_OUT}" stroke-width="4"/>
    <rect x="${px + 6}" y="${py + 6}" width="${p.w - 12}" height="${p.h - 12}" rx="13" fill="none" stroke="#b9c3ce" stroke-width="3"/>
    <path d="M 4 ${H} Q 14 ${H - 22} 22 ${H - 4} Q 30 ${H - 26} 40 ${H - 2} Z" fill="#6fcd4b" stroke="#3a7e28" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M ${W - 44} ${H} Q ${W - 34} ${H - 24} ${W - 26} ${H - 3} Q ${W - 16} ${H - 20} ${W - 6} ${H} Z" fill="#6fcd4b" stroke="#3a7e28" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="${W - 30}" cy="${H - 300}" rx="16" ry="7" fill="#7fc65c" opacity="0.85"/>
    <ellipse cx="30" cy="${H - 420}" rx="13" ry="6" fill="#7fc65c" opacity="0.85"/>`);
}

export function stoneSVG(i) {
  const shapes = [
    'M 4 14 Q 2 5 11 3 Q 22 1 26 9 Q 29 18 20 22 Q 8 25 4 14 Z',
    'M 3 12 Q 5 3 14 4 Q 25 2 25 12 Q 26 21 14 22 Q 3 22 3 12 Z',
    'M 6 18 Q 1 9 9 4 Q 18 0 24 6 Q 28 14 22 20 Q 13 25 6 18 Z',
  ];
  return svg(30, 26, `<path d="${shapes[i % 3]}" fill="${STONES[i % 4]}" stroke="${STONE_OUT}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 9 8 q 5 -3 10 -1" stroke="#e3e9ef" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
}

const QMARK = 'M 24 24 Q 24 14 32 14 Q 41 14 41 22 Q 41 28 35 31 Q 32 33 32 38';

export const BLOCK_ART = {
  qbox: svg(64, 64, `
    <rect x="3" y="3" width="58" height="58" rx="12" fill="url(#gold)" stroke="#8a5a12" stroke-width="4"/>
    <rect x="9" y="9" width="46" height="46" rx="8" fill="none" stroke="#fff3b8" stroke-width="2.5" opacity="0.8"/>
    ${[[11, 11], [53, 11], [11, 53], [53, 53]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#b87a1c"/>`).join('')}
    <path d="${QMARK}" fill="none" stroke="#8a5a12" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="48" r="6" fill="#8a5a12"/>
    <path d="${QMARK}" fill="none" stroke="#fff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="48" r="3.4" fill="#fff"/>`,
  `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="0.55" stop-color="#ffc533"/><stop offset="1" stop-color="#f29d1d"/></linearGradient>`),

  'qbox-used': svg(64, 64, `
    <rect x="3" y="3" width="58" height="58" rx="12" fill="#d9b183" stroke="#7a5230" stroke-width="4"/>
    <rect x="12" y="12" width="40" height="40" rx="8" fill="#c99d6c"/>
    ${[[11, 11], [53, 11], [11, 53], [53, 53]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#8f6440"/>`).join('')}
    <path d="M 26 26 L 38 26 L 32 44 Z" fill="#e7a35c" stroke="#8f6440" stroke-width="2" stroke-linejoin="round" opacity="0.7"/>`),

  carrot: svg(40, 54, `
    <path d="M 20 16 Q 13 4 8 6 Q 11 13 18 17 Z" fill="#5cc23e" stroke="#2f7a24" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 20 16 Q 20 1 25 2 Q 26 10 22 17 Z" fill="#6fd24e" stroke="#2f7a24" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 21 17 Q 31 6 34 10 Q 30 16 23 19 Z" fill="#5cc23e" stroke="#2f7a24" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 20 52 Q 9 34 9 24 Q 9 15 20 15 Q 31 15 31 24 Q 31 34 20 52 Z" fill="url(#carrot)" stroke="#8a4410" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 12 26 q 4 1 7 0 M 22 33 q 4 1 6 -1 M 15 40 q 3 1 5 0" stroke="#c45f10" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="15" cy="22" rx="3" ry="5" fill="#ffd9a0" opacity="0.8"/>`,
  `<linearGradient id="carrot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#f27a12"/></linearGradient>`),

  pebble: svg(14, 12, `<ellipse cx="7" cy="6" rx="5.5" ry="4.5" fill="#b2bdca" stroke="${STONE_OUT}" stroke-width="1.8"/>`),
};

// ---- Level end ------------------------------------------------------------------------------
const GOLD_DEFS = `<linearGradient id="gc" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#fff2a8"/><stop offset="0.45" stop-color="#ffd23f"/><stop offset="1" stop-color="#f0a313"/></linearGradient>`;

/** Golden Carrot; `bites` 0..2 nibbles out of the tip end. */
export function goldenCarrotSVG(bites = 0) {
  const bite = [[50, 104, 13], [32, 88, 13], [48, 74, 12]].slice(0, bites * 1.5 | 0);
  return svg(84, 124, `
    <mask id="m"><rect width="84" height="124" fill="#fff"/>${bite.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#000"/>`).join('')}</mask>
    <path d="M 42 30 Q 22 6 12 10 Q 18 22 38 32 Z" fill="#5cc23e" stroke="#2f7a24" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 42 30 Q 40 0 50 2 Q 54 18 46 32 Z" fill="#6fd24e" stroke="#2f7a24" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 44 32 Q 66 10 74 18 Q 66 30 48 36 Z" fill="#5cc23e" stroke="#2f7a24" stroke-width="3" stroke-linejoin="round"/>
    <g mask="url(#m)">
      <path d="M 42 120 Q 16 76 16 52 Q 16 30 42 30 Q 68 30 68 52 Q 68 76 42 120 Z" fill="url(#gc)" stroke="#a8670c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 24 56 q 8 2 14 0 M 46 70 q 8 2 12 -2 M 30 86 q 6 2 10 0" stroke="#d08a10" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="31" cy="48" rx="6" ry="11" fill="#fffbe0" opacity="0.85"/>
    </g>`, GOLD_DEFS);
}

export const STAR_PATH = (cx, cy, R, r) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
    d += `${i ? 'L' : 'M'} ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + 'Z';
};

export const END_ART = {
  'golden-carrot0': goldenCarrotSVG(0),
  'golden-carrot1': goldenCarrotSVG(1),
  'golden-carrot2': goldenCarrotSVG(2),
  crumb: svg(12, 12, `<circle cx="6" cy="6" r="4.5" fill="#ffd23f" stroke="#a8670c" stroke-width="1.5"/>`),
  confetti: svg(12, 18, `<rect x="1" y="1" width="10" height="16" rx="3" fill="#fff"/>`),
  'mini-carrot': svg(20, 28, `<path d="M 10 27 Q 4 16 4 11 Q 4 6 10 6 Q 16 6 16 11 Q 16 16 10 27 Z" fill="#ff9a2e" stroke="#8a4410" stroke-width="1.8"/><path d="M 10 7 L 7 1 M 10 7 L 13 1" stroke="#3f9a2c" stroke-width="2.5" stroke-linecap="round"/>`),
  star: svg(130, 126, `<path d="${STAR_PATH(65, 66, 60, 27)}" fill="url(#st)" stroke="#a8670c" stroke-width="6" stroke-linejoin="round"/>
    <path d="M 46 48 Q 56 36 66 34" stroke="#fffbe0" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.85"/>`,
    `<linearGradient id="st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff07a"/><stop offset="1" stop-color="#ffb81c"/></linearGradient>`),
  'star-empty': svg(130, 126, `<path d="${STAR_PATH(65, 66, 60, 27)}" fill="#e9d7bd" stroke="#b39673" stroke-width="6" stroke-linejoin="round" stroke-dasharray="1 0"/>`),

  // Hidden Star Carrot: a little golden star with carrot leaves.
  'star-carrot': svg(72, 84, `
    <path d="M 36 22 Q 26 4 18 6 Q 22 16 33 23 Z" fill="#5cc23e" stroke="#2f7a24" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 36 22 Q 46 2 54 6 Q 50 16 39 23 Z" fill="#6fd24e" stroke="#2f7a24" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${STAR_PATH(36, 52, 32, 15)}" fill="url(#st)" stroke="#a8670c" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="29" cy="50" r="3" fill="#5a3518"/><circle cx="43" cy="50" r="3" fill="#5a3518"/>
    <path d="M 31 58 Q 36 62 41 58" stroke="#5a3518" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    `<linearGradient id="st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff07a"/><stop offset="1" stop-color="#ffb81c"/></linearGradient>`),
};

// ---- Broken Bridge -----------------------------------------------------------------------
export const BRIDGE_ART = {
  'water-top': svg(64, 64, `
    <rect y="14" width="64" height="50" fill="#4fb3e8"/>
    <path d="M 0 14 Q 8 6 16 14 T 32 14 T 48 14 T 64 14 L 64 24 L 0 24 Z" fill="#7fd0f5"/>
    <path d="M 0 14 Q 8 6 16 14 T 32 14 T 48 14 T 64 14" fill="none" stroke="#2f7fb8" stroke-width="3"/>
    <path d="M 10 34 q 6 -3 12 0 M 40 46 q 6 -3 12 0" stroke="#bfe9ff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.8"/>`),
  water: svg(64, 64, `<rect width="64" height="64" fill="#4fb3e8"/><path d="M 24 22 q 6 -3 12 0" stroke="#bfe9ff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>`),
  plank: svg(66, 26, `
    <rect x="2" y="3" width="62" height="20" rx="6" fill="#c98a4b" stroke="#6b4424" stroke-width="3.5"/>
    <path d="M 10 10 q 16 -3 30 0 t 18 1" stroke="#a96d3a" stroke-width="2" fill="none"/>
    <circle cx="9" cy="13" r="2.4" fill="#6b4424"/><circle cx="57" cy="13" r="2.4" fill="#6b4424"/>`),
  'bridge-post': svg(24, 90, `<rect x="3" y="3" width="18" height="86" rx="7" fill="#b97a43" stroke="#6b4424" stroke-width="4"/>
    <rect x="1" y="12" width="22" height="8" rx="3" fill="#8f5a2c"/>`),
  'sign-q': svg(84, 110, `
    <rect x="36" y="44" width="12" height="66" rx="4" fill="#a96d3a" stroke="#6b4424" stroke-width="3.5"/>
    <rect x="4" y="4" width="76" height="56" rx="12" fill="#e9b878" stroke="#6b4424" stroke-width="4.5"/>
    <path d="M 32 22 Q 32 13 42 13 Q 52 13 52 21 Q 52 27 45 29 Q 42 31 42 36" fill="none" stroke="#6b4424" stroke-width="6" stroke-linecap="round"/>
    <circle cx="42" cy="46" r="4" fill="#6b4424"/>`),
};

// ---- Sleepy Log + beavers -------------------------------------------------------------------
export const LOG_ART = {
  log: svg(132, 132, `
    <circle cx="66" cy="66" r="62" fill="#9a6235" stroke="#5a3518" stroke-width="5"/>
    <circle cx="66" cy="66" r="50" fill="#e8c08a" stroke="#b9854f" stroke-width="3"/>
    <circle cx="66" cy="66" r="38" fill="none" stroke="#c99a62" stroke-width="3"/>
    <circle cx="66" cy="66" r="25" fill="none" stroke="#c99a62" stroke-width="3"/>
    <path d="M 44 62 Q 51 68 58 62 M 74 62 Q 81 68 88 62" stroke="#5a3518" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="66" cy="82" rx="6" ry="4.5" fill="#5a3518" opacity="0.85"/>
    <ellipse cx="44" cy="74" rx="6" ry="3.5" fill="#ff9fb2" opacity="0.6"/><ellipse cx="88" cy="74" rx="6" ry="3.5" fill="#ff9fb2" opacity="0.6"/>
    <path d="M 18 30 q 10 -6 20 -2 M 100 108 q 8 4 16 -2" stroke="#6b3f1d" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  chip: svg(14, 10, `<path d="M 1 5 Q 3 1 8 2 Q 13 3 12 6 Q 9 9 4 8 Z" fill="#e8c08a" stroke="#9a6235" stroke-width="1.5"/>`),
};

function beaverSVG(chomp) {
  return svg(76, 84, `
    <ellipse cx="38" cy="78" rx="26" ry="6" fill="#000" opacity="0.15"/>
    <ellipse cx="38" cy="54" rx="26" ry="27" fill="#a8693a" stroke="#5a3518" stroke-width="3.5"/>
    <ellipse cx="38" cy="62" rx="16" ry="16" fill="#d9a46d"/>
    <circle cx="16" cy="28" r="7" fill="#a8693a" stroke="#5a3518" stroke-width="3"/><circle cx="60" cy="28" r="7" fill="#a8693a" stroke="#5a3518" stroke-width="3"/>
    <ellipse cx="38" cy="38" rx="22" ry="19" fill="#a8693a" stroke="#5a3518" stroke-width="3.5"/>
    <circle cx="30" cy="34" r="4" fill="#3a2414"/><circle cx="46" cy="34" r="4" fill="#3a2414"/>
    <circle cx="31.5" cy="32.5" r="1.4" fill="#fff"/><circle cx="47.5" cy="32.5" r="1.4" fill="#fff"/>
    <ellipse cx="38" cy="44" rx="9" ry="6" fill="#d9a46d"/>
    <ellipse cx="38" cy="41" rx="4" ry="3" fill="#3a2414"/>
    ${chomp
      ? `<path d="M 32 47 Q 38 56 44 47 Z" fill="#7a2f2f" stroke="#5a3518" stroke-width="2"/><rect x="33.5" y="47" width="9" height="6" rx="1.5" fill="#fff" stroke="#5a3518" stroke-width="1.5"/>`
      : `<rect x="33.5" y="47" width="9" height="9" rx="1.5" fill="#fff" stroke="#5a3518" stroke-width="1.8"/><path d="M 38 47 L 38 56" stroke="#5a3518" stroke-width="1.5"/>`}
    <ellipse cx="22" cy="60" rx="6" ry="8" fill="#a8693a" stroke="#5a3518" stroke-width="2.5" transform="rotate(${chomp ? -30 : 10} 22 60)"/>
    <ellipse cx="54" cy="60" rx="6" ry="8" fill="#a8693a" stroke="#5a3518" stroke-width="2.5" transform="rotate(${chomp ? 30 : -10} 54 60)"/>`);
}
LOG_ART.beaver0 = beaverSVG(false);
LOG_ART.beaver1 = beaverSVG(true);

// ---- Carrot Lift, mushroom, checkpoint flower ------------------------------------------------
export const MISC_ART = {
  leaf: svg(140, 44, `
    <path d="M 4 24 Q 30 2 80 6 Q 126 10 136 22 Q 120 38 70 38 Q 22 38 4 24 Z" fill="#6fcd4b" stroke="#2f7a24" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 10 23 Q 70 16 130 21" stroke="#3f9a2c" stroke-width="3" fill="none"/>
    <path d="M 40 21 l -8 -9 M 70 19 l -6 -10 M 100 19 l -4 -9" stroke="#3f9a2c" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 24 15 Q 50 7 80 9" stroke="#b9f08f" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  bouncy: svg(116, 92, `
    <path d="M 44 90 Q 40 64 46 52 L 70 52 Q 76 64 72 90 Z" fill="#fff6e6" stroke="#5a3518" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 52 74 Q 58 78 64 74" stroke="#5a3518" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="51" cy="66" r="2.6" fill="#5a3518"/><circle cx="65" cy="66" r="2.6" fill="#5a3518"/>
    <path d="M 4 50 Q 4 6 58 4 Q 112 6 112 50 Q 58 62 4 50 Z" fill="url(#cap)" stroke="#5a3518" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="30" cy="30" rx="9" ry="7" fill="#fff"/><ellipse cx="62" cy="18" rx="10" ry="7" fill="#fff"/><ellipse cx="88" cy="34" rx="8" ry="6" fill="#fff"/>
    <path d="M 22 18 Q 36 8 52 8" stroke="#ffc6e2" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    `<linearGradient id="cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fc8"/><stop offset="1" stop-color="#e3479a"/></linearGradient>`),
  'flower-bud': svg(64, 110, `
    <path d="M 32 108 Q 30 70 32 40" stroke="#4e9c35" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M 31 84 Q 14 72 10 80 Q 18 92 31 88 Z" fill="#6cc24a" stroke="#3f7f2b" stroke-width="2.5"/>
    <path d="M 33 70 Q 50 58 54 66 Q 46 78 33 74 Z" fill="#6cc24a" stroke="#3f7f2b" stroke-width="2.5"/>
    <path d="M 32 14 Q 18 30 22 40 Q 32 48 42 40 Q 46 30 32 14 Z" fill="#ffd84d" stroke="#5a3518" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 32 18 Q 30 30 32 42" stroke="#e8a91c" stroke-width="2.5" fill="none"/>`),
  'flower-bloom': svg(96, 110, `
    <path d="M 48 108 Q 46 70 48 50" stroke="#4e9c35" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M 47 84 Q 30 72 26 80 Q 34 92 47 88 Z" fill="#6cc24a" stroke="#3f7f2b" stroke-width="2.5"/>
    <path d="M 49 72 Q 66 60 70 68 Q 62 80 49 76 Z" fill="#6cc24a" stroke="#3f7f2b" stroke-width="2.5"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="48" cy="18" rx="9" ry="15" transform="rotate(${a} 48 34)" fill="#ffd84d" stroke="#5a3518" stroke-width="2.5"/>`).join('')}
    <circle cx="48" cy="34" r="13" fill="#b5652d" stroke="#5a3518" stroke-width="2.5"/>
    <circle cx="43" cy="32" r="2.4" fill="#3a2414"/><circle cx="53" cy="32" r="2.4" fill="#3a2414"/>
    <path d="M 43 38 Q 48 42 53 38" stroke="#3a2414" stroke-width="2.2" fill="none" stroke-linecap="round"/>`),
};

// ---- Boss: the sleepy crow on its fence gate --------------------------------------------------
export const CROW_SIZE = 150;

/** lid: 0 (wide awake, grumpy) … 1 (eyes shut). */
export function crowSVG({ lid = 0, yawn = false, droop = 0 } = {}) {
  const BODY = '#3d4558', DARK = '#262b38', OUT = '#1c202b';
  const eye = (cx, flip) => {
    const ry = 15, top = 50 - ry;
    const lidH = Math.min(2 * ry + 2, lid * 2 * ry);
    return `<clipPath id="e${flip}"><ellipse cx="${cx}" cy="50" rx="12" ry="${ry}"/></clipPath>
      <ellipse cx="${cx}" cy="50" rx="12" ry="${ry}" fill="#fff" stroke="${OUT}" stroke-width="3"/>
      <g clip-path="url(#e${flip})">
        <circle cx="${cx + 2 * flip}" cy="54" r="6.5" fill="${OUT}"/><circle cx="${cx + 3.5 * flip}" cy="51.5" r="2.2" fill="#fff"/>
        ${lid > 0 ? `<rect x="${cx - 14}" y="${top - 2}" width="28" height="${lidH + 2}" fill="${BODY}"/>
        <path d="M ${cx - 13} ${top + lidH} Q ${cx} ${top + lidH + 3} ${cx + 13} ${top + lidH}" stroke="${OUT}" stroke-width="3" fill="none"/>` : ''}
      </g>
      ${lid >= 1 ? `<path d="M ${cx - 9} 52 Q ${cx} 58 ${cx + 9} 52" stroke="${OUT}" stroke-width="3" fill="none" stroke-linecap="round"/>` : ''}`;
  };
  const brows = lid < 0.5 ? `<path d="M 50 30 L 70 37 M 100 30 L 80 37" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>` : '';
  const beak = yawn
    ? `<path d="M 62 62 L 88 62 L 75 70 Z" fill="#ffa62b" stroke="#8a4a10" stroke-width="3" stroke-linejoin="round"/>
       <ellipse cx="75" cy="78" rx="9" ry="10" fill="#7a2f3f" stroke="${OUT}" stroke-width="2.5"/>
       <path d="M 64 86 L 86 86 L 75 98 Z" fill="#ffa62b" stroke="#8a4a10" stroke-width="3" stroke-linejoin="round"/>`
    : `<path d="M 62 62 Q 75 58 88 62 L 75 82 Z" fill="#ffa62b" stroke="#8a4a10" stroke-width="3" stroke-linejoin="round"/>
       <path d="M 66 66 L 84 66" stroke="#8a4a10" stroke-width="2"/>`;
  return svg(CROW_SIZE, CROW_SIZE, `
    <ellipse cx="75" cy="146" rx="40" ry="4" fill="#000" opacity="0.15"/>
    <path d="M 40 118 L 14 132 L 30 112 Z" fill="${DARK}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="75" cy="106" rx="44" ry="38" fill="${BODY}" stroke="${OUT}" stroke-width="4"/>
    <ellipse cx="75" cy="114" rx="26" ry="24" fill="#5d6780"/>
    <path d="M 40 100 Q 75 128 110 100 Q 96 122 75 124 Q 54 122 40 100 Z" fill="${DARK}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 60 142 l -6 6 M 60 142 l 0 7 M 90 142 l 6 6 M 90 142 l 0 7" stroke="#ffa62b" stroke-width="4" stroke-linecap="round"/>
    <g transform="rotate(${droop} 75 80)">
      <path d="M 66 20 L 70 4 L 76 18 L 84 6 L 84 22 Z" fill="${DARK}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="75" cy="52" r="36" fill="${BODY}" stroke="${OUT}" stroke-width="4"/>
      <ellipse cx="50" cy="68" rx="7" ry="4" fill="#ff8fa8" opacity="0.5"/><ellipse cx="100" cy="68" rx="7" ry="4" fill="#ff8fa8" opacity="0.5"/>
      ${eye(60, -1)}${eye(90, 1)}
      ${brows}
      ${beak}
    </g>`);
}

export const CROW_FRAMES = {
  crow0: { lid: 0 }, crow1: { lid: 0.18 }, crow2: { lid: 0.34 }, crow3: { lid: 0.5 }, crow4: { lid: 0.66 }, crow5: { lid: 0.85 },
  crowYawn: { lid: 1, yawn: true }, crowSleep: { lid: 1, droop: 16 },
};

export const FENCE_ART = {
  'fence-door': svg(100, 160, `
    <rect x="6" y="22" width="88" height="18" rx="6" fill="#d39a5c" stroke="#6b4424" stroke-width="4"/>
    <rect x="6" y="104" width="88" height="18" rx="6" fill="#d39a5c" stroke="#6b4424" stroke-width="4"/>
    ${[12, 40, 68].map((x) => `<path d="M ${x} 156 L ${x} 14 L ${x + 10} 2 L ${x + 20} 14 L ${x + 20} 156 Z" fill="#e7b273" stroke="#6b4424" stroke-width="4" stroke-linejoin="round"/>`).join('')}
    <path d="M 14 120 L 86 30" stroke="#c98a4b" stroke-width="10" stroke-linecap="round"/>
    <path d="M 14 120 L 86 30" stroke="#6b4424" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`),
  perch: svg(44, 230, `<rect x="8" y="10" width="28" height="222" rx="8" fill="#b97a43" stroke="#6b4424" stroke-width="4"/>
    <rect x="2" y="2" width="40" height="18" rx="7" fill="#d39a5c" stroke="#6b4424" stroke-width="4"/>
    <path d="M 16 40 L 16 210" stroke="#9a5f2f" stroke-width="3" opacity="0.6"/>`),
};

// ---- World props: water, turtles, drifting clouds, snowballs, bouncy mushrooms -------------------
const WATER = {
  meadow: ['#4fb3e8', '#7fd0f5', '#2f7fb8'],
  mushroom: ['#3fae9e', '#74d6c4', '#1f7368'],
  beach: ['#2fb3d1', '#7fe0ee', '#1f7f9e'],
  snow: ['#6fb6e6', '#b8e3ff', '#3f7fb3'],
  candy: ['#ff9fc8', '#ffd0e6', '#d0578e'], // strawberry milk!
};

function waterTop(c) {
  return svg(64, 64, `
    <rect y="14" width="64" height="50" fill="${c[0]}"/>
    <path d="M 0 14 Q 8 6 16 14 T 32 14 T 48 14 T 64 14 L 64 24 L 0 24 Z" fill="${c[1]}"/>
    <path d="M 0 14 Q 8 6 16 14 T 32 14 T 48 14 T 64 14" fill="none" stroke="${c[2]}" stroke-width="3"/>
    <path d="M 10 34 q 6 -3 12 0 M 40 46 q 6 -3 12 0" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>`);
}
const waterBody = (c) => svg(64, 64, `<rect width="64" height="64" fill="${c[0]}"/><path d="M 24 22 q 6 -3 12 0" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.45"/>`);

// Swimming water is see-through, so Hoppy shows underneath; light rays make it feel deep and friendly.
const swimTop = svg(64, 64, `
  <rect y="12" width="64" height="52" fill="#38b6e0"/>
  <path d="M 0 12 Q 8 4 16 12 T 32 12 T 48 12 T 64 12 L 64 20 L 0 20 Z" fill="#a8ecff"/>
  <path d="M 0 12 Q 8 4 16 12 T 32 12 T 48 12 T 64 12" fill="none" stroke="#ffffff" stroke-width="3"/>
  <path d="M 14 20 L 6 64 M 44 20 L 36 64" stroke="#ffffff" stroke-width="6" opacity="0.15"/>`);
const swimBody = svg(64, 64, `<rect width="64" height="64" fill="#2a9fd0"/>
  <path d="M 14 0 L 6 64 M 44 0 L 36 64" stroke="#ffffff" stroke-width="6" opacity="0.1"/>`);

export const WATER_ART = { 'swim-top': swimTop, swim: swimBody,
  bubble: svg(20, 20, `<circle cx="10" cy="10" r="7.5" fill="#d8f6ff" fill-opacity="0.35" stroke="#ffffff" stroke-width="2"/><circle cx="7.5" cy="7.5" r="2" fill="#ffffff"/>`) };
for (const [w, c] of Object.entries(WATER)) {
  WATER_ART[`water-top-${w}`] = waterTop(c);
  WATER_ART[`water-${w}`] = waterBody(c);
}

/** A friendly sea turtle; Hoppy stands on its flat-topped shell. Two paddling frames. */
function turtleSVG(frame) {
  const OUT = '#22543a';
  const f = frame ? 1 : -1;
  return svg(160, 84, `
    <ellipse cx="34" cy="${56 + f * 3}" rx="16" ry="8" fill="#7fd08a" stroke="${OUT}" stroke-width="3.5" transform="rotate(${20 * f} 34 56)"/>
    <ellipse cx="122" cy="${58 - f * 3}" rx="18" ry="8" fill="#7fd08a" stroke="${OUT}" stroke-width="3.5" transform="rotate(${-20 * f} 122 58)"/>
    <ellipse cx="146" cy="38" rx="17" ry="15" fill="#8fe09a" stroke="${OUT}" stroke-width="3.5"/>
    <circle cx="151" cy="33" r="4" fill="${OUT}"/><circle cx="152.5" cy="31.5" r="1.4" fill="#fff"/>
    <path d="M 146 44 Q 152 48 158 44" stroke="${OUT}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="141" cy="42" rx="4" ry="2.4" fill="#ff9fb2" opacity="0.7"/>
    <path d="M 10 50 Q 10 10 80 8 Q 150 10 150 50 Z" fill="url(#shell)" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M 10 50 L 150 50 Q 148 62 80 62 Q 12 62 10 50 Z" fill="#e9d98a" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 52 14 L 44 48 M 108 14 L 116 48 M 30 30 L 130 30" stroke="#2f7a46" stroke-width="3.5" fill="none" opacity="0.8"/>
    <path d="M 40 16 Q 80 8 120 16" stroke="#c9f5cf" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>`,
  `<linearGradient id="shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd27e"/><stop offset="1" stop-color="#3fa45a"/></linearGradient>`);
}

/** Drifting cotton-candy cloud (one-way platform) with a sleepy little face. */
function cloudPlatformSVG() {
  const OUT = '#b0659a';
  const puffs = [[30, 40, 26], [62, 28, 32], [98, 26, 30], [130, 40, 24]];
  return svg(160, 76, `
    ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y + 4}" r="${r}" fill="#f2b6dc"/>`).join('')}
    <rect x="10" y="38" width="140" height="32" rx="16" fill="#f2b6dc"/>
    ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff4fb" stroke="${OUT}" stroke-width="4"/>`).join('')}
    <rect x="10" y="34" width="140" height="30" rx="15" fill="#fff4fb" stroke="${OUT}" stroke-width="4"/>
    ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 2.5}" fill="#fff4fb"/>`).join('')}
    <rect x="13" y="37" width="134" height="24" rx="12" fill="#fff4fb"/>
    <path d="M 62 46 q 6 4 12 0 M 88 46 q 6 4 12 0" stroke="${OUT}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="56" cy="54" rx="6" ry="3.4" fill="#ffb3d9"/><ellipse cx="106" cy="54" rx="6" ry="3.4" fill="#ffb3d9"/>
    <path d="M 76 54 q 5 4 10 0" stroke="${OUT}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
}

export const MOVER_ART = {
  turtle0: turtleSVG(0),
  turtle1: turtleSVG(1),
  'cloud-platform': cloudPlatformSVG(),
  snowball: svg(64, 64, `
    <circle cx="32" cy="32" r="28" fill="url(#sb)" stroke="#6c86b0" stroke-width="4"/>
    <path d="M 14 26 Q 20 12 34 10" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="40" r="3" fill="#cfe0f5"/><circle cx="24" cy="44" r="2" fill="#cfe0f5"/>`,
  `<radialGradient id="sb" cx="40%" cy="35%" r="70%"><stop offset="0.5" stop-color="#ffffff"/><stop offset="1" stop-color="#d6e4f7"/></radialGradient>`),
  'snow-puff': svg(28, 28, `<circle cx="14" cy="14" r="11" fill="#ffffff" stroke="#c8d8ef" stroke-width="2.5"/>`),
  'rainbow-spark': svg(18, 18, `<path d="M 9 1 Q 10 8 17 9 Q 10 10 9 17 Q 8 10 1 9 Q 8 8 9 1 Z" fill="#ffffff"/>`),
};

/** Bouncy mushroom (one per world palette). */
function bouncySVG(capTop, capBottom, spot, shine, extra = '') {
  return svg(116, 92, `
    <path d="M 44 90 Q 40 64 46 52 L 70 52 Q 76 64 72 90 Z" fill="#fff6e6" stroke="#5a3518" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 52 74 Q 58 78 64 74" stroke="#5a3518" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="51" cy="66" r="2.6" fill="#5a3518"/><circle cx="65" cy="66" r="2.6" fill="#5a3518"/>
    <path d="M 4 50 Q 4 6 58 4 Q 112 6 112 50 Q 58 62 4 50 Z" fill="url(#cap)" stroke="#5a3518" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="30" cy="30" rx="9" ry="7" fill="${spot}"/><ellipse cx="62" cy="18" rx="10" ry="7" fill="${spot}"/><ellipse cx="88" cy="34" rx="8" ry="6" fill="${spot}"/>
    <path d="M 22 18 Q 36 8 52 8" stroke="${shine}" stroke-width="4" fill="none" stroke-linecap="round"/>${extra}`,
  `<linearGradient id="cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${capTop}"/><stop offset="1" stop-color="${capBottom}"/></linearGradient>`);
}
export const BOUNCY_ART = {
  'bouncy-meadow': bouncySVG('#ff8fc8', '#e3479a', '#fff', '#ffc6e2'),
  'bouncy-mushroom': bouncySVG('#8fb4ff', '#4d6fe0', '#e8f0ff', '#d0e0ff'),
  'bouncy-beach': bouncySVG('#ffb15c', '#f0782e', '#fff4c4', '#ffe0b8'),
  'bouncy-snow': bouncySVG('#9fd8ff', '#4fa3e0', '#ffffff', '#e0f4ff',
    `<path d="M 14 30 Q 20 8 58 6 Q 96 8 102 30 Q 90 22 76 26 Q 62 18 50 24 Q 34 18 14 30 Z" fill="#ffffff" stroke="#9fb7da" stroke-width="2"/>`),
  'bouncy-candy': bouncySVG('#9de89a', '#3fbf6b', '#ffffff', '#d8ffd6'),
};
