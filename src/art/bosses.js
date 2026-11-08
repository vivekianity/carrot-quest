// World bosses (GAME_DESIGN §3): grumpy-but-cute guards that get sleepier with every right answer.
// Each boss has frames 0–5 (eyelids drooping more and more), a big yawn and a snoozing frame.
import { crowSVG } from './blocks.js';

export const BOSS_SIZE = 150;

const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

/** An eye whose lid comes down as `lid` goes 0 → 1; fully closed eyes become a sleepy curve. */
function eye(id, cx, cy, rx, ry, lid, lidColor, out, { iris = null, pupil = 6.5, look = 0 } = {}) {
  const top = cy - ry;
  const lidH = Math.min(2 * ry + 2, lid * 2 * ry);
  return `<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${out}" stroke-width="3"/>
    <g clip-path="url(#${id})">
      ${iris ? `<circle cx="${cx + look}" cy="${cy + 3}" r="${pupil + 4}" fill="${iris}"/>` : ''}
      <circle cx="${cx + look}" cy="${cy + 3}" r="${pupil}" fill="${out}"/><circle cx="${cx + look + 1.6}" cy="${cy + 0.5}" r="2.2" fill="#fff"/>
      ${lid > 0 ? `<rect x="${cx - rx - 2}" y="${top - 2}" width="${2 * rx + 4}" height="${lidH + 2}" fill="${lidColor}"/>
      <path d="M ${cx - rx - 1} ${top + lidH} Q ${cx} ${top + lidH + 3} ${cx + rx + 1} ${top + lidH}" stroke="${out}" stroke-width="3" fill="none"/>` : ''}
    </g>
    ${lid >= 1 ? `<path d="M ${cx - rx * 0.75} ${cy + 2} Q ${cx} ${cy + 8} ${cx + rx * 0.75} ${cy + 2}" stroke="${out}" stroke-width="3" fill="none" stroke-linecap="round"/>` : ''}`;
}

const grumpyBrows = (lid, l, r, y, out) => (lid < 0.5
  ? `<path d="M ${l - 12} ${y - 6} L ${l + 10} ${y + 2} M ${r + 12} ${y - 6} L ${r - 10} ${y + 2}" stroke="${out}" stroke-width="5" stroke-linecap="round"/>` : '');

// ---- 🦉 Owl (Mushroom Forest) ------------------------------------------------------------------
export function owlSVG({ lid = 0, yawn = false, droop = 0 } = {}) {
  const OUT = '#3b2a35', BODY = '#9a7bb8', DARK = '#6f528f', BELLY = '#e8d6f2';
  const beak = yawn
    ? `<path d="M 68 70 L 82 70 L 75 76 Z" fill="#ffb13c" stroke="#8a4a10" stroke-width="2.5"/>
       <ellipse cx="75" cy="83" rx="8" ry="9" fill="#7a2f3f" stroke="${OUT}" stroke-width="2.5"/>`
    : `<path d="M 68 68 L 82 68 L 75 82 Z" fill="#ffb13c" stroke="#8a4a10" stroke-width="2.5" stroke-linejoin="round"/>`;
  return svg(BOSS_SIZE, BOSS_SIZE, `
    <ellipse cx="75" cy="146" rx="40" ry="4" fill="#000" opacity="0.15"/>
    <ellipse cx="75" cy="102" rx="46" ry="44" fill="${BODY}" stroke="${OUT}" stroke-width="4"/>
    <ellipse cx="75" cy="112" rx="30" ry="30" fill="${BELLY}"/>
    ${[100, 114, 128].map((y) => `<path d="M ${60} ${y} q 5 5 10 0 q 5 5 10 0 q 5 5 10 0" stroke="${DARK}" stroke-width="2.5" fill="none" opacity="0.6"/>`).join('')}
    <path d="M 32 92 Q 20 120 40 138 Q 46 116 44 96 Z" fill="${DARK}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 118 92 Q 130 120 110 138 Q 104 116 106 96 Z" fill="${DARK}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 62 144 l -4 5 M 66 144 l 0 6 M 84 144 l 0 6 M 88 144 l 4 5" stroke="#ffb13c" stroke-width="4" stroke-linecap="round"/>
    <g transform="rotate(${droop} 75 80)">
      <path d="M 40 30 L 34 6 L 56 22 Z M 110 30 L 116 6 L 94 22 Z" fill="${DARK}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="75" cy="54" rx="44" ry="36" fill="${BODY}" stroke="${OUT}" stroke-width="4"/>
      <circle cx="57" cy="54" r="19" fill="#f6e7c4" stroke="${OUT}" stroke-width="3"/>
      <circle cx="93" cy="54" r="19" fill="#f6e7c4" stroke="${OUT}" stroke-width="3"/>
      ${eye('oe1', 57, 54, 13, 13, lid, '#f6e7c4', OUT, { iris: '#ffc93c', pupil: 5.5 })}
      ${eye('oe2', 93, 54, 13, 13, lid, '#f6e7c4', OUT, { iris: '#ffc93c', pupil: 5.5 })}
      ${grumpyBrows(lid, 57, 93, 33, OUT)}
      ${beak}
    </g>`);
}

// ---- 🦀 Crab (Sunny Beach) ---------------------------------------------------------------------
export function crabSVG({ lid = 0, yawn = false, droop = 0 } = {}) {
  const OUT = '#6b1f1f', BODY = '#ff6b5b', DARK = '#e0463a';
  const clawY = 40 + droop * 2.5;           // claws sink as the crab dozes off
  const claw = (x, flip) => `<g transform="translate(${x} ${clawY}) scale(${flip} 1)">
      <path d="M 0 40 Q -6 24 -2 12" stroke="${OUT}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M 0 40 Q -6 24 -2 12" stroke="${BODY}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M -2 14 Q -24 6 -20 -14 Q -10 -6 -2 -8 Q -4 -26 12 -24 Q 18 -6 -2 14 Z" fill="${BODY}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    </g>`;
  const mouth = yawn
    ? `<ellipse cx="75" cy="110" rx="10" ry="11" fill="#7a2f3f" stroke="${OUT}" stroke-width="3"/>`
    : lid < 0.5 ? `<path d="M 64 112 Q 75 104 86 112" stroke="${OUT}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : `<path d="M 66 110 Q 75 114 84 110" stroke="${OUT}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  return svg(BOSS_SIZE, BOSS_SIZE, `
    <ellipse cx="75" cy="146" rx="48" ry="4" fill="#000" opacity="0.15"/>
    ${[[-1, 34], [-1, 46], [1, 104], [1, 116]].map(([s, x]) => `<path d="M ${x} 118 q ${-10 * -s} 14 ${-18 * -s} 26" stroke="${OUT}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M ${x} 118 q ${-10 * -s} 14 ${-18 * -s} 26" stroke="${DARK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join('')}
    ${claw(24, 1)}${claw(126, -1)}
    <path d="M 52 74 L 50 46 M 98 74 L 100 46" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>
    <path d="M 52 74 L 50 46 M 98 74 L 100 46" stroke="${BODY}" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="75" cy="106" rx="50" ry="34" fill="url(#cb)" stroke="${OUT}" stroke-width="4"/>
    <ellipse cx="58" cy="90" rx="14" ry="6" fill="#ffffff" opacity="0.35"/>
    <ellipse cx="44" cy="112" rx="7" ry="4" fill="#ffb3b3"/><ellipse cx="106" cy="112" rx="7" ry="4" fill="#ffb3b3"/>
    ${mouth}
    <g transform="rotate(${droop * 0.6} 50 46)">${eye('ce1', 50, 34, 12, 14, lid, BODY, OUT)}</g>
    <g transform="rotate(${-droop * 0.6} 100 46)">${eye('ce2', 100, 34, 12, 14, lid, BODY, OUT)}</g>
    ${lid < 0.5 ? `<path d="M 38 14 L 60 22 M 112 14 L 90 22" stroke="${OUT}" stroke-width="4.5" stroke-linecap="round"/>` : ''}`,
  `<linearGradient id="cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a7a"/><stop offset="1" stop-color="${DARK}"/></linearGradient>`);
}

// ---- 🐧 Penguin (Snowy Peaks) -------------------------------------------------------------------
export function penguinSVG({ lid = 0, yawn = false, droop = 0 } = {}) {
  const OUT = '#1c2433', BODY = '#33405a', BELLY = '#ffffff';
  const beak = yawn
    ? `<path d="M 66 66 L 84 66 L 75 72 Z" fill="#ffa62b" stroke="#8a4a10" stroke-width="2.5" stroke-linejoin="round"/>
       <ellipse cx="75" cy="80" rx="8" ry="9" fill="#7a2f3f" stroke="${OUT}" stroke-width="2.5"/>
       <path d="M 67 88 L 83 88 L 75 94 Z" fill="#ffa62b" stroke="#8a4a10" stroke-width="2.5" stroke-linejoin="round"/>`
    : `<path d="M 64 66 Q 75 62 86 66 L 75 78 Z" fill="#ffa62b" stroke="#8a4a10" stroke-width="2.5" stroke-linejoin="round"/>`;
  return svg(BOSS_SIZE, BOSS_SIZE, `
    <ellipse cx="75" cy="146" rx="36" ry="4" fill="#000" opacity="0.15"/>
    <ellipse cx="60" cy="142" rx="12" ry="6" fill="#ffa62b" stroke="#8a4a10" stroke-width="2.5"/>
    <ellipse cx="90" cy="142" rx="12" ry="6" fill="#ffa62b" stroke="#8a4a10" stroke-width="2.5"/>
    <path d="M 30 96 Q 14 112 22 128 Q 34 118 38 104 Z" fill="${BODY}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round" transform="rotate(${-droop} 34 100)"/>
    <path d="M 120 96 Q 136 112 128 128 Q 116 118 112 104 Z" fill="${BODY}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round" transform="rotate(${droop} 116 100)"/>
    <ellipse cx="75" cy="104" rx="42" ry="40" fill="${BODY}" stroke="${OUT}" stroke-width="4"/>
    <ellipse cx="75" cy="112" rx="28" ry="30" fill="${BELLY}"/>
    <path d="M 40 82 Q 75 98 110 82 L 112 92 Q 75 108 38 92 Z" fill="#4fb3ff" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 98 92 L 108 120 L 94 118 Z" fill="#4fb3ff" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <g transform="rotate(${droop} 75 80)">
      <ellipse cx="75" cy="52" rx="38" ry="34" fill="${BODY}" stroke="${OUT}" stroke-width="4"/>
      <path d="M 44 58 Q 46 34 62 34 Q 75 42 88 34 Q 104 34 106 58 Q 92 76 75 76 Q 58 76 44 58 Z" fill="${BELLY}"/>
      ${eye('pe1', 61, 50, 10, 12, lid, BELLY, OUT, { pupil: 5.5 })}
      ${eye('pe2', 89, 50, 10, 12, lid, BELLY, OUT, { pupil: 5.5 })}
      ${grumpyBrows(lid, 61, 89, 34, OUT)}
      <ellipse cx="50" cy="66" rx="6" ry="3.5" fill="#ff9fb2" opacity="0.6"/><ellipse cx="100" cy="66" rx="6" ry="3.5" fill="#ff9fb2" opacity="0.6"/>
      ${beak}
      <path d="M 52 22 Q 75 2 98 22 Q 75 14 52 22 Z" fill="#ff5c7a" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="75" cy="8" r="7" fill="#ffffff" stroke="${OUT}" stroke-width="3"/>
    </g>`);
}

// ---- 🦝 Raccoon, the Carrot Thief (Candy Clouds, final boss) -----------------------------------
export function raccoonSVG({ lid = 0, yawn = false, droop = 0 } = {}) {
  const OUT = '#2a2730', FUR = '#9a97a6', DARK = '#5c5966', LIGHT = '#e9e6ef';
  const mouth = yawn
    ? `<ellipse cx="75" cy="80" rx="8" ry="9" fill="#7a2f3f" stroke="${OUT}" stroke-width="2.5"/>`
    : lid < 0.5 ? `<path d="M 68 80 Q 75 84 82 78" stroke="${OUT}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M 69 80 Q 75 84 81 80" stroke="${OUT}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return svg(BOSS_SIZE, BOSS_SIZE, `
    <ellipse cx="75" cy="146" rx="42" ry="4" fill="#000" opacity="0.15"/>
    <g transform="rotate(${-droop * 0.8} 112 126)">
      <path d="M 104 126 Q 150 118 140 70 Q 136 56 124 62 Q 132 96 100 112 Z" fill="${FUR}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M 132 70 Q 140 76 138 86 M 128 96 Q 136 102 130 110" stroke="${DARK}" stroke-width="8" stroke-linecap="round"/>
    </g>
    <ellipse cx="75" cy="112" rx="38" ry="34" fill="${FUR}" stroke="${OUT}" stroke-width="4"/>
    <ellipse cx="75" cy="118" rx="22" ry="22" fill="${LIGHT}"/>
    <ellipse cx="54" cy="142" rx="12" ry="6" fill="${DARK}" stroke="${OUT}" stroke-width="2.5"/>
    <ellipse cx="96" cy="142" rx="12" ry="6" fill="${DARK}" stroke="${OUT}" stroke-width="2.5"/>
    <g transform="rotate(${droop} 75 84)">
      <path d="M 40 30 L 36 6 L 58 20 Z M 110 30 L 114 6 L 92 20 Z" fill="${FUR}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M 42 22 L 40 12 L 50 19 Z M 108 22 L 110 12 L 100 19 Z" fill="#ffb3c6"/>
      <ellipse cx="75" cy="56" rx="42" ry="34" fill="${FUR}" stroke="${OUT}" stroke-width="4"/>
      <path d="M 40 60 Q 75 88 110 60 Q 106 84 75 90 Q 44 84 40 60 Z" fill="${LIGHT}"/>
      <path d="M 34 52 Q 44 36 60 42 Q 75 50 90 42 Q 106 36 116 52 Q 106 66 90 60 Q 75 56 60 60 Q 44 66 34 52 Z" fill="${OUT}"/>
      ${eye('re1', 58, 50, 9, 10, lid, OUT, OUT, { pupil: 5 })}
      ${eye('re2', 92, 50, 9, 10, lid, OUT, OUT, { pupil: 5 })}
      ${lid < 0.5 ? `<path d="M 46 32 L 66 38 M 104 32 L 84 38" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>` : ''}
      <ellipse cx="75" cy="70" rx="7" ry="5" fill="${OUT}"/>
      ${mouth}
    </g>`);
}

const stages = (prefix) => ({
  [`${prefix}0`]: { lid: 0 }, [`${prefix}1`]: { lid: 0.18 }, [`${prefix}2`]: { lid: 0.34 },
  [`${prefix}3`]: { lid: 0.5 }, [`${prefix}4`]: { lid: 0.66 }, [`${prefix}5`]: { lid: 0.85 },
  [`${prefix}Yawn`]: { lid: 1, yawn: true }, [`${prefix}Sleep`]: { lid: 1, droop: 16 },
});

/** Every boss: its drawing, frames and where it sits. */
export const BOSS_ART = {
  crow: { draw: crowSVG, frames: stages('crow'), perch: 'perch', perchH: 222 },
  owl: { draw: owlSVG, frames: stages('owl'), perch: 'perch-stump', perchH: 214 },
  crab: { draw: crabSVG, frames: stages('crab'), perch: 'perch-rock', perchH: 104 },
  penguin: { draw: penguinSVG, frames: stages('penguin'), perch: 'perch-ice', perchH: 150 },
  raccoon: { draw: raccoonSVG, frames: stages('raccoon'), perch: 'perch-crate', perchH: 118 },
};

export const PERCH_ART = {
  'perch-stump': svg(110, 230, `
    <path d="M 30 230 L 34 20 L 76 20 L 80 230 Z" fill="#8a5a3a" stroke="#4b3424" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 44 40 L 42 220 M 64 60 L 66 210" stroke="#6b4426" stroke-width="3" opacity="0.6"/>
    <path d="M 76 120 Q 96 110 104 92" stroke="#4b3424" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M 76 120 Q 96 110 104 92" stroke="#8a5a3a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="104" cy="86" r="10" fill="#4fc28f" stroke="#24745a" stroke-width="3"/>
    <ellipse cx="55" cy="18" rx="32" ry="10" fill="#c99a6a" stroke="#4b3424" stroke-width="4"/>
    <ellipse cx="55" cy="18" rx="18" ry="5" fill="none" stroke="#8a5a3a" stroke-width="2.5"/>
    <path d="M 22 230 Q 8 220 4 230 M 88 230 Q 102 220 108 230" stroke="#4b3424" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  'perch-rock': svg(150, 110, `
    <path d="M 6 108 Q 2 52 34 26 Q 64 2 104 14 Q 144 30 146 108 Z" fill="#b9a68f" stroke="#5b4630" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M 30 40 Q 60 16 96 22" stroke="#e6d8c4" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M 90 70 q 12 -4 20 4 M 40 80 q 8 -6 16 0" stroke="#8a775f" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 120 100 Q 126 84 136 92" stroke="#3fa45a" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  'perch-ice': svg(130, 156, `
    <rect x="6" y="6" width="118" height="148" rx="16" fill="url(#ib)" stroke="#3f6f9e" stroke-width="4.5"/>
    <path d="M 20 140 L 60 14 L 76 14 L 36 140 Z" fill="#ffffff" opacity="0.3"/>
    <path d="M 4 12 Q 30 2 65 8 Q 100 2 126 12 L 126 22 Q 112 28 100 20 Q 90 36 80 22 Q 60 30 46 22 Q 30 34 20 22 Q 10 26 4 22 Z" fill="#ffffff" stroke="#9fb7da" stroke-width="2.5" stroke-linejoin="round"/>`,
  `<linearGradient id="ib" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2f5ff"/><stop offset="1" stop-color="#8fcdf2"/></linearGradient>`),
  'perch-crate': svg(140, 124, `
    <rect x="6" y="20" width="128" height="102" rx="10" fill="#e7b273" stroke="#6b4424" stroke-width="4.5"/>
    <path d="M 6 54 L 134 54 M 6 88 L 134 88" stroke="#6b4424" stroke-width="4"/>
    <path d="M 18 30 L 122 112" stroke="#c98a4b" stroke-width="9" stroke-linecap="round"/>
    ${[22, 46, 70, 94, 118].map((x, i) => `<g transform="translate(${x} ${22 - (i % 2) * 4}) rotate(${(i - 2) * 12})">
      <path d="M 0 -2 Q -9 -16 -9 -22 Q -9 -30 0 -30 Q 9 -30 9 -22 Q 9 -16 0 -2 Z" fill="#ff9a2e" stroke="#8a4410" stroke-width="2.5" transform="rotate(180 0 -16)"/>
      <path d="M 0 -32 L -4 -40 M 0 -32 L 4 -40" stroke="#3f9a2c" stroke-width="3" stroke-linecap="round"/></g>`).join('')}`),
  'carrot-sack': svg(110, 120, `
    <path d="M 20 116 Q 2 70 26 44 L 84 44 Q 108 70 90 116 Z" fill="#c9a06a" stroke="#6b4424" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M 28 44 Q 55 56 82 44" stroke="#6b4424" stroke-width="4" fill="none"/>
    <path d="M 36 80 L 74 80 M 55 66 L 55 98" stroke="#8a6a40" stroke-width="3" opacity="0.6"/>
    ${[34, 52, 70].map((x, i) => `<g transform="translate(${x} ${40}) rotate(${(i - 1) * 18})">
      <path d="M -7 0 Q -7 -22 0 -26 Q 7 -22 7 0 Z" fill="#ff9a2e" stroke="#8a4410" stroke-width="2.5"/>
      <path d="M 0 -26 L -4 -36 M 0 -26 L 4 -36" stroke="#3f9a2c" stroke-width="3" stroke-linecap="round"/></g>`).join('')}`),
};
