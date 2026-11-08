// Synthesised sound effects (Web Audio). iOS only allows audio after a user gesture,
// so call unlockAudio() from the first tap/key press.

let ctx = null;
let master = null;     // everything → gentle compressor → speakers
let sfxBus = null;     // sound effects (dry) …
let echo = null;       // … plus a soft room echo shared with the music
let musicGain = null;
export const audioSettings = { sound: true, music: true };

/** A short, soft "room" made from decaying noise — makes the synth sounds warm instead of dry. */
function makeRoom(seconds = 1.3) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  const conv = ctx.createConvolver();
  conv.buffer = ir;
  return conv;
}

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3.5;
      comp.attack.value = 0.004; comp.release.value = 0.2;
      comp.connect(ctx.destination);
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(comp);
      const room = makeRoom();
      echo = ctx.createGain();
      echo.gain.value = 0.22;
      echo.connect(room); room.connect(master);
      sfxBus = ctx.createGain();
      sfxBus.connect(master); sfxBus.connect(echo);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(master);
      const musicEcho = ctx.createGain();
      musicEcho.gain.value = 0.5;
      musicGain.connect(musicEcho); musicEcho.connect(echo);
    }
    if (ctx.state === 'suspended') ctx.resume();
    // Play one silent sample inside the gesture — needed on older iOS.
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.connect(ctx.destination); src.start(0);
  } catch (e) { /* audio is optional */ }
}

const ready = () => ctx && ctx.state === 'running' && audioSettings.sound;

/**
 * One synth note. `wobble` adds a springy vibrato that fades out (the "boing"); `cutoff` softens
 * bright waves; `detune` (cents) thickens a note.
 */
function tone({ type = 'sine', from, to = from, dur, vol = 0.3, delay = 0, wobble = null, cutoff = 0, detune = 0, attack = 0.012 }) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.detune.value = detune;
  o.frequency.setValueAtTime(from, t);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.7;
    o.connect(f); node = f;
  }
  node.connect(g); g.connect(sfxBus);
  if (wobble) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = wobble.rate;
    lg.gain.setValueAtTime(wobble.depth, t);
    lg.gain.exponentialRampToValueAtTime(1, t + dur);
    lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(t); lfo.stop(t + dur + 0.02);
  }
  o.start(t); o.stop(t + dur + 0.02);
}

let noiseBuf = null;
function noise({ dur, vol = 0.2, freq = 600, delay = 0, type = 'lowpass', q = 0.8, attack = 0.004 }) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(sfxBus);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}

const rnd = (a, b) => a + Math.random() * (b - a);
const ST = (semis, base = 523.25) => base * Math.pow(2, semis / 12);   // semitones above C5

export const sfx = {
  jump() {
    // A soft, springy "boing"
    if (!ready()) return;
    tone({ from: 300, to: 640, dur: 0.2, vol: 0.2, wobble: { rate: 30, depth: 46 } });
    tone({ type: 'triangle', from: 620, to: 1260, dur: 0.09, vol: 0.05 });
  },
  doubleJump() {
    if (!ready()) return;
    tone({ from: 480, to: 980, dur: 0.16, vol: 0.16, wobble: { rate: 34, depth: 60 } });
    [0, 4, 7].forEach((st, i) => tone({ type: 'triangle', from: ST(st + 12), dur: 0.12, vol: 0.06, delay: 0.05 + i * 0.04 }));
  },
  land(strength = 0.5) { if (ready()) noise({ dur: 0.08, vol: 0.12 + 0.2 * strength, freq: 380 }); },
  balloon() {
    if (!ready()) return;
    [0, 0.12, 0.24].forEach((d, i) => tone({ type: 'triangle', from: 500 + i * 120, to: 760 + i * 160, dur: 0.18, vol: 0.14, delay: d }));
  },
  plink(step = 0) {
    // Carrot pickup: a little bell; a streak climbs the pentatonic scale.
    if (!ready()) return;
    const scale = [0, 2, 4, 7, 9];
    const n = Math.min(step, 14);
    const f = 880 * Math.pow(2, (12 * Math.floor(n / 5) + scale[n % 5]) / 12);
    tone({ type: 'sine', from: f, dur: 0.35, vol: 0.16, attack: 0.004 });
    tone({ type: 'sine', from: f * 2.76, dur: 0.12, vol: 0.035, attack: 0.002 });   // bell shimmer
    tone({ type: 'triangle', from: f * 2, dur: 0.08, vol: 0.04 });
  },
  bump() { if (ready()) { tone({ type: 'square', from: 220, to: 160, dur: 0.07, vol: 0.06 }); tone({ from: 330, to: 520, dur: 0.1, vol: 0.12, delay: 0.03 }); } },
  crumble() {
    // Stone Gate: a deep thud, a rumble, then pebbles pattering down.
    if (!ready()) return;
    tone({ from: 120, to: 42, dur: 0.45, vol: 0.4, attack: 0.005 });
    noise({ dur: 0.8, vol: 0.32, freq: 320, attack: 0.02 });
    noise({ dur: 0.35, vol: 0.18, freq: 900, type: 'bandpass', q: 1.2, delay: 0.04 });
    for (let i = 0; i < 12; i++) {
      noise({ dur: rnd(0.03, 0.06), vol: rnd(0.06, 0.14), freq: rnd(1400, 3600), type: 'bandpass', q: 6, delay: 0.12 + i * rnd(0.04, 0.07) });
    }
  },
  signUp() { if (ready()) tone({ type: 'sine', from: 260, to: 520, dur: 0.3, vol: 0.12 }); },
  signDown() { if (ready()) tone({ type: 'sine', from: 520, to: 260, dur: 0.25, vol: 0.1 }); },
  correct() {
    // Right answer: a bright little arpeggio with a sparkle on top.
    if (!ready()) return;
    [0, 4, 7, 12].forEach((st, i) => tone({ type: 'triangle', from: ST(st), dur: 0.26, vol: 0.15, delay: i * 0.075 }));
    tone({ type: 'sine', from: ST(24), dur: 0.4, vol: 0.05, delay: 0.3 });
  },
  // Happy dance: a quick skippy jingle.
  dance() {
    if (!ready()) return;
    [7, 4, 7, 12].forEach((st, i) => tone({ type: 'triangle', from: ST(st), dur: 0.12, vol: 0.09, delay: i * 0.12 }));
    [0, 0.24].forEach((d) => noise({ dur: 0.05, vol: 0.06, freq: 6000, type: 'highpass', delay: d + 0.06 }));
  },
  // Not quite: a soft, friendly "hmm" (never a buzzer).
  tryAgain() {
    if (!ready()) return;
    tone({ type: 'sine', from: 392, to: 370, dur: 0.18, vol: 0.12 });
    tone({ type: 'sine', from: 330, to: 349, dur: 0.22, vol: 0.12, delay: 0.16 });
  },
  count(step = 0) { if (ready()) { const f = 523 * Math.pow(2, Math.min(step, 12) / 12); tone({ type: 'triangle', from: f, to: f, dur: 0.12, vol: 0.12 }); } },
  munch() {
    // Crunchy carrot bite: three crisp crackles and a happy "nom".
    if (!ready()) return;
    [0, 0.05, 0.11].forEach((d) => noise({ dur: rnd(0.04, 0.07), vol: rnd(0.2, 0.3), freq: rnd(2200, 3800), type: 'bandpass', q: 3, delay: d }));
    tone({ from: 260, to: 200, dur: 0.12, vol: 0.08, delay: 0.02 });
  },
  fanfare() {
    // Golden Carrot: a little brass fanfare over a timpani roll, ending on a sparkly chord.
    if (!ready()) return;
    noise({ dur: 0.7, vol: 0.18, freq: 180, attack: 0.5 });
    const brass = (st, d, len) => {
      tone({ type: 'sawtooth', from: ST(st), dur: len, vol: 0.09, delay: d, cutoff: 2400, detune: -7, attack: 0.03 });
      tone({ type: 'sawtooth', from: ST(st), dur: len, vol: 0.09, delay: d, cutoff: 2400, detune: 7, attack: 0.03 });
    };
    [[-5, 0.0, 0.16], [0, 0.16, 0.16], [4, 0.32, 0.16], [7, 0.48, 0.3], [4, 0.82, 0.14], [7, 0.98, 0.9]].forEach(([st, d, len]) => brass(st, d, len));
    [0, 4, 7, 12].forEach((st) => tone({ type: 'triangle', from: ST(st), dur: 1.2, vol: 0.06, delay: 0.98 }));
    [12, 16, 19, 24, 28].forEach((st, i) => tone({ type: 'sine', from: ST(st), dur: 0.25, vol: 0.05, delay: 1.1 + i * 0.06 }));
  },
  star(i = 0) { if (ready()) { const f = 784 * Math.pow(2, (i * 4) / 12); tone({ type: 'triangle', from: f, to: f * 1.5, dur: 0.25, vol: 0.18 }); tone({ from: f * 2, to: f * 2, dur: 0.3, vol: 0.06, delay: 0.05 }); } },
  starCarrot() { if (ready()) [0, 4, 7, 12, 16].forEach((s, i) => { const f = 880 * Math.pow(2, s / 12); tone({ type: 'triangle', from: f, to: f, dur: 0.2, vol: 0.15, delay: i * 0.07 }); }); },
  splash() { if (ready()) { noise({ dur: 0.35, vol: 0.3, freq: 900 }); tone({ from: 600, to: 200, dur: 0.2, vol: 0.08 }); } },
  thunk(i = 0) { if (ready()) tone({ type: 'triangle', from: 300 + i * 30, to: 180 + i * 20, dur: 0.08, vol: 0.18 }); },
  chomp() { if (ready()) noise({ dur: 0.06, vol: 0.22, freq: 2500 }); },
  grow() { if (ready()) { tone({ type: 'sine', from: 200, to: 900, dur: 1.2, vol: 0.12 }); tone({ type: 'triangle', from: 300, to: 1200, dur: 1.2, vol: 0.06, delay: 0.1 }); } },
  boing() {
    // Bouncy mushroom: a big rubbery spring.
    if (!ready()) return;
    tone({ from: 160, to: 820, dur: 0.5, vol: 0.26, wobble: { rate: 22, depth: 110 } });
    tone({ type: 'triangle', from: 320, to: 1200, dur: 0.3, vol: 0.07, delay: 0.03 });
  },
  checkpoint() { if (ready()) [0, 7, 12].forEach((s, i) => { const f = 659 * Math.pow(2, s / 12); tone({ type: 'triangle', from: f, to: f, dur: 0.18, vol: 0.15, delay: i * 0.09 }); }); },
  caw() { if (ready()) { tone({ type: 'sawtooth', from: 520, to: 380, dur: 0.16, vol: 0.06 }); tone({ type: 'sawtooth', from: 500, to: 360, dur: 0.18, vol: 0.06, delay: 0.22 }); } },
  yawn() { if (ready()) { tone({ type: 'sine', from: 420, to: 640, dur: 0.35, vol: 0.12 }); tone({ type: 'sine', from: 640, to: 260, dur: 0.6, vol: 0.12, delay: 0.35 }); } },
  snore() { if (ready()) { noise({ dur: 0.7, vol: 0.12, freq: 260 }); tone({ type: 'sine', from: 110, to: 90, dur: 0.7, vol: 0.06 }); } },
  creak() { if (ready()) tone({ type: 'sawtooth', from: 140, to: 220, dur: 0.4, vol: 0.05 }); },
  pop() { if (ready()) { noise({ dur: 0.05, vol: 0.25, freq: 2400 }); tone({ from: 900, to: 300, dur: 0.08, vol: 0.1 }); } },
  // Boss voices
  hoot() { if (ready()) { tone({ from: 420, to: 380, dur: 0.22, vol: 0.14 }); tone({ from: 440, to: 360, dur: 0.32, vol: 0.14, delay: 0.3 }); } },
  snip() { if (ready()) [0, 0.14].forEach((d) => { noise({ dur: 0.04, vol: 0.25, freq: 3500, delay: d }); tone({ type: 'square', from: 900, to: 700, dur: 0.04, vol: 0.05, delay: d }); }); },
  squawk() { if (ready()) { tone({ type: 'sawtooth', from: 700, to: 500, dur: 0.12, vol: 0.05 }); tone({ type: 'sawtooth', from: 760, to: 520, dur: 0.14, vol: 0.05, delay: 0.16 }); } },
  chitter() { if (ready()) [0, 0.07, 0.14, 0.21].forEach((d, i) => tone({ type: 'triangle', from: 900 + i * 60, to: 1200, dur: 0.05, vol: 0.09, delay: d })); },
  // Platform elements
  swim() { if (ready()) { tone({ from: 260, to: 420, dur: 0.14, vol: 0.1 }); noise({ dur: 0.12, vol: 0.06, freq: 700 }); } },
  bloop() { if (ready()) tone({ from: 300, to: 700, dur: 0.12, vol: 0.08 }); },
  whoosh() { if (ready()) { noise({ dur: 0.45, vol: 0.12, freq: 1600 }); tone({ type: 'triangle', from: 500, to: 1100, dur: 0.4, vol: 0.06 }); } },
  poof() { if (ready()) noise({ dur: 0.2, vol: 0.18, freq: 1100 }); },
  // Burrow shop: a happy "ta-da" with a carrot crunch; sticker book: a soft peel and pat.
  buy() {
    if (!ready()) return;
    noise({ dur: 0.07, vol: 0.18, freq: 2600 });
    [0, 4, 7, 12].forEach((s, i) => { const f = ST(s); tone({ type: 'triangle', from: f, to: f, dur: 0.22, vol: 0.14, delay: 0.08 + i * 0.08, wobble: { rate: 6, depth: 4 } }); });
    tone({ type: 'sine', from: ST(24), to: ST(24), dur: 0.5, vol: 0.05, delay: 0.42 });
  },
  peel() { if (ready()) { noise({ dur: 0.22, vol: 0.08, freq: 3200, type: 'highpass' }); tone({ type: 'sine', from: 700, to: 1100, dur: 0.12, vol: 0.06, delay: 0.18 }); } },
  swish() { if (ready()) noise({ dur: 0.16, vol: 0.1, freq: 1800 }); },
  oof() { if (ready()) { tone({ from: 330, to: 220, dur: 0.16, vol: 0.12 }); noise({ dur: 0.08, vol: 0.12, freq: 900 }); } },
  splashSoft() { if (ready()) noise({ dur: 0.25, vol: 0.12, freq: 1200 }); },
};

// ---- Music: a light, bouncy loop per world (GAME_DESIGN §6) -----------------------------------------
// Each token is an eighth note: a note name ("C5", "F#4", "Bb3"), "-" to hold, "." for a rest.
export const SONGS = {
  meadow: { bpm: 112, lead: 'triangle',
    melody: 'E5 - G5 - A5 G5 E5 - D5 - E5 - C5 - - - E5 - G5 - A5 C6 A5 G5 E5 - D5 - C5 - - -',
    bass: 'C3 G3 A2 E3 F2 C3 G2 G3 C3 G3 A2 E3 F2 G2 C3 C3' },
  mushroom: { bpm: 96, lead: 'sine',
    melody: 'A4 - C5 - E5 - D5 C5 B4 - G4 - A4 - - - C5 - E5 - G5 - E5 D5 C5 - B4 - A4 - - -',
    bass: 'A2 E3 G2 D3 E2 B2 A2 E3 C3 G3 G2 D3 A2 E2 A2 A2' },
  beach: { bpm: 120, lead: 'triangle',
    melody: 'F5 - A5 F5 C6 - A5 - G5 - Bb5 G5 F5 - - - F5 A5 C6 A5 D6 C6 A5 F5 G5 - E5 - F5 - - -',
    bass: 'F2 C3 F2 C3 C3 G2 F2 C3 Bb2 F3 Bb2 F3 C3 C3 F2 F2' },
  snow: { bpm: 100, lead: 'sine',
    melody: 'D5 F#5 A5 - F#5 - D5 - E5 G5 B5 - A5 - - - D6 - B5 A5 G5 - E5 - F#5 - E5 - D5 - - -',
    bass: 'D3 A2 D3 A2 E3 B2 A2 A2 G2 D3 G2 D3 A2 A2 D3 D3' },
  candy: { bpm: 126, lead: 'triangle',
    melody: 'G5 B5 D6 B5 G5 - D5 - E5 G5 C6 - B5 - - - A5 - C6 - B5 G5 E5 - D5 - F#5 - G5 - - -',
    bass: 'G2 D3 G2 D3 C3 G2 C3 G2 A2 E3 D3 D3 D2 D3 G2 G2' },
};
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freq(name) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name);
  if (!m) return null;
  const midi = 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}
/** "C5 - E5 ." → [{ f, len }] in eighth notes (exported for tests). */
export function parseTrack(text, unit = 1) {
  const out = [];
  for (const tok of text.trim().split(/\s+/)) {
    if (tok === '-' && out.length) out[out.length - 1].len += unit;
    else out.push({ f: tok === '.' || tok === '-' ? null : freq(tok), len: unit });
  }
  return out;
}
export const SONG_NAMES = Object.keys(SONGS);

const music = { world: null, timer: null, nextTime: 0, step: 0, events: null, ducked: false };
const MUSIC_VOL = 0.22;

function noteAt(type, f, t, dur, vol) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(vol * 0.6, t + Math.min(0.12, dur * 0.5));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + dur + 0.02);
}

let hatBuf = null;
function hat(t, vol) {
  if (!hatBuf) {
    hatBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
    const d = hatBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  }
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = hatBuf; f.type = 'highpass'; f.frequency.value = 6000; g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(musicGain);
  src.start(t);
}

/** A soft, round kick on the beat so each loop feels bouncy. */
function kick(t, vol) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 0.18);
}

function buildEvents(song) {
  // Flatten melody (eighths) and bass (quarters) into one list of events per eighth-note step.
  const steps = song.melody.trim().split(/\s+/).length;
  const ev = Array.from({ length: steps }, () => []);
  let i = 0;
  for (const n of parseTrack(song.melody)) { if (n.f) ev[i % steps].push({ kind: 'lead', f: n.f, len: n.len }); i += n.len; }
  i = 0;
  for (const n of parseTrack(song.bass, 2)) { if (n.f) ev[i % steps].push({ kind: 'bass', f: n.f, len: n.len }); i += n.len; }
  return ev;
}

function schedule() {
  if (!ctx || ctx.state !== 'running' || !music.world) return;
  const on = audioSettings.music;
  const target = on ? (music.ducked ? MUSIC_VOL * 0.3 : MUSIC_VOL) : 0;
  if (Math.abs(musicGain.gain.value - target) > 0.001) musicGain.gain.setTargetAtTime(target, ctx.currentTime, 0.15);
  if (!on) { music.nextTime = 0; return; }
  const song = SONGS[music.world];
  const eighth = 60 / song.bpm / 2;
  if (!music.events) music.events = buildEvents(song);
  if (music.nextTime < ctx.currentTime) music.nextTime = ctx.currentTime + 0.05;
  while (music.nextTime < ctx.currentTime + 0.25) {
    const t = music.nextTime;
    const k = music.step % music.events.length;
    for (const e of music.events[k]) {
      if (e.kind === 'lead') noteAt(song.lead, e.f, t, e.len * eighth * 0.95, 0.16);
      else noteAt('triangle', e.f, t, e.len * eighth * 0.9, 0.2);
    }
    if (k % 2 === 1) hat(t, 0.05);
    if (k % 4 === 0) kick(t, 0.22);
    music.step++;
    music.nextTime += eighth;
  }
}

/** Start (or switch to) a world's music loop. Safe to call before audio is unlocked. */
export function startMusic(world) {
  if (!SONGS[world]) world = 'meadow';
  if (music.world !== world) { music.world = world; music.events = null; music.step = 0; music.nextTime = 0; }
  if (!music.timer) music.timer = setInterval(schedule, 60);
}

export function stopMusic() {
  music.world = null;
  if (music.timer) { clearInterval(music.timer); music.timer = null; }
  if (ctx && musicGain) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
}

/** Quieter music while a maths sign is open, so the spoken question is easy to hear. */
export function duckMusic(on) { music.ducked = !!on; }
