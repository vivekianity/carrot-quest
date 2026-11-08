// Dev-only browser test helper. Paste into the console (or load with a <script> tag) — never shipped.
window.T = {
  g: () => window.carrotQuest,
  s: () => window.carrotQuest.scene.getScene('Level'),
  m: () => window.carrotQuest.scene.getScene('MathSign'),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  dir: null, jumpQ: false, jumpHeld: false,
  patch() {
    const c = T.s().controls;
    c.setMode('classic');
    if (c.__patched) return;
    c.__patched = true;
    const orig = c.update.bind(c);
    c.update = function () {
      orig();
      if (!this.enabled) return;
      if (T.dir === 'left') this.state.left = true;
      if (T.dir === 'right') this.state.right = true;
      if (T.jumpHeld) this.state.jumpHeld = true;
      if (T.jumpQ) { this.state.jumpPressed = true; this.state.jumpHeld = true; T.jumpQ = false; }
    };
  },
  async waitSign(ms = 20000) {
    const t = Date.now();
    while (Date.now() - t < ms) { const m = T.m(); if (m.scene.isActive() && m.q && !m.locked) return true; await T.sleep(100); }
    return false;
  },
  async waitClosed(ms = 15000) {
    const t = Date.now();
    while (Date.now() - t < ms) { if (!T.m().scene.isActive()) return true; await T.sleep(100); }
    return false;
  },
  async answer(right = true) {
    const m = T.m();
    if (m.method === 'numpad') {
      const v = String(right ? m.q.answer : m.q.answer + 1);
      for (const d of v) { m.pressKey(m.keys.find((k) => k.k === Number(d))); await T.sleep(150); }
      await T.sleep(150); m.pressKey(m.okKey);
    } else {
      const b = m.bubbles.find((b) => (right ? b.value === m.q.answer : b.value !== m.q.answer && !b.out));
      m.choose(b);
    }
  },
  tp(col, row = 13) { const h = T.s().hero.body; h.reset(col * 64 + 32, row * 64 - 35); },
  pos() {
    const s = T.s(), b = s.hero.body;
    return { col: +(b.center.x / 64).toFixed(2), bottom: Math.round(b.bottom), vx: Math.round(b.velocity.x), vy: Math.round(b.velocity.y),
      slope: !!s.onSlope, swim: !!s.swimming, state: s.state };
  },
  async go(level) {
    const m = T.m(); if (m.scene.isActive()) m.scene.stop();
    T.dir = null; T.jumpQ = false; T.jumpHeld = false;
    T.g().scene.getScenes(true).forEach((sc) => { if (sc.scene.key !== 'Level') sc.scene.stop(); });
    T.g().scene.start('Level', { levelId: level });
    await T.sleep(1200);
    T.patch();
    return 'ok';
  },
};
'harness ok';
