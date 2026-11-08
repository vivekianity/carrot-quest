// Challenge blocks (GAME_DESIGN §2) and level props, built from the parsed level map.
// Every challenge block: { type, x, question, solved, solve(instant) } — `solve(true)` jumps straight to
// the finished state (used when resuming from a checkpoint).
import { TILE, bridgeRuns, logSpan, liftSteps } from './engine/level-map.js';
import { GATE_PLAQUE } from './art/blocks.js';
import { BOSS_ART } from './art/bosses.js';
import { sfx } from './audio.js';
import { speak } from './speech.js';

export const GRASS_INSET = 4;
export const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif';
const WALL_TOP = -800; // invisible walls reach far above the screen: no jumping over a challenge

const rnd = Phaser.Math.Between;

/** Build all challenge blocks for the level, sorted left to right. */
export function createBlocks(s) {
  const blocks = [];
  for (const o of s.level.objects) {
    if (o.type === 'gate') blocks.push(makeGate(s, o));
    else if (o.type === 'qbox') blocks.push(makeQBox(s, o));
    else if (o.type === 'log') blocks.push(makeLog(s, o));
    else if (o.type === 'lift') blocks.push(makeLift(s, o));
    else if (o.type === 'boss') blocks.push(makeBoss(s, o));
  }
  for (const run of bridgeRuns(s.level)) blocks.push(makeBridge(s, run));
  return blocks.sort((a, b) => a.x - b.x);
}

// ---- Stone Gate ------------------------------------------------------------------------------
function makeGate(s, o) {
  const x = o.col * TILE + TILE / 2;
  const groundY = (o.row + 1) * TILE;
  const img = s.add.image(x, groundY + GRASS_INSET + 2, 'gate').setOrigin(0.5, 1).setDepth(3);
  const text = s.add.text(x, groundY + GRASS_INSET - GATE_PLAQUE.fromBottom, '', {
    fontFamily: FONT, fontSize: '54px', fontStyle: 'bold', color: '#56606c', align: 'center', lineSpacing: -14,
  }).setOrigin(0.5).setDepth(3).setShadow(0, 3, '#ffffff', 0, false, true);
  const gate = {
    type: 'gate', x, groundY, img, text, question: null, solved: false, state: 'closed',
    carve(q) { text.setText(`${q.a}\n×\n${q.b}`); },
    solve(instant) {
      gate.solved = true; gate.state = 'open';
      wall.body.enable = false;
      if (instant) { img.destroy(); text.destroy(); return; }
      crumble(s, gate);
    },
  };
  const wall = s.addSolid(x, (WALL_TOP + groundY) / 2, 96, groundY - WALL_TOP, () => {
    if (gate.state !== 'closed' || !s.canAsk()) return;
    gate.state = 'asking';
    s.ask(gate, () => gate.solve(false));
  });
  return gate;
}

function crumble(s, gate) {
  sfx.crumble();
  if (!s.reduceMotion) s.cameras.main.shake(220, 0.005);
  s.tweens.add({ targets: [gate.img, gate.text], alpha: 0, y: '+=30', duration: 260, onComplete: () => { gate.img.destroy(); gate.text.destroy(); } });
  const cam = s.cameras.main;
  const topY = Math.max(cam.scrollY - 40, gate.groundY - 700);
  const n = s.reduceMotion ? 8 : 26;
  for (let i = 0; i < n; i++) {
    const sy = rnd(topY, gate.groundY - 24);
    const stone = s.add.image(gate.x + rnd(-44, 44), sy, `stone${i % 3}`)
      .setDepth(4).setScale(Phaser.Math.FloatBetween(0.9, 1.7)).setAngle(rnd(0, 360));
    const landY = gate.groundY + GRASS_INSET - 6 + rnd(-4, 6);
    s.tweens.add({
      targets: stone, x: stone.x + rnd(-110, 110), y: landY, angle: stone.angle + rnd(-240, 240),
      duration: 380 + (landY - sy) * 0.9, ease: 'Quad.easeIn',
      onComplete: () => {
        s.tweens.add({ targets: stone, y: landY - 10, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
        s.tweens.add({ targets: stone, alpha: 0, scale: stone.scale * 0.6, delay: 700 + i * 20, duration: 400, onComplete: () => stone.destroy() });
      },
    });
  }
  s.fx.land.explode(s.fxCount(12), gate.x, gate.groundY + GRASS_INSET);
  s.fx.pebble.explode(s.fxCount(16), gate.x, gate.groundY - 40);
}

// ---- Question Box ----------------------------------------------------------------------------
function makeQBox(s, o) {
  const x = o.col * TILE + TILE / 2, y = o.row * TILE + TILE / 2;
  const img = s.add.image(x, y, 'qbox').setDepth(3);
  const breathe = s.tweens.add({ targets: img, scaleX: 1.04, scaleY: 0.97, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const box = {
    type: 'qbox', x, y, img, question: null, solved: false, state: 'full',
    solve(instant) {
      box.solved = true; box.state = 'used';
      breathe.stop();
      img.setTexture('qbox-used').setScale(1).setY(y);
      if (instant) return;
      s.tweens.add({ targets: img, y: y - 16, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
      s.fx.sparkle.explode(s.fxCount(14), x, y - TILE / 2);
      for (let i = 0; i < 5; i++) {
        const c = s.add.image(x, y - 10, 'carrot').setDepth(8).setScale(0.6);
        s.tweens.add({
          targets: c, x: x + (i - 2) * 38, y: y - 110 - (i % 2) * 26, scale: 0.9, angle: (i - 2) * 12,
          duration: 380, delay: i * 60, ease: 'Quad.easeOut', onComplete: () => s.flyToCounter(c, 260 + i * 110),
        });
      }
    },
  };
  s.addSolid(x, y, TILE, TILE, () => {
    if (!s.heroBody.touching.up || box.state !== 'full' || !s.canAsk()) return;
    box.state = 'asking';
    sfx.bump();
    s.tweens.add({ targets: img, y: y - 14, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    s.fx.jump.explode(s.fxCount(4), x, y + TILE / 2);
    s.time.delayedCall(200, () => s.ask(box, () => box.solve(false)));
  });
  return box;
}

// ---- Broken Bridge: planks fly in one by one -------------------------------------------------
function makeBridge(s, run) {
  const surfaceY = run.row * TILE;
  const x0 = run.c0 * TILE, x1 = (run.c1 + 1) * TILE;
  const postL = s.add.image(x0 - 6, surfaceY + GRASS_INSET + 4, 'bridge-post').setOrigin(0.5, 1).setDepth(2);
  const postR = s.add.image(x1 + 6, surfaceY + GRASS_INSET + 4, 'bridge-post').setOrigin(0.5, 1).setDepth(2);
  const sign = s.add.image(x0 - 40, surfaceY + GRASS_INSET + 2, 'sign-q').setOrigin(0.5, 1).setDepth(2).setScale(0.85);
  // a few broken stubs hanging from each side
  const stubL = s.add.image(x0 + 18, surfaceY + 16, 'plank').setDepth(2).setAngle(28).setScale(0.6, 1);
  const stubR = s.add.image(x1 - 18, surfaceY + 16, 'plank').setDepth(2).setAngle(-32).setScale(0.6, 1);
  const rope = s.add.graphics().setDepth(2).setAlpha(0);
  const deck = s.addSolid((x0 + x1) / 2, surfaceY + 12, x1 - x0 + 8, 24);
  deck.body.enable = false;

  const bridge = {
    type: 'bridge', x: x0, question: null, solved: false, state: 'closed',
    solve(instant) {
      bridge.solved = true; bridge.state = 'built';
      wall.body.enable = false;
      s.tweens.add({ targets: sign, alpha: 0, duration: instant ? 0 : 300 });
      stubL.destroy(); stubR.destroy();
      const n = run.c1 - run.c0 + 1;
      for (let i = 0; i < n; i++) {
        const px = x0 + i * TILE + TILE / 2, py = surfaceY + 12;
        const plank = s.add.image(px, py, 'plank').setDepth(3);
        if (instant) continue;
        plank.setPosition(px + rnd(-160, 160), py - 420 - i * 30).setAngle(rnd(-180, 180));
        s.tweens.add({
          targets: plank, x: px, y: py, angle: 0, duration: 420, delay: 250 + i * 190, ease: 'Back.easeOut',
          onComplete: () => { sfx.thunk(i); s.fx.jump.explode(s.fxCount(3), px, py); },
        });
      }
      const finish = () => {
        deck.body.enable = true;
        rope.clear().lineStyle(4, 0x8a5a30, 1);
        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(x0 - 6, surfaceY - 74), new Phaser.Math.Vector2((x0 + x1) / 2, surfaceY - 20), new Phaser.Math.Vector2(x1 + 6, surfaceY - 74));
        curve.draw(rope, 24);
        s.tweens.add({ targets: rope, alpha: 1, duration: instant ? 0 : 400 });
      };
      if (instant) finish();
      else s.time.delayedCall(250 + n * 190 + 300, finish);
    },
  };
  // An invisible wall at the ledge until the bridge is built (this is a challenge, not a jump).
  const wall = s.addSolid(x0 + 8, (WALL_TOP + surfaceY) / 2, 16, surfaceY - WALL_TOP, () => {
    if (bridge.state !== 'closed' || !s.canAsk()) return;
    bridge.state = 'asking';
    s.ask(bridge, () => bridge.solve(false));
  });
  return bridge;
}

// ---- Sleepy Log: beavers pop out and chew it away -------------------------------------------
function makeLog(s, o) {
  const span = logSpan(s.level, o.col, o.row);
  const top = span.topRow * TILE, bottom = (span.bottomRow + 1) * TILE;
  const h = bottom - top;
  const x = o.col * TILE + TILE / 2, cy = (top + bottom) / 2;
  const img = s.add.image(x, cy + 2, 'log').setDepth(3).setScale(h / 132);
  const snooze = s.add.text(x + 40, top + 18, 'z', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffffff', stroke: '#5a3518', strokeThickness: 6 }).setDepth(4);
  const zTween = s.tweens.add({ targets: snooze, y: top - 6, x: x + 52, alpha: { from: 1, to: 0 }, duration: 1800, repeat: -1 });
  const log = {
    type: 'log', x, question: null, solved: false, state: 'closed',
    solve(instant) {
      log.solved = true; log.state = 'gone';
      body.body.enable = false;
      zTween.stop(); snooze.destroy();
      if (instant) { img.destroy(); return; }
      if (!s.anims.exists('beaver-chomp')) {
        s.anims.create({ key: 'beaver-chomp', frames: [{ key: 'beaver0' }, { key: 'beaver1' }], frameRate: 9, repeat: -1 });
      }
      const beavers = [-1, 1].map((side) => {
        const b = s.add.sprite(x + side * 58, bottom + 70, 'beaver0').setOrigin(0.5, 1).setDepth(5).setFlipX(side > 0);
        s.tweens.add({ targets: b, y: bottom + GRASS_INSET, duration: 380, ease: 'Back.easeOut', delay: side > 0 ? 150 : 0, onComplete: () => b.play('beaver-chomp') });
        return b;
      });
      const chips = s.time.addEvent({
        delay: 130, repeat: 12, startAt: 0,
        callback: () => { s.fx.chip.explode(s.fxCount(4), x + rnd(-30, 30), cy + rnd(-30, 30)); sfx.chomp(); },
      });
      s.tweens.add({ targets: img, scale: 0, angle: 30, duration: 1600, delay: 450, ease: 'Sine.easeIn' });
      s.time.delayedCall(2150, () => {
        chips.remove();
        beavers.forEach((b, i) => {
          b.stop(); b.setTexture('beaver0');
          s.tweens.chain({
            targets: b,
            tweens: [
              { y: bottom - 26, duration: 200, ease: 'Quad.easeOut', yoyo: true, delay: i * 120 },
              { y: bottom + 80, duration: 320, ease: 'Back.easeIn', delay: 300 },
            ],
            onComplete: () => b.destroy(),
          });
        });
      });
    },
  };
  const body = s.addSolid(x, cy, 100, h, () => {
    if (log.state !== 'closed' || !s.canAsk()) return;
    log.state = 'asking';
    s.ask(log, () => log.solve(false));
  });
  return log;
}

// ---- Carrot Lift: a beanstalk spirals up the cliff to make stairs -------------------------------
function makeLift(s, o) {
  const geo = liftSteps(s.level, o.col, o.row);
  const cliffX = geo.cliffCol * TILE;
  const baseX = o.col * TILE + TILE / 2;
  const stalkX = cliffX - 70;
  const sign = s.add.image(baseX - 18, geo.groundY + GRASS_INSET + 2, 'sign-q').setOrigin(0.5, 1).setDepth(2).setScale(0.8);
  const sprout = s.add.graphics().setDepth(2);
  sprout.fillStyle(0x6fcd4b).lineStyle(3, 0x2f7a24).fillEllipse(stalkX - 8, geo.groundY - 8, 18, 10).strokeEllipse(stalkX - 8, geo.groundY - 8, 18, 10)
    .fillEllipse(stalkX + 8, geo.groundY - 10, 18, 10).strokeEllipse(stalkX + 8, geo.groundY - 10, 18, 10);
  const stalk = s.add.graphics().setDepth(2);
  const leaves = geo.steps.map((y, i) => {
    const img = s.add.image(cliffX - 52 - (i % 2) * 10, y + 14, 'leaf').setDepth(3).setScale(0).setFlipX(i % 2 === 1);
    const zone = s.addSolid(cliffX - 56, y + 8, 112, 16, null, { oneWay: true });
    zone.body.enable = false;
    return { y, img, zone, shown: false };
  });
  const topY = geo.cliffTopY - 40;

  const drawStalk = (p) => {
    stalk.clear();
    const yEnd = geo.groundY - p * (geo.groundY - topY);
    const pts = [];
    for (let y = geo.groundY; y >= yEnd; y -= 8) pts.push(new Phaser.Math.Vector2(stalkX + Math.sin((geo.groundY - y) / 46) * 26, y));
    if (pts.length < 2) return;
    stalk.lineStyle(16, 0x2f7a24, 1).strokePoints(pts);
    stalk.lineStyle(9, 0x6fcd4b, 1).strokePoints(pts);
    stalk.lineStyle(3, 0xb9f08f, 0.8).strokePoints(pts.map((v) => new Phaser.Math.Vector2(v.x - 2, v.y)));
  };
  const showLeaf = (leaf, instant) => {
    leaf.shown = true;
    leaf.zone.body.enable = true;
    if (instant) { leaf.img.setScale(0.8); return; }
    s.tweens.add({ targets: leaf.img, scale: 0.8, duration: 320, ease: 'Back.easeOut' });
    s.fx.sparkle.explode(s.fxCount(4), leaf.img.x, leaf.y);
  };

  const lift = {
    type: 'lift', x: baseX, question: null, solved: false, state: 'closed',
    solve(instant) {
      lift.solved = true; lift.state = 'grown';
      sign.setAlpha(0.5);
      sprout.destroy();
      if (instant) { drawStalk(1); leaves.forEach((l) => showLeaf(l, true)); return; }
      sfx.grow();
      s.tweens.addCounter({
        from: 0, to: 1, duration: 1700, ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const p = tw.getValue();
          drawStalk(p);
          const y = geo.groundY - p * (geo.groundY - topY);
          leaves.forEach((l) => { if (!l.shown && y <= l.y + 10) showLeaf(l, false); });
        },
        onComplete: () => speak('Climb the beanstalk!'),
      });
    },
  };
  const trigger = s.add.zone(baseX + 10, geo.groundY - 64, TILE + 20, 128);
  s.physics.add.existing(trigger, true);
  s.physics.add.overlap(s.hero, trigger, () => {
    if (lift.state !== 'closed' || !s.canAsk()) return;
    lift.state = 'asking';
    s.ask(lift, () => lift.solve(false));
  });
  return lift;
}

// ---- Boss gate: each world's boss guards a fence gate (5 questions; each right answer = a big yawn) ------
const BOSSES = {
  crow: {
    sound: 'caw', say: 'Caw! No carrots for you!',
    intro: "The grumpy crow won't let us pass! Answer five questions to make it sleepy.",
    asleep: "Shh! The crow is fast asleep. Let's tiptoe past!",
  },
  owl: {
    sound: 'hoot', say: 'Hoo! Who goes there?',
    intro: 'The night owl is wide awake! Answer five questions to make it sleepy.',
    asleep: "Shh! The owl is snoozing. Let's tiptoe past!",
  },
  crab: {
    sound: 'snip', say: 'Snip snap! My beach!',
    intro: 'The grumpy crab is guarding the beach! Answer five questions to make it sleepy.',
    asleep: "Shh! The crab is napping in the sun. Let's tiptoe past!",
  },
  penguin: {
    sound: 'squawk', say: 'Brrr! Nobody passes!',
    intro: 'The bossy penguin is blocking the path! Answer five questions to make it sleepy.',
    asleep: "Shh! The penguin is fast asleep. Let's tiptoe past!",
  },
  raccoon: {
    sound: 'chitter', say: 'All these carrots are mine!',
    intro: 'The Carrot Thief took all the carrots! Answer five questions to make the raccoon sleepy.',
    asleep: 'The Carrot Thief fell asleep, and all the carrots are back!',
    giveBack: 30, sack: true,
  },
};

function makeBoss(s, o) {
  const kind = s.config.boss || 'crow';
  const info = BOSSES[kind];
  const art = BOSS_ART[kind];
  const x = o.col * TILE + TILE / 2;
  const groundY = (o.row + 1) * TILE;
  const g = groundY + GRASS_INSET + 4;
  const doorL = s.add.image(x - 100, g, 'fence-door').setOrigin(0, 1).setDepth(3);
  const doorR = s.add.image(x + 100, g, 'fence-door').setOrigin(0, 1).setDepth(3).setScale(-1, 1); // mirrored, hinged on the right
  s.add.image(x + 128, g, art.perch).setOrigin(0.5, 1).setDepth(3);
  const sack = info.sack ? s.add.image(x + 222, g, 'carrot-sack').setOrigin(0.5, 1).setDepth(3) : null;
  const boss = s.add.sprite(x + 128, g - art.perchH, kind, `${kind}0`).setOrigin(0.5, 0.95).setDepth(4);
  const bob = s.tweens.add({ targets: boss, scaleY: 0.97, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const TOTAL = 5;
  let zzz = null;

  const say = (text) => {
    const t = s.add.text(boss.x - 40, boss.y - 150, text, {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#2a2f3b', backgroundColor: '#ffffff', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(20).setScale(0);
    s.tweens.add({ targets: t, scale: 1, duration: 250, ease: 'Back.easeOut' });
    s.time.delayedCall(2200, () => s.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() }));
  };

  // The Carrot Thief gives back every carrot: they burst out of the sack and fly into the counter.
  const giveBack = () => {
    s.tweens.add({ targets: sack, scaleY: 0.7, scaleX: 1.15, duration: 160, yoyo: true });
    sfx.pop();
    for (let i = 0; i < info.giveBack; i++) {
      const c = s.add.image(sack.x, sack.y - 70, 'carrot').setDepth(8).setScale(0.6);
      s.tweens.add({
        targets: c, x: sack.x + rnd(-200, 200), y: sack.y - rnd(160, 320), angle: rnd(-60, 60), scale: 0.9,
        duration: 420, delay: i * 40, ease: 'Quad.easeOut', onComplete: () => s.flyToCounter(c, 200 + (i % 6) * 60),
      });
    }
    s.time.delayedCall(600, () => s.toast(`🥕 +${info.giveBack} carrots back!`));
  };

  const fallAsleep = (instant) => {
    bob.stop();
    boss.setFrame(`${kind}Sleep`).setScale(1);
    zzz = s.add.text(boss.x + 30, boss.y - 120, 'Zzz', { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#ffffff', stroke: '#2a2f3b', strokeThickness: 8 }).setDepth(5);
    s.tweens.add({ targets: zzz, y: zzz.y - 30, x: zzz.x + 16, alpha: { from: 1, to: 0.2 }, scale: { from: 0.8, to: 1.2 }, duration: 1600, repeat: -1 });
    s.tweens.add({ targets: boss, scaleY: 0.96, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    wall.body.enable = false;
    if (instant) { doorL.setScale(0.12, 1); doorR.setScale(-0.12, 1); if (sack) sack.setScale(0.8, 0.6); return; }
    sfx.snore();
    s.time.addEvent({ delay: 2600, loop: true, callback: () => { if (s.cameras.main.worldView.contains(boss.x, boss.y)) sfx.snore(); } });
    s.time.delayedCall(700, () => {
      sfx.creak();
      s.tweens.add({ targets: doorL, scaleX: 0.12, duration: 700, ease: 'Back.easeOut' });
      s.tweens.add({ targets: doorR, scaleX: -0.12, duration: 700, ease: 'Back.easeOut' });
    });
    if (sack) s.time.delayedCall(1100, giveBack);
  };

  const round = (i) => {
    const q = i === 0 ? block.question : s.picker.next();
    s.ask(block, () => {
      // Each right answer: a big yawn, and the eyelids get heavier.
      boss.setFrame(`${kind}Yawn`);
      sfx.yawn();
      s.hoppy.play('hoppy-dance');
      s.time.delayedCall(1000, () => {
        if (i + 1 < TOTAL) {
          boss.setFrame(`${kind}${i + 1}`);
          s.hoppy.play('hoppy-think');
          s.time.delayedCall(600, () => round(i + 1));
        } else {
          block.solved = true; block.state = 'asleep';
          fallAsleep(false);
          speak(info.asleep);
          s.resumeGame();
        }
      });
    }, { question: q, progress: { index: i, total: TOTAL }, hold: true });
  };

  const block = {
    type: 'boss', kind, x: x - 100, question: null, solved: false, state: 'awake',
    solve(instant) { block.solved = true; block.state = 'asleep'; fallAsleep(instant); },
  };
  const wall = s.addSolid(x, (WALL_TOP + groundY) / 2, 200, groundY - WALL_TOP, () => {
    if (block.state !== 'awake' || !s.canAsk()) return;
    block.state = 'asking';
    s.pauseForCutscene();
    sfx[info.sound]();
    say(info.say);
    s.tweens.add({ targets: boss, y: boss.y - 18, duration: 140, yoyo: true, repeat: 1 });
    speak(info.intro);
    s.time.delayedCall(2400, () => round(0));
  });
  return block;
}

// ---- Props: mushroom, checkpoint flower, Star Carrot, Golden Carrot, water -----------------------
export function createProps(s) {
  const props = { flowers: [], star: null, goal: null };
  const lvl = s.level;

  // Water tiles (the gap under a Broken Bridge)
  for (let r = 0; r < lvl.rows; r++) {
    for (let c = 0; c < lvl.cols; c++) {
      if (lvl.grid[r][c] !== '~') continue;
      const top = r === 0 || lvl.grid[r - 1][c] !== '~';
      const w = s.add.image(c * TILE, r * TILE, top ? `water-top-${s.world}` : `water-${s.world}`).setOrigin(0).setDepth(6).setAlpha(0.92);
      if (top && !s.reduceMotion) s.tweens.add({ targets: w, y: w.y + 3, duration: 900 + (c % 3) * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  for (const o of lvl.objects) {
    const x = o.col * TILE + TILE / 2;
    const groundY = (o.row + 1) * TILE;
    if (o.type === 'mushroom') {
      const img = s.add.image(x, groundY + GRASS_INSET + 2, `bouncy-${s.world}`).setOrigin(0.5, 1).setDepth(3);
      s.addSolid(x, groundY - 74, 100, 20, () => {
        if (!s.heroBody.touching.down) return;
        s.bounce(img);
      }, { oneWay: true, noGround: true });
    } else if (o.type === 'flower') {
      const img = s.add.image(x, groundY + GRASS_INSET + 2, 'flower-bud').setOrigin(0.5, 1).setDepth(2);
      const f = { x, groundY, img, bloomed: false };
      const zone = s.add.zone(x, groundY - 64, TILE, 128);
      s.physics.add.existing(zone, true);
      s.physics.add.overlap(s.hero, zone, () => { if (!f.bloomed && s.state === 'play') s.reachCheckpoint(f); });
      props.flowers.push(f);
    } else if (o.type === 'star') {
      const y = o.row * TILE + TILE / 2;
      const glow = s.add.image(x, y, 'glow').setDepth(2).setScale(0.55).setAlpha(0.8);
      const img = s.add.image(x, y, 'star-carrot').setDepth(3);
      if (!s.reduceMotion) {
        s.tweens.add({ targets: img, y: y - 8, angle: { from: -6, to: 6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        s.tweens.add({ targets: glow, scale: 0.65, alpha: 0.55, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      const zone = s.add.zone(x, y, 60, 70);
      s.physics.add.existing(zone, true);
      props.star = { x, y, img, glow, zone, found: false };
      s.physics.add.overlap(s.hero, zone, () => { if (!props.star.found) s.findStarCarrot(props.star); });
    } else if (o.type === 'goal') {
      const glow = s.add.image(x, groundY - 50, 'glow').setDepth(2).setScale(0.8).setAlpha(0.85);
      const img = s.add.image(x, groundY + GRASS_INSET + 6, 'golden-carrot0').setOrigin(0.5, 1).setDepth(3);
      if (!s.reduceMotion) {
        s.tweens.add({ targets: glow, scale: 0.95, alpha: 0.6, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        s.tweens.add({ targets: img, angle: { from: -3, to: 3 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        s.time.addEvent({ delay: 500, loop: true, callback: () => s.fx.sparkle.explode(1, x + rnd(-40, 40), groundY - rnd(20, 120)) });
      }
      const zone = s.add.zone(x, groundY - 60, 80, 120);
      s.physics.add.existing(zone, true);
      props.goal = { x, groundY, img, glow };
      s.physics.add.overlap(s.hero, zone, () => s.reachGoal(props.goal));
    }
  }
  return props;
}
