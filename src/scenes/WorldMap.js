// The storybook World Map (GAME_DESIGN §8): a painted page with a path through the five worlds.
// Stepping-stones show each level's stars; Hoppy hops along the path to the level you tap, then a
// card pops up with a big Play button. Locked levels show a padlock. Endless Meadow opens after 5-2.
import { sfx, startMusic, audioSettings } from '../audio.js';
import { speak, stopSpeech } from '../speech.js';
import { profiles, progress, settings } from '../save.js';
import { LEVEL_ORDER, LEVEL_MAPS } from '../levels/index.js';
import { WORLDS, levelConfig, ENDLESS } from '../engine/levels-config.js';
import { MAP_NODES } from '../art/map.js';
import { AVATAR_NAMES } from '../art/avatars.js';
import { HOPPY_FOOT_Y } from '../art/hoppy.js';
import { dressHoppy } from '../skin.js';
import { stickerState } from './Stickers.js';
import { unlockOnTap, setLetterbox, titleText, text, tappable, button, soundToggles, reduceMotion, INK } from '../menu.js';

const NODE_IDS = [...LEVEL_ORDER, ENDLESS.id];
const HOP_MS = 260;

export class WorldMapScene extends Phaser.Scene {
  constructor() { super('WorldMap'); }

  /** data: { from, unlocked } after finishing a level (Hoppy hops on to the newly opened level). */
  init(data) { this.arrival = data || {}; }

  create() {
    this.reduce = reduceMotion();
    this.leaving = false;   // scenes are reused: clear last visit's state
    setLetterbox('#f7e7c4', '#e9d3a6');
    unlockOnTap(this);
    audioSettings.music = settings.music;
    audioSettings.sound = settings.sound;
    this.add.image(0, 0, 'world-map').setOrigin(0);
    dressHoppy(this);   // no-op unless the outfit changed (e.g. another child was picked)

    const fresh = this.arrival.unlocked && this.isUnlocked(this.arrival.unlocked) ? this.arrival.unlocked : null;
    this.path = new Phaser.Curves.Spline(NODE_IDS.map((id) => new Phaser.Math.Vector2(MAP_NODES[id].x, MAP_NODES[id].y)));
    this.drawPath();
    this.nodes = {};
    NODE_IDS.forEach((id) => this.makeNode(id, id === fresh));
    this.createHud();

    // Hoppy stands on the level she played last.
    const startId = this.arrival.from && NODE_IDS.includes(this.arrival.from) ? this.arrival.from : progress.lastLevel;
    this.at = NODE_IDS.includes(startId) && this.isUnlocked(startId) ? startId : LEVEL_ORDER[0];
    const p = this.nodeTop(this.at);
    this.hoppy = this.add.sprite(p.x, p.y, 'hoppy', 'idle0').setOrigin(0.5, HOPPY_FOOT_Y).setScale(0.8).setDepth(20);
    this.hoppy.play('hoppy-idle');
    this.busy = false;
    this.card = null;
    this.playMusicFor(this.at);

    this.cameras.main.fadeIn(350, 255, 255, 255);
    if (fresh) {
      this.busy = true;
      this.time.delayedCall(700, () => this.revealUnlock(fresh));
    } else {
      const name = profiles.current?.name;
      this.time.delayedCall(400, () => speak(name ? `Where shall we go, ${name}?` : 'Where shall we go?'));
    }
  }

  isUnlocked(id) {
    if (id === ENDLESS.id) return progress.isDone(ENDLESS.unlockAfter);
    return progress.isUnlocked(id, LEVEL_ORDER);
  }

  nodeTop(id) { return { x: MAP_NODES[id].x, y: MAP_NODES[id].y - 6 }; }
  worldOf(id) { return id === ENDLESS.id ? ENDLESS.world : LEVEL_MAPS[id].world; }
  playMusicFor(id) { startMusic(this.worldOf(id)); }

  // ---- The page --------------------------------------------------------------------------------
  drawPath() {
    const g = this.add.graphics().setDepth(1);
    const n = NODE_IDS.length - 1;
    const pts = this.path.getPoints(n * 22);
    const lastOpen = Math.max(...NODE_IDS.map((id, i) => (this.isUnlocked(id) ? i : 0)));
    pts.forEach((pt, i) => {
      if (i % 2) return;
      const seg = i / (n * 22) * n;
      const open = seg <= lastOpen;
      g.fillStyle(0x6b4424, open ? 0.2 : 0.08).fillCircle(pt.x, pt.y + 3, 6.5);
      g.fillStyle(open ? 0xfff3d6 : 0xe9d9bb, 1).fillCircle(pt.x, pt.y, 6.5);
      g.lineStyle(2.5, 0xa8784a, open ? 1 : 0.4).strokeCircle(pt.x, pt.y, 6.5);
    });
  }

  makeNode(id, hideUnlock) {
    const { x, y } = MAP_NODES[id];
    const endless = id === ENDLESS.id;
    const open = this.isUnlocked(id) && !hideUnlock;
    const stars = endless ? 0 : progress.bestStars(id);
    const tex = !open ? 'map-node-locked' : endless ? 'map-node-endless' : progress.isDone(id) ? 'map-node-done' : 'map-node';
    const img = this.add.image(x, y + 6, tex).setDepth(5);
    const label = text(this, x, y - 6, endless ? '∞' : id, endless ? 52 : 32, { color: open ? INK : '#7d766b' }).setDepth(6);
    if (!open) label.setAlpha(0);
    const node = { id, img, label, starImgs: [], extra: null };

    if (endless) {
      const best = progress.endless.best;
      node.extra = text(this, x, y + 66, best ? `Endless · best round ${best}` : 'Endless Meadow', 26, { color: INK, stroke: '#fff8e6', strokeThickness: 6 }).setDepth(6);
    } else {
      for (let i = 0; i < 3; i++) {
        const s = this.add.image(x + (i - 1) * 30, y + 54 - (i === 1 ? 6 : 0), i < stars ? 'star' : 'star-empty').setScale(0.24).setDepth(6);
        if (!open) s.setAlpha(0.45);
        node.starImgs.push(s);
      }
      const boss = levelConfig(id).boss;
      if (boss) {
        const asleep = progress.isDone(id);
        node.boss = this.add.image(x + 64, y - 40, boss, asleep ? `${boss}Sleep` : `${boss}0`).setScale(0.42).setDepth(7);
        if (!open) node.boss.setAlpha(0.6);
      }
    }
    // A generous hit area (≈ 120 px) around the stone.
    const hit = this.add.zone(x, y + 6, 124, 124).setDepth(8);
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.tapNode(id));
    this.nodes[id] = node;
  }

  createHud() {
    const p = profiles.current;
    const avatar = this.add.image(70, 66, 'avatar-ring').setScale(0.6).setDepth(30);
    const face = this.add.image(70, 66, `avatar-${p ? p.avatar : 'bunny'}`).setScale(0.6).setDepth(31);
    tappable(this, avatar, () => this.leave('Profiles'));
    face.setInteractive({ useHandCursor: true }).on('pointerdown', () => avatar.emit('pointerdown'));
    // Quit: back to the title screen (progress is already saved). A web app can't close itself on iOS.
    const quit = this.add.image(70, 176, 'btnQuit').setScale(0.9).setDepth(30);
    tappable(this, quit, () => { stopSpeech(); this.leave('Title'); });
    soundToggles(this, 166, 66, 96).forEach((b) => b.setDepth(30).setScale(0.9));

    const who = p ? (p.name || AVATAR_NAMES[p.avatar]) : 'Hoppy';
    this.add.image(640, 60, 'map-ribbon').setScale(0.7, 1).setDepth(30);
    const t = titleText(this, 640, 52, `${who}'s Map`, 44).setDepth(31);
    if (t.width > 280) t.setScale(280 / t.width);

    // Hoppy's Burrow (carrot shop) and the sticker book; a pink star shows when there are new stickers.
    const burrow = this.add.image(882, 66, 'btnBurrow').setScale(0.9).setDepth(30);
    tappable(this, burrow, () => this.leave('Burrow'));
    const book = this.add.image(978, 66, 'btnStickers').setScale(0.9).setDepth(30);
    tappable(this, book, () => this.leave('Stickers'));
    const fresh = stickerState().fresh.length;
    if (fresh) {
      const dot = this.add.image(1010, 34, 'new-dot').setDepth(32);
      if (!this.reduce) this.tweens.add({ targets: dot, scale: 1.15, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    const pill = this.add.image(1150, 62, 'pill').setScale(0.76, 1).setDepth(30);
    this.add.image(1094, 60, 'carrot').setScale(0.9).setAngle(-12).setDepth(31);
    text(this, 1166, 58, String(progress.carrotBank), 42, { color: '#6b4424' }).setDepth(31);
    tappable(this, pill, () => this.leave('Burrow'), { sound: false });   // carrots are spent in the Burrow
  }

  // ---- Moving around ------------------------------------------------------------------------------
  tapNode(id) {
    if (this.busy) return;
    if (this.card) this.closeCard();
    const node = this.nodes[id];
    if (!this.isUnlocked(id)) {
      sfx.bump();
      this.tweens.add({ targets: node.img, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => node.img.setAngle(0) });
      const before = id === ENDLESS.id ? ENDLESS.unlockAfter : LEVEL_ORDER[LEVEL_ORDER.indexOf(id) - 1];
      this.say(`Finish ${before} first!`);
      speak(`Finish level ${before.replace('-', ' ')} first!`);
      return;
    }
    if (id === this.at) { this.showCard(id); return; }
    this.hopTo(id, () => this.showCard(id));
  }

  /** Hop node by node along the path (forwards or backwards), then call `done`. */
  hopTo(id, done) {
    this.busy = true;
    const from = NODE_IDS.indexOf(this.at), to = NODE_IDS.indexOf(id);
    const step = Math.sign(to - from);
    const n = NODE_IDS.length - 1;
    const hops = [];
    for (let i = from; i !== to; i += step) hops.push([i, i + step]);
    const h = this.hoppy;
    h.setFlipX(step < 0);
    const next = () => {
      const hop = hops.shift();
      if (!hop) {
        this.at = id;
        progress.lastLevel = id;
        h.play('hoppy-idle');
        this.playMusicFor(id);
        this.busy = false;
        done();
        return;
      }
      const [a, b] = hop;
      h.play('hoppy-jump');
      sfx.jump();
      this.tweens.addCounter({
        from: 0, to: 1, duration: this.reduce ? 140 : HOP_MS, ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const t = tw.getValue();
          const pt = this.path.getPoint((a + (b - a) * t) / n);
          h.setPosition(pt.x, pt.y - 6 - Math.sin(t * Math.PI) * (this.reduce ? 0 : 46));
        },
        onComplete: () => { h.play('hoppy-land'); this.time.delayedCall(40, next); },
      });
    };
    next();
  }

  /** After finishing a level: the next stone pops open with sparkles and Hoppy hops onto it. */
  revealUnlock(id) {
    const node = this.nodes[id];
    const endless = id === ENDLESS.id;
    node.img.setTexture(endless ? 'map-node-endless' : 'map-node');
    node.label.setColor(INK).setAlpha(1);
    node.starImgs.forEach((s) => s.setAlpha(1));
    if (node.boss) node.boss.setAlpha(1);
    sfx.star(2);
    this.tweens.add({ targets: node.img, scale: { from: 0.5, to: 1 }, duration: 450, ease: 'Back.easeOut' });
    const sp = this.add.particles(node.img.x, node.img.y, 'sparkle', {
      lifespan: 800, speed: { min: 80, max: 240 }, scale: { start: 1.3, end: 0 }, emitting: false,
    }).setDepth(25);
    sp.explode(this.reduce ? 6 : 18);
    if (endless) speak('Endless Meadow is open! It goes on and on!', { mood: 'cheer' });
    else {
      const w = LEVEL_MAPS[id].world;
      const newWorld = this.arrival.from && LEVEL_MAPS[this.arrival.from] && LEVEL_MAPS[this.arrival.from].world !== w;
      speak(newWorld ? `Hooray! On to ${WORLDS[w].name}!` : `Level ${id.replace('-', ' ')} is open!`, { mood: 'cheer' });
    }
    this.time.delayedCall(800, () => this.hopTo(id, () => this.showCard(id)));
  }

  // ---- The level card -------------------------------------------------------------------------------
  showCard(id) {
    if (this.card) this.closeCard();
    const endless = id === ENDLESS.id;
    const c = this.add.container(640, 400).setDepth(50);
    const dim = this.add.rectangle(0, -40, 1280, 720, 0x1d3347, 0.28).setInteractive();
    dim.on('pointerdown', () => this.closeCard());
    const bg = this.add.image(0, 0, 'map-card').setInteractive();   // taps on the card don't close it
    c.add([dim, bg]);

    let heading, name;
    if (endless) {
      const e = progress.endless;
      heading = '🌈 Endless Meadow';
      name = e.best ? `Round ${e.round}  ·  best: round ${e.best}` : 'It goes on and on!';
    } else {
      const def = LEVEL_MAPS[id], w = WORLDS[def.world];
      heading = `${w.emoji} ${w.name}`;
      name = `${id}  ${def.name}`;
    }
    c.add(text(this, 0, -106, heading, 30, { color: '#7a5a3a' }));
    const title = text(this, 0, -58, name, 46);
    if (title.width > 500) title.setScale(500 / title.width);
    c.add(title);
    if (!endless) {
      const stars = progress.bestStars(id);
      for (let i = 0; i < 3; i++) c.add(this.add.image((i - 1) * 76, 14 - (i === 1 ? 8 : 0), i < stars ? 'star' : 'star-empty').setScale(0.5));
    } else {
      c.add(this.add.image(0, 10, 'map-node-endless').setScale(0.8));
    }
    const play = button(this, 0, 86, '▶  Play', () => this.play(id), { tex: 'btnPlay', scale: 0.68, size: 50, color: '#ffffff' });
    play.label.setStroke('#2f7a24', 9);
    c.add([play.bg, play.label]);

    c.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    if (!this.reduce) this.tweens.add({ targets: play.bg, scale: 0.73, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
    sfx.signUp();
    speak(endless ? 'Endless Meadow! Ready?' : `${LEVEL_MAPS[id].name}! Ready?`);
    this.card = c;
  }

  closeCard() {
    const c = this.card;
    this.card = null;
    if (!c) return;
    this.tweens.add({ targets: c, scale: 0.7, alpha: 0, duration: 160, onComplete: () => c.destroy(true) });
  }

  say(str) {
    const t = titleText(this, 640, 160, str, 44).setDepth(60).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 240, ease: 'Back.easeOut' });
    this.time.delayedCall(1600, () => this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() }));
  }

  play(id) {
    if (this.leaving) return;
    sfx.correct();
    progress.lastLevel = id;
    this.leave('Level', { levelId: id });
  }

  leave(scene, data) {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
  }
}
