// Small helpers shared by the menu scenes (Title, Profiles, World Map, Level Complete).
import { sfx, audioSettings, unlockAudio } from './audio.js';
import { speak, stopSpeech, unlockSpeech } from './speech.js';
import { settings } from './save.js';
import { parseLevel, tileData, TILE } from './engine/level-map.js';

export const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif';
export const INK = '#5a3518';

export const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** First tap anywhere unlocks Web Audio and speech (an iOS rule). */
export function unlockOnTap(scene) {
  scene.input.on('pointerdown', () => { unlockAudio(); unlockSpeech(); });
}

/** Letterbox colours around the 16:9 canvas. */
export function setLetterbox(sky, ground = sky) {
  document.documentElement.style.setProperty('--sky', sky);
  document.documentElement.style.setProperty('--ground', ground);
}

export function text(scene, x, y, str, size = 40, opts = {}) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color: INK, align: 'center', ...opts,
  }).setOrigin(0.5);
}

/** Big friendly title text: white with a thick brown outline. */
export function titleText(scene, x, y, str, size = 64) {
  return text(scene, x, y, str, size, { color: '#ffffff', stroke: INK, strokeThickness: Math.round(size / 6) })
    .setShadow(0, 6, 'rgba(0,0,0,0.18)', 0, false, true);
}

/** Make an image (and optional label) a tappable button with a squish. */
export function tappable(scene, target, onTap, { label = null, sound = true } = {}) {
  target.setInteractive({ useHandCursor: true });
  const parts = label ? [target, label] : [target];
  target.on('pointerdown', () => {
    const sx = target.scaleX, sy = target.scaleY;
    scene.tweens.killTweensOf(parts);
    scene.tweens.add({ targets: target, scaleX: sx * 0.9, scaleY: sy * 0.9, duration: 80, yoyo: true, onComplete: () => target.setScale(sx, sy) });
    if (label) {
      const l = label.scale;
      scene.tweens.add({ targets: label, scale: l * 0.9, duration: 80, yoyo: true, onComplete: () => label.setScale(l) });
    }
    if (sound) sfx.bump();
    scene.time.delayedCall(140, onTap);
  });
  return target;
}

/** A pill or big button with a label on it. */
export function button(scene, x, y, str, onTap, { tex = 'pill', scale = 1, size = 38, color = INK } = {}) {
  const bg = scene.add.image(x, y, tex).setScale(scale);
  const label = text(scene, x, y - 4, str, size, { color });
  tappable(scene, bg, onTap, { label });
  return { bg, label };
}

/** Music, sound-effects and speech toggles (96 px), shared settings. */
export function soundToggles(scene, x, y, gap = 106) {
  const make = (bx, name, apply) => {
    const key = name.toLowerCase();
    const tex = () => `btn${name}${settings[key] ? 'On' : 'Off'}`;
    const btn = scene.add.image(bx, y, tex());
    tappable(scene, btn, () => {
      settings[key] = !settings[key];
      apply(settings[key]);
      btn.setTexture(tex());
    });
    return btn;
  };
  return [
    make(x, 'Music', (on) => { audioSettings.music = on; }),
    make(x + gap, 'Sound', (on) => { audioSettings.sound = on; if (on) sfx.plink(4); }),
    make(x + gap * 2, 'Speech', (on) => { if (on) speak('Hello! I will read to you.', { mood: 'cheer' }); else stopSpeech(); }),
  ];
}

/** Parallax-style meadow backdrop (static) with drifting clouds; returns the cloud layer to scroll. */
export function meadowBackdrop(scene, world = 'meadow') {
  scene.add.image(0, 0, `bg-${world}-sky`).setOrigin(0);
  const clouds = scene.add.tileSprite(0, 0, 1280, scene.textures.get(`bg-${world}-clouds`).getSourceImage().height, `bg-${world}-clouds`).setOrigin(0);
  for (const name of ['far', 'mid', 'near']) scene.add.image(0, -40, `bg-${world}-${name}`).setOrigin(0);
  return clouds;
}

/** A strip of real ground tiles along the bottom of the screen; returns the grass line y. */
export function groundStrip(scene, world = 'meadow', rows = 2) {
  const cols = 21;
  const lines = [];
  for (let r = 0; r < rows + 1; r++) lines.push(r === 0 ? '.'.repeat(cols) : '#'.repeat(cols));
  const lvl = parseLevel(lines.join('\n'));
  const map = scene.make.tilemap({ data: tileData(lvl), tileWidth: TILE, tileHeight: TILE });
  const key = `tiles-${world}`;
  const ts = map.addTilesetImage(key, key, TILE, TILE, 1, 2);
  const top = 720 - rows * TILE;
  map.createLayer(0, ts, 0, top - TILE);
  return top;
}
