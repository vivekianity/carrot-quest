// The sticker book (GAME_DESIGN §8). Left page: a sleepy sticker for every boss put to sleep.
// Right page: a rosette for every times table mastered ("×7 Champion"). Stickers not earned yet
// are dotted outlines — tap one to hear how to get it. New stickers peel on with a sparkle.
import { sfx, startMusic, audioSettings } from '../audio.js';
import { speak } from '../speech.js';
import { progress, settings, masteryStore, stickerStore } from '../save.js';
import { createMastery } from '../engine/mastery.js';
import { STICKERS, earnedStickers, unseenStickers } from '../engine/stickers.js';
import { unlockOnTap, setLetterbox, titleText, text, tappable, meadowBackdrop, reduceMotion, INK } from '../menu.js';

/** Which stickers the current child has, and which of those are new. Shared with the World Map badge. */
export function stickerState() {
  const m = createMastery(masteryStore.load());
  const earned = earnedStickers({ isDone: (id) => progress.isDone(id), tableMastered: (t) => m.tableMastered(t) });
  return { earned, fresh: unseenStickers(earned, stickerStore.seen) };
}

const BOSS_AT = [[176, 286], [336, 286], [496, 286], [256, 476], [416, 476]];
const TABLE_AT = (i) => [902 + ((i % 5) - 2) * 104, i < 5 ? 286 : 470];

export class StickersScene extends Phaser.Scene {
  constructor() { super('Stickers'); }

  create() {
    this.reduce = reduceMotion();
    this.leaving = false;
    setLetterbox('#bfe6ff', '#86bb74');
    unlockOnTap(this);
    audioSettings.music = settings.music;
    audioSettings.sound = settings.sound;
    startMusic('meadow');
    meadowBackdrop(this);
    this.add.image(640, 392, 'sticker-book');

    const { earned, fresh } = stickerState();
    this.earned = new Set(earned);
    const newOnes = new Set(fresh);

    text(this, 320, 118, 'Sleepy Friends', 40);
    text(this, 902, 118, 'Times Table Champions', 40);
    const bosses = STICKERS.filter((s) => s.kind === 'boss');
    const tables = STICKERS.filter((s) => s.kind === 'table');
    const nB = bosses.filter((s) => this.earned.has(s.id)).length;
    const nT = tables.filter((s) => this.earned.has(s.id)).length;
    text(this, 320, 616, `${nB} of ${bosses.length}`, 30, { color: '#9a7a52' });
    text(this, 902, 616, `${nT} of ${tables.length}`, 30, { color: '#9a7a52' });

    this.peel = [];
    bosses.forEach((s, i) => this.makeBoss(s, ...BOSS_AT[i], newOnes.has(s.id)));
    tables.forEach((s, i) => this.makeTable(s, ...TABLE_AT(i), newOnes.has(s.id)));

    const back = this.add.image(76, 64, 'btnBack').setDepth(30);
    tappable(this, back, () => this.leave());

    this.sparkles = this.add.particles(0, 0, 'sparkle', {
      lifespan: 800, speed: { min: 100, max: 280 }, scale: { start: 1.4, end: 0 }, rotate: { min: 0, max: 360 }, emitting: false,
    }).setDepth(40);

    this.cameras.main.fadeIn(300, 255, 255, 255);
    if (this.peel.length) {
      this.time.delayedCall(500, () => {
        speak(this.peel.length > 1 ? `${this.peel.length} new stickers!` : 'A new sticker!', { mood: 'cheer' });
        this.peel.forEach((p, i) => this.time.delayedCall(500 + i * 650, () => this.peelOn(p, i)));
      });
      stickerStore.markSeen(fresh);
    } else {
      this.time.delayedCall(350, () => speak(earned.length ? 'Your sticker book!' : 'Your sticker book! Win stickers by playing.', { mood: 'cheer' }));
    }
  }

  // A boss sticker: the boss fast asleep on a round white sticker, with a little "z z".
  makeBoss(s, x, y, isNew) {
    const has = this.earned.has(s.id);
    const c = this.add.container(x, y);
    if (has) {
      const backing = this.add.image(0, 0, 'sticker-back').setScale(0.88);
      const boss = this.add.image(0, 8, s.boss, `${s.boss}Sleep`).setScale(0.78);
      const z = text(this, 46, -44, 'z z', 26, { color: '#6d8fc7' });
      c.add([backing, boss, z]);
    } else {
      c.add(this.add.image(0, 0, 'sticker-empty').setScale(0.88));
      c.add(this.add.image(0, 8, s.boss, `${s.boss}0`).setScale(0.6).setTintFill(0xe4d3b4).setAlpha(0.9));
      c.add(text(this, 0, 6, '?', 54, { color: '#c9a77a' }));
    }
    const label = text(this, x, y + 90, s.name, 22, { color: has ? INK : '#b39a78' });
    if (label.width > 150) label.setScale(150 / label.width);
    this.hookUp(c, s, has, 150);
    if (isNew) { c.setAlpha(0); this.peel.push({ c, s }); }
  }

  makeTable(s, x, y, isNew) {
    const has = this.earned.has(s.id);
    const c = this.add.container(x, y);
    if (has) {
      c.add(this.add.image(0, 8, `badge-${s.table}`).setScale(0.62));
      c.add(text(this, 0, -4, `×${s.table}`, s.table === 10 ? 30 : 36, { color: INK }));
    } else {
      c.add(this.add.image(0, 0, 'sticker-empty').setScale(0.6));
      c.add(text(this, 0, 0, `×${s.table}`, 34, { color: '#c9a77a' }));
    }
    this.hookUp(c, s, has, 104);
    if (isNew) { c.setAlpha(0); this.peel.push({ c, s }); }
  }

  hookUp(c, s, has, size) {
    c.setSize(size, size).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      this.tweens.killTweensOf(c);
      if (has) {
        sfx.plink(4);
        c.setAngle(0).setScale(1);
        this.tweens.add({ targets: c, scale: 1.15, angle: { from: -6, to: 6 }, duration: 140, yoyo: true, repeat: 1, onComplete: () => c.setAngle(0).setScale(1) });
        speak(s.said, { mood: 'cheer' });
      } else {
        sfx.bump();
        if (!this.reduce) this.tweens.add({ targets: c, x: c.x + 6, duration: 60, yoyo: true, repeat: 2 });
        speak(`${s.hint} to win this sticker!`);
      }
    });
  }

  peelOn({ c }, i) {
    sfx.peel();
    this.time.delayedCall(180, () => sfx.star(i % 3));
    this.sparkles.explode(this.reduce ? 6 : 18, c.x, c.y);
    const tag = this.add.image(c.x + 48, c.y - 52, 'new-dot').setDepth(20).setScale(0);
    this.tweens.add({ targets: tag, scale: 1, duration: 300, delay: 250, ease: 'Back.easeOut' });
    if (this.reduce) { c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 400 }); return; }
    c.setScale(1.8).setAngle(-22).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, angle: 0, alpha: 1, duration: 520, ease: 'Back.easeOut' });
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('WorldMap'));
  }
}
