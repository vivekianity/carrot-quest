// "Who's playing?" — up to 4 child profiles. Tap a card to play; tap + to make a new player:
// pick an animal friend, then type a name on a big A–Z keyboard (or skip it and use the animal's name).
// Removing a profile lives in the grown-ups' corner (later), so a child can't delete one by accident.
import { sfx } from '../audio.js';
import { speak } from '../speech.js';
import { profiles, MAX_PROFILES, NAME_MAX, wardrobeStore } from '../save.js';
import { outfitOf } from '../engine/shop.js';
import { dressHoppy } from '../skin.js';
import { AVATAR_KEYS, AVATAR_NAMES } from '../art/avatars.js';
import { WORLD_COLORS } from '../art/worlds.js';
import { unlockOnTap, setLetterbox, titleText, text, tappable, button, meadowBackdrop, reduceMotion, INK } from '../menu.js';

const CARD_GAP = 286;
const KEY_ROWS = ['ABCDEFGHIJ', 'KLMNOPQRS', 'TUVWXYZ'];
const KEY_STEP = 104;

export class ProfilesScene extends Phaser.Scene {
  constructor() { super('Profiles'); }

  create() {
    this.reduce = reduceMotion();
    this.leaving = false;
    setLetterbox(WORLD_COLORS.meadow[0], '#86bb74');   // green under the hills
    unlockOnTap(this);
    meadowBackdrop(this);
    this.add.rectangle(640, 360, 1280, 720, 0xfff6de, 0.35);
    this.layer = null;
    this.showCards();
    this.cameras.main.fadeIn(300, 255, 255, 255);
  }

  clear() {
    if (this.layer) this.layer.destroy(true);
    this.layer = this.add.container(0, 0);
    return this.layer;
  }

  // ---- The cards --------------------------------------------------------------------------------
  showCards() {
    const L = this.clear();
    const list = profiles.list();
    L.add(titleText(this, 640, 92, list.length ? "Who's playing?" : 'Hello! Who are you?', 72));
    const back = this.add.image(76, 70, 'btnBack');
    tappable(this, back, () => this.scene.start('Title'));
    L.add(back);

    const slots = [...list, ...(list.length < MAX_PROFILES ? [null] : [])];
    const x0 = 640 - ((slots.length - 1) * CARD_GAP) / 2;
    slots.forEach((p, i) => {
      const x = x0 + i * CARD_GAP, y = 410;
      if (!p) {
        const card = this.add.image(x, y, 'profile-new');
        const t = text(this, x, y + 90, 'New player', 34);
        L.add([card, t]);
        tappable(this, card, () => this.showCreate());
        if (!list.length && !this.reduce) this.tweens.add({ targets: card, scale: 1.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        return;
      }
      const sum = profiles.summary(p.id);
      const card = this.add.image(x, y, 'profile-card');
      const face = this.add.image(x, y - 50, `avatar-${p.avatar}`);
      const name = text(this, x, y + 64, p.name || AVATAR_NAMES[p.avatar], 40);
      if (name.width > 220) name.setScale(220 / name.width);
      const stars = text(this, x, y + 112, `⭐ ${sum.stars}   🥕 ${sum.carrots}`, 28, { color: '#7a5a3a' });
      L.add([card, face, name, stars]);
      if (!this.reduce) this.tweens.add({ targets: face, y: y - 58, duration: 900 + i * 110, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      tappable(this, card, () => this.choose(p));
      card.setScale(0);
      this.tweens.add({ targets: card, scale: 1, duration: 320, delay: i * 70, ease: 'Back.easeOut' });
    });
  }

  choose(p) {
    if (this.leaving) return;
    this.leaving = true;
    profiles.select(p.id);
    sfx.correct();
    speak(`Hi ${p.name || AVATAR_NAMES[p.avatar]}! Let's go!`, { mood: 'cheer' });
    // Dress Hoppy in this child's Burrow outfit while the screen fades.
    const dressed = dressHoppy(this, outfitOf(wardrobeStore.load()));
    this.cameras.main.fadeOut(300, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => dressed.then(() => this.scene.start('WorldMap')));
  }

  // ---- Making a new player --------------------------------------------------------------------------
  showCreate() {
    const L = this.clear();
    this.avatar = AVATAR_KEYS[profiles.list().length % AVATAR_KEYS.length];
    this.typed = '';
    speak('Pick your animal friend! Then type your name.');

    const back = this.add.image(76, 70, 'btnBack');
    tappable(this, back, () => this.showCards());
    L.add([back, titleText(this, 640, 70, 'Pick your animal friend!', 56)]);

    // Eight faces in a row (each 120 px — easy to tap).
    this.faces = AVATAR_KEYS.map((k, i) => {
      const x = 640 + (i - 3.5) * 142, y = 210;
      const ring = this.add.image(x, y, 'avatar-ring').setScale(0.8).setAlpha(0);
      const face = this.add.image(x, y, `avatar-${k}`).setScale(0.8);
      L.add([ring, face]);
      tappable(this, face, () => this.pickAvatar(k));
      return { k, ring, face };
    });
    this.pickAvatar(this.avatar, true);

    // Name: a field with the letters typed so far, and a Done button.
    L.add(this.add.image(520, 352, 'name-field'));
    this.nameText = text(this, 520, 350, '', 60);
    L.add(this.nameText);
    const done = button(this, 1012, 352, '✓ Done', () => this.finishCreate(), { tex: 'btnPlay', scale: 0.62, size: 46, color: '#ffffff' });
    done.label.setStroke('#2f7a24', 8);
    L.add([done.bg, done.label]);
    this.updateName();

    // A big A–Z keyboard (in ABC order — easier than QWERTY for young children). Keys are 94 px.
    KEY_ROWS.forEach((row, r) => {
      const y = 470 + r * 94;
      const extra = r === 2 ? 1 : 0;                 // ⌫ goes at the end of the last row
      const x0 = 640 - ((row.length + extra - 1) * KEY_STEP) / 2;
      [...row].forEach((ch, i) => L.add(this.key(x0 + i * KEY_STEP, y, ch, () => this.typeLetter(ch))));
      if (extra) L.add(this.key(x0 + row.length * KEY_STEP, y, '⌫', () => this.backspace(), 'keyBack'));
    });
  }

  key(x, y, label, onTap, tex = 'key') {
    const img = this.add.image(x, y, tex).setScale(0.88);
    const t = text(this, x, y - 4, label, label === '⌫' ? 44 : 50);
    tappable(this, img, onTap, { label: t, sound: false });
    return [img, t];
  }

  pickAvatar(k, quiet = false) {
    this.avatar = k;
    for (const f of this.faces) {
      const on = f.k === k;
      this.tweens.killTweensOf([f.face, f.ring]);
      f.ring.setAlpha(on ? 1 : 0);
      f.face.setScale(on ? 0.92 : 0.8);
      if (on && !this.reduce) this.tweens.add({ targets: f.face, scale: 0.98, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (!quiet) { sfx.pop(); speak(AVATAR_NAMES[k]); }
    if (this.nameText) this.updateName();
  }

  typeLetter(ch) {
    if (this.typed.length >= NAME_MAX) { sfx.thunk(1); return; }
    this.typed += this.typed ? ch.toLowerCase() : ch;
    sfx.count(this.typed.length % 8);
    this.updateName();
    this.tweens.add({ targets: this.nameText, scale: { from: 1.12, to: 1 }, duration: 150, ease: 'Back.easeOut' });
  }

  backspace() {
    if (!this.typed) return;
    sfx.thunk(1);
    this.typed = this.typed.slice(0, -1);
    this.updateName();
  }

  updateName() {
    if (this.typed) this.nameText.setText(this.typed).setColor(INK).setAlpha(1);
    else this.nameText.setText(AVATAR_NAMES[this.avatar]).setColor('#b48a5e').setAlpha(0.7);
  }

  finishCreate() {
    const p = profiles.create({ name: this.typed || AVATAR_NAMES[this.avatar], avatar: this.avatar });
    if (!p) { this.showCards(); return; }
    this.choose(p);
  }
}
