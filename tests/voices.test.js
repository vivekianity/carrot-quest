import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice, scoreVoice, voiceStyle, speakable, isNatural } from '../src/engine/voices.js';

const V = (name, lang = 'en-US', localService = true, extra = {}) => ({ name, lang, localService, ...extra });

test('prefers Premium / Enhanced on-device voices over the basic ones', () => {
  const voices = [V('Samantha'), V('Fred'), V('Ava (Premium)'), V('Daniel', 'en-GB'), V('Zoe (Enhanced)')];
  assert.equal(pickVoice(voices).name, 'Ava (Premium)');
  assert.equal(pickVoice(voices.filter((v) => !/Premium/.test(v.name))).name, 'Zoe (Enhanced)');
});

test('a friendly basic voice beats an unknown one', () => {
  assert.equal(pickVoice([V('Rishi', 'en-IN'), V('Samantha')]).name, 'Samantha');
});

test('never novelty or robotic voices, never online voices, only English', () => {
  for (const n of ['Bubbles', 'Zarvox', 'Whisper', 'Fred', 'Ralph', 'Bad News', 'Superstar']) assert.equal(scoreVoice(V(n)), -Infinity, n);
  assert.equal(scoreVoice(V('Google UK English Female', 'en-GB', false)), -Infinity, 'online voice sends words to a server');
  assert.equal(scoreVoice(V('Microsoft Aria Online (Natural)', 'en-US', false)), -Infinity);
  assert.equal(scoreVoice(V('Amélie', 'fr-CA')), -Infinity);
  assert.equal(pickVoice([V('Bubbles'), V('Google US English', 'en-US', false)]), null);
});

test('a saved favourite voice wins when still installed (and allowed)', () => {
  const voices = [V('Ava (Premium)'), V('Karen', 'en-AU')];
  assert.equal(pickVoice(voices, 'Karen').name, 'Karen');
  assert.equal(pickVoice(voices, 'Gone').name, 'Ava (Premium)');
  assert.equal(pickVoice([...voices, V('Zarvox')], 'Zarvox').name, 'Ava (Premium)');
});

test('moods: questions unhurried, cheers brighter; natural voices get a gentler pitch lift', () => {
  const q = voiceStyle('question'), c = voiceStyle('cheer');
  assert.ok(q.rate < c.rate);
  assert.ok(c.pitch > q.pitch);
  assert.ok(c.pitch <= 1.2, 'no chipmunk voices');
  const nat = V('Ava (Premium)');
  assert.ok(isNatural(nat));
  assert.ok(voiceStyle('cheer', nat).pitch < c.pitch);
  assert.ok(voiceStyle('cheer', nat).pitch > 1);
});

test('text is tidied so it reads like a person talks', () => {
  assert.equal(speakable('3 × 4'), '3 times 4');
  assert.equal(speakable('🌟 You know 6 × 7!'), 'You know 6 times 7!');
  assert.equal(speakable('Endless Meadow · Round 2'), 'Endless Meadow, Round 2');
  assert.equal(speakable('Wow, you’re a star! 🥕'), "Wow, you're a star!");
  assert.equal(speakable('🗺'), '');
});
