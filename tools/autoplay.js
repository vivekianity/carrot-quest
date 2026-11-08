// Browser autopilot (inject after tools/browser-harness.js): plays a level in Easy mode the way a
// child would — jumps at walls and pit edges (double-jumping over wide gaps), answers every maths
// sign — and reports whether the Golden Carrot was reached.  Usage:  await AP.play('2-1')
window.AP = {
  solidAt(s, c, r) {
    const t = s.layer.getTileAt(c, r);
    return !!(t && (t.collides || t.faceTop));
  },
  async play(id, { timeout = 300000 } = {}) {
    await T.go(id);
    const s = T.s();
    s.controls.setMode('easy');
    const t0 = Date.now();
    const log = { id, signs: 0, balloons: 0, jumps: 0, unstuck: 0 };
    let lastX = 0, lastMove = Date.now(), wasBalloon = false, held = 0, airJumped = false, done = false;
    while (Date.now() - t0 < timeout) {
      await T.sleep(40);
      const g = T.g();
      if (g.scene.isActive('LevelComplete')) { done = true; break; }
      const m = T.m();
      if (m.scene.isActive()) {
        T.jumpHeld = false;
        if (m.q && !m.locked) { await T.answer(true); log.signs++; await T.sleep(300); }
        lastMove = Date.now();
        continue;
      }
      if (s.state === 'end') { lastMove = Date.now(); continue; }
      if (s.state === 'balloon') { if (!wasBalloon) log.balloons++; wasBalloon = true; T.jumpHeld = false; lastMove = Date.now(); continue; }
      wasBalloon = false;
      const b = s.heroBody;
      if (Math.abs(b.center.x - lastX) > 6) { lastX = b.center.x; lastMove = Date.now(); }
      const col = Math.floor(b.center.x / 64), feet = Math.floor((b.bottom - 2) / 64);
      const onGround = b.blocked.down || b.touching.down;
      if (held > 0) { held -= 40; T.jumpHeld = held > 0; }
      if (onGround) airJumped = false;
      const ahead = Math.floor((b.right + 20) / 64);
      const wall = AP.solidAt(s, ahead, feet) || AP.solidAt(s, ahead, feet - 1);
      let pit = true;
      for (let r = feet + 1; r < s.level.rows; r++) if (AP.solidAt(s, ahead, r)) { pit = r > feet + 2 ? true : false; break; }
      const nearEdge = pit && (b.right + 20) - ahead * 64 >= 0;
      const stuck = Date.now() - lastMove > 1500;
      if (onGround && held <= 0 && (wall || nearEdge || stuck)) {
        T.jumpQ = true; held = 360; T.jumpHeld = true; log.jumps++;
        if (stuck) { log.unstuck++; lastMove = Date.now(); }
      } else if (!onGround && !airJumped && b.velocity.y > 40) {
        // Falling: double-jump if there's no ground under the next few columns.
        let ground = false;
        for (let c = col; c <= col + 2 && !ground; c++) for (let r = feet + 1; r <= feet + 3; r++) if (AP.solidAt(s, c, r)) { ground = true; break; }
        if (!ground || wall) { T.jumpQ = true; held = 300; T.jumpHeld = true; airJumped = true; log.jumps++; }
      }
    }
    T.jumpHeld = false;
    return { ...log, done, seconds: Math.round((Date.now() - t0) / 1000), stars: done ? T.g().scene.getScene('LevelComplete').r.stars : 0 };
  },
};
'autoplay ok';
