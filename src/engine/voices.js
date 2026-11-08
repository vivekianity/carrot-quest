// Choosing a warm, natural-sounding reading voice, and tidying text so it reads like a person talks.
// Pure (no DOM): works on plain { name, lang, localService, default } objects, so it can be tested.
//
// Rules:
//  - Only on-device voices (localService). Online voices send the words to a server, and the game
//    promises no network use. If the device has none, the browser's default is used.
//  - Never the novelty voices (Bubbles, Zarvox, Whisper…) or the old robotic ones (Fred, Ralph…).
//  - Prefer "Premium" / "Enhanced" / "Natural" voices (much more human), then gentle, friendly voices.

const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Princess|Deranged|Hysterical|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley)\b/i;
// Friendly, clear voices on Apple devices, Windows and Android (all on-device).
const FRIENDLY = ['Ava', 'Zoe', 'Samantha', 'Allison', 'Susan', 'Serena', 'Kate', 'Stephanie', 'Martha', 'Karen',
  'Moira', 'Tessa', 'Fiona', 'Nicky', 'Catherine', 'Siri', 'Libby', 'Sonia', 'Maisie', 'Aria', 'Jenny', 'Emma', 'Hazel', 'Zira'];
const QUALITY = [[/premium/i, 70], [/enhanced/i, 55], [/natural|neural/i, 55], [/siri/i, 45], [/compact/i, -15]];
const LANG = { 'en-GB': 8, 'en-US': 8, 'en-AU': 6, 'en-IE': 6, 'en-NZ': 6, 'en-ZA': 5, 'en-CA': 5, 'en-IN': 4 };

export function isNatural(voice) {
  return !!voice && /premium|enhanced|natural|neural|siri/i.test(voice.name);
}

export function scoreVoice(v) {
  const lang = String(v.lang || '').replace('_', '-');
  if (!/^en(-|$)/i.test(lang)) return -Infinity;
  if (NOVELTY.test(v.name)) return -Infinity;
  if (v.localService === false) return -Infinity;
  let s = LANG[lang] ?? 2;
  for (const [re, pts] of QUALITY) if (re.test(v.name)) s += pts;
  const first = v.name.split(/[\s(]/)[0];
  const fi = FRIENDLY.indexOf(first);
  if (fi >= 0) s += 30 - fi * 0.5;                  // earlier in the list = a little warmer
  if (v.default) s += 1;
  return s;
}

/** The best voice, or null. `preferred` (a saved voice name) wins if it is still installed and allowed. */
export function pickVoice(voices, preferred = null) {
  const ok = voices.filter((v) => scoreVoice(v) > -Infinity);
  if (preferred) {
    const p = ok.find((v) => v.name === preferred);
    if (p) return p;
  }
  let best = null, bestScore = -Infinity;
  for (const v of ok) { const sc = scoreVoice(v); if (sc > bestScore) { best = v; bestScore = sc; } }
  return best;
}

// How Hoppy's friend talks in different moments. Natural voices get only a small pitch lift —
// big pitch shifts are what make synthetic speech sound like a robot or a chipmunk.
export const MOODS = {
  question: { rate: 0.9, pitch: 1.08 },
  cheer: { rate: 1.0, pitch: 1.16 },
  count: { rate: 0.98, pitch: 1.08 },
  calm: { rate: 0.92, pitch: 1.06 },
};

export function voiceStyle(mood = 'calm', voice = null) {
  const m = MOODS[mood] || MOODS.calm;
  const soften = isNatural(voice) ? 0.5 : 1;
  return { rate: m.rate, pitch: Math.round((1 + (m.pitch - 1) * soften) * 100) / 100 };
}

/** Make text read naturally: maths symbols become words, emoji and decorations are dropped. */
export function speakable(text) {
  return String(text)
    .replace(/(\d)\s*×\s*(\d|\?)/g, '$1 times $2')
    .replace(/×/g, ' times ')
    .replace(/\s=\s/g, ' equals ')
    .replace(/[·•]/g, ', ')
    .replace(/[’‘]/g, "'")
    .replace(/\p{Extended_Pictographic}|️|‍/gu, '')
    .replace(/\s+([!?.,])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
