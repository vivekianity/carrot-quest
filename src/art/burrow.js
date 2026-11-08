// Hoppy's burrow (the carrot shop scene): a cosy underground room, decorations the child can buy,
// and the shop's wooden panel and cards. All SVG strings.
import { itemIconSVG } from './outfits.js';
import { CATALOGUE } from '../engine/shop.js';

const OUT = '#6b4424';
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

function room() {
  const pebbles = [[90, 120], [250, 70], [610, 90], [760, 60], [980, 110], [1180, 160], [40, 330], [1240, 420], [700, 40], [420, 50]]
    .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${10 + (i % 3) * 4}" ry="${7 + (i % 2) * 3}" fill="#8f5d38" opacity="0.7"/>`).join('');
  const roots = [[200, 40, 60], [520, 28, 44], [880, 30, 70], [1100, 50, 40]]
    .map(([x, y, l]) => `<path d="M ${x} ${y} q 6 ${l * 0.4} -4 ${l * 0.7} t 6 ${l * 0.3}" fill="none" stroke="#a8743f" stroke-width="5" stroke-linecap="round"/>
      <path d="M ${x + 3} ${y + l * 0.45} q 10 6 12 16" fill="none" stroke="#a8743f" stroke-width="3" stroke-linecap="round"/>`).join('');
  const planks = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M ${i * 170 - 20} 602 L ${i * 170 - 60} 720" stroke="#a96f3a" stroke-width="3" opacity="0.6"/>`).join('');
  return svg(1280, 720, `
    <rect width="1280" height="720" fill="#7a4a2a"/>
    ${pebbles}
    <path d="M 0 720 L 0 250 Q 10 60 220 50 Q 640 20 1060 50 Q 1270 60 1280 250 L 1280 720 Z" fill="url(#wall)"/>
    <path d="M 0 250 Q 10 60 220 50 Q 640 20 1060 50 Q 1270 60 1280 250" fill="none" stroke="#5a361d" stroke-width="10" opacity="0.5"/>
    ${roots}
    ${[[120, 480], [600, 160], [1000, 300], [360, 120], [820, 470]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="9" fill="#dca06a" opacity="0.6"/>`).join('')}
    <!-- the round window onto the meadow -->
    <g transform="translate(170 300)">
      <circle r="98" fill="#8a5a30" stroke="${OUT}" stroke-width="6"/>
      <circle r="80" fill="url(#sky)"/>
      <clipPath id="win"><circle r="80"/></clipPath>
      <g clip-path="url(#win)">
        <ellipse cx="-30" cy="70" rx="90" ry="50" fill="#8fd36a"/><ellipse cx="60" cy="80" rx="80" ry="46" fill="#6fbf4f"/>
        <circle cx="40" cy="-38" r="16" fill="#fff3a0"/>
        <ellipse cx="-36" cy="-30" rx="22" ry="10" fill="#fff" opacity="0.9"/><ellipse cx="-20" cy="-36" rx="14" ry="9" fill="#fff" opacity="0.9"/>
        ${[[-50, 40], [-10, 52], [30, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff"/><circle cx="${x}" cy="${y}" r="1.8" fill="#ffd23f"/>`).join('')}
      </g>
      <path d="M -80 0 L 80 0 M 0 -80 L 0 80" stroke="#8a5a30" stroke-width="9"/>
      <circle r="80" fill="none" stroke="${OUT}" stroke-width="5"/>
      <path d="M -60 -52 Q -40 -70 -12 -76" fill="none" stroke="#fff" stroke-width="6" opacity="0.45" stroke-linecap="round"/>
      <path d="M -112 96 L 112 96" stroke="#a8743f" stroke-width="16" stroke-linecap="round"/>
    </g>
    <!-- floor -->
    <path d="M 0 600 Q 640 586 1280 600 L 1280 720 L 0 720 Z" fill="#c98a4b"/>
    ${planks}
    <path d="M 0 600 Q 640 586 1280 600" fill="none" stroke="${OUT}" stroke-width="5"/>
    <path d="M 0 608 Q 640 594 1280 608" fill="none" stroke="#e7b27a" stroke-width="3" opacity="0.7"/>`,
  `<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6b07a"/><stop offset="1" stop-color="#f4cf9c"/></linearGradient>
   <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0ff"/><stop offset="1" stop-color="#d8f1ff"/></linearGradient>`);
}

// ---- Decorations (positions are used by the Burrow scene) ---------------------------------------
export const DECOR_AT = {
  'decor-rug': { x: 330, y: 640 },
  'decor-plant': { x: 568, y: 604, origin: [0.5, 1] },
  'decor-lamp': { x: 62, y: 612, origin: [0.5, 1] },
  'decor-picture': { x: 488, y: 292 },
  'decor-shelf': { x: 330, y: 196 },
  'decor-garland': { x: 330, y: 118 },
};

export const DECOR_ART = {
  'decor-rug': svg(400, 90, `
    <ellipse cx="200" cy="48" rx="192" ry="38" fill="#000" opacity="0.12"/>
    <ellipse cx="200" cy="44" rx="190" ry="36" fill="#ff9ec2" stroke="${OUT}" stroke-width="5"/>
    <ellipse cx="200" cy="44" rx="150" ry="26" fill="#ffd0e1" stroke="#e07aa3" stroke-width="3"/>
    <ellipse cx="200" cy="44" rx="100" ry="16" fill="#ffe8a0" stroke="#e0b24a" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i / 8 * Math.PI * 2; return `<circle cx="${(200 + Math.cos(a) * 128).toFixed(0)}" cy="${(44 + Math.sin(a) * 21).toFixed(0)}" r="5" fill="#fff"/>`; }).join('')}`),
  'decor-plant': svg(120, 170, `
    <path d="M 60 96 C 40 60 14 60 8 40 C 30 40 52 54 60 90 Z" fill="#6fcd4b" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 60 96 C 80 56 104 54 114 30 C 88 32 66 52 60 90 Z" fill="#5ab83a" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 60 98 C 56 60 60 30 64 8 C 76 30 72 64 62 98 Z" fill="#7ad95a" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="64" cy="10" r="9" fill="#ff8fc8" stroke="${OUT}" stroke-width="3"/><circle cx="64" cy="10" r="3.5" fill="#ffd23f"/>
    <path d="M 22 100 L 98 100 L 88 164 Q 60 170 32 164 Z" fill="#e8835a" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="16" y="94" width="88" height="18" rx="8" fill="#f29a6c" stroke="${OUT}" stroke-width="5"/>
    <circle cx="48" cy="136" r="6" fill="#fff" opacity="0.5"/><circle cx="72" cy="140" r="4" fill="#fff" opacity="0.4"/>`),
  'decor-lamp': svg(110, 220, `
    <ellipse cx="55" cy="60" rx="54" ry="54" fill="#fff3a0" opacity="0.35"/>
    <path d="M 55 100 L 55 206" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>
    <path d="M 55 100 L 55 206" stroke="#c98a4b" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="55" cy="208" rx="30" ry="9" fill="#a8743f" stroke="${OUT}" stroke-width="5"/>
    <path d="M 22 40 Q 55 30 88 40 L 70 104 Q 55 112 40 104 Z" fill="#ff9a3c" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 34 60 Q 50 64 60 58 M 40 80 Q 52 84 64 78" stroke="#d96b1c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M 46 34 C 40 16 44 8 50 4 C 54 14 54 24 52 34 Z M 56 34 C 58 18 66 10 76 10 C 72 20 66 28 60 36 Z" fill="#6fcd4b" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <ellipse cx="42" cy="56" rx="5" ry="12" fill="#fff" opacity="0.45"/>`),
  'decor-picture': svg(150, 126, `
    <rect x="6" y="10" width="138" height="112" rx="10" fill="#000" opacity="0.15"/>
    <rect x="6" y="4" width="138" height="112" rx="10" fill="#e8b15c" stroke="${OUT}" stroke-width="5"/>
    <rect x="20" y="18" width="110" height="84" rx="4" fill="#bfe6ff" stroke="#a8743f" stroke-width="3"/>
    <ellipse cx="50" cy="102" rx="50" ry="22" fill="#8fd36a"/><ellipse cx="108" cy="104" rx="40" ry="20" fill="#6fbf4f"/>
    <circle cx="106" cy="38" r="10" fill="#fff3a0"/>
    <path d="M 62 92 L 76 46 L 90 92 Q 76 98 62 92 Z" fill="#ff9a3c" stroke="${OUT}" stroke-width="3" stroke-linejoin="round" transform="rotate(14 76 70)"/>
    <path d="M 76 46 q -8 -12 -2 -18 M 78 46 q 8 -10 14 -8" stroke="#5ab83a" stroke-width="4" fill="none" stroke-linecap="round" transform="rotate(14 76 70)"/>
    <circle cx="75" cy="-2" r="5" fill="#8d8f93" stroke="#4d4f53" stroke-width="2"/><path d="M 30 6 L 75 -2 L 120 6" stroke="#8d8f93" stroke-width="2" fill="none"/>`),
  'decor-shelf': svg(230, 110, `
    <rect x="10" y="82" width="210" height="18" rx="6" fill="#a8743f" stroke="${OUT}" stroke-width="5"/>
    <path d="M 40 100 L 52 108 M 190 100 L 178 108" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/>
    <!-- a ball, a block tower, a teddy and a tiny boat -->
    <circle cx="44" cy="62" r="20" fill="#ff6b6b" stroke="${OUT}" stroke-width="4"/><path d="M 26 56 Q 44 66 62 56" stroke="#fff" stroke-width="5" fill="none"/>
    <rect x="76" y="56" width="26" height="26" rx="4" fill="#5ec2ff" stroke="${OUT}" stroke-width="4"/>
    <rect x="82" y="32" width="24" height="24" rx="4" fill="#ffd23f" stroke="${OUT}" stroke-width="4"/>
    <circle cx="146" cy="44" r="13" fill="#c98a4b" stroke="${OUT}" stroke-width="4"/>
    <circle cx="136" cy="33" r="5" fill="#c98a4b" stroke="${OUT}" stroke-width="3"/><circle cx="156" cy="33" r="5" fill="#c98a4b" stroke="${OUT}" stroke-width="3"/>
    <ellipse cx="146" cy="70" rx="17" ry="14" fill="#c98a4b" stroke="${OUT}" stroke-width="4"/>
    <circle cx="142" cy="42" r="2" fill="${OUT}"/><circle cx="151" cy="42" r="2" fill="${OUT}"/><ellipse cx="146" cy="49" rx="4" ry="3" fill="#f3d9a4"/>
    <path d="M 176 72 L 214 72 L 206 82 L 184 82 Z" fill="#fff" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 195 70 L 195 40 L 212 66 Z" fill="#ff9ec2" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`),
  'decor-garland': svg(600, 90, `
    <path d="M 6 14 Q 300 70 594 14" fill="none" stroke="${OUT}" stroke-width="4"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
      const t = (i + 0.5) / 9, x = 6 + t * 588, y = 14 + 4 * 56 * t * (1 - t) * 0.98;
      const c = ['#ff6b6b', '#ffd23f', '#6fcd4b', '#5ec2ff', '#ff8fc8', '#ffa62b', '#9a6bff', '#ffd23f', '#ff6b6b'][i];
      const pts = [];
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 9 : 19; pts.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + 18 + Math.sin(a) * r).toFixed(1)}`); }
      return `<polygon points="${pts.join(' ')}" fill="${c}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`;
    }).join('')}`),
};

// Shop icons for decorations: the decoration itself, scaled into the card.
function decorIcon(id) {
  const src = DECOR_ART[id];
  const [, w, h] = src.match(/width="(\d+)" height="(\d+)"/).map(Number);
  const s = Math.min(104 / w, 104 / h);
  const inner = src.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><g transform="translate(${(120 - w * s) / 2} ${(120 - h * s) / 2}) scale(${s})">${inner}</g></svg>`;
}

const shopPanel = svg(620, 680, `
  <rect x="8" y="16" width="604" height="656" rx="40" fill="#000" opacity="0.18"/>
  <rect x="8" y="8" width="604" height="656" rx="40" fill="#c98a4b" stroke="${OUT}" stroke-width="7"/>
  <rect x="24" y="24" width="572" height="624" rx="30" fill="#fff4dc" stroke="#a8743f" stroke-width="3"/>
  <path d="M 50 150 L 570 150" stroke="#e7cfa3" stroke-width="3" stroke-dasharray="10 10"/>`);

const card = (edge, fill, width = 5) => svg(176, 196, `
  <rect x="6" y="12" width="164" height="178" rx="28" fill="#000" opacity="0.13"/>
  <rect x="6" y="6" width="164" height="178" rx="28" fill="${fill}" stroke="${edge}" stroke-width="${width}"/>
  <rect x="22" y="16" width="70" height="10" rx="5" fill="#fff" opacity="0.8"/>`);

const tab = (fill, edge) => svg(104, 104, `
  <circle cx="52" cy="56" r="44" fill="#000" opacity="0.15"/>
  <circle cx="52" cy="50" r="44" fill="${fill}" stroke="${edge}" stroke-width="6"/>`);

export const BURROW_ART = {
  'burrow-room': room(),
  'shop-panel': shopPanel,
  'shop-card': card('#a8743f', '#fffaf0'),
  'shop-card-on': card('#f0b93a', '#fff6c8', 8),
  'shop-tab': tab('#fff8e6', '#a8743f'),
  'shop-tab-on': tab('#fff3a0', '#f0b93a'),
  'shop-tick': svg(52, 52, `<circle cx="26" cy="26" r="22" fill="#6fcd4b" stroke="#2f7a24" stroke-width="4"/>
    <path d="M 15 27 L 23 35 L 38 18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
  'shop-new': svg(52, 52, `<circle cx="26" cy="26" r="22" fill="#fff3a0" stroke="#f0b93a" stroke-width="4"/>
    <path d="M 26 12 L 26 40 M 12 26 L 40 26" stroke="#c48a12" stroke-width="6" stroke-linecap="round"/>`),
};
for (const it of CATALOGUE) BURROW_ART[`item-${it.id}`] = it.slot === 'decor' ? decorIcon(it.id) : itemIconSVG(it.id);
Object.assign(BURROW_ART, DECOR_ART);
