// UI and effect sprites as SVG strings: touch buttons, balloon, dust puff, shadow.

const OUT = '#6b4424';
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

function roundButton(size, top, bottom, icon) {
  const c = size / 2, r = c - 8;
  return svg(size, size, `
    <circle cx="${c}" cy="${c + 5}" r="${r}" fill="#000" opacity="0.18"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="url(#g)" stroke="${OUT}" stroke-width="6"/>
    <ellipse cx="${c - r * 0.25}" cy="${c - r * 0.5}" rx="${r * 0.5}" ry="${r * 0.22}" fill="#fff" opacity="0.45"/>
    ${icon(c)}`,
  `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`);
}

const arrow = (dir) => (c) => {
  const s = dir; // 1 = right, -1 = left
  return `<path d="M ${c - 14 * s} ${c - 26} L ${c + 20 * s} ${c} L ${c - 14 * s} ${c + 26} Z"
    fill="${OUT}" stroke="${OUT}" stroke-width="12" stroke-linejoin="round"/>`;
};

function signSVG() {
  const W = 960, H = 430;
  const planks = [0, 1, 2].map((i) => {
    const y = 18 + i * 132;
    return `<rect x="14" y="${y}" width="${W - 28}" height="128" rx="20" fill="${['#e9b878', '#e2ad6a', '#ecbd80'][i]}" stroke="#8a5a30" stroke-width="3"/>
      <path d="M 60 ${y + 40} q 140 -12 300 0 t 300 4" stroke="#c98f4f" stroke-width="3" fill="none" opacity="0.55"/>
      <path d="M 380 ${y + 92} q 160 10 330 -2 t 180 2" stroke="#c98f4f" stroke-width="3" fill="none" opacity="0.5"/>
      <ellipse cx="${[200, 720, 470][i]}" cy="${y + 70}" rx="16" ry="8" fill="none" stroke="#c98f4f" stroke-width="3" opacity="0.5"/>`;
  }).join('');
  return svg(W, H, `
    <rect x="6" y="14" width="${W - 12}" height="${H - 14}" rx="30" fill="#000" opacity="0.18"/>
    <rect x="6" y="6" width="${W - 12}" height="${H - 14}" rx="30" fill="#c98a4b" stroke="${OUT}" stroke-width="7"/>
    ${planks}
    ${[[40, 40], [W - 40, 40], [40, H - 50], [W - 40, H - 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#8d8f93" stroke="#4d4f53" stroke-width="2.5"/><circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#dfe1e4"/>`).join('')}`);
}

function bubbleSVG(color, edge) {
  return svg(180, 180, `
    <circle cx="90" cy="94" r="80" fill="#000" opacity="0.12"/>
    <circle cx="90" cy="88" r="80" fill="url(#bb)" stroke="${edge}" stroke-width="6"/>
    <ellipse cx="62" cy="52" rx="26" ry="15" fill="#fff" opacity="0.75" transform="rotate(-30 62 52)"/>
    <circle cx="126" cy="132" r="7" fill="#fff" opacity="0.5"/>`,
  `<radialGradient id="bb" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="${color}" stop-opacity="0.9"/><stop offset="1" stop-color="${color}"/></radialGradient>`);
}

// Number-pad key: a chunky rounded tile (≥ 100 px, easy for small fingers).
function keySVG(top, bottom, edge) {
  return svg(112, 108, `
    <rect x="4" y="10" width="104" height="94" rx="26" fill="#000" opacity="0.16"/>
    <rect x="4" y="4" width="104" height="94" rx="26" fill="url(#k)" stroke="${edge}" stroke-width="5"/>
    <rect x="20" y="13" width="56" height="12" rx="6" fill="#fff" opacity="0.5"/>`,
  `<linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`);
}

const note = (c, off) => `
  <path d="M ${c - 8} ${c + 14} L ${c - 8} ${c - 20} L ${c + 18} ${c - 26} L ${c + 18} ${c + 8}" fill="none" stroke="${OUT}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
  <ellipse cx="${c - 15}" cy="${c + 15}" rx="9" ry="7" fill="${OUT}"/><ellipse cx="${c + 11}" cy="${c + 9}" rx="9" ry="7" fill="${OUT}"/>
  ${off ? `<path d="M ${c - 26} ${c - 26} L ${c + 26} ${c + 26}" stroke="#fff8e6" stroke-width="12" stroke-linecap="round"/><path d="M ${c - 26} ${c - 26} L ${c + 26} ${c + 26}" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/>` : ''}`;
// Speech: a speech bubble with "talking" dots (crossed out when off).
const talk = (c, off) => `
  <path d="M ${c - 26} ${c - 20} Q ${c - 26} ${c - 28} ${c - 18} ${c - 28} L ${c + 18} ${c - 28} Q ${c + 26} ${c - 28} ${c + 26} ${c - 20}
    L ${c + 26} ${c + 6} Q ${c + 26} ${c + 14} ${c + 18} ${c + 14} L ${c - 4} ${c + 14} L ${c - 16} ${c + 26} L ${c - 14} ${c + 14}
    L ${c - 18} ${c + 14} Q ${c - 26} ${c + 14} ${c - 26} ${c + 6} Z" fill="#fff" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
  ${[-12, 0, 12].map((dx) => `<circle cx="${c + dx}" cy="${c - 7}" r="4.2" fill="${off ? '#b8a993' : OUT}"/>`).join('')}
  ${off ? `<path d="M ${c - 26} ${c - 26} L ${c + 26} ${c + 26}" stroke="#fff8e6" stroke-width="12" stroke-linecap="round"/><path d="M ${c - 26} ${c - 26} L ${c + 26} ${c + 26}" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/>` : ''}`;
const mouth = (c, off) => `
  <path d="M ${c - 24} ${c - 8} L ${c - 13} ${c - 8} L ${c + 1} ${c - 20} L ${c + 1} ${c + 20} L ${c - 13} ${c + 8} L ${c - 24} ${c + 8} Z" fill="${OUT}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
  ${off ? `<path d="M ${c + 10} ${c - 10} L ${c + 26} ${c + 10} M ${c + 26} ${c - 10} L ${c + 10} ${c + 10}" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`
    : `<path d="M ${c + 9} ${c - 9} Q ${c + 16} ${c} ${c + 9} ${c + 9}" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
       <path d="M ${c + 15} ${c - 17} Q ${c + 27} ${c} ${c + 15} ${c + 17}" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`}`;

export const UI_ART = {
  key: keySVG('#fffaf0', '#f3d9a4', '#8a5a30'),
  keyOk: keySVG('#b4f08a', '#5cbf3e', '#2f7a24'),
  keyBack: keySVG('#ffe2c2', '#f5b77d', '#8a5a30'),
  keyGlow: svg(160, 156, `<rect x="6" y="6" width="148" height="144" rx="44" fill="url(#kg)"/>`,
    `<radialGradient id="kg"><stop offset="0.62" stop-color="#ffd84a" stop-opacity="1"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>`),
  slot: svg(200, 150, `
    <rect x="6" y="10" width="188" height="134" rx="30" fill="#000" opacity="0.12"/>
    <rect x="6" y="6" width="188" height="134" rx="30" fill="#fffaf0" stroke="#8a5a30" stroke-width="6"/>
    <rect x="22" y="16" width="90" height="12" rx="6" fill="#fff" opacity="0.9"/>`),
  btnMusicOn: roundButton(96, '#fff8e6', '#f3d9a4', (c) => note(c, false)),
  btnMusicOff: roundButton(96, '#efe6d6', '#d9c7a6', (c) => note(c, true)),
  btnSoundOn: roundButton(96, '#fff8e6', '#f3d9a4', (c) => mouth(c, false)),
  btnSoundOff: roundButton(96, '#efe6d6', '#d9c7a6', (c) => mouth(c, true)),
  btnSpeechOn: roundButton(96, '#fff8e6', '#f3d9a4', (c) => talk(c, false)),
  btnSpeechOff: roundButton(96, '#efe6d6', '#d9c7a6', (c) => talk(c, true)),
  btnLeft: roundButton(140, '#fff8e6', '#f3d9a4', arrow(-1)),
  btnRight: roundButton(140, '#fff8e6', '#f3d9a4', arrow(1)),
  btnJump: roundButton(180, '#b4f08a', '#5cbf3e', (c) => `
    <path d="M ${c - 30} ${c + 10} L ${c} ${c - 24} L ${c + 30} ${c + 10}" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M ${c - 30} ${c + 10} L ${c} ${c - 24} L ${c + 30} ${c + 10}" fill="none" stroke="#2f7a24" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" transform="translate(0 4)"/>
    <path d="M ${c - 30} ${c + 38} L ${c} ${c + 6} L ${c + 30} ${c + 38}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`),
  pill: svg(230, 88, `
    <rect x="6" y="10" width="218" height="72" rx="36" fill="#000" opacity="0.15"/>
    <rect x="6" y="5" width="218" height="72" rx="36" fill="url(#g)" stroke="${OUT}" stroke-width="5"/>
    <rect x="30" y="14" width="120" height="14" rx="7" fill="#fff" opacity="0.45"/>`,
  `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8e6"/><stop offset="1" stop-color="#f3d9a4"/></linearGradient>`),
  balloon: svg(70, 96, `
    <path d="M 35 4 C 58 4 66 24 64 40 C 62 60 46 74 35 78 C 24 74 8 60 6 40 C 4 24 12 4 35 4 Z" fill="url(#b)" stroke="#9e2346" stroke-width="3.5"/>
    <ellipse cx="22" cy="24" rx="7" ry="12" fill="#fff" opacity="0.55" transform="rotate(20 22 24)"/>
    <circle cx="20" cy="42" r="3" fill="#fff" opacity="0.4"/>
    <path d="M 30 78 L 40 78 L 37 85 L 33 85 Z" fill="#e8436a" stroke="#9e2346" stroke-width="2.5" stroke-linejoin="round"/>`,
  `<radialGradient id="b" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ff9fb6"/><stop offset="0.6" stop-color="#ff5c84"/><stop offset="1" stop-color="#e2365f"/></radialGradient>`),
  puff: svg(32, 32, `
    <circle cx="16" cy="16" r="13" fill="#fffaf0" stroke="#d9c4a3" stroke-width="2.5"/>
    <circle cx="12" cy="12" r="4" fill="#fff" opacity="0.9"/>`),
  ring: svg(96, 40, `<ellipse cx="48" cy="20" rx="44" ry="16" fill="none" stroke="#fff" stroke-width="6" opacity="0.9"/>`),
  sparkle: svg(24, 24, `<path d="M 12 1 Q 13.5 10.5 23 12 Q 13.5 13.5 12 23 Q 10.5 13.5 1 12 Q 10.5 10.5 12 1 Z" fill="#fff6b0" stroke="#f0b93a" stroke-width="1.5" stroke-linejoin="round"/>`),
  sign: signSVG(),
  signpost: svg(48, 420, `
    <rect x="8" y="0" width="32" height="430" rx="8" fill="#b97a43" stroke="${OUT}" stroke-width="5"/>
    <path d="M 18 30 L 18 400" stroke="#9a5f2f" stroke-width="3" opacity="0.6"/>`),
  bubble0: bubbleSVG('#ff9fc4', '#d9558d'),
  bubble1: bubbleSVG('#8fd3ff', '#3b93cf'),
  bubble2: bubbleSVG('#ffe170', '#d39b12'),
  bubble3: bubbleSVG('#a8ee8a', '#4aa83a'),
  glow: svg(260, 260, `<circle cx="130" cy="130" r="128" fill="url(#gl)"/>`,
    `<radialGradient id="gl"><stop offset="0.45" stop-color="#fff3a0" stop-opacity="0.95"/><stop offset="0.75" stop-color="#ffd23f" stop-opacity="0.45"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>`),
  btnSpeak: roundButton(100, '#fff8e6', '#f3d9a4', (c) => `
    <path d="M ${c - 22} ${c - 9} L ${c - 11} ${c - 9} L ${c + 3} ${c - 22} L ${c + 3} ${c + 22} L ${c - 11} ${c + 9} L ${c - 22} ${c + 9} Z" fill="${OUT}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M ${c + 11} ${c - 10} Q ${c + 18} ${c} ${c + 11} ${c + 10}" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
    <path d="M ${c + 17} ${c - 18} Q ${c + 30} ${c} ${c + 17} ${c + 18}" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`),
  heart: svg(30, 28, `<path d="M 15 26 C 4 18 1 12 2 8 C 3 3 9 1 15 7 C 21 1 27 3 28 8 C 29 12 26 18 15 26 Z" fill="#fff" stroke="#c94d6c" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="9" cy="8" rx="3" ry="2" fill="#fff" opacity="0.9"/>`),
  shadow: svg(80, 20, `<ellipse cx="40" cy="10" rx="36" ry="8" fill="#2b4a1c" opacity="0.28"/>`),

  // ---- Menus: Title, Profiles, World Map ---------------------------------------------------------
  btnMap: roundButton(96, '#fff8e6', '#f3d9a4', (c) => `
    <path d="M ${c - 24} ${c - 16} L ${c - 8} ${c - 22} L ${c + 8} ${c - 16} L ${c + 24} ${c - 22} L ${c + 24} ${c + 18} L ${c + 8} ${c + 24} L ${c - 8} ${c + 18} L ${c - 24} ${c + 24} Z"
      fill="#bfe6a8" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M ${c - 8} ${c - 22} L ${c - 8} ${c + 18} M ${c + 8} ${c - 16} L ${c + 8} ${c + 24}" stroke="${OUT}" stroke-width="3"/>
    <path d="M ${c - 18} ${c + 8} q 8 -14 18 -6 t 16 -10" fill="none" stroke="#e8604c" stroke-width="3.5" stroke-dasharray="4 4" stroke-linecap="round"/>`),
  btnPlayGrey: svg(380, 140, `
    <rect x="8" y="18" width="364" height="116" rx="58" fill="#000" opacity="0.14"/>
    <rect x="8" y="8" width="364" height="116" rx="58" fill="url(#pg)" stroke="#8a8172" stroke-width="7"/>
    <rect x="44" y="20" width="200" height="20" rx="10" fill="#fff" opacity="0.45"/>`,
  `<linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ebe5d8"/><stop offset="1" stop-color="#c9c0ae"/></linearGradient>`),
  btnBack: roundButton(96, '#fff8e6', '#f3d9a4', (c) => `
    <path d="M ${c + 8} ${c - 22} L ${c - 14} ${c} L ${c + 8} ${c + 22}" fill="none" stroke="${OUT}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`),
  // Quit: a little wooden door standing open, with an arrow stepping out of it.
  btnQuit: roundButton(96, '#fff8e6', '#f3d9a4', (c) => `
    <path d="M ${c - 26} ${c + 24} L ${c - 26} ${c - 12} Q ${c - 26} ${c - 26} ${c - 12} ${c - 26} L ${c - 2} ${c - 26} Q ${c + 12} ${c - 26} ${c + 12} ${c - 12} L ${c + 12} ${c + 24} Z"
      fill="#5a3a22" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M ${c - 26} ${c + 24} L ${c - 26} ${c - 12} Q ${c - 26} ${c - 22} ${c - 18} ${c - 24} L ${c - 4} ${c - 20} L ${c - 4} ${c + 28} Z"
      fill="#e8a25a" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M ${c - 21} ${c - 10} L ${c - 9} ${c - 8} M ${c - 21} ${c + 6} L ${c - 9} ${c + 7}" stroke="#b87232" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="${c - 9}" cy="${c + 2}" r="2.8" fill="#ffd23f" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M ${c + 2} ${c + 2} L ${c + 22} ${c + 2}" stroke="#3f9a2a" stroke-width="7" stroke-linecap="round"/>
    <path d="M ${c + 14} ${c - 8} L ${c + 26} ${c + 2} L ${c + 14} ${c + 12}" fill="none" stroke="#3f9a2a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
  btnPlay: svg(380, 140, `
    <rect x="8" y="18" width="364" height="116" rx="58" fill="#000" opacity="0.18"/>
    <rect x="8" y="8" width="364" height="116" rx="58" fill="url(#pl)" stroke="#2f7a24" stroke-width="7"/>
    <rect x="44" y="20" width="200" height="20" rx="10" fill="#fff" opacity="0.45"/>`,
  `<linearGradient id="pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4f08a"/><stop offset="1" stop-color="#5cbf3e"/></linearGradient>`),
  'profile-card': svg(250, 310, `
    <rect x="6" y="14" width="238" height="290" rx="34" fill="#000" opacity="0.16"/>
    <rect x="6" y="6" width="238" height="290" rx="34" fill="#fff8e6" stroke="${OUT}" stroke-width="6"/>
    <rect x="26" y="20" width="120" height="14" rx="7" fill="#fff" opacity="0.85"/>`),
  'profile-new': svg(250, 310, `
    <rect x="6" y="6" width="238" height="290" rx="34" fill="#fff8e6" fill-opacity="0.55" stroke="${OUT}" stroke-width="5" stroke-dasharray="18 12"/>
    <circle cx="125" cy="128" r="54" fill="#b4f08a" stroke="#2f7a24" stroke-width="6"/>
    <path d="M 125 98 L 125 158 M 95 128 L 155 128" stroke="#fff" stroke-width="16" stroke-linecap="round"/>`),
  'avatar-ring': svg(176, 176, `<circle cx="88" cy="88" r="80" fill="#fff3a0" stroke="#f0b93a" stroke-width="8"/>`),
  // Burrow (a round green door in a grassy mound) and the sticker book.
  btnBurrow: roundButton(96, '#fff8e6', '#f3d9a4', (c) => `
    <path d="M ${c - 30} ${c + 22} Q ${c - 30} ${c - 26} ${c} ${c - 26} Q ${c + 30} ${c - 26} ${c + 30} ${c + 22} Z" fill="#8fd36a" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
    <circle cx="${c}" cy="${c + 4}" r="15" fill="#e8835a" stroke="${OUT}" stroke-width="4"/>
    <path d="M ${c} ${c - 11} L ${c} ${c + 19} M ${c - 15} ${c + 4} L ${c + 15} ${c + 4}" stroke="${OUT}" stroke-width="2.5" opacity="0.6"/>
    <circle cx="${c + 8}" cy="${c + 8}" r="2.6" fill="#ffd23f" stroke="${OUT}" stroke-width="1.5"/>
    <path d="M ${c - 24} ${c - 4} l 3 -7 l 3 7 M ${c + 20} ${c - 8} l 3 -7 l 3 7" stroke="#3f9a2a" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  btnStickers: roundButton(96, '#fff8e6', '#f3d9a4', (c) => `
    <path d="M ${c - 28} ${c - 20} Q ${c - 14} ${c - 26} ${c} ${c - 20} Q ${c + 14} ${c - 26} ${c + 28} ${c - 20} L ${c + 28} ${c + 22} Q ${c + 14} ${c + 16} ${c} ${c + 22} Q ${c - 14} ${c + 16} ${c - 28} ${c + 22} Z" fill="#d9534f" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M ${c - 23} ${c - 17} Q ${c - 12} ${c - 21} ${c - 2} ${c - 16} L ${c - 2} ${c + 17} Q ${c - 12} ${c + 12} ${c - 23} ${c + 16} Z M ${c + 23} ${c - 17} Q ${c + 12} ${c - 21} ${c + 2} ${c - 16} L ${c + 2} ${c + 17} Q ${c + 12} ${c + 12} ${c + 23} ${c + 16} Z" fill="#fffaf0"/>
    <path d="M ${c - 12} ${c - 9} l 2.6 5.4 l 5.9 0.8 l -4.3 4.1 l 1 5.9 l -5.2 -2.8 l -5.2 2.8 l 1 -5.9 l -4.3 -4.1 l 5.9 -0.8 Z" fill="#ffd23f" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="${c + 12}" cy="${c}" r="7" fill="#8fd36a" stroke="${OUT}" stroke-width="1.8"/>`),
  'new-dot': svg(44, 44, `<circle cx="22" cy="22" r="19" fill="#ff5f8f" stroke="#fff" stroke-width="4"/>
    <path d="M 22 10 l 3.2 6.6 l 7.2 1 l -5.2 5 l 1.3 7.2 l -6.5 -3.4 l -6.5 3.4 l 1.3 -7.2 l -5.2 -5 l 7.2 -1 Z" fill="#fff"/>`),
  'name-field': svg(560, 110, `
    <rect x="6" y="12" width="548" height="92" rx="30" fill="#000" opacity="0.12"/>
    <rect x="6" y="6" width="548" height="92" rx="30" fill="#fffdf6" stroke="${OUT}" stroke-width="6"/>`),
};
