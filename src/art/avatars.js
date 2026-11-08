// Profile pictures: eight friendly animal faces (SVG strings, 150 × 150) for the "Who's playing?" screen.
const S = 150;
const OUT = '#5a3518';
const svg = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><defs>${defs}</defs>${body}</svg>`;

const eyes = (y = 78, dx = 20, color = '#2a1d14') => `
  <ellipse cx="${75 - dx}" cy="${y}" rx="7" ry="9" fill="${color}"/><ellipse cx="${75 + dx}" cy="${y}" rx="7" ry="9" fill="${color}"/>
  <circle cx="${73 - dx}" cy="${y - 4}" r="2.6" fill="#fff"/><circle cx="${73 + dx}" cy="${y - 4}" r="2.6" fill="#fff"/>`;
const cheeks = (y = 96, dx = 34, c = '#ff9db0') =>
  `<ellipse cx="${75 - dx}" cy="${y}" rx="9" ry="6" fill="${c}" opacity="0.7"/><ellipse cx="${75 + dx}" cy="${y}" rx="9" ry="6" fill="${c}" opacity="0.7"/>`;
const smile = (y = 100) => `<path d="M 66 ${y} Q 70 ${y + 6} 75 ${y} Q 80 ${y + 6} 84 ${y}" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>`;
const shade = (cx = 75, cy = 84, rx = 52, ry = 48) =>
  `<ellipse cx="${cx}" cy="${cy + 6}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.12"/>`;
const face = (fill, rx = 52, ry = 48, cy = 84) =>
  `${shade(75, cy, rx, ry)}<ellipse cx="75" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${OUT}" stroke-width="5"/>
   <ellipse cx="56" cy="${cy - ry * 0.55}" rx="${rx * 0.36}" ry="${ry * 0.16}" fill="#fff" opacity="0.35"/>`;

export const AVATARS = {
  bunny: svg(`
    <path d="M 48 50 C 36 10 50 2 58 8 C 66 14 66 34 64 46 Z" fill="#f4f4f8" stroke="${OUT}" stroke-width="5"/>
    <path d="M 102 50 C 114 10 100 2 92 8 C 84 14 84 34 86 46 Z" fill="#f4f4f8" stroke="${OUT}" stroke-width="5"/>
    <path d="M 53 40 C 48 20 54 14 58 18 C 61 22 60 32 59 40 Z" fill="#ffb7c8"/>
    <path d="M 97 40 C 102 20 96 14 92 18 C 89 22 90 32 91 40 Z" fill="#ffb7c8"/>
    ${face('#f9f9fc')}${eyes()}${cheeks()}
    <ellipse cx="75" cy="92" rx="6" ry="4.5" fill="#ff8fa8"/>${smile(99)}`),
  fox: svg(`
    <path d="M 30 62 L 34 14 L 66 44 Z" fill="#ff9442" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 120 62 L 116 14 L 84 44 Z" fill="#ff9442" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 38 50 L 40 28 L 56 44 Z" fill="#5a3518" opacity="0.7"/><path d="M 112 50 L 110 28 L 94 44 Z" fill="#5a3518" opacity="0.7"/>
    ${face('#ff9442')}
    <path d="M 28 88 Q 75 70 122 88 Q 112 128 75 132 Q 38 128 28 88 Z" fill="#fff6ea"/>
    ${eyes(76)}<ellipse cx="75" cy="96" rx="8" ry="6" fill="#2a1d14"/>${smile(104)}`),
  bear: svg(`
    <circle cx="36" cy="44" r="20" fill="#b07a4f" stroke="${OUT}" stroke-width="5"/><circle cx="114" cy="44" r="20" fill="#b07a4f" stroke="${OUT}" stroke-width="5"/>
    <circle cx="36" cy="44" r="9" fill="#e2b48a"/><circle cx="114" cy="44" r="9" fill="#e2b48a"/>
    ${face('#b07a4f')}
    <ellipse cx="75" cy="102" rx="26" ry="20" fill="#e8c39d"/>
    ${eyes(76, 22)}<ellipse cx="75" cy="94" rx="9" ry="6.5" fill="#2a1d14"/>${smile(103)}${cheeks(98, 40)}`),
  cat: svg(`
    <path d="M 28 66 L 34 18 L 66 42 Z" fill="#9aa3b5" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 122 66 L 116 18 L 84 42 Z" fill="#9aa3b5" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 37 52 L 40 30 L 55 42 Z" fill="#ffb7c8"/><path d="M 113 52 L 110 30 L 95 42 Z" fill="#ffb7c8"/>
    ${face('#a9b1c2')}
    <path d="M 75 40 L 75 56 M 62 42 L 66 56 M 88 42 L 84 56" stroke="#7d8597" stroke-width="5" stroke-linecap="round"/>
    ${eyes(80)}${cheeks()}<path d="M 70 92 L 80 92 L 75 98 Z" fill="#ff8fa8"/>${smile(100)}
    <path d="M 22 92 L 48 96 M 22 104 L 48 102 M 128 92 L 102 96 M 128 104 L 102 102" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`),
  frog: svg(`
    <circle cx="46" cy="44" r="22" fill="#7fd36b" stroke="${OUT}" stroke-width="5"/><circle cx="104" cy="44" r="22" fill="#7fd36b" stroke="${OUT}" stroke-width="5"/>
    ${face('#7fd36b', 56, 42, 90)}
    <circle cx="46" cy="44" r="12" fill="#fff"/><circle cx="104" cy="44" r="12" fill="#fff"/>
    <circle cx="48" cy="46" r="7" fill="#2a1d14"/><circle cx="102" cy="46" r="7" fill="#2a1d14"/>
    <circle cx="46" cy="43" r="2.4" fill="#fff"/><circle cx="100" cy="43" r="2.4" fill="#fff"/>
    <path d="M 44 98 Q 75 122 106 98" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
    ${cheeks(100, 44)}<circle cx="68" cy="82" r="2.5" fill="${OUT}"/><circle cx="82" cy="82" r="2.5" fill="${OUT}"/>`),
  panda: svg(`
    <circle cx="36" cy="42" r="19" fill="#2f2f38" stroke="${OUT}" stroke-width="5"/><circle cx="114" cy="42" r="19" fill="#2f2f38" stroke="${OUT}" stroke-width="5"/>
    ${face('#fbfbfd')}
    <ellipse cx="54" cy="80" rx="15" ry="18" fill="#2f2f38" transform="rotate(-24 54 80)"/>
    <ellipse cx="96" cy="80" rx="15" ry="18" fill="#2f2f38" transform="rotate(24 96 80)"/>
    <circle cx="56" cy="78" r="6" fill="#fff"/><circle cx="94" cy="78" r="6" fill="#fff"/>
    <circle cx="57" cy="79" r="3.4" fill="#2a1d14"/><circle cx="93" cy="79" r="3.4" fill="#2a1d14"/>
    <ellipse cx="75" cy="98" rx="8" ry="5.5" fill="#2a1d14"/>${smile(105)}${cheeks(102, 40)}`),
  mouse: svg(`
    <circle cx="32" cy="48" r="28" fill="#c9c3cf" stroke="${OUT}" stroke-width="5"/><circle cx="118" cy="48" r="28" fill="#c9c3cf" stroke="${OUT}" stroke-width="5"/>
    <circle cx="32" cy="48" r="16" fill="#ffc0cf"/><circle cx="118" cy="48" r="16" fill="#ffc0cf"/>
    ${face('#d6d1db', 48, 46, 88)}
    ${eyes(82, 18)}${cheeks(100, 30)}<circle cx="75" cy="98" r="6" fill="#ff8fa8"/>${smile(104)}
    <path d="M 30 96 L 54 100 M 30 108 L 54 106 M 120 96 L 96 100 M 120 108 L 96 106" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`),
  chick: svg(`
    <path d="M 70 34 Q 62 12 74 18 Q 78 6 84 20 Q 92 14 86 34 Z" fill="#ffd23f" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    ${face('#ffd84f', 52, 50, 86)}
    ${eyes(78, 20)}${cheeks(96, 36, '#ff9f6e')}
    <path d="M 62 92 L 88 92 L 75 108 Z" fill="#ff9b2f" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 64 92 L 86 92" stroke="${OUT}" stroke-width="3"/>`),
};

export const AVATAR_NAMES = {
  bunny: 'Bunny', fox: 'Fox', bear: 'Bear', cat: 'Kitty', frog: 'Froggy', panda: 'Panda', mouse: 'Mouse', chick: 'Chick',
};
export const AVATAR_KEYS = Object.keys(AVATARS);
export const AVATAR_SIZE = S;
