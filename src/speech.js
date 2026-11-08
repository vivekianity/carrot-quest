// Read-aloud with the browser's speechSynthesis, using the most natural *on-device* voice available
// (see src/engine/voices.js). On iPad the best results come from a downloaded "Enhanced" or "Premium"
// voice (Settings → Accessibility → Spoken Content → Voices → English) — the game picks it up by itself.
// iOS only lets speech start after a user gesture, so unlockSpeech() runs on the first tap.
//
// Silent-voice safety net: some voices are listed by the browser but never make a sound (on iPad, Siri
// voices appear in the list but can't be used by web pages). If a line hasn't started within
// SILENT_MS, that voice is marked bad for this session, the next best voice is chosen (finally the
// browser's default), and the line is said again.
import { settings, load } from './save.js';
import { pickVoice, voiceStyle, speakable } from './engine/voices.js';

const partsOf = (text) => [speakable(text)].filter(Boolean);

const SILENT_MS = 2500;      // generous: a high-quality voice can take a moment to load the first time
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voice = null;
let unlocked = false;
const badVoices = new Set();   // names of voices that stayed silent ('' = the browser default)
let voiceWorks = false;        // set once the current voice has been heard; no more checks after that
let gaveUp = false;            // even the browser default stayed silent: stop retrying
let cancels = 0;               // bumps on every cancel, so a watchdog knows its line was interrupted
const live = new Set();        // keep utterances referenced until they finish (iOS can drop unreferenced ones)

function choose() {
  if (!synth) return;
  try {
    const usable = synth.getVoices().filter((v) => !badVoices.has(v.name));
    const next = pickVoice(usable, load('voice', null));
    if ((next && next.name) !== (voice && voice.name)) voiceWorks = false;
    voice = next;
  } catch (e) { voice = null; }
}
if (synth) {
  choose();
  if (synth.addEventListener) synth.addEventListener('voiceschanged', choose);
  else synth.onvoiceschanged = choose;
}

export const speechAvailable = !!synth;
export function currentVoiceName() { return voice ? voice.name : '(browser default)'; }

export function unlockSpeech() {
  if (!synth || unlocked) return;
  unlocked = true;
  if (!voice) choose();
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  } catch (e) { /* optional */ }
}

let lastCancel = -1e9;
function cancel() {
  cancels++;
  if (synth.speaking || synth.pending) lastCancel = Date.now();
  synth.cancel();
}

// iPad Safari drops a line that is spoken in the same moment as a cancel(), so after stopping
// something we wait a tenth of a second before speaking again.
const AFTER_CANCEL_MS = 120;
let holdUntil = 0;              // when the line waiting after a cancel will be handed to the voice

/** Queue the pieces of one line with the current voice; `onStart` fires when any of it is heard. */
function sayParts(parts, mood, onEnd, onStart) {
  const style = voiceStyle(mood, voice);
  parts.forEach((words, i) => {
    const u = new SpeechSynthesisUtterance(words);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else if (!badVoices.has('')) u.lang = 'en-GB';
    u.rate = style.rate;
    u.pitch = style.pitch;
    live.add(u);
    u.onstart = onStart;
    u.onend = () => { live.delete(u); if (onEnd && i === parts.length - 1) onEnd(); };
    u.onerror = () => { live.delete(u); };
    synth.speak(u);
  });
}

/**
 * Speak `text`. `mood`: 'question' (unhurried), 'cheer' (bright), 'count' or 'calm'.
 * `queue: true` adds to what is already being said instead of interrupting.
 */
export function speak(text, { queue = false, mood = 'calm', onEnd } = {}) {
  if (!synth || !settings.speech) { if (onEnd) onEnd(); return; }
  try {
    if (!voice) choose();
    const parts = partsOf(text);
    if (!parts.length) { if (onEnd) onEnd(); return; }
    if (!queue) cancel();
    let started = false;
    const onStart = () => { started = true; voiceWorks = true; };
    // A fresh line waits out the pause after a cancel; a queued line waits until that line has gone in.
    const now = Date.now();
    const wait = queue ? holdUntil - now : AFTER_CANCEL_MS - (now - lastCancel);
    const mine = cancels;
    if (wait > 0) {
      if (!queue) holdUntil = now + wait;
      setTimeout(() => { if (mine === cancels) sayParts(parts, mood, onEnd, onStart); }, wait + (queue ? 1 : 0));
    } else {
      sayParts(parts, mood, onEnd, onStart);
    }
    // Watch the first line said with an untested voice (queued lines wait behind others, so skip those).
    // Before the first tap nothing can be heard anyway (iOS rule), so don't blame the voice.
    if (voiceWorks || gaveUp || queue || !unlocked) return;
    const mark = cancels;
    setTimeout(() => {
      if (started || voiceWorks || mark !== cancels) return;
      badVoices.add(voice ? voice.name : '');
      if (!voice && badVoices.has('')) {
        // The browser default (with and without a language) is silent too: give up quietly.
        if (badVoices.has('nolang')) { gaveUp = true; return; }
        badVoices.add('nolang');
      }
      choose();
      cancel();
      speak(text, { mood, onEnd });
    }, SILENT_MS + Math.max(0, wait));
  } catch (e) { if (onEnd) onEnd(); }
}

export function stopSpeech() {
  try { if (synth) cancel(); } catch (e) { /* ignore */ }
}
