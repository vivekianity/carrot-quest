// The storybook World Map (GAME_DESIGN §8): a painted page with one region per world, the level
// stepping-stones, and a rainbow meadow corner for Endless Meadow. SVG strings only.
const W = 1280, H = 720;
const OUT = '#6b4424';
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

/** Where each stepping-stone sits on the page (level order, then Endless Meadow). */
export const MAP_NODES = {
  '1-1': { x: 150, y: 612 }, '1-2': { x: 330, y: 556 },
  '2-1': { x: 512, y: 618 }, '2-2': { x: 690, y: 560 },
  '3-1': { x: 872, y: 620 }, '3-2': { x: 1074, y: 586 },
  '4-1': { x: 1158, y: 418 }, '4-2': { x: 964, y: 352 },
  '5-1': { x: 738, y: 300 }, '5-2': { x: 508, y: 338 },
  endless: { x: 238, y: 300 },
};

// Tiny seeded random, so the page looks the same every time.
function rand(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

const tree = (x, y, s = 1) => `
  <rect x="${x - 5 * s}" y="${y - 6 * s}" width="${10 * s}" height="${22 * s}" rx="${4 * s}" fill="#9a6a3c" stroke="${OUT}" stroke-width="3"/>
  <circle cx="${x}" cy="${y - 22 * s}" r="${22 * s}" fill="#6cc24a" stroke="${OUT}" stroke-width="3.5"/>
  <circle cx="${x - 7 * s}" cy="${y - 30 * s}" r="${7 * s}" fill="#9be07a" opacity="0.8"/>`;
const flower = (x, y, c) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><circle cx="${x}" cy="${y}" r="2" fill="#fff3a0"/>`;
const mushroom = (x, y, s, cap) => `
  <rect x="${x - 7 * s}" y="${y - 22 * s}" width="${14 * s}" height="${24 * s}" rx="${6 * s}" fill="#fff4e2" stroke="${OUT}" stroke-width="3"/>
  <path d="M ${x - 26 * s} ${y - 18 * s} Q ${x} ${y - 58 * s} ${x + 26 * s} ${y - 18 * s} Z" fill="${cap}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
  <circle cx="${x - 9 * s}" cy="${y - 32 * s}" r="${4.5 * s}" fill="#fff" opacity="0.9"/><circle cx="${x + 8 * s}" cy="${y - 28 * s}" r="${3.5 * s}" fill="#fff" opacity="0.9"/>`;
const palm = (x, y, s = 1) => `
  <path d="M ${x} ${y} Q ${x + 6 * s} ${y - 30 * s} ${x - 2 * s} ${y - 60 * s}" fill="none" stroke="#a86f3a" stroke-width="${8 * s}" stroke-linecap="round"/>
  <path d="M ${x - 2 * s} ${y - 60 * s} q -26 -4 -36 12 q 18 -16 36 -12 q -6 -26 -26 -30 q 26 6 26 30 q 14 -24 36 -22 q -22 4 -36 22 q 30 -4 40 14 q -18 -12 -40 -14 Z"
    fill="#4fb84a" stroke="${OUT}" stroke-width="3" stroke-linejoin="round" transform="scale(1)"/>`;
const pine = (x, y, s = 1) => `
  <rect x="${x - 4 * s}" y="${y - 8 * s}" width="${8 * s}" height="${12 * s}" fill="#8a5a30"/>
  <path d="M ${x} ${y - 52 * s} L ${x + 20 * s} ${y - 8 * s} L ${x - 20 * s} ${y - 8 * s} Z" fill="#3f9a6a" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M ${x} ${y - 52 * s} L ${x + 9 * s} ${y - 32 * s} Q ${x} ${y - 36 * s} ${x - 9 * s} ${y - 32 * s} Z" fill="#fff"/>`;
const peak = (x, y, w, h, c = '#a9bfd8') => `
  <path d="M ${x - w / 2} ${y} L ${x} ${y - h} L ${x + w / 2} ${y} Z" fill="${c}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M ${x - w * 0.17} ${y - h * 0.66} L ${x} ${y - h} L ${x + w * 0.17} ${y - h * 0.66} L ${x + w * 0.06} ${y - h * 0.6} L ${x - w * 0.05} ${y - h * 0.68} Z" fill="#fff"/>`;
const puff = (x, y, s, c) => `
  <g fill="${c}" stroke="${OUT}" stroke-width="3"><path d="M ${x - 40 * s} ${y} a ${18 * s} ${18 * s} 0 0 1 ${18 * s} ${-22 * s} a ${24 * s} ${24 * s} 0 0 1 ${44 * s} ${-4 * s} a ${18 * s} ${18 * s} 0 0 1 ${20 * s} ${26 * s} Z"/></g>`;
const lolly = (x, y, c) => `
  <rect x="${x - 3}" y="${y - 38}" width="6" height="40" fill="#fff" stroke="${OUT}" stroke-width="2.5"/>
  <circle cx="${x}" cy="${y - 50}" r="16" fill="${c}" stroke="${OUT}" stroke-width="3.5"/>
  <path d="M ${x} ${y - 50} m -9 0 a 9 9 0 1 1 9 9 a 5 5 0 1 1 -5 -5" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`;

/** A soft, hand-drawn-looking rounded patch (wobbly edges) for one region of the map. */
function blob(x0, y0, x1, y1, fill, edge, seed) {
  const r = rand(seed);
  const pts = [];
  const side = (ax, ay, bx, by) => {
    const len = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(len / 70));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const nx = (by - ay) / len, ny = -(bx - ax) / len;   // outward normal (clockwise path)
      const j = (r() - 0.5) * 22;
      pts.push([ax + (bx - ax) * t + nx * j, ay + (by - ay) * t + ny * j]);
    }
  };
  side(x0, y0, x1, y0); side(x1, y0, x1, y1); side(x1, y1, x0, y1); side(x0, y1, x0, y0);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${mid(pts[pts.length - 1], pts[0]).join(' ')}`;
  pts.forEach((p, i) => { const m = mid(p, pts[(i + 1) % pts.length]); d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; });
  return `<path d="${d} Z" fill="${fill}" stroke="${edge}" stroke-width="5" stroke-linejoin="round" opacity="0.95"/>`;
}

export function mapSVG() {
  const r = rand(77);
  let deco = '';
  // Meadow Hills (bottom-left)
  for (const [x, y, s] of [[60, 520, 1], [255, 470, 0.85], [420, 520, 0.75], [40, 690, 0.9], [250, 700, 0.8]]) deco += tree(x, y, s);
  for (let i = 0; i < 26; i++) deco += flower(20 + r() * 400, 480 + r() * 230, ['#ff8fb0', '#fff', '#ffd23f', '#b38bff'][i % 4]);
  // Mushroom Forest (bottom-middle)
  for (const [x, y, s, c] of [[455, 690, 1.1, '#e85d6a'], [600, 520, 0.9, '#a879e8'], [780, 690, 1, '#f08a3c'], [600, 708, 0.8, '#e85d6a'], [760, 505, 0.7, '#a879e8']]) deco += mushroom(x, y, s, c);
  // Sunny Beach (bottom-right)
  for (const [x, y, s] of [[980, 520, 1], [1240, 690, 0.9], [800, 560, 0.7]]) deco += palm(x, y, s);
  deco += `<path d="M 1150 708 q 14 -10 28 0 t 28 0 t 28 0 t 28 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    <path d="M 1180 660 q 12 -8 24 0 t 24 0 t 24 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
  deco += `<path d="M 1186 520 l 0 -46 l 28 34 Z" fill="#ff7a6b" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/><path d="M 1170 522 q 30 12 56 0 l -6 10 q -22 8 -44 0 Z" fill="#c98a4b" stroke="${OUT}" stroke-width="3"/>`;
  // Snowy Peaks (upper-right)
  deco += peak(1060, 470, 220, 190) + peak(1210, 470, 200, 230, '#b9cbe0') + peak(905, 470, 170, 140, '#c4d4e6');
  for (const [x, y, s] of [[860, 300, 0.9], [1090, 300, 0.8], [1250, 330, 0.8], [1110, 455, 0.7]]) deco += pine(x, y, s);
  // Candy Clouds (upper-middle)
  for (const [x, y, s, c] of [[460, 250, 1.3, '#ffd6ea'], [640, 230, 1.1, '#dfe9ff'], [820, 215, 0.9, '#ffe6f3'], [600, 430, 1.2, '#ffd6ea'], [415, 420, 0.9, '#dfe9ff']]) deco += puff(x, y, s, c);
  for (const [x, y, c] of [[410, 360, '#ff8fc8'], [640, 400, '#7fc8ff'], [820, 370, '#ffb347']]) deco += lolly(x, y, c);
  // Endless Meadow (upper-left): a big rainbow over a field of flowers
  const bands = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'];
  deco += bands.map((c, i) => `<path d="M ${70 + i * 12} 400 A ${170 - i * 12} ${150 - i * 12} 0 0 1 ${410 - i * 12} 400" fill="none" stroke="${c}" stroke-width="12"/>`).join('');
  for (let i = 0; i < 22; i++) deco += flower(40 + r() * 330, 390 + r() * 70, ['#ff8fb0', '#fff', '#ffd23f', '#b38bff'][i % 4]);

  return svg(W, H, `
    <rect width="${W}" height="${H}" fill="#f7e7c4"/>
    <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="34" fill="url(#paper)" stroke="#d9bb86" stroke-width="6"/>
    <g clip-path="url(#page)">
    ${blob(-40, 150, 396, 462, '#d8f3c4', '#b5dc9c', 3)}
    ${blob(404, 150, 820, 462, '#fde1ef', '#f2bfd8', 5)}
    ${blob(828, 150, 1320, 470, '#e4eef8', '#c3d5e8', 7)}
    ${blob(-40, 476, 432, 760, '#b7e59a', '#93cc72', 11)}
    ${blob(440, 480, 806, 760, '#cbb5ee', '#ab90d8', 13)}
    ${blob(814, 482, 1320, 760, '#f6dca2', '#e2bf78', 17)}
    <path d="M 1110 760 Q 1140 650 1320 616 L 1320 760 Z" fill="#8fd3f4" stroke="#6cbce3" stroke-width="5"/>
    ${deco}
    </g>
    <!-- a soft vignette like an old storybook page -->
    <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="34" fill="url(#vig)"/>`,
  `<radialGradient id="paper" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#fff6de"/><stop offset="1" stop-color="#f3dfb4"/></radialGradient>
   <clipPath id="page"><rect x="13" y="13" width="${W - 26}" height="${H - 26}" rx="32"/></clipPath>
   <radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="0.7" stop-color="#7a5a30" stop-opacity="0"/><stop offset="1" stop-color="#7a5a30" stop-opacity="0.22"/></radialGradient>`);
}

/** Stepping-stone for a level: 'open', 'done' (golden rim) or 'locked' (grey with a padlock). */
function nodeSVG(kind) {
  const top = kind === 'locked' ? '#c9c3b8' : kind === 'endless' ? '#fff3b0' : '#fff8e6';
  const side = kind === 'locked' ? '#9e978b' : kind === 'done' ? '#f0b93a' : kind === 'endless' ? '#ffb347' : '#d9b27a';
  const rim = kind === 'done' ? '#ffd23f' : kind === 'endless' ? 'url(#rb)' : side;
  const lock = kind === 'locked' ? `
    <rect x="40" y="38" width="32" height="26" rx="6" fill="#8a8378" stroke="#5f594f" stroke-width="3.5"/>
    <path d="M 46 39 v -8 a 10 10 0 0 1 20 0 v 8" fill="none" stroke="#5f594f" stroke-width="4.5"/>
    <circle cx="56" cy="50" r="3.5" fill="#5f594f"/>` : '';
  return svg(112, 100, `
    <ellipse cx="56" cy="64" rx="50" ry="30" fill="#000" opacity="0.15"/>
    <ellipse cx="56" cy="56" rx="50" ry="30" fill="${side}" stroke="${OUT}" stroke-width="5"/>
    <ellipse cx="56" cy="46" rx="50" ry="30" fill="${top}" stroke="${OUT}" stroke-width="5"/>
    <ellipse cx="56" cy="46" rx="40" ry="22" fill="none" stroke="${rim}" stroke-width="5" opacity="0.9"/>
    <ellipse cx="38" cy="34" rx="14" ry="5" fill="#fff" opacity="0.6"/>${lock}`,
  `<linearGradient id="rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd43b"/><stop offset="0.5" stop-color="#69db7c"/><stop offset="0.75" stop-color="#4dabf7"/><stop offset="1" stop-color="#9775fa"/></linearGradient>`);
}

const ribbon = svg(520, 96, `
  <path d="M 30 30 L 0 30 L 22 54 L 0 78 L 60 78 Z" fill="#c9503f" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M 490 30 L 520 30 L 498 54 L 520 78 L 460 78 Z" fill="#c9503f" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M 40 14 Q 260 0 480 14 L 480 70 Q 260 56 40 70 Z" fill="#e8604c" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M 60 24 Q 260 12 460 24" fill="none" stroke="#fff" stroke-width="3" opacity="0.45"/>`);

const card = svg(560, 300, `
  <rect x="8" y="16" width="544" height="276" rx="36" fill="#000" opacity="0.16"/>
  <rect x="8" y="8" width="544" height="276" rx="36" fill="#fff8e6" stroke="${OUT}" stroke-width="6"/>
  <rect x="28" y="24" width="300" height="14" rx="7" fill="#fff" opacity="0.8"/>`);

export const MAP_ART = {
  'world-map': mapSVG(),
  'map-node': nodeSVG('open'),
  'map-node-done': nodeSVG('done'),
  'map-node-locked': nodeSVG('locked'),
  'map-node-endless': nodeSVG('endless'),
  'map-ribbon': ribbon,
  'map-card': card,
};
