// Terrain tiles and ground decorations as SVG strings (64×64 tiles), one palette per world.
import { TILE, EDGE } from '../engine/level-map.js';

const T = TILE;

const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

/**
 * World palettes. `top` is the surface layer (grass, moss, sand, snow, frosting), `dirt` the ground under it.
 * `bits` are the little details in the dirt (pebbles, roots, shells, cracks, sprinkles).
 */
export const PALETTES = {
  meadow: {
    out: '#4b3424', dirt: '#c98a52', shade: '#a06a3c',
    top: ['#9be86a', '#5dbb3f'], topEdge: '#3f8f2c', topShine: '#c6f59a', band: 'grass',
    bits: 'pebbles', bitFill: '#e2a86f', bitEdge: '#9c6234', bitShine: '#f6d2a4',
  },
  mushroom: {
    out: '#3a2a3f', dirt: '#8c5f6e', shade: '#6a4352',
    top: ['#7fe0b4', '#3fae84'], topEdge: '#24745a', topShine: '#c4f7de', band: 'moss',
    bits: 'roots', bitFill: '#b78795', bitEdge: '#5e3b48', bitShine: '#d9b3bf',
  },
  beach: {
    out: '#7a5427', dirt: '#f0c27a', shade: '#d39c55',
    top: ['#fff1c9', '#f7d996'], topEdge: '#d6a85c', topShine: '#ffffff', band: 'sand',
    bits: 'shells', bitFill: '#ffd7e0', bitEdge: '#c47a8a', bitShine: '#ffffff',
  },
  snow: {
    out: '#3c4a66', dirt: '#8ea2c4', shade: '#6c7fa3',
    top: ['#ffffff', '#e2efff'], topEdge: '#9fb7da', topShine: '#ffffff', band: 'snow',
    bits: 'cracks', bitFill: '#b7c6de', bitEdge: '#5d6f92', bitShine: '#dbe5f3',
  },
  candy: {
    out: '#7a3557', dirt: '#f7a6c4', shade: '#df7fa6',
    top: ['#fffaf2', '#ffe3ef'], topEdge: '#e58bb2', topShine: '#ffffff', band: 'frosting',
    bits: 'sprinkles', bitFill: '#ffffff', bitEdge: '#c25b88', bitShine: '#ffffff',
  },
};

// Rounded silhouette. Edges that are not exposed are pushed outside the tile so that
// their outline is clipped away and neighbouring tiles join without a seam.
function silhouette(mask, bottomY = 58) {
  const t = mask & EDGE.T, r = mask & EDGE.R, b = mask & EDGE.B, l = mask & EDGE.L;
  const x0 = l ? 4 : -8, x1 = r ? 60 : 72, y0 = t ? 4 : -8, y1 = b ? bottomY : 72;
  const R = 15;
  const tl = t && l, tr = t && r, br = b && r, bl = b && l;
  return [
    `M ${x0 + (tl ? R : 0)} ${y0}`,
    `L ${x1 - (tr ? R : 0)} ${y0}`, tr ? `Q ${x1} ${y0} ${x1} ${y0 + R}` : '',
    `L ${x1} ${y1 - (br ? R : 0)}`, br ? `Q ${x1} ${y1} ${x1 - R} ${y1}` : '',
    `L ${x0 + (bl ? R : 0)} ${y1}`, bl ? `Q ${x0} ${y1} ${x0} ${y1 - R}` : '',
    `L ${x0} ${y0 + (tl ? R : 0)}`, tl ? `Q ${x0} ${y0} ${x0 + R} ${y0}` : '',
    'Z',
  ].join(' ');
}

// The surface layer's lower edge. Every shape repeats every 16 or 32 px, so tiles join seamlessly.
function topBand(style, y) {
  let d = `M -16 -16 L 80 -16 L 80 ${y}`;
  if (style === 'grass' || style === 'moss') {
    for (let x = 80; x > -16; x -= 16) d += ` Q ${x - 8} ${y + 9} ${x - 16} ${y}`;
  } else if (style === 'sand') {
    for (let x = 80; x > -16; x -= 32) d += ` Q ${x - 8} ${y + 5} ${x - 16} ${y} Q ${x - 24} ${y - 4} ${x - 32} ${y}`;
  } else if (style === 'snow') {
    // soft rounded drifts with an occasional icicle-like drip
    for (let x = 80; x > -16; x -= 32) d += ` Q ${x - 6} ${y + 6} ${x - 12} ${y + 2} Q ${x - 16} ${y + 16} ${x - 20} ${y + 2} Q ${x - 26} ${y + 6} ${x - 32} ${y}`;
  } else {
    // frosting: round drips
    for (let x = 80; x > -16; x -= 32) d += ` L ${x - 4} ${y} Q ${x - 4} ${y + 18} ${x - 12} ${y + 18} Q ${x - 20} ${y + 18} ${x - 20} ${y} L ${x - 32} ${y}`;
  }
  return d + ' Z';
}

const BITS = [
  [[14, 38, 5, 3.5], [44, 50, 6, 4], [30, 58, 3, 2.2], [52, 32, 2.5, 2]],
  [[22, 44, 4, 3], [48, 40, 3, 2.4], [12, 56, 5.5, 3.6], [38, 30, 2.4, 2]],
];
const SPRINKLE = ['#ff6b8b', '#ffd23f', '#5ec2ff', '#7be07b', '#b48cff'];

function dirtDetails(p, variant, fromY) {
  const list = BITS[variant % 2].filter(([, y]) => y > fromY);
  return list.map(([x, y, rx, ry], i) => {
    switch (p.bits) {
      case 'shells':
        return i % 2
          ? `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#f7dcae" stroke="${p.shade}" stroke-width="1.5"/>`
          : `<path d="M ${x - 6} ${y + 3} Q ${x} ${y - 9} ${x + 6} ${y + 3} Z" fill="${p.bitFill}" stroke="${p.bitEdge}" stroke-width="1.6" stroke-linejoin="round"/>
             <path d="M ${x} ${y + 3} L ${x} ${y - 4} M ${x - 3} ${y + 3} L ${x - 2} ${y - 2} M ${x + 3} ${y + 3} L ${x + 2} ${y - 2}" stroke="${p.bitEdge}" stroke-width="1" opacity="0.7"/>`;
      case 'sprinkles':
        return `<rect x="${x - 4}" y="${y - 1.6}" width="8" height="3.2" rx="1.6" fill="${SPRINKLE[(i + variant * 2) % 5]}" transform="rotate(${(i * 47 + variant * 30) % 180} ${x} ${y})"/>`;
      case 'cracks':
        return `<path d="M ${x - 6} ${y - 3} l 5 3 l -2 4 l 6 2" stroke="${p.bitEdge}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>`;
      case 'roots':
        return i % 2
          ? `<path d="M ${x - 8} ${y} q 5 -4 9 0 t 8 1" stroke="${p.bitEdge}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>`
          : `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${p.bitFill}" stroke="${p.bitEdge}" stroke-width="1.5"/>`;
      default:
        return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${p.bitFill}" stroke="${p.bitEdge}" stroke-width="1.5"/>
          <ellipse cx="${x - rx * 0.3}" cy="${y - ry * 0.35}" rx="${rx * 0.35}" ry="${ry * 0.3}" fill="${p.bitShine}" opacity="0.8"/>`;
    }
  }).join('') + (variant && p.bits === 'pebbles' ? `<path d="M 6 ${Math.max(fromY + 6, 30)} q 6 -3 12 0" stroke="#a96d3a" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>` : '');
}

function bandDecor(p) {
  if (p.band === 'moss') {
    return `<circle cx="14" cy="9" r="2.6" fill="#ffe27a"/><circle cx="46" cy="12" r="2" fill="#ffb3d9"/>`;
  }
  if (p.band === 'frosting') {
    return `${[[10, 9, 0], [28, 13, 1], [44, 8, 2], [58, 14, 3]].map(([x, y, i]) => `<rect x="${x - 3.5}" y="${y - 1.4}" width="7" height="2.8" rx="1.4" fill="${SPRINKLE[i]}" transform="rotate(${i * 40} ${x} ${y})"/>`).join('')}`;
  }
  if (p.band === 'snow') return `<circle cx="20" cy="8" r="1.8" fill="#cfe3ff"/><circle cx="50" cy="12" r="1.5" fill="#cfe3ff"/>`;
  if (p.band === 'sand') return `<circle cx="18" cy="12" r="1.2" fill="#d6a85c"/><circle cx="40" cy="9" r="1" fill="#d6a85c"/><circle cx="54" cy="15" r="1.2" fill="#d6a85c"/>`;
  return '';
}

const defs = (p) => `
  <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.top[0]}"/><stop offset="1" stop-color="${p.top[1]}"/>
  </linearGradient>`;

const bandY = (p) => (p.band === 'snow' || p.band === 'frosting' ? 20 : 22);

/** Ground tile for an edge mask (EDGE bits) and a detail variant. */
export function groundTileSVG(p, mask, variant = 0, bottomY = 58) {
  const sil = silhouette(mask, bottomY);
  const top = mask & EDGE.T;
  const by = bandY(p);
  const body = `
    <clipPath id="c"><path d="${sil}"/></clipPath>
    <path d="${sil}" fill="${p.dirt}"/>
    <g clip-path="url(#c)">
      ${dirtDetails(p, variant, top ? 26 : -10)}
      ${top ? `<path d="${topBand(p.band, by)}" fill="url(#top)"/>
        <path d="${topBand(p.band, by)}" fill="none" stroke="${p.topEdge}" stroke-width="2" opacity="0.6"/>
        <path d="M -8 10 L 72 10" stroke="${p.topShine}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
        ${bandDecor(p)}` : ''}
      ${mask & EDGE.B ? `<path d="M -8 ${bottomY - 6} L 72 ${bottomY - 6}" stroke="${p.shade}" stroke-width="5" opacity="0.35"/>` : ''}
    </g>
    <path d="${sil}" fill="none" stroke="${p.out}" stroke-width="4" stroke-linejoin="round"/>`;
  return svg(T, T, body, defs(p));
}

/** Floating platform (one-way) tile: surface layer on top, short rounded underside. */
export function platformTileSVG(p, leftEnd, rightEnd) {
  const mask = EDGE.T | EDGE.B | (leftEnd ? EDGE.L : 0) | (rightEnd ? EDGE.R : 0);
  const sil = silhouette(mask, 44);
  const by = bandY(p) - 2;
  const body = `
    <clipPath id="c"><path d="${sil}"/></clipPath>
    <path d="${sil}" fill="${p.dirt}"/>
    <g clip-path="url(#c)">
      <ellipse cx="22" cy="34" rx="3.5" ry="2.5" fill="${p.bitFill}" stroke="${p.bitEdge}" stroke-width="1.5"/>
      <ellipse cx="46" cy="36" rx="2.6" ry="2" fill="${p.bitFill}" stroke="${p.bitEdge}" stroke-width="1.2"/>
      <path d="M -8 38 L 72 38" stroke="${p.shade}" stroke-width="5" opacity="0.35"/>
      <path d="${topBand(p.band, by)}" fill="url(#top)"/>
      <path d="${topBand(p.band, by)}" fill="none" stroke="${p.topEdge}" stroke-width="2" opacity="0.6"/>
      <path d="M -8 10 L 72 10" stroke="${p.topShine}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      ${bandDecor(p)}
    </g>
    <path d="${sil}" fill="none" stroke="${p.out}" stroke-width="4" stroke-linejoin="round"/>`;
  return svg(T, T, body, defs(p));
}

/** Slippery ice block: glassy blue with shiny streaks, a frosty rim on top. */
export function iceTileSVG(p, mask) {
  const sil = silhouette(mask, 58);
  const top = mask & EDGE.T;
  const body = `
    <clipPath id="c"><path d="${sil}"/></clipPath>
    <path d="${sil}" fill="url(#ice)"/>
    <g clip-path="url(#c)">
      <path d="M 6 58 L 34 4 L 46 4 L 18 58 Z" fill="#ffffff" opacity="0.28"/>
      <path d="M 40 58 L 62 14 L 68 14 L 46 58 Z" fill="#ffffff" opacity="0.2"/>
      <path d="M 12 40 l 8 -6 l 4 5" stroke="#7fb4e6" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>
      ${top ? `<path d="M -8 4 L 72 4 L 72 13 Q 56 18 40 13 Q 24 9 8 14 Q 0 16 -8 13 Z" fill="#f4fbff"/>
        <path d="M -8 7 L 72 7" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>` : ''}
    </g>
    <path d="${sil}" fill="none" stroke="#3f6f9e" stroke-width="4" stroke-linejoin="round"/>`;
  return svg(T, T, body, `<linearGradient id="ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6f1ff"/><stop offset="1" stop-color="#8fcdf2"/></linearGradient>`);
}

/**
 * Ground slope tile (dirt only; the surface layer along the slope is drawn as one strip in the level
 * so it joins smoothly). rise +1 = up to the right.
 */
export function slopeTileSVG(p, rise) {
  const poly = rise > 0 ? '-2 66 66 -2 66 66' : '-2 -2 66 66 -2 66';
  const body = `
    <clipPath id="c"><polygon points="${poly}"/></clipPath>
    <polygon points="${poly}" fill="${p.dirt}"/>
    <g clip-path="url(#c)">${dirtDetails(p, 1, 20)}</g>`;
  return svg(T, T, body);
}

/** An empty tile (rainbow slides are drawn by the level as smooth strips). */
export const BLANK_TILE = svg(T, T, '');

// ---- Decorations (stand on the ground; origin at bottom-centre) ------------------------------
const OUT = '#4b3424';
const MEADOW_DECOR = {
  daisy: svg(36, 48, `
    <path d="M 18 47 Q 16 34 18 22" stroke="#4e9c35" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M 17 38 Q 9 33 7 37 Q 11 42 17 40 Z" fill="#6cc24a" stroke="#3f7f2b" stroke-width="1.8"/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="18" cy="12" rx="4.6" ry="8" transform="rotate(${a} 18 18)" fill="#fff" stroke="${OUT}" stroke-width="2"/>`).join('')}
    <circle cx="18" cy="18" r="5.4" fill="#ffcf3f" stroke="${OUT}" stroke-width="2"/>
    <circle cx="16.5" cy="16.5" r="1.8" fill="#fff3b0"/>`),
  tulip: svg(32, 50, `
    <path d="M 16 49 Q 17 36 16 24" stroke="#4e9c35" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M 16 42 Q 26 34 27 38 Q 24 44 16 44 Z" fill="#6cc24a" stroke="#3f7f2b" stroke-width="1.8"/>
    <path d="M 7 12 L 11 18 L 16 9 L 21 18 L 25 12 Q 27 26 16 27 Q 5 26 7 12 Z" fill="#ff7aa2" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M 11 16 Q 12 22 15 24" stroke="#ffd0de" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  tuft: svg(40, 22, `
    <path d="M 3 21 Q 8 10 9 3 Q 12 12 14 21 Q 17 8 20 1 Q 23 10 25 21 Q 28 11 32 5 Q 33 14 37 21 Z" fill="#6fcd4b" stroke="#3a7e28" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 19 6 Q 20 13 21 19" stroke="#b9f08f" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),
  rock: svg(40, 24, `
    <path d="M 4 23 Q 3 11 13 7 Q 22 2 31 8 Q 38 13 37 23 Z" fill="#c9c3bd" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M 12 12 Q 18 8 24 9" stroke="#f1ede8" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 26 18 q 4 -1 6 1" stroke="#9e958d" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  mushroom: svg(34, 34, `
    <path d="M 12 33 Q 11 24 13 18 L 21 18 Q 23 24 22 33 Z" fill="#fff6e6" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M 2 19 Q 3 4 17 3 Q 31 4 32 19 Q 17 23 2 19 Z" fill="#ff6b5b" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="11" cy="11" r="3" fill="#fff"/><circle cx="21" cy="8" r="2.2" fill="#fff"/><circle cx="25" cy="15" r="2.6" fill="#fff"/>`),
};

const tinyShroom = (x, h, cap, dots, out) => `
  <path d="M ${x - 4} 47 Q ${x - 5} ${47 - h * 0.6} ${x - 3} ${47 - h} L ${x + 3} ${47 - h} Q ${x + 5} ${47 - h * 0.6} ${x + 4} 47 Z" fill="#fff4e8" stroke="${out}" stroke-width="2"/>
  <path d="M ${x - 13} ${49 - h} Q ${x - 12} ${33 - h} ${x} ${32 - h} Q ${x + 12} ${33 - h} ${x + 13} ${49 - h} Q ${x} ${52 - h} ${x - 13} ${49 - h} Z" fill="${cap}" stroke="${out}" stroke-width="2.2" stroke-linejoin="round"/>
  <circle cx="${x - 5}" cy="${41 - h}" r="2.4" fill="${dots}"/><circle cx="${x + 5}" cy="${39 - h}" r="1.8" fill="${dots}"/>`;

const MUSHROOM_DECOR = {
  toadstools: svg(48, 48, tinyShroom(16, 16, '#b25cd9', '#f6e3ff', '#3a2a3f') + tinyShroom(34, 8, '#ff7a8f', '#fff', '#3a2a3f')),
  fern: svg(44, 46, `
    ${[[-35, 22, 28], [0, 22, 20], [35, 22, 28]].map(([a]) => `<g transform="rotate(${a} 22 46)">
      <path d="M 22 46 Q 20 26 22 6" stroke="#2f8f6a" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${[12, 20, 28, 36].map((y) => `<ellipse cx="16" cy="${y}" rx="6" ry="3" fill="#4fc28f" transform="rotate(-25 16 ${y})"/><ellipse cx="28" cy="${y - 2}" rx="6" ry="3" fill="#4fc28f" transform="rotate(25 28 ${y - 2})"/>`).join('')}
    </g>`).join('')}`),
  glowcaps: svg(40, 30, `
    <circle cx="12" cy="14" r="11" fill="#a6f3ff" opacity="0.35"/><circle cx="28" cy="18" r="9" fill="#a6f3ff" opacity="0.35"/>
    ${[[12, 12], [28, 7], [21, 4]].map(([x, h]) => `<path d="M ${x - 2} 29 L ${x - 1.5} ${29 - h - 6} L ${x + 1.5} ${29 - h - 6} L ${x + 2} 29 Z" fill="#e8fbff" stroke="#24745a" stroke-width="1.5"/>
      <path d="M ${x - 7} ${29 - h - 5} Q ${x} ${29 - h - 15} ${x + 7} ${29 - h - 5} Z" fill="#6ee7ff" stroke="#24745a" stroke-width="1.8" stroke-linejoin="round"/>`).join('')}`),
  moss: svg(40, 20, `<path d="M 3 19 Q 4 9 12 9 Q 15 2 22 4 Q 30 1 33 9 Q 39 11 37 19 Z" fill="#4fc28f" stroke="#24745a" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="14" cy="11" r="2" fill="#ffe27a"/><circle cx="27" cy="8" r="1.6" fill="#ffb3d9"/>`),
  rock: svg(40, 24, `
    <path d="M 4 23 Q 3 11 13 7 Q 22 2 31 8 Q 38 13 37 23 Z" fill="#a99bb3" stroke="#3a2a3f" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M 8 14 Q 14 4 24 7 Q 20 12 10 16 Z" fill="#4fc28f"/>
    <path d="M 26 18 q 4 -1 6 1" stroke="#7d6f88" stroke-width="2" fill="none" stroke-linecap="round"/>`),
};

const BEACH_DECOR = {
  shell: svg(34, 24, `
    <path d="M 3 22 Q 4 4 17 2 Q 30 4 31 22 Q 17 25 3 22 Z" fill="#ffc7d4" stroke="#b05a6e" stroke-width="2.2" stroke-linejoin="round"/>
    ${[-10, -5, 0, 5, 10].map((dx) => `<path d="M 17 22 L ${17 + dx * 1.2} 5" stroke="#d9879a" stroke-width="1.6"/>`).join('')}
    <rect x="12" y="20" width="10" height="4" rx="2" fill="#f2a5b7" stroke="#b05a6e" stroke-width="1.5"/>`),
  starfish: svg(36, 26, `<g transform="translate(18 15) scale(1 0.62)">
    <path d="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 7 : 16; return `${i ? 'L' : 'M'} ${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`; }).join(' ')} Z" fill="#ff9a5c" stroke="#a8501f" stroke-width="2.6" stroke-linejoin="round"/>
    <circle cx="-3" cy="-2" r="1.6" fill="#ffd9b8"/><circle cx="4" cy="1" r="1.6" fill="#ffd9b8"/></g>`),
  grass: svg(40, 34, `
    <path d="M 8 33 Q 6 18 2 6 M 14 33 Q 14 16 18 2 M 22 33 Q 24 20 32 8 M 30 33 Q 32 24 38 18" stroke="#8ab34a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M 14 33 Q 14 16 18 2" stroke="#c2dc7a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`),
  pebbles: svg(40, 16, `
    <ellipse cx="10" cy="11" rx="8" ry="5" fill="#d9cbb5" stroke="#7a5427" stroke-width="2"/>
    <ellipse cx="25" cy="12" rx="6" ry="4" fill="#bfe3e8" stroke="#4e7f87" stroke-width="2"/>
    <ellipse cx="34" cy="12" rx="4" ry="3" fill="#ffd7e0" stroke="#b05a6e" stroke-width="1.6"/>`),
  castle: svg(54, 46, `
    <path d="M 4 45 L 6 22 L 12 22 L 12 16 L 18 16 L 18 22 L 22 22 L 22 10 L 27 10 L 27 4 L 32 10 L 32 22 L 36 22 L 36 16 L 42 16 L 42 22 L 48 22 L 50 45 Z" fill="#f7d996" stroke="#7a5427" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 23 45 L 23 34 Q 27 28 31 34 L 31 45 Z" fill="#d6a85c" stroke="#7a5427" stroke-width="2"/>
    <path d="M 27 4 L 27 -2 L 34 1 Z" fill="#ff6b8b"/>`),
};

const SNOW_DECOR = {
  pine: svg(44, 58, `
    <rect x="19" y="46" width="6" height="11" rx="2" fill="#8a5a30" stroke="#4b3424" stroke-width="2"/>
    <path d="M 22 2 L 38 26 L 30 26 L 42 46 L 2 46 L 14 26 L 6 26 Z" fill="#3f9a6b" stroke="#235c40" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M 22 2 L 31 15 Q 22 19 13 15 Z M 14 26 Q 22 31 30 26 L 34 32 Q 22 37 10 32 Z" fill="#ffffff"/>`),
  drift: svg(48, 20, `<path d="M 2 19 Q 6 6 18 8 Q 26 0 36 6 Q 46 8 46 19 Z" fill="#ffffff" stroke="#9fb7da" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M 14 12 Q 20 9 26 10" stroke="#e2efff" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  crystal: svg(34, 40, `
    <path d="M 17 39 L 9 22 L 17 2 L 25 22 Z" fill="#c8ecff" stroke="#3f6f9e" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M 8 39 L 3 28 L 8 18 L 12 28 Z M 26 39 L 22 30 L 27 22 L 31 30 Z" fill="#a8dcfa" stroke="#3f6f9e" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 17 6 L 15 20" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>`),
  snowman: svg(40, 56, `
    <circle cx="20" cy="40" r="14" fill="#ffffff" stroke="#3c4a66" stroke-width="2.6"/>
    <circle cx="20" cy="19" r="10" fill="#ffffff" stroke="#3c4a66" stroke-width="2.6"/>
    <circle cx="16.5" cy="17" r="1.8" fill="#3c4a66"/><circle cx="23.5" cy="17" r="1.8" fill="#3c4a66"/>
    <path d="M 20 20 L 28 22 L 20 23 Z" fill="#ff8a3d"/>
    <path d="M 10 28 Q 20 33 30 28" stroke="#ff5c7a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="12" y="6" width="16" height="4" rx="2" fill="#3c4a66"/><rect x="15" y="0" width="10" height="8" rx="2" fill="#3c4a66"/>`),
  rock: svg(40, 26, `
    <path d="M 4 25 Q 3 13 13 9 Q 22 4 31 10 Q 38 15 37 25 Z" fill="#9aa8bf" stroke="#3c4a66" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M 7 15 Q 13 4 24 7 Q 34 9 34 16 Q 24 12 7 15 Z" fill="#ffffff" stroke="#9fb7da" stroke-width="1.5"/>`),
};

const CANDY_DECOR = {
  lollipop: svg(36, 60, `
    <rect x="16" y="28" width="4" height="31" rx="2" fill="#fff" stroke="#c25b88" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="15" fill="#ff8fc8" stroke="#7a3557" stroke-width="2.6"/>
    <path d="M 18 18 m -10 0 a 10 10 0 1 1 10 10 a 7 7 0 1 1 -7 -7 a 4 4 0 1 1 4 4" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  gumdrop: svg(40, 30, `
    <path d="M 3 29 Q 3 8 13 6 Q 18 0 24 4 Q 37 6 37 29 Z" fill="#7be07b" stroke="#2f7a24" stroke-width="2.4" stroke-linejoin="round"/>
    ${[[11, 18], [20, 12], [28, 20], [18, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#ffffff"/>`).join('')}
    <ellipse cx="13" cy="12" rx="4" ry="2.5" fill="#c9f7c9" opacity="0.8"/>`),
  cane: svg(30, 56, `
    <path d="M 18 55 L 18 16 Q 18 4 10 4 Q 3 4 3 12" stroke="#7a3557" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M 18 55 L 18 16 Q 18 4 10 4 Q 3 4 3 12" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M 18 55 L 18 16 Q 18 4 10 4 Q 3 4 3 12" stroke="#ff5c7a" stroke-width="7" fill="none" stroke-dasharray="5 6"/>`),
  cupcake: svg(40, 44, `
    <path d="M 7 24 L 11 43 L 29 43 L 33 24 Z" fill="#7fd0f5" stroke="#7a3557" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M 15 25 L 16 43 M 20 25 L 20 43 M 25 25 L 24 43" stroke="#4fb3e8" stroke-width="2"/>
    <path d="M 4 25 Q 4 12 14 12 Q 16 4 22 6 Q 30 6 30 14 Q 37 16 36 25 Z" fill="#fff3f8" stroke="#7a3557" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="21" cy="5" r="4.5" fill="#ff4f6d" stroke="#7a3557" stroke-width="2"/>`),
  sprinkles: svg(40, 14, `${[[6, 8, 0], [14, 5, 1], [21, 10, 2], [28, 6, 3], [34, 10, 4]].map(([x, y, i]) => `<rect x="${x - 3}" y="${y - 1.5}" width="6" height="3" rx="1.5" fill="${SPRINKLE[i]}" transform="rotate(${i * 50} ${x} ${y})"/>`).join('')}`),
};

export const DECOR = { meadow: MEADOW_DECOR, mushroom: MUSHROOM_DECOR, beach: BEACH_DECOR, snow: SNOW_DECOR, candy: CANDY_DECOR };
/** Which decorations to scatter in each world (repeats make some more common). */
export const DECOR_MIX = {
  meadow: ['daisy', 'tuft', 'tulip', 'tuft', 'rock', 'daisy', 'mushroom', 'tuft'],
  mushroom: ['toadstools', 'fern', 'moss', 'glowcaps', 'fern', 'rock', 'moss', 'toadstools'],
  beach: ['shell', 'grass', 'starfish', 'pebbles', 'grass', 'shell', 'castle', 'grass'],
  snow: ['pine', 'drift', 'crystal', 'drift', 'rock', 'pine', 'snowman', 'drift'],
  candy: ['lollipop', 'gumdrop', 'sprinkles', 'cane', 'gumdrop', 'cupcake', 'sprinkles', 'lollipop'],
};
/** Small decorations that should sit in front of Hoppy's feet. */
export const DECOR_FRONT = new Set(['tuft', 'moss', 'grass', 'drift', 'sprinkles']);
