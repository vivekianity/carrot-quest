// World elements (GAME_DESIGN §3): moving turtles and drifting clouds, snowballs rolling down slopes,
// smooth surface strips for slopes and rainbow slides, and swimming water.
import { TILE, SLOPES, movers, slopeAt, surfaceBelow, isGround } from './engine/level-map.js';
import { PALETTES } from './art/tiles.js';
import { sfx } from './audio.js';

const DOCK_MS = 1500;     // a ride waits this long at each end, so it's easy to hop on and off
const RAINBOW = [0xff6b6b, 0xffa94d, 0xffe066, 0x69db7c, 0x4dabf7, 0x9775fa];

export function createElements(s) {
  const el = { movers: [], snowballs: [], spawners: [], riding: null, ridingAt: -1 };
  drawSlopes(s);
  drawSwimWater(s);
  createMovers(s, el);
  createSpawners(s, el);
  return el;
}

// ---- Slopes and rainbow slides: one smooth strip per run of slope tiles ------------------------------
function slopeRuns(level) {
  const runs = [];
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      const ch = level.grid[r][c];
      const sl = SLOPES[ch];
      if (!sl) continue;
      const pr = r + sl.rise; // the previous tile of the same run is one column left, one row up/down
      if (c > 0 && pr >= 0 && pr < level.rows && level.grid[pr][c - 1] === ch) continue;
      let n = 1;
      while (c + n < level.cols && level.grid[r - sl.rise * n]?.[c + n] === ch) n++;
      runs.push({ ch, c0: c, r0: r, n, ...sl });
    }
  }
  return runs;
}

function drawSlopes(s) {
  const pal = PALETTES[s.world];
  const hex = (c) => Phaser.Display.Color.HexStringToColor(c).color;
  for (const run of slopeRuns(s.level)) {
    const x0 = run.c0 * TILE, x1 = (run.c0 + run.n) * TILE;
    const y0 = run.rise > 0 ? (run.r0 + 1) * TILE : run.r0 * TILE;
    const y1 = y0 - run.rise * run.n * TILE;
    const g = s.add.graphics().setDepth(0.5);
    const band = (off, thick, color, alpha = 1) => {
      g.fillStyle(color, alpha).beginPath();
      g.moveTo(x0, y0 + off); g.lineTo(x1, y1 + off); g.lineTo(x1, y1 + off + thick); g.lineTo(x0, y0 + off + thick);
      g.closePath().fillPath();
    };
    if (run.solid) {
      band(0, 22, hex(pal.top[1]));
      band(0, 12, hex(pal.top[0]));
      g.lineStyle(4, hex(pal.out), 1).lineBetween(x0, y0, x1, y1);
      g.lineStyle(3, hex(pal.topShine), 0.7).lineBetween(x0 + 6, y0 + 8 - run.rise * 6, x1 - 6, y1 + 8 + run.rise * 6);
    } else {
      // Rainbow: six stripes under the surface line, with soft cloud puffs at both ends.
      RAINBOW.forEach((col, i) => band(i * 6, 6, col));
      g.lineStyle(4, 0xffffff, 1).lineBetween(x0, y0, x1, y1);
      g.lineStyle(3, 0xb0659a, 0.8).lineBetween(x0, y0 + 37, x1, y1 + 37);
      for (const [x, y] of [[x0, y0], [x1, y1]]) {
        s.add.image(x, y + 26, 'snow-puff').setScale(2.6, 2).setDepth(0.6).setTint(0xfff4fb);
        s.add.image(x + 20, y + 30, 'snow-puff').setScale(1.8, 1.4).setDepth(0.6).setTint(0xffe6f3);
      }
    }
  }
}

// ---- Swimming water: see-through, with light rays; Hoppy shows through it ---------------------------
function drawSwimWater(s) {
  const lvl = s.level;
  for (let r = 0; r < lvl.rows; r++) {
    for (let c = 0; c < lvl.cols; c++) {
      if (lvl.grid[r][c] !== 'w') continue;
      const top = r === 0 || lvl.grid[r - 1][c] !== 'w';
      const w = s.add.image(c * TILE, r * TILE, top ? 'swim-top' : 'swim').setOrigin(0).setDepth(6).setAlpha(0.55);
      if (top && !s.reduceMotion) s.tweens.add({ targets: w, y: w.y + 3, duration: 1000 + (c % 3) * 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}

// ---- Turtles and drifting clouds: ride them across water and wide gaps --------------------------------
function createMovers(s, el) {
  if (!s.anims.exists('turtle-paddle')) {
    s.anims.create({ key: 'turtle-paddle', frames: [{ key: 'turtle0' }, { key: 'turtle1' }], frameRate: 4, repeat: -1 });
  }
  for (const m of movers(s.level)) {
    const turtle = m.type === 'turtle';
    const surfaceY = turtle ? m.y - 4 : m.y - 64; // turtles float at the water line; clouds sit in their row
    const zone = s.add.zone(m.x0, surfaceY + 8, 132, 16);
    s.physics.add.existing(zone);
    const b = zone.body;
    b.setAllowGravity(false);
    b.setImmovable(true);
    b.pushable = false;
    b.checkCollision.down = b.checkCollision.left = b.checkCollision.right = false;
    const sprite = turtle
      ? s.add.sprite(m.x0, surfaceY + 50, 'turtle0').setOrigin(0.5, 0.82).setDepth(6.5).play('turtle-paddle')
      : s.add.image(m.x0, surfaceY + 34, 'cloud-platform').setOrigin(0.5, 0.55).setDepth(3);
    const mover = {
      ...m, zone, sprite, turtle, surfaceY, dir: 1, speed: turtle ? 120 : 125, dock: DOCK_MS, docked: 'min',
      offsetY: sprite.y - zone.y,
    };
    s.physics.add.collider(s.hero, zone, () => {
      if (!s.heroBody.touching.down) return;
      s.staticGroundAt = s.time.now;
      el.riding = mover;
      el.ridingAt = s.time.now;
    });
    el.movers.push(mover);
  }
}

function updateMovers(s, el, dt) {
  for (const m of el.movers) {
    const b = m.zone.body;
    if (m.dock > 0) {
      m.dock -= dt;
      b.setVelocityX(0);
    } else {
      const x = b.center.x;
      const target = m.dir > 0 ? m.x1 : m.x0;
      const dist = Math.abs(target - x);
      if (dist < 3 || (m.dir > 0 ? x > target : x < target)) {
        b.reset(target, b.center.y);
        m.docked = m.dir > 0 ? 'max' : 'min';
        m.dir = -m.dir;
        m.dock = DOCK_MS;
        b.setVelocityX(0);
      } else {
        m.docked = null;
        // ease in and out near the ends
        const v = m.speed * Phaser.Math.Clamp(Math.min(dist, Math.abs(x - (m.dir > 0 ? m.x0 : m.x1))) / 90, 0.3, 1);
        b.setVelocityX(v * m.dir);
      }
    }
    m.sprite.x = b.center.x;
    m.sprite.y = b.center.y + m.offsetY + (m.turtle ? Math.sin(s.time.now / 300 + m.col) * 2 : Math.sin(s.time.now / 500 + m.col) * 3);
    if (m.turtle) m.sprite.setFlipX(b.velocity.x < 0 || (b.velocity.x === 0 && m.dir < 0));
  }
}

/**
 * Easy mode: Hoppy waits at the edge until a ride is there, stays still while riding,
 * and hops off when it reaches the other side.
 */
function shouldWait(s, el) {
  const hb = s.heroBody;
  const riding = el.riding && s.time.now - el.ridingAt < 120 ? el.riding : null;
  if (riding) return riding.docked !== 'max';
  if (!s.isGrounded()) return false;
  for (const m of el.movers) {
    const edge = m.x0 - 66;                       // left end of the ride at its starting dock
    if (hb.center.x > edge - 150 && hb.center.x < edge + 10 && m.docked !== 'min') return true;
  }
  return false;
}

// ---- Snowballs: roll down the slope from a spawner; a gentle bump if one touches Hoppy -------------------
function createSpawners(s, el) {
  for (const o of s.level.objects) {
    if (o.type !== 'snowball') continue;
    const x = o.col * TILE + TILE / 2;
    // Roll toward the lower side.
    const left = surfaceBelow(s.level, x - TILE, o.row * TILE) ?? 0;
    const right = surfaceBelow(s.level, x + TILE, o.row * TILE) ?? 0;
    el.spawners.push({ x, y: (o.row + 1) * TILE, dir: left > right ? -1 : 1, timer: 1200 + el.spawners.length * 900 });
  }
}

function spawnSnowball(s, el, sp) {
  const img = s.add.image(sp.x, sp.y, 'snowball').setOrigin(0.5, 1).setDepth(4).setScale(0.3);
  s.tweens.add({ targets: img, scale: 1, duration: 300, ease: 'Back.easeOut' });
  el.snowballs.push({ img, x: sp.x, y: sp.y, dir: sp.dir, vx: 40, start: sp.x, dead: false });
}

function poof(s, ball) {
  ball.dead = true;
  sfx.poof();
  s.fx.snow.explode(s.fxCount(10), ball.x, ball.y - 26);
  s.tweens.add({ targets: ball.img, scale: 1.3, alpha: 0, duration: 200, onComplete: () => ball.img.destroy() });
}

function updateSnowballs(s, el, dt) {
  const cam = s.cameras.main.worldView;
  for (const sp of el.spawners) {
    if (Math.abs(sp.x - cam.centerX) > 1400) continue;
    sp.timer -= dt;
    if (sp.timer <= 0) {
      sp.timer = 3600;
      if (Math.abs(s.heroBody.center.x - sp.x) > 140) spawnSnowball(s, el, sp); // never right on top of Hoppy
    }
  }
  const hb = s.heroBody;
  for (const ball of el.snowballs) {
    if (ball.dead) continue;
    const sl = slopeAt(s.level, ball.x, ball.y);
    const downhill = sl && Math.sign(-sl.rise) === ball.dir;
    ball.vx = Math.min(ball.vx + (downhill ? 520 : -60) * (dt / 1000), 380);
    if (ball.vx < 30) ball.vx = 30;
    ball.x += ball.dir * ball.vx * (dt / 1000);
    const surf = surfaceBelow(s.level, ball.x, ball.y - 30);
    if (surf === null) { ball.y += 8; } else ball.y = surf;
    ball.img.setPosition(ball.x, ball.y + 4);
    ball.img.rotation += (ball.dir * ball.vx * (dt / 1000)) / 28;
    const wall = isGround(s.level, Math.floor((ball.x + ball.dir * 30) / TILE), Math.floor((ball.y - 30) / TILE));
    if (wall || Math.abs(ball.x - ball.start) > TILE * 9 || ball.y > s.level.height) { poof(s, ball); continue; }
    // Touching Hoppy?
    const cx = ball.x, cy = ball.y - 28;
    const nx = Phaser.Math.Clamp(cx, hb.left, hb.right), ny = Phaser.Math.Clamp(cy, hb.top, hb.bottom);
    if ((cx - nx) ** 2 + (cy - ny) ** 2 < 26 * 26 && s.state === 'play') {
      if (hb.velocity.y > 0 && hb.bottom < cy) s.bounceOff(ball.img, 760);   // landed on top: a little boing
      else s.knockBack(ball.dir);
      poof(s, ball);
    }
  }
  el.snowballs = el.snowballs.filter((b) => !b.dead || b.img.active);
}

export function updateElements(s, el, dt) {
  updateMovers(s, el, dt);
  updateSnowballs(s, el, dt);
}

export { shouldWait };
