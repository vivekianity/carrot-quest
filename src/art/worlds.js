// Parallax backgrounds per world. Layers tile seamlessly horizontally (width W).

export const BG_W = 1280;
export const BG_H = 820; // a little taller than the view so vertical camera moves never show a gap

const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

// Deterministic random so the art is the same every boot.
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// A seamless ridge: sum of sines with whole-number periods across the width.
function ridge(base, waves, step = 16) {
  const y = (x) => base + waves.reduce((s, [amp, k, ph]) => s + amp * Math.sin((2 * Math.PI * k * x) / BG_W + ph), 0);
  let d = `M 0 ${BG_H} L 0 ${y(0).toFixed(1)}`;
  for (let x = step; x <= BG_W; x += step) d += ` L ${x} ${y(x).toFixed(1)}`;
  return { d: d + ` L ${BG_W} ${BG_H} Z`, y };
}

// Draw an item at x and, if it straddles an edge, again at x ± W so the layer wraps cleanly.
const wrap = (x, half, draw) => [x, x - BG_W, x + BG_W].filter((xx) => xx + half > 0 && xx - half < BG_W).map(draw).join('');

export function meadowSky() {
  return svg(1280, 720, `
    <rect width="1280" height="720" fill="url(#sky)"/>
    <circle cx="1060" cy="130" r="150" fill="#fff6c9" opacity="0.35"/>
    <circle cx="1060" cy="130" r="95" fill="#fff3b3" opacity="0.5"/>
    <circle cx="1060" cy="130" r="62" fill="#ffe56b" stroke="#ffc93c" stroke-width="5"/>
    <circle cx="1043" cy="112" r="16" fill="#fff6c4" opacity="0.8"/>`,
  `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#7cc8f7"/><stop offset="0.55" stop-color="#bfe6ff"/><stop offset="1" stop-color="#fdf4d8"/>
   </linearGradient>`);
}

function cloud(x, y, s, shade = '#cfe3f2', fill = '#ffffff') {
  const puffs = [[0, 0, 34], [36, -14, 42], [78, -4, 36], [108, 8, 26], [-28, 10, 24]];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${puffs.map(([px, py, r]) => `<circle cx="${px}" cy="${py + 4}" r="${r}" fill="${shade}"/>`).join('')}
    ${puffs.map(([px, py, r]) => `<circle cx="${px}" cy="${py}" r="${r}" fill="${fill}"/>`).join('')}
    <rect x="-40" y="10" width="160" height="26" rx="13" fill="${fill}"/>
  </g>`;
}

function cloudLayer(seed, shade, fill, n = 5, opacity = 1) {
  const r = rng(seed);
  let body = '';
  for (let i = 0; i < n; i++) {
    const x = i * (BG_W / n) + r() * 120, y = 70 + r() * 170, s = 0.6 + r() * 0.5;
    const sh = Array.isArray(shade) ? shade[i % shade.length] : shade;
    const fl = Array.isArray(fill) ? fill[i % fill.length] : fill;
    body += wrap(x, 120 * s, (xx) => cloud(xx, y, s, sh, fl));
  }
  return svg(BG_W, 360, `<g opacity="${opacity}">${body}</g>`);
}

export function meadowClouds() { return cloudLayer(7, '#cfe3f2', '#ffffff'); }

export function meadowFar() {
  const back = ridge(470, [[38, 2, 0.4], [22, 5, 1.7], [10, 9, 0.2]]);
  const front = ridge(530, [[30, 3, 2.2], [18, 7, 0.9], [8, 11, 3.0]]);
  return svg(BG_W, BG_H, `
    <path d="${back.d}" fill="#b9e3c3"/>
    <path d="${front.d}" fill="#a3d9a6"/>
    <path d="${front.d}" fill="url(#haze)"/>`,
  `<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#e8f7e0" stop-opacity="0.6"/>
   </linearGradient>`);
}

const CANOPY = [[-26, -78, 30], [24, -80, 32], [0, -108, 36]];

function tree(x, groundY, s, hue) {
  const OUT = '#2f6b31';
  const c = ['#5fb85a', '#6fc766', '#56ad52'][hue];
  return `<g transform="translate(${x} ${groundY}) scale(${s})">
    <path d="M -8 0 Q -6 -40 -4 -62 L 4 -62 Q 6 -40 8 0 Z" fill="#a8744a" stroke="#6b4426" stroke-width="3"/>
    ${CANOPY.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" stroke="${OUT}" stroke-width="7"/>`).join('')}
    ${CANOPY.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`).join('')}
    <ellipse cx="-12" cy="-118" rx="14" ry="9" fill="#9ee08f" opacity="0.7"/>
    <ellipse cx="22" cy="-92" rx="9" ry="6" fill="#9ee08f" opacity="0.55"/>
  </g>`;
}

export function meadowMid() {
  const hill = ridge(540, [[34, 2, 1.1], [20, 4, 2.6], [9, 8, 0.5]]);
  const r = rng(21);
  let trees = '';
  for (let i = 0; i < 7; i++) {
    const x = i * (BG_W / 7) + r() * 90;
    const s = 0.75 + r() * 0.35;
    trees += wrap(x, 75 * s, (xx) => tree(xx, hill.y(x) + 14, s, i % 3));
  }
  return svg(BG_W, BG_H, `${trees}
    <path d="${hill.d}" fill="#7fcb6a" stroke="#4d9440" stroke-width="4"/>
    <path d="${ridge(600, [[14, 3, 0.3], [8, 6, 1.4]]).d}" fill="#74c060" opacity="0.6"/>`);
}

function bush(x, y, s, flowers, r) {
  const OUT = '#2c6a2b';
  const puffs = [[-44, 4, 30], [-14, -16, 38], [26, -10, 34], [52, 6, 26]];
  let fl = '';
  for (let i = 0; i < flowers; i++) {
    const fx = -50 + r() * 100, fy = -24 + r() * 26;
    fl += `<circle cx="${fx}" cy="${fy}" r="4.5" fill="${['#ffe066', '#ff9ec0', '#ffffff'][i % 3]}" stroke="${OUT}" stroke-width="1.5"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${puffs.map(([px, py, rr]) => `<circle cx="${px}" cy="${py}" r="${rr}" fill="#46a342" stroke="${OUT}" stroke-width="8"/>`).join('')}
    ${puffs.map(([px, py, rr]) => `<circle cx="${px}" cy="${py}" r="${rr}" fill="#46a342"/>`).join('')}
    <rect x="-74" y="8" width="150" height="60" fill="#46a342"/>
    ${puffs.map(([px, py, rr]) => `<ellipse cx="${px - rr * 0.25}" cy="${py - rr * 0.45}" rx="${rr * 0.4}" ry="${rr * 0.22}" fill="#7fd06f" opacity="0.65"/>`).join('')}
    ${fl}
  </g>`;
}

export function meadowNear() {
  const r = rng(99);
  const base = ridge(650, [[16, 2, 0.8], [10, 5, 2.1]]);
  let bushes = '';
  for (let i = 0; i < 5; i++) {
    const x = i * 256 + 60 + r() * 120;
    const s = 0.9 + r() * 0.4;
    const fl = 2 + Math.floor(r() * 4);
    bushes += wrap(x, 80 * s, (xx) => bush(xx, base.y(x) - 6, s, fl, rng(i * 31 + 5)));
  }
  return svg(BG_W, BG_H, `${bushes}
    <path d="${base.d}" fill="#3f9a3d" stroke="#2c6a2b" stroke-width="4"/>`);
}

// ---- Shared helpers for the other worlds ------------------------------------------------------
const skyGrad = (stops) => `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const sun = (cx, cy, r, core, rim, halo) => `
  <circle cx="${cx}" cy="${cy}" r="${r * 2.4}" fill="${halo}" opacity="0.3"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 1.5}" fill="${halo}" opacity="0.45"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${core}" stroke="${rim}" stroke-width="5"/>
  <circle cx="${cx - r * 0.28}" cy="${cy - r * 0.28}" r="${r * 0.26}" fill="#ffffff" opacity="0.55"/>`;
const hazeDef = (c) => `<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${c}" stop-opacity="0.6"/></linearGradient>`;

// ---- 🍄 Mushroom Forest: a cosy violet evening among giant toadstools -------------------------
export function mushroomSky() {
  const r = rng(3);
  let stars = '';
  for (let i = 0; i < 40; i++) {
    const x = r() * 1280, y = r() * 330, s = 1 + r() * 2.2;
    stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(1)}" fill="#fff8d6" opacity="${(0.4 + r() * 0.5).toFixed(2)}"/>`;
  }
  return svg(1280, 720, `<rect width="1280" height="720" fill="url(#sky)"/>${stars}
    <circle cx="1040" cy="140" r="120" fill="#fff4c4" opacity="0.18"/>
    <circle cx="1040" cy="140" r="58" fill="#fff4c4" stroke="#f0d48a" stroke-width="5"/>
    <circle cx="1022" cy="128" r="10" fill="#f0dfa6"/><circle cx="1058" cy="160" r="7" fill="#f0dfa6"/><circle cx="1050" cy="118" r="5" fill="#f0dfa6"/>`,
  skyGrad([[0, '#5a4fa3'], [0.55, '#9c86d6'], [1, '#f6c6dc']]));
}
export function mushroomClouds() { return cloudLayer(11, '#b9a6e3', '#e4d8fb', 5, 0.9); }

function bigShroom(x, groundY, s, cap, spot) {
  const OUT = '#3a2a3f';
  return `<g transform="translate(${x} ${groundY}) scale(${s})">
    <path d="M -16 0 Q -20 -70 -12 -140 L 12 -140 Q 20 -70 16 0 Z" fill="#f4e6da" stroke="${OUT}" stroke-width="5"/>
    <path d="M -8 -10 Q -10 -70 -4 -130" stroke="#d9c4b4" stroke-width="5" fill="none"/>
    <path d="M -90 -130 Q -84 -230 0 -236 Q 84 -230 90 -130 Q 0 -112 -90 -130 Z" fill="${cap}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="-40" cy="-182" rx="15" ry="11" fill="${spot}"/><ellipse cx="18" cy="-206" rx="18" ry="11" fill="${spot}"/><ellipse cx="54" cy="-160" rx="12" ry="9" fill="${spot}"/>
    <path d="M -60 -190 Q -40 -220 -6 -226" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.35"/>
  </g>`;
}

export function mushroomFar() {
  const back = ridge(470, [[34, 2, 0.8], [20, 5, 2.3], [10, 9, 1.0]]);
  const front = ridge(540, [[26, 3, 1.4], [16, 6, 0.4], [8, 11, 2.0]]);
  const r = rng(13);
  let shrooms = '';
  for (let i = 0; i < 6; i++) {
    const x = i * (BG_W / 6) + r() * 100, s = 0.35 + r() * 0.2;
    shrooms += wrap(x, 95 * s, (xx) => `<g opacity="0.85">${bigShroom(xx, back.y(x) + 30, s, '#8a6cc4', '#a991dc')}</g>`);
  }
  return svg(BG_W, BG_H, `${shrooms}<path d="${back.d}" fill="#7f6bbd"/><path d="${front.d}" fill="#6c5aa8"/><path d="${front.d}" fill="url(#haze)"/>`, hazeDef('#c9b4ea'));
}

export function mushroomMid() {
  const hill = ridge(560, [[30, 2, 0.6], [18, 4, 2.0], [8, 8, 0.9]]);
  const r = rng(17);
  const caps = [['#e2537a', '#ffd0dc'], ['#b25cd9', '#f0d6ff'], ['#ff8a4c', '#ffe1c9']];
  let shrooms = '';
  for (let i = 0; i < 5; i++) {
    const x = i * (BG_W / 5) + r() * 120, s = 0.65 + r() * 0.35;
    const [c, sp] = caps[i % 3];
    shrooms += wrap(x, 95 * s, (xx) => bigShroom(xx, hill.y(x) + 18, s, c, sp));
  }
  return svg(BG_W, BG_H, `${shrooms}<path d="${hill.d}" fill="#3fae84" stroke="#24745a" stroke-width="4"/>
    <path d="${ridge(610, [[12, 3, 0.7], [8, 7, 1.9]]).d}" fill="#38a179" opacity="0.7"/>`);
}

export function mushroomNear() {
  const r = rng(23);
  const base = ridge(655, [[14, 2, 1.8], [9, 5, 0.3]]);
  let items = '';
  for (let i = 0; i < 6; i++) {
    const x = i * (BG_W / 6) + 40 + r() * 100;
    const y = base.y(x) + 4;
    items += wrap(x, 70, (xx) => `<g transform="translate(${xx} ${y})">
      ${[-40, -15, 15, 40].map((a, k) => `<path d="M 0 0 Q ${a * 0.6} -40 ${a * 1.4} ${-70 - (k % 2) * 16}" stroke="#2a8b63" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M 0 0 Q ${a * 0.6} -40 ${a * 1.4} ${-70 - (k % 2) * 16}" stroke="#46c28e" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}
      <circle cx="${-24 + (i % 3) * 20}" cy="-18" r="7" fill="#6ee7ff" opacity="0.8"/>
    </g>`);
  }
  return svg(BG_W, BG_H, `${items}<path d="${base.d}" fill="#2f9a70" stroke="#1d6b4c" stroke-width="4"/>`);
}

// ---- 🏖️ Sunny Beach: sea, islands and palm trees ------------------------------------------------
export function beachSky() {
  return svg(1280, 720, `<rect width="1280" height="720" fill="url(#sky)"/>${sun(1070, 120, 60, '#ffe56b', '#ffc93c', '#fff3b3')}`,
    skyGrad([[0, '#4fb8f0'], [0.6, '#a8e2ff'], [1, '#e6fbff']]));
}
export function beachClouds() { return cloudLayer(29, '#cde9f7', '#ffffff', 4); }

function palm(x, groundY, s) {
  const OUT = '#5b4320';
  const leaf = (a, len) => `<path d="M 0 0 Q ${Math.cos(a) * len * 0.5} ${Math.sin(a) * len * 0.5 - 26} ${Math.cos(a) * len} ${Math.sin(a) * len}" stroke="#2f8a3e" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M 0 0 Q ${Math.cos(a) * len * 0.5} ${Math.sin(a) * len * 0.5 - 26} ${Math.cos(a) * len} ${Math.sin(a) * len}" stroke="#5cc75a" stroke-width="13" fill="none" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${groundY}) scale(${s})">
    <path d="M -10 0 Q 0 -90 26 -170 L 40 -166 Q 16 -86 12 0 Z" fill="#c9965a" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    ${[40, 80, 120].map((y) => `<path d="M ${-6 + y * 0.18} ${-y} q 10 -4 18 2" stroke="${OUT}" stroke-width="3" fill="none" opacity="0.5"/>`).join('')}
    <g transform="translate(34 -170)">
      ${leaf(-2.9, 90)}${leaf(-2.2, 80)}${leaf(-1.2, 70)}${leaf(-0.4, 88)}${leaf(0.25, 80)}${leaf(2.9, 70)}
      <circle cx="-6" cy="8" r="9" fill="#8a5a30" stroke="${OUT}" stroke-width="3"/><circle cx="8" cy="10" r="9" fill="#8a5a30" stroke="${OUT}" stroke-width="3"/>
    </g>
  </g>`;
}

export function beachFar() {
  const r = rng(31);
  const islandX = 300 + r() * 600;
  let waves = '';
  for (let y = 560; y < BG_H; y += 40) {
    for (let x = (y / 40) % 2 ? 0 : 60; x < BG_W; x += 120) waves += `<path d="M ${x} ${y} q 15 -8 30 0" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.6"/>`;
  }
  return svg(BG_W, BG_H, `
    <ellipse cx="${islandX}" cy="545" rx="150" ry="40" fill="#e9cf8d"/>
    <ellipse cx="${islandX - 30}" cy="530" rx="80" ry="30" fill="#7cc66b"/>
    <g opacity="0.9">${palm(islandX + 40, 530, 0.35)}</g>
    <g transform="translate(${(islandX + 520) % BG_W} 520)">
      <path d="M -40 10 L 40 10 L 30 26 L -30 26 Z" fill="#ffffff" stroke="#2f6f9e" stroke-width="3"/>
      <path d="M 0 8 L 0 -54 L 34 4 Z" fill="#ff8a7a" stroke="#a8433a" stroke-width="3" stroke-linejoin="round"/>
    </g>
    <rect x="0" y="540" width="${BG_W}" height="${BG_H - 540}" fill="url(#sea)"/>
    <path d="M 0 540 L ${BG_W} 540" stroke="#ffffff" stroke-width="4" opacity="0.7"/>
    ${waves}`,
  `<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fb6d8"/><stop offset="1" stop-color="#2a8fc0"/></linearGradient>`);
}

export function beachMid() {
  const dune = ridge(590, [[22, 2, 0.4], [14, 5, 1.6], [6, 9, 2.4]]);
  const r = rng(37);
  let palms = '';
  for (let i = 0; i < 4; i++) {
    const x = i * (BG_W / 4) + r() * 160, s = 0.75 + r() * 0.3;
    palms += wrap(x, 140 * s, (xx) => palm(xx, dune.y(x) + 14, s));
  }
  return svg(BG_W, BG_H, `${palms}<path d="${dune.d}" fill="#f5d896" stroke="#c99a52" stroke-width="4"/>
    <path d="${ridge(640, [[10, 3, 1.1], [6, 7, 0.2]]).d}" fill="#efcd85" opacity="0.8"/>`);
}

export function beachNear() {
  const r = rng(41);
  const base = ridge(660, [[12, 2, 0.6], [8, 6, 2.6]]);
  let items = '';
  for (let i = 0; i < 6; i++) {
    const x = i * (BG_W / 6) + 30 + r() * 120;
    const y = base.y(x) + 6;
    items += wrap(x, 60, (xx) => `<g transform="translate(${xx} ${y})">
      ${[-30, -12, 6, 24].map((dx, k) => `<path d="M ${dx} 0 Q ${dx + 4} -40 ${dx + 16 + k * 4} ${-80 + k * 10}" stroke="#8ab34a" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M ${dx} 0 Q ${dx + 4} -40 ${dx + 16 + k * 4} ${-80 + k * 10}" stroke="#b9d86a" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}
    </g>`);
  }
  return svg(BG_W, BG_H, `${items}<path d="${base.d}" fill="#ecc778" stroke="#c99a52" stroke-width="4"/>`);
}

// ---- ❄️ Snowy Peaks: mountains, pines and soft snow -----------------------------------------------
export function snowSky() {
  return svg(1280, 720, `<rect width="1280" height="720" fill="url(#sky)"/>${sun(1060, 130, 54, '#fff7d6', '#ffe08a', '#ffffff')}`,
    skyGrad([[0, '#8cc4f2'], [0.6, '#cfe6fb'], [1, '#f6f9ff']]));
}
export function snowClouds() { return cloudLayer(43, '#d6e2f0', '#ffffff', 5); }

function peaks(baseY, heights, fill, cap, seed) {
  const r = rng(seed);
  const n = heights.length;
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = i * (BG_W / n) + r() * 60, h = heights[i], w = h * 1.3;
    out += wrap(x, w, (xx) => `
      <path d="M ${xx - w} ${baseY} L ${xx} ${baseY - h} L ${xx + w} ${baseY} Z" fill="${fill}" stroke="#7d93b8" stroke-width="3" stroke-linejoin="round"/>
      <path d="M ${xx - h * 0.36} ${baseY - h * 0.72} L ${xx} ${baseY - h} L ${xx + h * 0.36} ${baseY - h * 0.72} L ${xx + h * 0.2} ${baseY - h * 0.66} L ${xx + h * 0.05} ${baseY - h * 0.74} L ${xx - h * 0.12} ${baseY - h * 0.64} Z" fill="${cap}" stroke="#a9bcd9" stroke-width="2" stroke-linejoin="round"/>`);
  }
  return out;
}

export function snowFar() {
  return svg(BG_W, BG_H, `${peaks(560, [230, 300, 200, 270, 240], '#b5c8e6', '#ffffff', 47)}
    <rect x="0" y="555" width="${BG_W}" height="${BG_H - 555}" fill="#dfe9f7"/>
    <rect x="0" y="380" width="${BG_W}" height="${BG_H - 380}" fill="url(#haze)"/>`, hazeDef('#eef4fc'));
}

function pine(x, groundY, s) {
  return `<g transform="translate(${x} ${groundY}) scale(${s})">
    <rect x="-8" y="-24" width="16" height="26" rx="4" fill="#8a5a30" stroke="#4b3424" stroke-width="3"/>
    <path d="M 0 -170 L 44 -100 L 24 -100 L 62 -24 L -62 -24 L -24 -100 L -44 -100 Z" fill="#3f9a6b" stroke="#235c40" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 0 -170 L 26 -128 Q 0 -116 -26 -128 Z M -24 -100 Q 0 -86 24 -100 L 36 -78 Q 0 -64 -36 -78 Z M -50 -48 Q 0 -34 50 -48 L 58 -32 Q 0 -18 -58 -32 Z" fill="#ffffff"/>
  </g>`;
}

export function snowMid() {
  const hill = ridge(570, [[28, 2, 2.0], [16, 4, 0.7], [8, 9, 1.3]]);
  const r = rng(53);
  let trees = '';
  for (let i = 0; i < 7; i++) {
    const x = i * (BG_W / 7) + r() * 80, s = 0.6 + r() * 0.35;
    trees += wrap(x, 65 * s, (xx) => pine(xx, hill.y(x) + 12, s));
  }
  return svg(BG_W, BG_H, `${trees}<path d="${hill.d}" fill="#f4f8ff" stroke="#9fb7da" stroke-width="4"/>
    <path d="${ridge(625, [[10, 3, 0.2], [6, 6, 1.7]]).d}" fill="#e6effb"/>`);
}

export function snowNear() {
  const r = rng(59);
  const base = ridge(662, [[14, 2, 2.4], [9, 5, 1.1]]);
  let items = '';
  for (let i = 0; i < 5; i++) {
    const x = i * (BG_W / 5) + 40 + r() * 120;
    items += wrap(x, 70, (xx) => `<g opacity="0.95">${pine(xx, base.y(x) + 10, 0.45)}</g>`);
  }
  return svg(BG_W, BG_H, `${items}<path d="${base.d}" fill="#ffffff" stroke="#9fb7da" stroke-width="4"/>
    <path d="${ridge(690, [[8, 3, 0.9]]).d}" fill="#eaf2fd"/>`);
}

// ---- 🍭 Candy Clouds: pastel sky, lollipop trees, a candy castle ------------------------------------
export function candySky() {
  const arc = (r, c) => `<path d="M ${640 - r} 700 A ${r} ${r} 0 0 1 ${640 + r} 700" stroke="${c}" stroke-width="22" fill="none" opacity="0.45"/>`;
  return svg(1280, 720, `<rect width="1280" height="720" fill="url(#sky)"/>
    ${['#ff8a8a', '#ffc46b', '#fff27a', '#8de08a', '#7fc8ff', '#b79cff'].map((c, i) => arc(560 - i * 22, c)).join('')}
    ${sun(1080, 120, 52, '#fff1a8', '#ffb3d1', '#ffe0ef')}`,
  skyGrad([[0, '#ffb3d9'], [0.5, '#ffd9ec'], [1, '#e6dcff']]));
}
export function candyClouds() { return cloudLayer(61, ['#f5b8d6', '#bcd6ff'], ['#ffe6f3', '#e8f1ff'], 5); }

export function candyFar() {
  const back = ridge(500, [[30, 2, 1.2], [18, 5, 0.4]]);
  const castleX = 760;
  const tower = (x, w, h, roof) => `<rect x="${x - w / 2}" y="${500 - h}" width="${w}" height="${h}" fill="#f7c6e0" stroke="#c77fa6" stroke-width="3"/>
    <path d="M ${x - w / 2 - 8} ${500 - h} L ${x} ${500 - h - w * 1.1} L ${x + w / 2 + 8} ${500 - h} Z" fill="${roof}" stroke="#c77fa6" stroke-width="3" stroke-linejoin="round"/>`;
  return svg(BG_W, BG_H, `
    <g opacity="0.85">${tower(castleX - 70, 40, 120, '#b79cff')}${tower(castleX + 70, 40, 120, '#7fc8ff')}${tower(castleX, 60, 170, '#ff8fc8')}
      <rect x="${castleX - 90}" y="420" width="180" height="80" fill="#f7c6e0" stroke="#c77fa6" stroke-width="3"/>
      <path d="M ${castleX - 18} 500 L ${castleX - 18} 466 Q ${castleX} 446 ${castleX + 18} 466 L ${castleX + 18} 500 Z" fill="#c77fa6"/></g>
    <path d="${back.d}" fill="#f3c2e3"/><path d="${ridge(550, [[22, 3, 2.1], [12, 7, 0.8]]).d}" fill="#e6b4f0"/>
    <path d="${ridge(550, [[22, 3, 2.1], [12, 7, 0.8]]).d}" fill="url(#haze)"/>`, hazeDef('#fff0f8'));
}

function lollipopTree(x, groundY, s, c1, c2) {
  return `<g transform="translate(${x} ${groundY}) scale(${s})">
    <rect x="-7" y="-150" width="14" height="150" rx="6" fill="#ffffff" stroke="#c25b88" stroke-width="4"/>
    <path d="M -7 -130 L 7 -142 M -7 -100 L 7 -112 M -7 -70 L 7 -82 M -7 -40 L 7 -52" stroke="#ff8fc8" stroke-width="5"/>
    <circle cx="0" cy="-196" r="62" fill="${c1}" stroke="#7a3557" stroke-width="6"/>
    <path d="M 0 -196 m -44 0 a 44 44 0 1 1 44 44 a 30 30 0 1 1 -30 -30 a 16 16 0 1 1 16 16" stroke="${c2}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <ellipse cx="-24" cy="-226" rx="16" ry="9" fill="#ffffff" opacity="0.5" transform="rotate(-30 -24 -226)"/>
  </g>`;
}

export function candyMid() {
  const hill = ridge(570, [[26, 2, 0.3], [16, 4, 1.8], [8, 8, 2.7]]);
  const r = rng(67);
  const cols = [['#ff8fc8', '#ffffff'], ['#7fc8ff', '#ffffff'], ['#ffd36b', '#ff8a5c'], ['#9de89a', '#ffffff']];
  let trees = '';
  for (let i = 0; i < 5; i++) {
    const x = i * (BG_W / 5) + r() * 120, s = 0.6 + r() * 0.3;
    const [a, b] = cols[i % 4];
    trees += wrap(x, 70 * s, (xx) => lollipopTree(xx, hill.y(x) + 12, s, a, b));
  }
  return svg(BG_W, BG_H, `${trees}<path d="${hill.d}" fill="#a8ecd0" stroke="#55b28c" stroke-width="4"/>
    <path d="${ridge(620, [[10, 3, 1.5], [6, 6, 0.3]]).d}" fill="#97e2c3" opacity="0.8"/>`);
}

export function candyNear() {
  const r = rng(71);
  const base = ridge(662, [[12, 2, 1.2], [8, 5, 2.9]]);
  const drops = ['#ff6b8b', '#ffd23f', '#7be07b', '#5ec2ff', '#b48cff'];
  let items = '';
  for (let i = 0; i < 7; i++) {
    const x = i * (BG_W / 7) + 30 + r() * 90;
    const y = base.y(x) + 8, c = drops[i % 5], w = 34 + r() * 16;
    items += wrap(x, w + 10, (xx) => `<path d="M ${xx - w} ${y} Q ${xx - w} ${y - w * 1.3} ${xx} ${y - w * 1.35} Q ${xx + w} ${y - w * 1.3} ${xx + w} ${y} Z" fill="${c}" stroke="#7a3557" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="${xx - w * 0.35}" cy="${y - w * 0.85}" rx="${w * 0.22}" ry="${w * 0.14}" fill="#ffffff" opacity="0.6"/>`);
  }
  return svg(BG_W, BG_H, `${items}<path d="${base.d}" fill="#f7a6c4" stroke="#c25b88" stroke-width="4"/>
    <path d="${ridge(690, [[6, 4, 0.5]]).d}" fill="#fbc3d8"/>`);
}

export const WORLD_ART = {
  meadow: { sky: meadowSky, clouds: meadowClouds, far: meadowFar, mid: meadowMid, near: meadowNear },
  mushroom: { sky: mushroomSky, clouds: mushroomClouds, far: mushroomFar, mid: mushroomMid, near: mushroomNear },
  beach: { sky: beachSky, clouds: beachClouds, far: beachFar, mid: beachMid, near: beachNear },
  snow: { sky: snowSky, clouds: snowClouds, far: snowFar, mid: snowMid, near: snowNear },
  candy: { sky: candySky, clouds: candyClouds, far: candyFar, mid: candyMid, near: candyNear },
};

/** Letterbox colours behind the canvas (top = sky, bottom = ground) per world. */
export const WORLD_COLORS = {
  meadow: ['#7cc8f7', '#c98a52'],
  mushroom: ['#5a4fa3', '#8c5f6e'],
  beach: ['#4fb8f0', '#f0c27a'],
  snow: ['#8cc4f2', '#8ea2c4'],
  candy: ['#ffb3d9', '#f7a6c4'],
};
