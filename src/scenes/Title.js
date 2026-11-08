// Title screen: the Carrot Quest logo, Hoppy bouncing in the meadow, and one big Play button.
// The first tap also unlocks sound and speech (iOS needs a tap before audio can play).
import { sfx, startMusic, stopMusic, audioSettings } from '../audio.js';
import { speak, stopSpeech } from '../speech.js';
import { settings } from '../save.js';
import { HOPPY_FOOT_Y } from '../art/hoppy.js';
import { GRASS_INSET } from '../blocks.js';
import { WORLD_COLORS } from '../art/worlds.js';
import { unlockOnTap, setLetterbox, titleText, text, button, tappable, meadowBackdrop, groundStrip, reduceMotion } from '../menu.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const reduce = reduceMotion();
    this.leaving = false;
    this.bye = null;
    setLetterbox(...WORLD_COLORS.meadow);
    unlockOnTap(this);
    this.clouds = meadowBackdrop(this);
    const ground = groundStrip(this);

    // Logo: the title in big rounded letters with a golden carrot.
    const logo = this.add.container(640, 170);
    const title = titleText(this, 0, 0, 'Carrot Quest', 128);
    const carrot = this.add.image(title.width / 2 + 40, -10, 'golden-carrot0').setScale(0.85).setAngle(18);
    const glow = this.add.image(carrot.x, carrot.y, 'glow').setScale(0.7).setAlpha(0.6);
    logo.add([glow, carrot, title]);
    logo.x = 640 - 40;
    const sub = text(this, 640, 278, 'A times tables adventure', 40, { color: '#ffffff', stroke: '#5a3518', strokeThickness: 8 });
    if (!reduce) {
      this.tweens.add({ targets: logo, y: 178, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: carrot, angle: 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Hoppy hops happily on the grass.
    const feet = ground + GRASS_INSET;
    const hoppy = this.add.sprite(330, feet, 'hoppy', 'idle0').setOrigin(0.5, HOPPY_FOOT_Y).setScale(1.25);
    hoppy.play('hoppy-idle');
    if (!reduce) {
      this.time.addEvent({
        delay: 2600, loop: true, callback: () => {
          hoppy.play('hoppy-jump');
          this.tweens.add({
            targets: hoppy, y: feet - 110, duration: 300, yoyo: true, ease: 'Quad.easeOut',
            onComplete: () => { hoppy.play('hoppy-idle'); },
          });
        },
      });
    }
    // A few carrots bob in the air.
    [[880, 420], [960, 380], [1040, 420]].forEach(([x, y], i) => {
      const c = this.add.image(x, y, 'carrot');
      if (!reduce) this.tweens.add({ targets: c, y: y - 10, angle: { from: -6, to: 6 }, duration: 900 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // Play: the big green button (and a tap anywhere does the same).
    const play = button(this, 640, 452, '▶  Play', () => this.go(), { tex: 'btnPlay', size: 64, color: '#ffffff' });
    play.label.setStroke('#2f7a24', 10);
    if (!reduce) this.tweens.add({ targets: [play.bg], scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.input.on('pointerdown', (p, over) => { if (!over.length) this.go(); });

    // Quit (top-right): try to close the game; iPadOS won't let a web app close itself, so we
    // fall back to a calm "bye-bye" screen with the music and speech stopped.
    const quit = this.add.image(1204, 72, 'btnQuit');
    tappable(this, quit, () => this.quit());

    this.cameras.main.fadeIn(400, 255, 255, 255);
  }

  go() {
    if (this.leaving || this.bye) return;
    this.leaving = true;
    audioSettings.music = settings.music;
    audioSettings.sound = settings.sound;
    startMusic('meadow');
    sfx.correct();
    speak("Who's playing?");
    this.cameras.main.fadeOut(300, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Profiles'));
  }

  quit() {
    if (this.leaving || this.bye) return;
    stopMusic();
    stopSpeech();
    try { window.close(); } catch (e) { /* not allowed: show the goodbye screen */ }

    const reduce = reduceMotion();
    const L = this.bye = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x1d3557, 0.82).setInteractive();   // swallows taps
    const title = titleText(this, 640, 150, 'Bye-bye! See you soon!', 84);
    const hoppy = this.add.sprite(640, 430, 'hoppy', 'idle0').setOrigin(0.5, HOPPY_FOOT_Y).setScale(1.2);
    hoppy.play('hoppy-idle');
    const hint = text(this, 640, 500, 'Grown-ups: swipe up from the bottom of the screen to close the game.', 30,
      { color: '#ffffff', stroke: '#1d3557', strokeThickness: 6, wordWrap: { width: 1000 } });
    const again = button(this, 640, 612, '▶  Play again', () => this.unquit(), { tex: 'btnPlay', size: 50, color: '#ffffff' });
    again.label.setStroke('#2f7a24', 9);
    L.add([shade, title, hoppy, hint, again.bg, again.label]);
    if (!reduce) {
      L.setAlpha(0);
      this.tweens.add({ targets: L, alpha: 1, duration: 400 });
    }
    this.time.delayedCall(300, () => speak('Bye-bye! See you soon!', { mood: 'cheer' }));
  }

  unquit() {
    if (!this.bye) return;
    this.bye.destroy(true);
    this.bye = null;
    audioSettings.music = settings.music;
    startMusic('meadow');
  }

  update(time) {
    if (this.clouds) this.clouds.tilePositionX = time * 0.01;
  }
}
