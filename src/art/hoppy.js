// Hoppy the bunny — every animation frame is an SVG string built from a pose.
// Drawn facing right in a 128-wide box (with headroom for the ears); feet rest on y ≈ 121.
// An optional outfit { hat, glasses, cape, scarf } (ids from src/engine/shop.js) is drawn into
// every frame, so Hoppy wears it in every pose.
import { HATS, GLASSES, SCARVES, OUTFIT_DEFS, capeSVG } from './outfits.js';

const HEADROOM = 26;                         // extra viewBox space above y=0 for tall ears
const SCALE = 112 / 128;
export const HOPPY_W = 112;                  // rendered frame size in px
export const HOPPY_H = Math.round((128 + HEADROOM) * SCALE);
export const HOPPY_FOOT_Y = (121 + HEADROOM) / (128 + HEADROOM); // sprite origin-y: feet on the ground
/** Paw position in the 'float' frame, relative to the sprite origin, in rendered px (facing right). */
export const HOPPY_PAW = { x: (97 - 64) * SCALE, y: (50 - 121) * SCALE };

const OUT = '#4a3127';
const FUR = '#fffaf3';
const FUR_SHADE = '#efdcc8';
const PINK = '#ffb1c4';
const SCARF = '#e9443b';
const SCARF_DARK = '#b92d26';

const BASE = {
  dy: 0, tilt: 0, headDy: 0,
  earBack: { a: -14, bend: -3, len: 46 },
  earFront: { a: 30, bend: 16, len: 44 },
  eyes: 'open',             // open | closed | happy | wide
  mouth: 'smile',           // smile | open | o
  feetBack: [50, 115], feetFront: [72, 116], footTilt: [0, 0],
  armBack: [44, 92, 20], armFront: [80, 93, -20], // x, y, rotation
  scarf: 0,                 // scarf tail flutter
  squint: 0,
};

function ear({ a, bend, len }, x, y, w = 21) {
  const outer = `M ${-w / 2} 6 C ${-w / 2 - 3} ${-len * 0.5}, ${bend - w * 0.6} ${-len}, ${bend} ${-len}
    C ${bend + w * 0.6} ${-len}, ${w / 2 + 3} ${-len * 0.5}, ${w / 2} 6 Z`;
  const iw = w * 0.42, il = len * 0.8, ib = bend * 0.8;
  const inner = `M ${-iw / 2} 2 C ${-iw / 2 - 1} ${-il * 0.5}, ${ib - iw * 0.55} ${-il}, ${ib} ${-il}
    C ${ib + iw * 0.55} ${-il}, ${iw / 2 + 1} ${-il * 0.5}, ${iw / 2} 2 Z`;
  return `<g transform="translate(${x} ${y}) rotate(${a})">
    <path d="${outer}" fill="url(#fur)" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="${inner}" fill="${PINK}"/>
  </g>`;
}

function eyes(kind) {
  const L = [63, 51], R = [79, 51];
  if (kind === 'closed') {
    return [L, R].map(([x, y]) =>
      `<path d="M ${x - 5} ${y + 1} Q ${x} ${y + 5} ${x + 5} ${y + 1}" fill="none" stroke="${OUT}" stroke-width="3.2" stroke-linecap="round"/>`).join('');
  }
  if (kind === 'happy') {
    return [L, R].map(([x, y]) =>
      `<path d="M ${x - 5} ${y + 3} Q ${x} ${y - 4} ${x + 5} ${y + 3}" fill="none" stroke="${OUT}" stroke-width="3.2" stroke-linecap="round"/>`).join('');
  }
  const ry = kind === 'wide' ? 7.4 : 6.6;
  const up = kind === 'up' ? -2.5 : 0;
  return [L, R].map(([x, y], i) => `
    <ellipse cx="${x + (up ? 1 : 0)}" cy="${y + up}" rx="${i ? 5 : 4.6}" ry="${ry}" fill="${OUT}"/>
    <circle cx="${x + 1.6 + (up ? 1 : 0)}" cy="${y - 2.6 + up}" r="2.1" fill="#fff"/>
    <circle cx="${x - 1.4}" cy="${y + 2.8}" r="0.9" fill="#fff" opacity="0.8"/>`).join('');
}

function mouth(kind) {
  if (kind === 'open') {
    return `<path d="M 70 64 Q 74 62 78 64 Q 77 71 74 71 Q 71 71 70 64 Z" fill="#c2475b" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  if (kind === 'chew') {
    return `<path d="M 69 64.5 Q 74 68.5 79 64.5" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="85" cy="63" rx="7" ry="5.5" fill="#ffc2cf" stroke="${OUT}" stroke-width="1.6" opacity="0.9"/>`;
  }
  if (kind === 'hmm') {
    return `<path d="M 70 66 Q 74 64.5 78 66" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  if (kind === 'o') {
    return `<ellipse cx="74" cy="66" rx="3" ry="3.6" fill="#c2475b" stroke="${OUT}" stroke-width="2.2"/>`;
  }
  return `<path d="M 68.5 64 Q 71.2 67.5 74 64 Q 76.8 67.5 79.5 64" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function foot([x, y], rot) {
  return `<g transform="rotate(${rot} ${x} ${y})">
    <ellipse cx="${x}" cy="${y}" rx="12.5" ry="7" fill="url(#fur)" stroke="${OUT}" stroke-width="3.2"/>
    <ellipse cx="${x + 4}" cy="${y + 1}" rx="3.2" ry="2.4" fill="${PINK}" opacity="0.9"/>
  </g>`;
}

function arm([x, y, rot]) {
  return `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="10" transform="rotate(${rot} ${x} ${y})"
    fill="url(#fur)" stroke="${OUT}" stroke-width="3"/>`;
}

function scarfTail(f, c) {
  return `<path d="M 42 80 C 30 ${81 + f * 0.3}, 22 ${83 + f}, 11 ${86 + f * 1.6}
      L 14 ${96 + f * 1.2} C 24 ${93 + f * 0.8}, 33 ${91}, 44 ${88} Z"
    fill="${c.main}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 20 ${86 + f * 1.1} L 22 ${93 + f * 0.9} M 28 ${84 + f * 0.7} L 30 ${91 + f * 0.6}"
      stroke="${c.stripe}" stroke-width="2.4" stroke-linecap="round"/>`;
}

// Where each hat sits on the head: [x, y, tilt]. (0, 0) in the hat drawing is the top of the head.
const HAT_AT = {
  'hat-party': [59, 29, -10], 'hat-flowers': [61, 31, -4], 'hat-sun': [61, 28, -6],
  'hat-beanie': [61, 27, -4], 'hat-crown': [61, 27, -6],
};

export function hoppySVG(pose = {}, outfit = null) {
  const p = { ...BASE, ...pose };
  const o = outfit || {};
  const sc = SCARVES[o.scarf] || { main: SCARF, dark: SCARF_DARK, top: '#ff6a5c', stripe: '#ffd2cc' };
  const scarfFill = sc.rainbow ? 'url(#rainbow)' : 'url(#scarf)';
  const hat = HATS[o.hat] ? (() => { const [x, y, a] = HAT_AT[o.hat]; return `<g transform="translate(${x} ${y}) rotate(${a})">${HATS[o.hat]()}</g>`; })() : '';
  const glasses = GLASSES[o.glasses] ? GLASSES[o.glasses]() : '';
  const cape = o.cape ? capeSVG(o.cape, p.scarf) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${HOPPY_W}" height="${HOPPY_H}" viewBox="0 ${-HEADROOM} 128 ${128 + HEADROOM}">
  <defs>
    <radialGradient id="fur" cx="40%" cy="30%" r="80%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.6" stop-color="${FUR}"/>
      <stop offset="1" stop-color="${FUR_SHADE}"/>
    </radialGradient>
    <linearGradient id="scarf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sc.top || sc.main}"/><stop offset="1" stop-color="${sc.rainbow ? '#ff5a5a' : sc.main}"/>
    </linearGradient>
    ${o.scarf || o.hat || o.cape ? OUTFIT_DEFS : ''}
  </defs>
  <g transform="translate(0 ${p.dy}) rotate(${p.tilt} 64 118)">
    ${cape}
    ${ear(p.earBack, 50, 33)}
    ${foot(p.feetBack, p.footTilt[0])}
    <circle cx="36" cy="94" r="9.5" fill="#fff" stroke="${OUT}" stroke-width="3.2"/>
    <circle cx="34" cy="91" r="3.5" fill="#fff8ee" opacity="0.9"/>
    ${arm(p.armBack)}
    <ellipse cx="61" cy="95" rx="25" ry="21" fill="url(#fur)" stroke="${OUT}" stroke-width="3.5"/>
    <ellipse cx="66" cy="99" rx="13" ry="11" fill="#fff" opacity="0.85"/>
    ${scarfTail(p.scarf, sc)}
    <g transform="translate(0 ${p.headDy})">
      <ellipse cx="61" cy="56" rx="31" ry="28.5" fill="url(#fur)" stroke="${OUT}" stroke-width="3.5"/>
      ${ear(p.earFront, 70, 32)}
      <ellipse cx="55" cy="64" rx="5" ry="3.4" fill="#ff8fa8" opacity="0.6"/>
      <ellipse cx="86" cy="62" rx="5.5" ry="3.8" fill="#ff8fa8" opacity="0.65"/>
      ${eyes(p.eyes)}
      <path d="M 71.5 58.5 Q 74 56.8 76.5 58.5 Q 76.2 61.5 74 62 Q 71.8 61.5 71.5 58.5 Z" fill="#ff7f9c" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>
      ${mouth(p.mouth)}
      ${glasses}
      <path d="M 37 77 Q 61 90 86 77 L 87 86 Q 61 100 36 86 Z" fill="${scarfFill}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M 44 84 Q 61 92 79 84" fill="none" stroke="${sc.dark}" stroke-width="2" opacity="0.6"/>
      ${hat}
    </g>
    ${foot(p.feetFront, p.footTilt[1])}
    ${arm(p.armFront)}
  </g>
</svg>`;
}

// ---- Poses --------------------------------------------------------------------------------
export const HOPPY_FRAMES = {
  idle0: {},
  idle1: { eyes: 'closed' },                                          // blink
  idle2: { earBack: { a: -24, bend: -6, len: 47 }, headDy: -1 },      // ear twitch
  idle3: { dy: 1, headDy: 1, earFront: { a: 34, bend: 18, len: 44 } }, // breathe

  // Bunny-hop run: push → tuck → reach → touch down
  run0: { tilt: 6, feetBack: [40, 113], feetFront: [48, 115], footTilt: [-25, -20], earBack: { a: -40, bend: -10, len: 46 }, earFront: { a: -18, bend: -14, len: 44 }, armFront: [84, 90, -50], scarf: 2 },
  run1: { dy: -7, tilt: 2, feetBack: [56, 108], feetFront: [66, 110], footTilt: [10, 10], earBack: { a: -46, bend: -14, len: 46 }, earFront: { a: -26, bend: -16, len: 44 }, armFront: [82, 88, -10], scarf: -3 },
  run2: { dy: -4, tilt: -3, feetBack: [76, 112], feetFront: [86, 112], footTilt: [15, 15], earBack: { a: -36, bend: -8, len: 46 }, earFront: { a: -14, bend: -10, len: 44 }, armFront: [80, 94, 10], scarf: 4 },
  run3: { dy: 2, tilt: 0, feetBack: [56, 115], feetFront: [72, 116], earBack: { a: -30, bend: -4, len: 45 }, earFront: { a: -6, bend: -6, len: 43 }, armFront: [80, 94, -20], scarf: 0 },

  jump: { dy: -2, tilt: -6, feetBack: [48, 113], feetFront: [62, 116], footTilt: [30, 35], earBack: { a: -10, bend: -8, len: 50 }, earFront: { a: 4, bend: -8, len: 48 }, armBack: [42, 86, 40], armFront: [82, 84, -40], eyes: 'wide', mouth: 'open', scarf: 6 },
  fall: { tilt: 4, feetBack: [50, 117], feetFront: [72, 118], footTilt: [-10, -10], earBack: { a: -30, bend: 10, len: 47 }, earFront: { a: 18, bend: 14, len: 45 }, armBack: [40, 84, 60], armFront: [84, 84, -60], eyes: 'wide', mouth: 'o', scarf: -5 },
  flap0: { dy: -2, feetBack: [52, 112], feetFront: [68, 112], footTilt: [20, 20], earBack: { a: -78, bend: -10, len: 46 }, earFront: { a: 74, bend: 10, len: 44 }, armBack: [42, 86, 50], armFront: [82, 86, -50], eyes: 'happy', mouth: 'open', scarf: 6 },
  flap1: { dy: -2, feetBack: [52, 112], feetFront: [68, 112], footTilt: [20, 20], earBack: { a: -48, bend: 8, len: 46 }, earFront: { a: 44, bend: -8, len: 44 }, armBack: [42, 88, 30], armFront: [82, 88, -30], eyes: 'happy', mouth: 'open', scarf: -4 },
  land: { dy: 3, headDy: 3, feetBack: [44, 117], feetFront: [78, 117], earBack: { a: -58, bend: 10, len: 44 }, earFront: { a: 56, bend: 12, len: 42 }, armBack: [40, 96, 70], armFront: [84, 96, -70], eyes: 'happy' },
  think: { tilt: -2, headDy: 1, earBack: { a: -6, bend: -2, len: 47 }, earFront: { a: 48, bend: 20, len: 43 }, armFront: [83, 81, 18], eyes: 'up', mouth: 'hmm' },
  // Thinking: paw tapping the chin, eyes wandering, one ear flopping as she ponders.
  think1: { tilt: -3, headDy: 1, earBack: { a: -6, bend: -2, len: 47 }, earFront: { a: 56, bend: 24, len: 43 }, armFront: [84, 78, 26], eyes: 'up', mouth: 'hmm' },
  think2: { tilt: -1, headDy: 0, earBack: { a: -12, bend: -4, len: 47 }, earFront: { a: 44, bend: 18, len: 43 }, armFront: [83, 81, 18], eyes: 'closed', mouth: 'hmm' },
  think3: { tilt: 1, headDy: 1, earBack: { a: -4, bend: 2, len: 47 }, earFront: { a: 50, bend: 20, len: 43 }, armFront: [84, 80, 22], eyes: 'open', mouth: 'o' },
  // Happy dance: lean left/right, paws up in turn, ears swinging, little foot lifts.
  dance0: { dy: -3, tilt: -9, feetBack: [48, 112], feetFront: [72, 116], footTilt: [20, 0], earBack: { a: -40, bend: -12, len: 46 }, earFront: { a: 10, bend: -10, len: 44 }, armBack: [40, 80, 70], armFront: [84, 96, -30], eyes: 'happy', mouth: 'open', scarf: 6 },
  dance1: { dy: 0, tilt: 0, feetBack: [50, 115], feetFront: [72, 116], earBack: { a: -20, bend: 4, len: 46 }, earFront: { a: 36, bend: 14, len: 44 }, armBack: [42, 84, 55], armFront: [82, 84, -55], eyes: 'happy', mouth: 'smile', scarf: 0 },
  dance2: { dy: -3, tilt: 9, feetBack: [50, 116], feetFront: [74, 111], footTilt: [0, -20], earBack: { a: -4, bend: 12, len: 46 }, earFront: { a: 46, bend: 18, len: 44 }, armBack: [44, 96, 30], armFront: [86, 78, -70], eyes: 'happy', mouth: 'open', scarf: -6 },
  dance3: { dy: 1, headDy: 1, tilt: 0, feetBack: [48, 116], feetFront: [74, 117], earBack: { a: -30, bend: -6, len: 45 }, earFront: { a: 30, bend: 10, len: 43 }, armBack: [42, 86, 40], armFront: [82, 86, -40], eyes: 'closed', mouth: 'smile', scarf: 2 },
  // Munching the Golden Carrot (paws up at the mouth) and the propeller-ear victory spin.
  munch0: { armBack: [62, 74, 50], armFront: [86, 74, -50], eyes: 'happy', mouth: 'open', earBack: { a: -16, bend: -4, len: 46 }, earFront: { a: 26, bend: 14, len: 44 } },
  munch1: { dy: 1, armBack: [62, 76, 45], armFront: [86, 76, -45], eyes: 'closed', mouth: 'chew', earBack: { a: -10, bend: -2, len: 46 }, earFront: { a: 34, bend: 18, len: 44 } },
  spin0: { dy: -2, earBack: { a: -88, bend: 0, len: 46 }, earFront: { a: 88, bend: 0, len: 44 }, armBack: [42, 84, 60], armFront: [82, 84, -60], eyes: 'happy', mouth: 'open', scarf: 5 },
  spin1: { dy: -2, earBack: { a: -42, bend: 0, len: 28 }, earFront: { a: 42, bend: 0, len: 27 }, armBack: [42, 84, 60], armFront: [82, 84, -60], eyes: 'happy', mouth: 'open', scarf: -3 },
  spin2: { dy: -2, earBack: { a: -4, bend: 0, len: 48 }, earFront: { a: 4, bend: 0, len: 46 }, armBack: [42, 84, 60], armFront: [82, 84, -60], eyes: 'happy', mouth: 'open', scarf: 4 },
  spin3: { dy: -2, earBack: { a: 40, bend: 0, len: 28 }, earFront: { a: -40, bend: 0, len: 27 }, armBack: [42, 84, 60], armFront: [82, 84, -60], eyes: 'happy', mouth: 'open', scarf: -4 },
  float: { feetBack: [52, 116], feetFront: [68, 118], footTilt: [-15, -20], earBack: { a: -20, bend: -4, len: 46 }, earFront: { a: 22, bend: 12, len: 44 }, armFront: [93, 60, 25], eyes: 'happy', mouth: 'open', scarf: 3 },
};
