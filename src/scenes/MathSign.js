// MathSign: overlay scene. A wooden sign slides up with the question; the child answers by tapping
// one of the bubbles or, on later levels, by typing on a big number pad.
// 1st miss → the sign wobbles, "Let's count together!", rows of carrots light up as they're counted.
// 2nd miss → the right answer glows and the child taps (or types) it. No red X, no buzzer, no way to fail.
import { sfx, unlockAudio } from '../audio.js';
import { speak, unlockSpeech } from '../speech.js';
import { numberWords } from '../engine/questions.js';
import { NUMPAD_MAX_DIGITS } from '../engine/levels-config.js';
import { createPraise, createDeck } from '../engine/praise.js';

const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif';
const INK = '#5a3518';
const GREEN = '#2f7a24';
const BOARD_Y = 250;
const BUBBLE_Y = 598;
// Encouragement rotates across every sign this session (never the same cheer twice in a row).
const praise = createPraise();
// A few natural ways to ask, so it sounds like a friend talking rather than a machine.
const ASK = createDeck(['{q}?', "What's {q}?", 'How about {q}?', "Let's see. {q}?", 'Can you do {q}?']);
const askLine = (q) => (q.kind === 'missing'
  ? `${q.speech.charAt(0).toUpperCase()}${q.speech.slice(1)}?`
  : ASK.next().replace('{q}', q.speech));
// Number pad: two rows under the sign. Keys are 104 × 94 px (bigger than the 80 px minimum).
const PAD = { rows: [[1, 2, 3, 4, 5, 'back'], [6, 7, 8, 9, 0, 'ok']], x0: 640 - 2.5 * 118, dx: 118, y: [538, 650] };

export class MathSignScene extends Phaser.Scene {
  constructor() { super('MathSign'); }

  init(data) {
    this.q = data.question;
    this.onDone = data.onDone;
    this.onCorrect = data.onCorrect || null;
    this.progress = data.progress || null;   // { index, total } for multi-question boss gates
    this.method = data.method === 'numpad' ? 'numpad' : 'bubbles';
    this.attempts = 0;
    this.locked = true;
    this.startTime = 0;
    this.typed = '';
    this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  create() {
    const q = this.q;
    this.input.on('pointerdown', () => { unlockAudio(); unlockSpeech(); });

    this.backdrop = this.add.rectangle(640, 360, 1280, 720, 0x1d3347, 1).setAlpha(0);
    this.tweens.add({ targets: this.backdrop, alpha: 0.3, duration: 300 });

    // --- The sign -------------------------------------------------------------------------
    this.board = this.add.container(640, 720 + 260);
    const postL = this.add.image(-300, 120, 'signpost').setOrigin(0.5, 0);
    const postR = this.add.image(300, 120, 'signpost').setOrigin(0.5, 0);
    const sign = this.add.image(0, 0, 'sign');
    this.caption = this.add.text(0, -178, '', {
      fontFamily: FONT, fontSize: '38px', fontStyle: 'bold', color: '#ffffff', stroke: INK, strokeThickness: 9,
    }).setOrigin(0.5).setAlpha(0);
    this.speakBtn = this.add.image(408, -140, 'btnSpeak').setScale(0.9).setInteractive({ useHandCursor: true });
    this.speakBtn.on('pointerdown', () => {
      this.tweens.add({ targets: this.speakBtn, scale: 0.8, duration: 90, yoyo: true });
      speak(`${q.speech}?`, { mood: 'question' });
    });
    this.grid = this.add.container(0, 0);
    this.line = this.buildLine();
    this.board.add([postL, postR, sign, this.grid, this.line, this.caption, this.speakBtn]);

    // Boss rounds: a row of little carrots shows how many questions are done.
    if (this.progress) {
      const { index, total } = this.progress;
      for (let i = 0; i < total; i++) {
        const c = this.add.image(-410 + i * 40, -168, 'mini-carrot').setScale(1.3).setAlpha(i < index ? 1 : 0.3);
        if (i === index && !this.reduceMotion) this.tweens.add({ targets: c, alpha: 1, scale: 1.55, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.board.add(c);
      }
    }

    sfx.signUp();
    this.tweens.add({
      targets: this.board, y: BOARD_Y, duration: 650, ease: 'Back.easeOut',
      onComplete: () => {
        const show = () => (this.method === 'numpad' ? this.showPad() : this.showBubbles());
        if (q.flip) this.flipIntro(show); else show();
      },
    });

    this.sparkles = this.add.particles(0, 0, 'sparkle', {
      lifespan: 700, speed: { min: 120, max: 320 }, angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 }, rotate: { min: 0, max: 360 }, emitting: false,
    }).setDepth(20);
  }

  // --- The question line: "3 × 4 = ▢" or "3 × ▢ = 12" ---------------------------------------------
  buildLine() {
    const q = this.q;
    const style = { fontFamily: FONT, fontSize: '124px', fontStyle: 'bold', color: INK };
    const c = this.add.container(0, -6);
    this.before = this.add.text(0, 0, q.before, style).setOrigin(0, 0.5).setShadow(0, 4, '#f6d7a8', 0, false, true);
    this.after = this.add.text(0, 0, q.after, style).setOrigin(0, 0.5).setShadow(0, 4, '#f6d7a8', 0, false, true);
    this.slot = this.add.image(0, 2, 'slot');
    this.slotText = this.add.text(0, 0, '?', { ...style, fontSize: '112px', color: '#b48a5e' }).setOrigin(0.5);
    c.add([this.before, this.slot, this.slotText, this.after]);
    const gap = 26;
    const parts = [q.before ? this.before.width : null, 200, q.after ? this.after.width : null].filter((w) => w !== null);
    const total = parts.reduce((s, w) => s + w, 0) + gap * (parts.length - 1);
    let x = -total / 2;
    if (q.before) { this.before.x = x; x += this.before.width + gap; }
    this.slot.x = this.slotText.x = x + 100; x += 200 + gap;
    if (q.after) this.after.x = x;
    // Very long lines (missing-number questions with 3-digit products) shrink to fit the sign.
    if (total > 840) c.setScale(840 / total);
    this.lineScale = c.scale;
    return c;
  }

  // --- "Flip it!" (GAME_DESIGN §7): the fact the child just learned turns around into this one --------
  flipIntro(done) {
    const q = this.q, f = q.flip;
    const style = { fontFamily: FONT, fontSize: '124px', fontStyle: 'bold', color: INK };
    const mk = (s) => this.add.text(0, 0, s, style).setOrigin(0, 0.5).setShadow(0, 4, '#f6d7a8', 0, false, true);
    // The learned fact, in the same place as the question's "a × b =".
    const A = mk(String(f.a)), X = mk('×'), B = mk(String(f.b)), E = mk('=');
    const sp = mk(' ').width;
    let x = this.before.x;
    const at = {};
    for (const [k, t] of [['A', A], ['X', X], ['B', B], ['E', E]]) { t.x = x; at[k] = x; x += t.width + sp; }
    this.line.add([A, X, B, E]);
    this.before.setAlpha(0);
    this.slot.setAlpha(0.35);
    this.slotText.setAlpha(0.35);
    this.setCaption('Flip it! 🔄');
    speak(`Flip it! ${numberWords(f.a)} times ${numberWords(f.b)} turns around!`, { mood: 'cheer' });
    sfx.whoosh();

    // B jumps over to the front and A dives under to the back: "4 × 3" becomes "3 × 4".
    const newA = at.A;                                   // where the new first number (old B) goes
    const newB = at.A + B.width + sp + X.width + sp;     // where the new second number (old A) goes
    const finish = () => {
      this.tweens.add({ targets: [A, X, B, E], alpha: 0, duration: 220, onComplete: () => [A, X, B, E].forEach((t) => t.destroy()) });
      this.tweens.add({ targets: this.before, alpha: 1, duration: 220 });
      this.tweens.add({ targets: [this.slot, this.slotText], alpha: 1, duration: 220 });
      this.time.delayedCall(260, done);
    };
    if (this.reduceMotion) { this.time.delayedCall(1200, finish); return; }
    this.time.delayedCall(900, () => {
      this.tweens.add({ targets: B, x: newA, duration: 700, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: B, y: -110, duration: 350, yoyo: true, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: A, x: newB, duration: 700, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: A, y: 80, duration: 350, yoyo: true, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: X, scale: 1.25, duration: 350, yoyo: true, ease: 'Sine.easeInOut' });
      this.time.delayedCall(720, () => { sfx.pop(); this.time.delayedCall(500, finish); });
    });
  }

  setSlot(text, color = INK) {
    this.slotText.setText(text).setColor(color);
  }

  // --- Answer bubbles -----------------------------------------------------------------------
  showBubbles() {
    const n = this.q.choices.length;
    const gap = n > 3 ? 270 : 300;
    this.bubbles = this.q.choices.map((value, i) => {
      const x = 640 + (i - (n - 1) / 2) * gap;
      const glow = this.add.image(x, BUBBLE_Y, 'glow').setAlpha(0).setScale(0.9);
      const img = this.add.image(x, BUBBLE_Y, `bubble${i % 4}`).setScale(0);
      const txt = this.add.text(x, BUBBLE_Y - 4, String(value), {
        fontFamily: FONT, fontSize: '92px', fontStyle: 'bold', color: INK, stroke: '#ffffff', strokeThickness: 10,
      }).setOrigin(0.5).setScale(0);
      img.setInteractive(new Phaser.Geom.Circle(90, 88, 88), Phaser.Geom.Circle.Contains);
      const b = { value, img, txt, glow, x, out: false };
      img.on('pointerdown', () => this.choose(b));
      this.tweens.add({ targets: [img, txt], scale: 1, duration: 380, delay: 90 * i, ease: 'Back.easeOut' });
      if (!this.reduceMotion) {
        this.tweens.add({ targets: [img, txt], y: `-=10`, duration: 1100 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 400 + i * 120 });
      }
      return b;
    });
    this.ready();
  }

  ready() {
    speak(askLine(this.q), { queue: !!this.q.flip, mood: 'question' });
    // A short pause so a tap meant for jumping can't answer by accident.
    this.time.delayedCall(650, () => { this.locked = false; this.startTime = this.time.now; });
  }

  choose(b) {
    if (this.locked || b.out) return;
    if (b.value === this.q.answer) { this.success(b.x, BUBBLE_Y, () => this.popBubbles(b)); return; }
    this.fadeOut(b);
    this.miss();
  }

  fadeOut(b) {
    b.out = true;
    b.img.disableInteractive();
    this.tweens.add({ targets: [b.img, b.txt], alpha: 0.28, scale: 0.78, duration: 350, ease: 'Quad.easeOut' });
  }

  popBubbles(b) {
    this.tweens.add({ targets: [b.img, b.txt], scale: 1.35, alpha: 0, duration: 300, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: b.glow, alpha: 0, duration: 200 });
    this.bubbles.forEach((o) => { if (o !== b) this.tweens.add({ targets: [o.img, o.txt], alpha: 0, scale: 0.5, duration: 250 }); });
  }

  // --- Number pad -----------------------------------------------------------------------------
  showPad() {
    this.keys = [];
    PAD.rows.forEach((row, ri) => row.forEach((k, ci) => {
      const x = PAD.x0 + ci * PAD.dx, y = PAD.y[ri];
      const tex = k === 'ok' ? 'keyOk' : k === 'back' ? 'keyBack' : 'key';
      const glow = this.add.image(x, y, 'keyGlow').setAlpha(0);
      const img = this.add.image(x, y, tex).setScale(0).setInteractive({ useHandCursor: true });
      const label = k === 'ok' ? '✓' : k === 'back' ? '⌫' : String(k);
      const txt = this.add.text(x, y - 4, label, {
        fontFamily: FONT, fontSize: k === 'back' ? '50px' : '66px', fontStyle: 'bold', color: k === 'ok' ? '#ffffff' : INK,
        stroke: k === 'ok' ? GREEN : undefined, strokeThickness: k === 'ok' ? 8 : 0,
      }).setOrigin(0.5).setScale(0);
      const key = { k, x, y, img, txt, glow };
      img.on('pointerdown', () => this.pressKey(key));
      this.tweens.add({ targets: [img, txt], scale: 1, duration: 300, delay: 30 * (ri * 6 + ci), ease: 'Back.easeOut' });
      this.keys.push(key);
    }));
    this.okKey = this.keys.find((k) => k.k === 'ok');
    this.setOkEnabled(false);
    // Typing on a real keyboard works too (handy for testing on a computer).
    this.input.keyboard?.on('keydown', (e) => {
      if (/^[0-9]$/.test(e.key)) this.pressKey(this.keys.find((k) => k.k === Number(e.key)));
      else if (e.key === 'Backspace') this.pressKey(this.keys.find((k) => k.k === 'back'));
      else if (e.key === 'Enter') this.pressKey(this.okKey);
    });
    this.ready();
  }

  setOkEnabled(on) {
    this.okKey.img.setAlpha(on ? 1 : 0.45);
    this.okKey.txt.setAlpha(on ? 1 : 0.45);
  }

  pressKey(key) {
    if (!key || this.locked) return;
    this.tweens.add({ targets: [key.img, key.txt], scale: 0.88, duration: 70, yoyo: true });
    if (key.k === 'back') {
      if (!this.typed) return;
      sfx.thunk(1);
      this.typed = this.typed.slice(0, -1);
    } else if (key.k === 'ok') {
      if (!this.typed) return;
      this.submitTyped();
      return;
    } else {
      if (this.typed.length >= NUMPAD_MAX_DIGITS) return;
      if (this.typed === '0') this.typed = '';
      sfx.count(Number(key.k));
      this.typed += String(key.k);
    }
    this.setSlot(this.typed || '?', this.typed ? INK : '#b48a5e');
    this.setOkEnabled(!!this.typed);
    if (this.typed) this.tweens.add({ targets: this.slotText, scale: { from: 1.18, to: 1 }, duration: 160, ease: 'Back.easeOut' });
  }

  submitTyped() {
    const value = Number(this.typed);
    if (value === this.q.answer) {
      this.success(this.okKey.x, this.okKey.y, () => this.hidePad());
      return;
    }
    // Not quite: the number gently wobbles away and the slot is ready for another try.
    this.locked = true;
    const wobble = this.reduceMotion ? [] : [{ angle: -6, duration: 70 }, { angle: 6, duration: 110 }, { angle: 0, duration: 70 }];
    this.tweens.chain({
      targets: this.slotText,
      tweens: [...wobble, { alpha: 0, duration: 260 }],
      onComplete: () => {
        this.typed = '';
        this.slotText.setAlpha(1);
        this.setSlot('?', '#b48a5e');
        this.setOkEnabled(false);
      },
    });
    this.miss();
  }

  hidePad() {
    this.keys.forEach((k, i) => this.tweens.add({ targets: [k.img, k.txt, k.glow], alpha: 0, scale: 0.6, duration: 220, delay: i * 12 }));
  }

  // --- Misses -------------------------------------------------------------------------------
  miss() {
    this.attempts++;
    sfx.tryAgain();
    if (this.attempts === 1) this.countTogether();
    else this.showAnswer();
  }

  setCaption(text) {
    this.caption.setText(text);
    this.tweens.add({ targets: this.caption, alpha: 1, duration: 200 });
  }

  // --- First miss: count together -----------------------------------------------------------
  countTogether() {
    const q = this.q;
    const rowsN = q.rows, perRow = q.perRow;
    this.locked = true;
    if (!this.reduceMotion) {
      this.tweens.add({ targets: this.board, angle: { from: -2.5, to: 2.5 }, duration: 110, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => this.board.setAngle(0) });
    }
    const intro = q.kind === 'missing' ? `Let's count in ${perRow}s!` : "Let's count together!";
    this.setCaption(intro);
    speak(intro, { mood: 'cheer' });
    this.tweens.add({ targets: this.line, y: -98, scale: this.lineScale * 0.74, duration: 400, ease: 'Quad.easeInOut' });

    // `rowsN` groups of `perRow` carrots. Few groups → one row per group with running totals on the right;
    // many groups (e.g. 9 × 4) → one column per group with totals underneath, so nothing gets cramped.
    const cols = rowsN > perRow;
    const areaW = 740, areaH = cols ? 160 : 200, centreY = cols ? 84 : 100;
    const across = cols ? rowsN : perRow, down = cols ? perRow : rowsN;
    const cell = Math.min(80, areaW / across, areaH / down);
    const s = (cell * 0.92) / 54;
    const x0 = -(across * cell) / 2 - (cols ? 0 : 36) + cell / 2;
    const y0 = centreY - (down * cell) / 2 + cell / 2;
    const rows = [];
    for (let r = 0; r < rowsN; r++) {
      const row = [];
      for (let c = 0; c < perRow; c++) {
        const x = cols ? x0 + r * cell : x0 + c * cell;
        const y = cols ? y0 + c * cell : y0 + r * cell;
        const img = this.add.image(x, y, 'carrot').setScale(0).setAlpha(0.35).setTint(0xc9b9a8);
        this.grid.add(img);
        this.tweens.add({ targets: img, scale: s, duration: 220, delay: 300 + (r * perRow + c) * 12, ease: 'Back.easeOut' });
        row.push(img);
      }
      rows.push(row);
    }

    const labelSize = cols ? Phaser.Math.Clamp(Math.round(cell * 0.62), 22, 44) : Phaser.Math.Clamp(Math.round(cell * 0.85), 28, 60);
    const step = 950;
    const start = 1700;
    rows.forEach((row, r) => {
      this.time.delayedCall(start + r * step, () => {
        row.forEach((img, c) => {
          this.tweens.add({ targets: img, alpha: 1, scale: { from: s * 1.35, to: s }, duration: 260, delay: c * 45, ease: 'Back.easeOut', onStart: () => img.clearTint() });
        });
        const total = (r + 1) * perRow;
        const lx = cols ? x0 + r * cell : x0 + perRow * cell + 28;
        const ly = cols ? y0 + down * cell - cell / 2 + 22 : y0 + r * cell;
        const label = this.add.text(lx, ly, String(total), {
          fontFamily: FONT, fontSize: `${labelSize}px`, fontStyle: 'bold', color: INK,
        }).setOrigin(cols ? 0.5 : 0, 0.5).setScale(0);
        this.grid.add(label);
        this.tweens.add({ targets: label, scale: 1, duration: 250, ease: 'Back.easeOut' });
        sfx.count(r);
        speak(String(total), { mood: 'count' });
      });
    });
    this.time.delayedCall(start + rowsN * step + 300, () => {
      this.setCaption('Now you try!');
      const ask = q.kind === 'missing'
        ? `How many ${numberWords(perRow)}s make ${numberWords(q.product)}?`
        : `${q.speech} is…?`;
      speak(ask, { queue: true, mood: 'question' });
      this.locked = false;
    });
  }

  // --- Second miss: the right answer glows --------------------------------------------------
  showAnswer() {
    const ans = this.q.answer;
    const word = numberWords(ans);
    if (this.method === 'bubbles') {
      this.bubbles.forEach((b) => { if (b.value !== ans && !b.out) this.fadeOut(b); });
      const right = this.bubbles.find((b) => b.value === ans);
      this.pulse(right.glow, 0.9);
      this.setCaption(`It's ${ans}! Tap ${ans}.`);
      speak(`It's ${word}! Tap ${word}.`);
      return;
    }
    // Number pad: the digits to type glow, and the answer shows faintly in the slot until typing starts.
    const digits = String(ans).split('').map(Number);
    this.keys.forEach((k) => { this.tweens.killTweensOf(k.glow); k.glow.setAlpha(0); });
    digits.forEach((d) => {
      const k = this.keys.find((key) => key.k === d);
      k.img.setTint(0xffe58a);                     // the key itself turns golden, not just its halo
      this.pulse(k.glow, 1);
    });
    this.pulse(this.okKey.glow, 0.6);
    this.time.delayedCall(650, () => { if (!this.typed) this.setSlot(String(ans), '#d9b98e'); });
    const spell = digits.length > 1 ? ` Type ${digits.join(', ')}.` : ` Type ${ans}.`;
    this.setCaption(`It's ${ans}!${spell}`);
    speak(`It's ${word}!${digits.length > 1 ? ` Type ${digits.map(numberWords).join(', then ')}.` : ` Type ${word}.`}`);
  }

  pulse(glow, alpha) {
    glow.setAlpha(alpha);
    if (!this.reduceMotion) {
      this.tweens.add({ targets: glow, scale: { from: 0.92, to: 1.08 }, alpha: { from: alpha * 0.8, to: alpha }, duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // --- Right answer -------------------------------------------------------------------------
  success(x, y, hideAnswers) {
    this.locked = true;
    const q = this.q;
    const firstTry = this.attempts === 0;
    const ms = this.time.now - this.startTime;
    sfx.correct();
    this.sparkles.explode(this.reduceMotion ? 6 : 18, x, y);
    hideAnswers();

    this.setSlot(String(q.answer), GREEN);
    this.before.setColor(GREEN);
    this.after.setColor(GREEN);
    this.tweens.add({ targets: this.line, scale: this.line.scale * 1.1, duration: 160, yoyo: true });
    const cheer = praise.next(firstTry).text;
    this.setCaption(cheer);
    if (this.onCorrect) this.time.delayedCall(120, () => this.onCorrect());
    const said = q.kind === 'missing'
      ? `${numberWords(q.a)} times ${numberWords(q.b)} is ${numberWords(q.product)}`
      : `${q.speech} is ${numberWords(q.answer)}`;
    speak(`${cheer} ${said}!`, { mood: 'cheer' });

    this.time.delayedCall(firstTry ? 1700 : 2100, () => this.close({ firstTry, attempts: this.attempts + 1, ms }));
  }

  close(result) {
    sfx.signDown();
    this.tweens.add({ targets: this.backdrop, alpha: 0, duration: 400 });
    this.tweens.add({
      targets: this.board, y: 720 + 300, duration: 450, ease: 'Back.easeIn',
      onComplete: () => {
        const done = this.onDone;
        this.scene.stop();
        if (done) done(result);
      },
    });
  }
}
