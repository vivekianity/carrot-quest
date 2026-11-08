// LevelComplete: overlay with 1–3 stars (GAME_DESIGN §3), carrots collected and what to do next:
// back to the map (where the next level pops open), play again, or straight on to the next level.
// In Endless Meadow it shows the round instead of stars, and "Keep going" starts the next round.
import { sfx } from '../audio.js';
import { speak } from '../speech.js';
import { nextStarHint } from '../engine/scoring.js';
import { LEVEL_MAPS } from '../levels/index.js';
import { WORLDS, ENDLESS } from '../engine/levels-config.js';
import { unlockOnTap, text, button, reduceMotion, INK } from '../menu.js';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super('LevelComplete'); }

  init(data) { this.r = data; }

  create() {
    const r = this.r;
    const reduce = reduceMotion();
    unlockOnTap(this);

    const back = this.add.rectangle(640, 360, 1280, 720, 0x1d3347, 1).setAlpha(0);
    this.tweens.add({ targets: back, alpha: 0.35, duration: 400 });

    const board = this.add.container(640, -300);
    const sign = this.add.image(0, 0, 'sign').setScale(0.92, 1.05);
    const title = text(this, 0, -170, r.endless ? `Round ${r.round} done!` : `Level ${r.levelId} done!`, 64);
    board.add([sign, title]);

    const lines = [`🥕 ${r.carrots} carrots`];
    if (r.challenges) lines.push(`✔ ${r.firstTry} of ${r.challenges} right first time`);
    board.add(text(this, 0, 100, lines.join('     '), 36));

    let slots = [];
    if (r.endless) {
      board.add(this.add.image(0, -40, 'map-node-endless').setScale(1.3));
      board.add(text(this, 0, -46, '∞', 70));
      board.add(text(this, 0, 158, r.round >= r.best ? '🏆 Your best round yet!' : `Best so far: round ${r.best}`, 32, { color: '#b07a00' }));
    } else {
      slots = [-170, 0, 170].map((x, i) => {
        const empty = this.add.image(x, -40 - (i === 1 ? 18 : 0), 'star-empty').setScale(0.95);
        const full = this.add.image(empty.x, empty.y, 'star').setScale(0).setAngle(-30);
        board.add([empty, full]);
        return full;
      });
      const hint = nextStarHint(r);
      const extra = r.starCarrot ? '⭐ You found the Star Carrot!'
        : hint === 'star' ? 'Find the hidden Star Carrot for 3 stars!'
          : 'Get more right first time for more stars!';
      board.add(text(this, 0, 158, extra, 32, { color: r.starCarrot ? '#b07a00' : '#7a5a3a' }));
    }

    this.tweens.add({
      targets: board, y: 300, duration: 700, ease: 'Back.easeOut',
      onComplete: () => {
        if (r.endless) {
          sfx.star(2);
          this.time.delayedCall(400, () => {
            speak(`Round ${r.round} done! Hop-tastic! Keep going?`, { mood: 'cheer' });
            this.showButtons();
          });
          return;
        }
        for (let i = 0; i < r.stars; i++) {
          this.time.delayedCall(250 + i * 520, () => {
            sfx.star(i);
            this.tweens.add({ targets: slots[i], scale: 0.95, angle: 0, duration: 420, ease: 'Back.easeOut' });
            if (!reduce) {
              const sp = this.add.particles(board.x + slots[i].x, board.y + slots[i].y, 'sparkle', {
                lifespan: 700, speed: { min: 100, max: 260 }, scale: { start: 1.3, end: 0 }, emitting: false,
              });
              sp.explode(12);
            }
          });
        }
        const word = r.stars === 1 ? 'star' : 'stars';
        this.time.delayedCall(250 + r.stars * 520, () => {
          speak(`Hooray! You got ${r.stars} ${word}!${r.newBest && r.stars > 1 ? ' A new best!' : ''}`, { mood: 'cheer' });
          this.showButtons();
        });
      },
    });
  }

  note(str) {
    const t = text(this, 640, 540, str, 34, { color: '#ffffff', stroke: INK, strokeThickness: 8 }).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 400 });
  }

  showButtons() {
    const r = this.r;
    const leave = (scene, data) => {
      const level = this.scene.get('Level');
      this.scene.stop();
      if (scene === 'Level') level.scene.restart(data);
      else level.scene.start(scene, data);
    };
    const pill = (x, label, onTap, primary = false) => {
      const b = button(this, x, 628, label, onTap, { size: 38 });
      b.bg.setScale(1.25, 1.15);
      if (primary) b.bg.setTint(0xc8f5a6);
      [b.bg, b.label].forEach((o) => { const s = { x: o.scaleX, y: o.scaleY }; o.setScale(0); this.tweens.add({ targets: o, scaleX: s.x, scaleY: s.y, duration: 300, ease: 'Back.easeOut' }); });
    };

    if (r.endless) {
      pill(440, '🗺 Map', () => leave('WorldMap', { from: ENDLESS.id }));
      pill(840, 'Keep going ▶', () => leave('Level', { levelId: ENDLESS.id }), true);
      return;
    }
    const mapData = { from: r.levelId, unlocked: r.unlocked || null };
    pill(330, '🗺 Map', () => leave('WorldMap', mapData), !r.next);
    pill(640, '↻ Again', () => leave('Level', { levelId: r.levelId }));
    if (r.next) {
      pill(950, 'Next ▶', () => leave('Level', { levelId: r.next }), true);
      if (r.next === ENDLESS.id) {
        if (r.unlocked) {
          this.note(`${r.sticker ? '🏅 New sticker!     ' : ''}🌈 Endless Meadow is open!`);
          speak('You finished all five worlds! Endless Meadow is open!', { queue: true, mood: 'cheer' });
        }
        return;
      }
      const here = LEVEL_MAPS[r.levelId].world, there = LEVEL_MAPS[r.next].world;
      if (there !== here) {
        const w = WORLDS[there];
        this.note(`${r.sticker ? '🏅 New sticker!     ' : ''}${w.emoji} On to ${w.name}!`);
        if (r.sticker) speak('A new sticker for your sticker book!', { queue: true, mood: 'cheer' });
        speak(`Next stop: ${w.name}!`, { queue: true, mood: 'cheer' });
      }
    }
  }
}
