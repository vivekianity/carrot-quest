// Hoppy's Burrow (GAME_DESIGN §8): the carrot shop. Hoppy stands in her cosy room on the left;
// the shop board on the right has five tabs (hats, glasses, capes, scarves, burrow things).
// Tap an item to try it on (Hoppy shows it straight away), then Buy / Wear / Take off with the big
// button. Outfits are worn in every level; decorations appear in the room.
// Nothing here can go wrong: you can't spend carrots you haven't got, and nothing is ever lost.
import { sfx, startMusic, audioSettings } from '../audio.js';
import { speak } from '../speech.js';
import { progress, settings, wardrobeStore } from '../save.js';
import { CATEGORIES, itemsIn, itemById, owns, isUsing, buy, use, outfitOf } from '../engine/shop.js';
import { DECOR_AT } from '../art/burrow.js';
import { HOPPY_FOOT_Y } from '../art/hoppy.js';
import { dressHoppy } from '../skin.js';
import { unlockOnTap, setLetterbox, titleText, text, tappable, reduceMotion, INK } from '../menu.js';

const PREVIEW_FRAMES = ['idle0', 'idle1', 'idle2', 'idle3', 'dance0', 'dance1', 'dance2', 'dance3'];
const PANEL = { x: 958, y: 368 };
const CARD = { x0: PANEL.x - 186, dx: 186, y: [296, 496] };
const TAB_ICON = { hat: 'hat-party', glasses: 'glasses-star', cape: 'cape-hero', scarf: 'scarf-blue', decor: 'decor-plant' };

export class BurrowScene extends Phaser.Scene {
  constructor() { super('Burrow'); }

  create() {
    this.reduce = reduceMotion();
    this.leaving = false;
    setLetterbox('#7a4a2a');
    unlockOnTap(this);
    audioSettings.music = settings.music;
    audioSettings.sound = settings.sound;
    startMusic('meadow');

    this.wardrobe = wardrobeStore.load();
    this.category = 'hat';
    this.selected = null;

    this.add.image(0, 0, 'burrow-room').setOrigin(0);
    this.decor = {};
    for (const [id, at] of Object.entries(DECOR_AT)) {
      const img = this.add.image(at.x, at.y, id).setDepth(id === 'decor-rug' ? 2 : 1);
      if (at.origin) img.setOrigin(...at.origin);
      img.setVisible(false);
      this.decor[id] = img;
    }

    // Hoppy in the middle of her room (a small preview sheet, redrawn quickly for try-ons).
    this.hoppy = this.add.sprite(330, 616, 'hoppy', 'idle0').setOrigin(0.5, HOPPY_FOOT_Y).setScale(2.1).setDepth(5);
    this.hoppy.play('hoppy-idle');
    this.hoppyShadow = this.add.image(330, 618, 'shadow').setScale(2.2, 1.6).setDepth(4);
    this.refreshHoppy();

    this.sparkles = this.add.particles(0, 0, 'sparkle', {
      lifespan: 800, speed: { min: 120, max: 320 }, scale: { start: 1.5, end: 0 }, rotate: { min: 0, max: 360 }, emitting: false,
    }).setDepth(40);
    this.hearts = this.add.particles(0, 0, 'heart', {
      lifespan: 1200, speedY: { min: -260, max: -120 }, speedX: { min: -120, max: 120 }, scale: { start: 1.3, end: 0.4 },
      alpha: { start: 1, end: 0 }, tint: [0xff8fb0, 0xffb3c7, 0xff6f9c], emitting: false,
    }).setDepth(40);

    this.createTopBar();
    this.add.image(PANEL.x, PANEL.y, 'shop-panel').setDepth(10);
    this.createTabs();
    this.page = null;
    this.showCategory('hat');
    this.refreshRoom();

    this.cameras.main.fadeIn(300, 255, 255, 255);
    this.time.delayedCall(350, () => speak("Welcome to Hoppy's burrow! Tap something to try it on.", { mood: 'cheer' }));
  }

  // ---- Hoppy ---------------------------------------------------------------------------------
  makePreviewAnims() {
    const A = this.anims;
    if (A.exists('hoppy-try-idle')) return;
    const f = (...n) => n.map((frame) => ({ key: 'hoppy-try', frame }));
    A.create({ key: 'hoppy-try-idle', frames: f('idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle1', 'idle0', 'idle0', 'idle0', 'idle2', 'idle2', 'idle0', 'idle3', 'idle3'), frameRate: 8, repeat: -1 });
    A.create({ key: 'hoppy-try-dance', frames: f('dance0', 'dance1', 'dance2', 'dance3'), frameRate: 7, repeat: 1 });
  }

  /** Show Hoppy wearing what she owns plus whatever is being tried on. */
  async refreshHoppy(happy = false) {
    const look = outfitOf(this.wardrobe, this.selected);
    await dressHoppy(this, look, { key: 'hoppy-try', frames: PREVIEW_FRAMES });
    if (!this.scene.isActive() || this.leaving) return;
    this.makePreviewAnims();      // once the try-on sheet exists
    if (this.hoppy.texture.key !== 'hoppy-try') this.hoppy.play('hoppy-try-idle');
    if (happy) {
      this.hoppy.play('hoppy-try-dance');
      this.hoppy.once('animationcomplete', () => this.hoppy.play('hoppy-try-idle'));
      if (!this.reduce) {
        this.tweens.killTweensOf(this.hoppy);
        this.hoppy.y = 616;
        this.tweens.add({ targets: this.hoppy, y: 590, duration: 170, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.hoppy.y = 616; } });
      }
    }
  }

  refreshRoom() {
    for (const [id, img] of Object.entries(this.decor)) {
      this.tweens.killTweensOf(img);
      const out = this.wardrobe.decor.includes(id);
      const trying = this.selected === id && !out;
      img.setVisible(out || trying).setAlpha(trying ? 0.55 : 1).setScale(1);
      if (trying && !this.reduce) this.tweens.add({ targets: img, alpha: 0.8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // ---- Top bar: back and carrots ------------------------------------------------------------------
  createTopBar() {
    const back = this.add.image(76, 70, 'btnBack').setDepth(30);
    tappable(this, back, () => this.leave());
    this.add.image(258, 70, 'pill').setScale(0.86, 1).setDepth(30);
    this.add.image(192, 68, 'carrot').setScale(0.95).setAngle(-12).setDepth(31);
    this.bankText = text(this, 276, 66, String(progress.carrotBank), 42, { color: '#6b4424' }).setDepth(31);
    const t = titleText(this, 510, 70, "Hoppy's Burrow", 38).setDepth(30);
    if (t.width > 250) t.setScale(250 / t.width);
  }

  setBank(n, from = null) {
    this.bankText.setText(String(n));
    if (from !== null && !this.reduce) {
      this.tweens.addCounter({ from, to: n, duration: 500, onUpdate: (tw) => this.bankText.setText(String(Math.round(tw.getValue()))) });
    }
    this.tweens.add({ targets: this.bankText, scale: { from: 1.3, to: 1 }, duration: 300, ease: 'Back.easeOut' });
  }

  // ---- Shop tabs and cards -----------------------------------------------------------------------
  createTabs() {
    this.tabs = CATEGORIES.map((c, i) => {
      const x = PANEL.x + (i - 2) * 112, y = 104;
      const bg = this.add.image(x, y, 'shop-tab').setDepth(11);
      const icon = this.add.image(x, y - 4, `item-${TAB_ICON[c.id]}`).setScale(0.64).setDepth(12);
      tappable(this, bg, () => this.showCategory(c.id), { sound: false });
      icon.setInteractive({ useHandCursor: true }).on('pointerdown', () => bg.emit('pointerdown'));
      return { id: c.id, bg, icon };
    });
  }

  showCategory(id) {
    if (this.page && this.category === id) return;
    if (this.page) sfx.swish();
    this.category = id;
    this.selected = null;
    this.tabs.forEach((t) => t.bg.setTexture(t.id === id ? 'shop-tab-on' : 'shop-tab'));
    if (this.page) this.page.destroy(true);
    const P = this.page = this.add.container(0, 0).setDepth(13);
    const cat = CATEGORIES.find((c) => c.id === id);
    P.add(text(this, PANEL.x, 186, cat.name, 40));

    this.cards = itemsIn(id).map((item, i) => {
      const x = CARD.x0 + (i % 3) * CARD.dx, y = CARD.y[Math.floor(i / 3)];
      const bg = this.add.image(x, y, 'shop-card');
      const pic = this.add.image(x, y - 30, `item-${item.id}`).setScale(id === 'decor' ? 0.88 : 0.95);
      const name = text(this, x, y + 38, item.name, 22);
      if (name.width > 150) name.setScale(150 / name.width);
      const price = this.add.container(x, y + 68);
      const tick = this.add.image(x + 62, y - 74, 'shop-tick').setScale(0.9);
      P.add([bg, pic, name, price, tick]);
      const card = { item, bg, pic, name, price, tick };
      tappable(this, bg, () => this.select(item.id), { sound: false });
      bg.setScale(0);
      this.tweens.add({ targets: bg, scale: 1, duration: 260, delay: i * 40, ease: 'Back.easeOut' });
      return card;
    });
    this.refreshCards();
    this.showAction();
  }

  refreshCards() {
    for (const c of this.cards) {
      const id = c.item.id;
      const have = owns(this.wardrobe, id), using = isUsing(this.wardrobe, id);
      c.bg.setTexture(this.selected === id || (this.selected === null && using) ? 'shop-card-on' : 'shop-card');
      c.tick.setVisible(have);
      c.price.removeAll(true);
      if (have) {
        c.price.add(text(this, 0, 0, using ? (c.item.slot === 'decor' ? 'In my burrow' : 'Wearing') : 'Mine!', 22, { color: '#2f7a24' }));
      } else {
        const t = text(this, 14, 0, String(c.item.price), 26, { color: progress.carrotBank >= c.item.price ? INK : '#9c8f7a' });
        c.price.add([this.add.image(-22, 0, 'mini-carrot').setScale(1.4), t]);
      }
    }
  }

  // ---- Choosing, trying on and buying -------------------------------------------------------------
  select(id) {
    const item = itemById(id);
    sfx.pop();
    this.selected = id;
    const card = this.cards.find((c) => c.item.id === id);
    if (card) this.tweens.add({ targets: card.pic, scale: card.pic.scale * 1.15, duration: 120, yoyo: true });
    this.refreshCards();
    this.showAction();
    if (item.slot === 'decor') this.refreshRoom();
    else this.refreshHoppy(true);
    const have = owns(this.wardrobe, id);
    speak(have ? `${item.name}!` : `${item.name}! ${item.price} carrots.`, { mood: 'cheer' });
  }

  /** The big button under the cards: Buy / Wear / Take off / Put it out / Put away. */
  showAction() {
    if (this.action) this.action.destroy(true);
    const A = this.action = this.add.container(PANEL.x, 636).setDepth(14);
    const id = this.selected;
    if (!id) {
      A.add(text(this, 0, 0, 'Tap something to try it on!', 30, { color: '#7a5a3a' }));
      return;
    }
    const item = itemById(id);
    const have = owns(this.wardrobe, id);
    const using = isUsing(this.wardrobe, id);
    let label, onTap, ready = true;
    if (!have) {
      ready = progress.carrotBank >= item.price;
      label = ready ? `Buy  🥕 ${item.price}` : `Need ${item.price - progress.carrotBank} more 🥕`;
      onTap = () => this.purchase(id);
    } else if (item.slot === 'decor') {
      label = using ? 'Put away' : 'Put it out!';
      onTap = () => this.toggle(id);
    } else if (item.slot === 'scarf') {
      label = using ? 'Wearing it ✓' : 'Wear it!';
      onTap = () => (using ? this.cheer(item) : this.toggle(id));
    } else {
      label = using ? 'Take it off' : 'Wear it!';
      onTap = () => this.toggle(id);
    }
    const bg = this.add.image(0, 0, ready ? 'btnPlay' : 'btnPlayGrey').setScale(0.92, 0.66);
    if (ready && have && using) bg.setTint(0xfff0b0);
    const t = text(this, 0, -4, label, 38, { color: '#ffffff', stroke: ready ? '#2f7a24' : '#8a8172', strokeThickness: 8 });
    if (t.width > 320) t.setScale(320 / t.width);
    A.add([bg, t]);
    tappable(this, bg, onTap, { label: t, sound: false });
    A.setScale(0.7);
    this.tweens.add({ targets: A, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }

  purchase(id) {
    const item = itemById(id);
    const bank = progress.carrotBank;
    const r = buy(this.wardrobe, id, bank);
    if (!r.ok) {
      if (r.reason === 'short') {
        sfx.bump();
        speak(`Let's collect ${r.need} more carrots for the ${item.name}!`, { mood: 'calm' });
        if (!this.reduce) this.tweens.add({ targets: this.bankText, angle: { from: -8, to: 8 }, duration: 80, yoyo: true, repeat: 2, onComplete: () => this.bankText.setAngle(0) });
      }
      return;
    }
    if (!progress.spend(item.price)) return;
    this.wardrobe = r.wardrobe;
    wardrobeStore.save(this.wardrobe);
    this.setBank(progress.carrotBank, bank);
    sfx.buy();
    const card = this.cards.find((c) => c.item.id === id);
    if (card) this.sparkles.explode(this.reduce ? 6 : 20, card.bg.x, card.bg.y);
    this.celebrate(item);
    speak(`Ta-da! ${item.slot === 'decor' ? 'A' : 'Hoppy has a'} new ${item.name}!`, { mood: 'cheer' });
    this.refreshCards();
    this.showAction();
  }

  toggle(id) {
    const item = itemById(id);
    const on = !isUsing(this.wardrobe, id);
    this.wardrobe = use(this.wardrobe, id, on);
    wardrobeStore.save(this.wardrobe);
    if (on) { sfx.correct(); this.celebrate(item); } else sfx.poof();
    this.refreshCards();
    this.showAction();
  }

  cheer(item) {
    sfx.dance();
    this.celebrate(item);
    speak(`Hoppy loves the ${item.name}!`, { mood: 'cheer' });
  }

  celebrate(item) {
    if (item.slot === 'decor') {
      this.refreshRoom();
      const img = this.decor[item.id];
      if (img.visible) {
        this.sparkles.explode(this.reduce ? 6 : 16, img.x, img.y - (img.originY === 1 ? img.height / 2 : 0));
        if (!this.reduce) this.tweens.add({ targets: img, scale: { from: 1.15, to: 1 }, duration: 380, ease: 'Back.easeOut' });
      }
      return;
    }
    this.refreshHoppy(true);
    this.time.delayedCall(200, () => sfx.dance());
    this.hearts.explode(this.reduce ? 4 : 12, this.hoppy.x, this.hoppy.y - 180);
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    sfx.correct();
    // Dress the real Hoppy (every frame) in what she owns, then back to the map.
    const done = dressHoppy(this, outfitOf(this.wardrobe));
    this.cameras.main.fadeOut(300, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => done.then(() => this.scene.start('WorldMap')));
  }
}
