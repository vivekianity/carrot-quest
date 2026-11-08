import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SONGS, parseTrack } from '../src/audio.js';
import { WORLDS } from '../src/engine/levels-config.js';

test('every world has a music loop', () => {
  for (const w of Object.keys(WORLDS)) assert.ok(SONGS[w], w);
});

for (const [world, song] of Object.entries(SONGS)) {
  test(`${world} music: melody and bass are the same length and every note is valid`, () => {
    const lead = parseTrack(song.melody);
    const bass = parseTrack(song.bass, 2);
    const len = (t) => t.reduce((s, n) => s + n.len, 0);
    assert.equal(len(lead), len(bass));
    assert.equal(len(lead) % 8, 0, 'whole bars');
    for (const tok of `${song.melody} ${song.bass}`.split(/\s+/)) {
      if (tok !== '-' && tok !== '.') assert.ok(parseTrack(tok)[0].f > 50, `bad note ${tok}`);
    }
  });
}
