// Touch + keyboard controls with two modes (GAME_DESIGN §4):
//  - easy:    Hoppy auto-runs; tap/hold anywhere on the right half to jump (longer hold = higher).
//  - classic: big ◀ ▶ buttons bottom-left, big JUMP button bottom-right.
// Multi-touch: every pointer is tracked on its own, so run + jump work together.

import { unlockAudio } from './audio.js';
import { unlockSpeech } from './speech.js';

const W = 1280, H = 720;
const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif';

const LAYOUT = {
  left: { x: 118, y: 612 },
  right: { x: 282, y: 612 },
  jump: { x: 1146, y: 590 },
};

export class Controls {
  constructor(scene, mode = 'easy') {
    this.scene = scene;
    this.mode = mode;
    this.enabled = true;
    this.pointers = new Map(); // pointer.id -> 'left' | 'right' | 'jump'
    this.pressQueued = false;
    this.state = { left: false, right: false, jumpHeld: false, jumpPressed: false };
    this.onModeChange = null;

    const ui = (key, p) => scene.add.image(p.x, p.y, key).setScrollFactor(0).setDepth(1000).setAlpha(0.9);
    this.buttons = {
      left: ui('btnLeft', LAYOUT.left),
      right: ui('btnRight', LAYOUT.right),
      jump: ui('btnJump', LAYOUT.jump),
    };

    // Easy-mode hint, shown until the first jump.
    this.hint = scene.add.text(W * 0.75, H * 0.5, 'Tap here to jump!', {
      fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#6b4424', strokeThickness: 10,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    scene.tweens.add({ targets: this.hint, scale: 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Control-mode toggle (Easy / Classic) in the top-left of the level, saved per child.
    this.toggleBg = scene.add.image(132, 62, 'pill').setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });
    this.toggleText = scene.add.text(132, 58, '', {
      fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#6b4424',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    this.toggleBg.on('pointerdown', () => {
      this.toggleBg.setScale(0.94);
      scene.time.delayedCall(120, () => this.toggleBg.setScale(1));
      this.setMode(this.mode === 'easy' ? 'classic' : 'easy');
      if (this.onModeChange) this.onModeChange(this.mode);
    });

    // Pointer input
    const input = scene.input;
    input.on('pointerdown', (p, over) => {
      unlockAudio();
      unlockSpeech();
      if (!this.enabled) return;       // e.g. while a maths sign is open
      if (over && over.length) return; // tapped a UI button
      const zone = this.zoneFor(p);
      if (!zone) return;
      this.pointers.set(p.id, zone);
      if (zone === 'jump') this.pressQueued = true;
    });
    input.on('pointermove', (p) => {
      const cur = this.pointers.get(p.id);
      if (cur === 'left' || cur === 'right') {
        const zone = this.zoneFor(p);
        if (zone === 'left' || zone === 'right') this.pointers.set(p.id, zone);
      }
    });
    const release = (p) => this.pointers.delete(p.id);
    input.on('pointerup', release);
    input.on('pointerupoutside', release);
    input.on('gameout', () => this.pointers.clear());

    // Keyboard (for testing on a computer): ←/→ or A/D to move, Space/↑/W/Z to jump.
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = input.keyboard
      ? input.keyboard.addKeys({ left: K.LEFT, right: K.RIGHT, a: K.A, d: K.D, up: K.UP, w: K.W, space: K.SPACE, z: K.Z })
      : null;
    if (input.keyboard) input.keyboard.on('keydown', unlockAudio);

    this.clearAll = () => this.pointers.clear();
    window.addEventListener('blur', this.clearAll);
    document.addEventListener('visibilitychange', this.clearAll);
    scene.events.once('shutdown', () => {
      window.removeEventListener('blur', this.clearAll);
      document.removeEventListener('visibilitychange', this.clearAll);
    });

    this.setMode(mode);
  }

  zoneFor(p) {
    const { x, y } = p;
    if (this.mode === 'easy') return x >= W / 2 ? 'jump' : null;
    // Classic: generous zones around the buttons.
    if (x >= W * 0.6 && y >= H * 0.35) return 'jump';
    if (x <= 440 && y >= H * 0.45) return x < (LAYOUT.left.x + LAYOUT.right.x) / 2 ? 'left' : 'right';
    return null;
  }

  setMode(mode) {
    this.mode = mode === 'classic' ? 'classic' : 'easy';
    this.pointers.clear();
    const classic = this.mode === 'classic';
    Object.values(this.buttons).forEach((b) => b.setVisible(classic));
    this.hint.setVisible(!classic && !this.hintDone);
    this.toggleText.setText(classic ? '🎮 Classic' : '🐰 Easy');
  }

  /** Turn game input off/on (off while a maths sign is open). Forgets any held fingers and queued taps. */
  setEnabled(on) {
    this.enabled = on;
    // Hide the touch buttons while the game is paused so nothing looks tappable underneath a sign.
    const classic = this.mode === 'classic';
    Object.values(this.buttons).forEach((b) => b.setVisible(on && classic));
    this.pointers.clear();
    this.pressQueued = false;
    if (this.keys) Object.values(this.keys).forEach((k) => k.reset());
  }

  hideHint() {
    if (this.hintDone) return;
    this.hintDone = true;
    this.scene.tweens.add({ targets: this.hint, alpha: 0, duration: 400, onComplete: () => this.hint.setVisible(false) });
  }

  /** Call once per frame before reading `state`. */
  update() {
    const s = this.state;
    const k = this.keys;
    const held = new Set(this.pointers.values());
    const JD = Phaser.Input.Keyboard.JustDown;
    let keyPress = false;
    if (k) keyPress = JD(k.space) || JD(k.up) || JD(k.w) || JD(k.z);

    s.left = held.has('left') || (k && (k.left.isDown || k.a.isDown)) || false;
    s.right = held.has('right') || (k && (k.right.isDown || k.d.isDown)) || false;
    s.jumpHeld = held.has('jump') || (k && (k.space.isDown || k.up.isDown || k.w.isDown || k.z.isDown)) || false;
    s.jumpPressed = this.pressQueued || keyPress;
    this.pressQueued = false;

    if (!this.enabled) { s.left = s.right = s.jumpHeld = s.jumpPressed = false; }

    this.toggleBg.input.enabled = this.enabled;

    if (this.mode === 'classic') {
      this.buttons.left.setScale(s.left ? 0.9 : 1);
      this.buttons.right.setScale(s.right ? 0.9 : 1);
      this.buttons.jump.setScale(s.jumpHeld ? 0.9 : 1);
    }
  }
}
