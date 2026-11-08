// Level scene: terrain, parallax, Hoppy, controls, challenge blocks, carrots, checkpoints,
// balloon rescue, camera, and the Golden Carrot ending.
import {
  parseLevel, tileData, surfaceBelow, findSafeSpot, isGround, isWater, isSwim, isIce, slopeAt, SLOPES,
  TILE, PLATFORM_BASE, ICE_BASE,
} from '../engine/level-map.js';
import { JumpAssist, PHYS, approach, gravityMult, cutJump } from '../engine/jump.js';
import { levelConfig, ENDLESS } from '../engine/levels-config.js';
import { createMastery } from '../engine/mastery.js';
import { makeEndlessLevel, newEndlessSeed } from '../engine/endless.js';
import { createQuestionPicker } from '../engine/questions.js';
import { starsFor } from '../engine/scoring.js';
import { newlyMasteredTables } from '../engine/stickers.js';
import { HOPPY_FOOT_Y, HOPPY_PAW } from '../art/hoppy.js';
import { Controls } from '../controls.js';
import { createHoppyAnims } from '../anims.js';
import { soundToggles } from '../menu.js';
import { sfx, startMusic, duckMusic, audioSettings } from '../audio.js';
import { DECOR_MIX, DECOR_FRONT } from '../art/tiles.js';
import { WORLD_COLORS } from '../art/worlds.js';
import { createElements, updateElements, shouldWait } from '../elements.js';
import { speak, stopSpeech } from '../speech.js';
import { settings, progress, checkpoints, masteryStore } from '../save.js';
import { LEVEL_MAPS, nextLevelId } from '../levels/index.js';
import { createBlocks, createProps, GRASS_INSET, FONT } from '../blocks.js';

const VIEW_W = 1280, VIEW_H = 720;
const BODY_W = 44, BODY_H = 70;
const PARALLAX = { clouds: 0.06, far: 0.15, mid: 0.38, near: 0.65 };
const HUD = { x: 1140, y: 62 };
const GATE_LOOKAHEAD = 900;     // carve a gate's question when Hoppy gets this close
const BOUNCE = { normal: 1080, super: 1560 };
const CHEER_MS = 1000;           // how long Hoppy keeps dancing after a sign closes

export class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    const id = data && data.levelId;
    this.endless = id === ENDLESS.id;
    if (this.endless) {
      // Endless Meadow: the saved round and its map seed (so a checkpoint can be resumed after leaving).
      const e = progress.endless;
      if (!e.seed) { e.seed = newEndlessSeed(); progress.endless = { round: e.round, seed: e.seed }; }
      this.levelId = ENDLESS.id;
      this.round = e.round;
      this.levelDef = makeEndlessLevel(e.round, e.seed);
    } else {
      this.levelId = (id && LEVEL_MAPS[id]) ? id : '1-1';
      this.levelDef = LEVEL_MAPS[this.levelId];
    }
    this.config = levelConfig(this.levelDef.questions || this.levelId);
    this.world = this.levelDef.world || 'meadow';
  }

  create() {
    this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.leaving = false;   // scenes are reused between visits
    const lvl = this.level = parseLevel(this.levelDef.map);
    this.maxScrollY = Math.max(0, lvl.height - VIEW_H);

    const [sky, ground] = WORLD_COLORS[this.world];
    document.documentElement.style.setProperty('--sky', sky);
    document.documentElement.style.setProperty('--ground', ground);
    audioSettings.music = settings.music;
    audioSettings.sound = settings.sound;
    startMusic(this.world);
    this.events.once('shutdown', () => duckMusic(false));

    this.createBackground(this.world);
    this.createTerrain();
    this.createDecor();
    this.createHoppy();
    this.createEffects();
    this.elements = createElements(this);

    // The child's learning record: missed facts come back more often, and learned ones get a "flip it!".
    this.mastery = createMastery(masteryStore.load());
    this.picker = createQuestionPicker(this.config, { mastery: this.mastery });
    if (this.levelId !== 'test') progress.lastLevel = this.levelId;
    this.events.once('shutdown', () => this.keepUnseenFlips());
    this.stats = { challenges: 0, firstTry: 0 };
    this.starFound = false;
    this.blocks = createBlocks(this);
    this.props = createProps(this);
    this.createCarrots();
    this.createHud();

    this.controls = new Controls(this, settings.controlMode);
    this.controls.onModeChange = (m) => { settings.controlMode = m; };

    this.resumeFromCheckpoint();

    // Camera: smooth follow with a little look-ahead in the running direction.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, lvl.width, lvl.height);
    cam.startFollow(this.hoppy, true, 0.09, 0.07);
    cam.setFollowOffset(-140, 40);
    cam.centerOn(this.hoppy.x + 140, this.hoppy.y - 40);
    this.physics.world.setBounds(0, -800, lvl.width, lvl.height + 800, true, true, false, false);
    this.cameras.main.fadeIn(350, 255, 255, 255);
  }

  // ---- World ----------------------------------------------------------------------------
  createBackground(world) {
    this.add.image(0, 0, `bg-${world}-sky`).setOrigin(0).setScrollFactor(0).setDepth(-100);
    this.bg = ['clouds', 'far', 'mid', 'near'].map((name, i) => {
      const key = `bg-${world}-${name}`;
      const tex = this.textures.get(key).getSourceImage();
      const ts = this.add.tileSprite(0, 0, VIEW_W, tex.height, key).setOrigin(0).setScrollFactor(0).setDepth(-90 + i);
      return { ts, f: PARALLAX[name], drift: name === 'clouds' ? 0.008 : 0 };
    });
  }

  updateBackground(time) {
    const cam = this.cameras.main;
    // Layers sit at their designed height when the camera is at the bottom of the level, and slide
    // down (revealing more sky) as Hoppy climbs.
    for (const { ts, f, drift } of this.bg) {
      ts.tilePositionX = cam.scrollX * f + time * drift;
      ts.y = (this.maxScrollY - cam.scrollY) * f;
    }
  }

  createTerrain() {
    const lvl = this.level;
    const map = this.make.tilemap({ data: tileData(lvl), tileWidth: TILE, tileHeight: TILE });
    const key = `tiles-${this.world}`;
    const tileset = map.addTilesetImage(key, key, TILE, TILE, 1, 2);
    this.layer = map.createLayer(0, tileset, 0, 0).setDepth(0);
    // Ground and ice are solid on every face; floating platforms only from above (jump up through them).
    // Slopes are not tiles to collide with: Hoppy follows their surface in snapToSlope().
    const solid = [...Array(PLATFORM_BASE + 4).keys(), ...Array.from({ length: 16 }, (_, i) => ICE_BASE + i)];
    this.layer.setCollision(solid);
    this.layer.forEachTile((t) => { if (t.index >= PLATFORM_BASE && t.index < PLATFORM_BASE + 4) t.setCollision(false, false, true, false); });
  }

  /** Tiles beside a slope don't snag Hoppy while she's on the slope (she follows the slope's surface). */
  tileCollides(tile) {
    const c = Math.floor(this.heroBody.center.x / TILE);
    if (tile.x === c) return true;
    return !SLOPES[this.level.grid[tile.y]?.[c]];
  }

  createDecor() {
    const lvl = this.level;
    let seed = 1234;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const kinds = DECOR_MIX[this.world];
    const busy = new Set();
    for (const o of lvl.objects) if (o.type !== 'carrot') for (let d = -2; d <= 2; d++) busy.add(o.col + d);
    for (let c = 0; c < lvl.cols; c++) {
      if (busy.has(c) || Math.abs(c - lvl.start.col) < 2) continue;
      for (let r = 1; r < lvl.rows; r++) {
        if (!isGround(lvl, c, r) || lvl.grid[r - 1][c] !== '.') continue;
        if (!isGround(lvl, c - 1, r) || !isGround(lvl, c + 1, r)) continue; // keep ledge edges clean
        if (rand() > 0.42) continue;
        const kind = kinds[Math.floor(rand() * kinds.length)];
        const x = c * TILE + 12 + rand() * (TILE - 24);
        if (lvl.grid[r][c] === 'I') continue; // keep the ice clear
        const d = this.add.image(x, r * TILE + GRASS_INSET + 3, `decor-${this.world}-${kind}`).setOrigin(0.5, 1).setDepth(1);
        if (rand() < 0.5) d.setFlipX(true);
        if (DECOR_FRONT.has(kind)) d.setDepth(6); // little tufts sit in front of Hoppy's feet
      }
    }
  }

  /** A static solid (or one-way) body; `onTouch` runs on contact. Standing on it counts as ground. */
  addSolid(x, y, w, h, onTouch = null, { oneWay = false, noGround = false } = {}) {
    const zone = this.add.zone(x, y, w, h);
    this.physics.add.existing(zone, true);
    if (oneWay) {
      zone.body.checkCollision.down = false;
      zone.body.checkCollision.left = false;
      zone.body.checkCollision.right = false;
    }
    this.physics.add.collider(this.hero, zone, () => {
      if (!noGround && this.heroBody.touching.down) this.staticGroundAt = this.time.now;
      if (onTouch) onTouch();
    });
    return zone;
  }

  isGrounded() {
    return this.heroBody.blocked.down || this.time.now - this.staticGroundAt < 20 || !!this.onSlope;
  }

  // ---- Hoppy ----------------------------------------------------------------------------
  createHoppy() {
    const lvl = this.level;
    const sx = lvl.start.col * TILE + TILE / 2;
    const sy = (lvl.start.row + 1) * TILE - BODY_H / 2;

    // Physics lives on an invisible zone; the sprite only follows it, so squash & stretch never
    // changes the collision box.
    this.hero = this.add.zone(sx, sy, BODY_W, BODY_H);
    this.physics.add.existing(this.hero);
    this.heroBody = this.hero.body;
    this.heroBody.setCollideWorldBounds(true);
    this.heroBody.setMaxVelocity(1000, 1700);
    this.physics.add.collider(this.hero, this.layer, null, (_h, tile) => this.tileCollides(tile));
    this.staticGroundAt = -1;
    this.onSlope = null;
    this.swimming = false;

    this.shadow = this.add.image(sx, sy, 'shadow').setDepth(2);
    this.hoppy = this.add.sprite(sx, sy + BODY_H / 2 + GRASS_INSET, 'hoppy', 'idle0').setOrigin(0.5, HOPPY_FOOT_Y).setDepth(5);
    this.squash = { x: 1, y: 1 };

    createHoppyAnims(this.anims);
    this.hoppy.play('hoppy-idle');

    this.jump = new JumpAssist(PHYS);
    this.facing = 1;
    this.state = 'play';           // play | balloon | end
    this.wasGrounded = true;
    this.fallSpeed = 0;
    this.landTimer = 0;
    this.flapTimer = 0;
    this.puffTimer = 0;
    this.autoRunDelay = 400;       // short pause before Easy mode starts running
    this.lastSafeX = sx;
    this.cheerTimer = 0;
    this.signOpen = false;
  }

  createEffects() {
    const few = this.reduceMotion;
    const base = { lifespan: 420, alpha: { start: 0.95, end: 0 }, emitting: false, gravityY: -60 };
    this.fx = {
      land: this.add.particles(0, 0, 'puff', { ...base, speed: { min: 60, max: 170 }, angle: { min: 190, max: 350 }, scale: { start: 0.75, end: 0.15 } }).setDepth(7),
      run: this.add.particles(0, 0, 'puff', { ...base, lifespan: 360, speed: { min: 20, max: 60 }, angle: { min: 220, max: 320 }, scale: { start: 0.45, end: 0.1 } }).setDepth(4),
      jump: this.add.particles(0, 0, 'puff', { ...base, speed: { min: 40, max: 110 }, angle: { min: 160, max: 380 }, scale: { start: 0.55, end: 0.1 } }).setDepth(7),
      pebble: this.add.particles(0, 0, 'pebble', { lifespan: 900, speed: { min: 150, max: 380 }, angle: { min: 200, max: 340 }, gravityY: 1300, scale: { start: 1.4, end: 0.8 }, rotate: { min: 0, max: 360 }, alpha: { start: 1, end: 0 }, emitting: false }).setDepth(7),
      chip: this.add.particles(0, 0, 'chip', { lifespan: 700, speed: { min: 120, max: 300 }, angle: { min: 200, max: 340 }, gravityY: 1100, scale: { start: 1.6, end: 1 }, rotate: { min: 0, max: 360 }, alpha: { start: 1, end: 0 }, emitting: false }).setDepth(7),
      splash: this.add.particles(0, 0, 'puff', { lifespan: 600, speed: { min: 150, max: 340 }, angle: { min: 240, max: 300 }, gravityY: 1000, tint: 0x9fdcff, scale: { start: 0.7, end: 0.2 }, alpha: { start: 1, end: 0 }, emitting: false }).setDepth(7),
      bubble: this.add.particles(0, 0, 'bubble', { lifespan: 1400, speedY: { min: -120, max: -60 }, speedX: { min: -20, max: 20 }, scale: { start: 0.6, end: 1.1 }, alpha: { start: 0.9, end: 0 }, emitting: false }).setDepth(7),
      snow: this.add.particles(0, 0, 'snow-puff', { lifespan: 600, speed: { min: 80, max: 240 }, angle: { min: 190, max: 350 }, gravityY: 700, scale: { start: 0.9, end: 0.2 }, alpha: { start: 1, end: 0 }, emitting: false }).setDepth(7),
      slide: this.add.particles(0, 0, 'rainbow-spark', { lifespan: 500, speed: { min: 20, max: 80 }, scale: { start: 1, end: 0 }, tint: [0xff6b6b, 0xffe066, 0x69db7c, 0x4dabf7, 0x9775fa], emitting: false }).setDepth(7),
      crumb: this.add.particles(0, 0, 'crumb', { lifespan: 600, speed: { min: 80, max: 200 }, angle: { min: 200, max: 340 }, gravityY: 900, scale: { start: 1, end: 0.4 }, emitting: false }).setDepth(8),
      sparkle: this.add.particles(0, 0, 'sparkle', { lifespan: 600, speed: { min: 60, max: 180 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 }, rotate: { min: 0, max: 360 }, emitting: false }).setDepth(8),
      // Right answer: little hearts and stars float up around Hoppy.
      hearts: this.add.particles(0, 0, 'heart', { lifespan: 1100, speedY: { min: -220, max: -110 }, speedX: { min: -120, max: 120 }, gravityY: 80, scale: { start: 0.9, end: 0.3 }, alpha: { start: 1, end: 0 }, rotate: { min: -25, max: 25 }, tint: [0xff6b8b, 0xff9ec0, 0xffc2d4], emitting: false }).setDepth(8),
      stars: this.add.particles(0, 0, 'sparkle', { lifespan: 900, speed: { min: 120, max: 280 }, angle: { min: 200, max: 340 }, gravityY: 300, scale: { start: 1.4, end: 0 }, rotate: { min: 0, max: 360 }, tint: [0xffd23f, 0xfff3a0, 0x8fd3ff, 0xb4f08a], emitting: false }).setDepth(8),
    };
    this.fxCount = (n) => (few ? Math.max(1, Math.ceil(n / 3)) : n);
    this.balloonString = this.add.graphics().setDepth(4);
  }

  // ---- Main loop --------------------------------------------------------------------------
  update(time, delta) {
    const dt = Math.min(delta, 50);
    this.controls.update();
    const input = this.controls.state;
    const b = this.heroBody;

    if (this.signOpen) {           // physics is paused and game input ignored while a sign is up
      this.updateBackground(time);
      return;
    }
    this.carveUpcomingGates();

    if (this.state === 'play') {
      updateElements(this, this.elements, dt);
      this.snapToSlope();
      const grounded = this.isGrounded();
      const easy = this.controls.mode === 'easy';
      if (this.autoRunDelay > 0) this.autoRunDelay -= dt;
      const swim = this.updateSwimming(dt);

      // Horizontal movement
      let dir = easy ? (this.autoRunDelay > 0 ? 0 : 1) : (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (easy && dir > 0 && shouldWait(this, this.elements)) dir = 0; // wait for the turtle / cloud
      let speed = easy ? PHYS.easyRunSpeed : PHYS.runSpeed;
      let accelRate = grounded ? PHYS.groundAccel : PHYS.airAccel;
      if (swim) { speed *= PHYS.swimSpeedMult; accelRate = PHYS.airAccel * 0.6; }
      else if (grounded && this.onIceNow()) accelRate *= PHYS.iceGrip;
      const sl = this.onSlope;
      if (sl && grounded) {
        const downhill = -sl.rise; // +1: the slope goes down to the right
        if (!sl.solid) { dir = downhill; speed = PHYS.slideSpeed; }      // rainbow slide: whoosh!
        else if (dir === downhill) speed *= PHYS.slopeBoost;
      }
      b.velocity.x = approach(b.velocity.x, dir * speed, accelRate * (dt / 1000));
      if (dir !== 0) this.facing = dir;
      this.updateSlideFx(dt);

      // Jumping (or swimming strokes)
      if (swim) {
        if (input.jumpPressed) this.swimStroke();
        this.jump.reset();
        b.setGravityY(PHYS.swimGravity - PHYS.gravity);
        if (b.velocity.y > PHYS.swimMaxFall) b.velocity.y = PHYS.swimMaxFall;
      } else {
        const res = this.jump.step(dt, { grounded, pressed: input.jumpPressed, held: input.jumpHeld, vy: b.velocity.y });
        if (res.jump === 'ground') this.doJump(false);
        else if (res.jump === 'double') this.doJump(true);
        if (res.cut) b.velocity.y = cutJump(b.velocity.y);
        b.setGravityY(PHYS.gravity * (gravityMult(b.velocity.y, input.jumpHeld) - 1));
        if (b.velocity.y > PHYS.maxFall) b.velocity.y = PHYS.maxFall;
      }

      // Landing
      if (grounded && !this.wasGrounded) this.onLand(this.fallSpeed);
      this.fallSpeed = grounded ? 0 : Math.max(0, b.velocity.y);
      this.wasGrounded = grounded;

      // Remember the last solid ground for the balloon rescue.
      if (grounded && !swim) {
        const c = Math.floor(b.center.x / TILE), r = Math.floor((b.bottom + 2) / TILE);
        if (isGround(this.level, c, r)) this.lastSafeX = b.center.x;
      }

      // Fell into water or a gap → balloon!
      const wc = Math.floor(b.center.x / TILE), wr = Math.floor((b.bottom - 10) / TILE);
      if (isWater(this.level, wc, wr)) {
        sfx.splash();
        this.fx.splash.explode(this.fxCount(14), b.center.x, wr * TILE + 14);
        this.startBalloon(wr * TILE + 60);
      } else if (b.top > this.level.height + 40) {
        this.startBalloon();
      }

      // Running dust
      if (grounded && !swim && Math.abs(b.velocity.x) > 150) {
        this.puffTimer -= dt;
        if (this.puffTimer <= 0) {
          this.puffTimer = this.reduceMotion ? 420 : 170;
          this.fx.run.explode(1, b.center.x - this.facing * 16, b.bottom + GRASS_INSET - 2);
        }
      }

      // Sprite follows the body
      this.hoppy.x = b.center.x;
      this.hoppy.y = b.bottom + GRASS_INSET;
    }

    this.updateVisual(dt);
    this.updateBackground(time);

    // Camera look-ahead eases toward the facing direction.
    const cam = this.cameras.main;
    cam.followOffset.x = Phaser.Math.Linear(cam.followOffset.x, -140 * this.facing, 0.03);
  }

  // ---- World elements: slopes, ice, swimming, snowballs ---------------------------------------
  /** Keep Hoppy on a slope's surface (walking up, running down, sliding down a rainbow). */
  snapToSlope() {
    const b = this.heroBody;
    const was = this.onSlope;
    this.onSlope = null;
    if (b.velocity.y < 0) return;
    const sl = slopeAt(this.level, b.center.x, b.bottom);
    if (!sl) return;
    const d = b.bottom - sl.y;                 // > 0: Hoppy has sunk into the slope
    const above = was ? 28 : 3;                // when already on it, stick to it going downhill
    const below = sl.solid ? 48 : 22;          // rainbows are one-way: only catch from just above
    if (d < -above || d > below) return;
    b.position.y -= d;
    b.velocity.y = 0;
    this.onSlope = sl;
  }

  onIceNow() {
    const b = this.heroBody;
    const r = Math.floor((b.bottom + 2) / TILE);
    return isIce(this.level, Math.floor(b.center.x / TILE), r)
      || isIce(this.level, Math.floor((b.left + 4) / TILE), r) || isIce(this.level, Math.floor((b.right - 4) / TILE), r);
  }

  updateSlideFx(dt) {
    const b = this.heroBody;
    const rainbow = !!(this.onSlope && !this.onSlope.solid);
    this.slideFxTimer = (this.slideFxTimer || 0) - dt;
    const icy = this.isGrounded() && Math.abs(b.velocity.x) > 120 && this.onIceNow();
    if ((rainbow || icy) && this.slideFxTimer <= 0) {
      this.slideFxTimer = this.reduceMotion ? 240 : 70;
      if (rainbow) this.fx.slide.explode(1, b.center.x - this.facing * 20, b.bottom);
      else this.fx.sparkle.explode(1, b.center.x - this.facing * 16, b.bottom + 2);
    }
    if (rainbow && !this.wasSliding) sfx.whoosh();
    this.wasSliding = rainbow;
  }

  /** Is Hoppy in swimming water? Handles splashes, bubbles and the "tap to swim" tip. */
  updateSwimming(dt) {
    const b = this.heroBody;
    const swim = isSwim(this.level, Math.floor(b.center.x / TILE), Math.floor(b.center.y / TILE));
    if (swim !== this.swimming) {
      this.swimming = swim;
      sfx.splashSoft();
      this.fx.splash.explode(this.fxCount(6), b.center.x, this.waterSurfaceY() + 10);
      if (swim) {
        b.velocity.y = Math.min(b.velocity.y, 220);
        if (!this.swimTipShown) {
          this.swimTipShown = true;
          this.toast('🫧 Tap to swim up!');
          speak('Splash! Tap to swim up.');
        }
      }
    }
    if (swim) {
      this.bubbleTimer = (this.bubbleTimer || 0) - dt;
      if (this.bubbleTimer <= 0) {
        this.bubbleTimer = this.reduceMotion ? 1600 : 650;
        this.fx.bubble.explode(1, b.center.x + this.facing * 14, b.top + 14);
      }
    }
    return swim;
  }

  /** World-y of the water surface above Hoppy. */
  waterSurfaceY() {
    const b = this.heroBody;
    const c = Math.floor(b.center.x / TILE);
    let r = Math.floor(b.center.y / TILE);
    while (r > 0 && isSwim(this.level, c, r - 1)) r--;
    return r * TILE;
  }

  swimStroke() {
    const b = this.heroBody;
    const c = Math.floor(b.center.x / TILE);
    const surface = this.waterSurfaceY();
    const open = !isGround(this.level, c, Math.floor(surface / TILE) - 1); // not under a rock arch
    const atTop = open && b.top < surface + 34;
    b.velocity.y = -(atTop ? PHYS.swimJumpOut : PHYS.swimStroke);
    this.flapTimer = 320;
    this.squashTo(1.12, 0.9, 60, 220);
    this.fx.bubble.explode(this.fxCount(3), b.center.x, b.bottom);
    this.controls.hideHint();
    if (atTop) sfx.jump(); else sfx.swim();
  }

  /** A small bounce off something soft (landing on a snowball). */
  bounceOff(obj, v) {
    this.heroBody.velocity.y = -v;
    this.jump.reset();
    this.squashTo(0.8, 1.2, 60, 240);
    sfx.boing();
  }

  /** A soft push back (bumped by a snowball). No damage, nothing lost. */
  knockBack(dir) {
    const b = this.heroBody;
    b.velocity.x = dir * 380;
    b.velocity.y = -460;
    this.onSlope = null;
    this.autoRunDelay = 500;
    this.landTimer = 0;
    this.squashTo(1.25, 0.8, 60, 300);
    this.fx.land.explode(this.fxCount(6), b.center.x, b.center.y);
    sfx.oof();
  }

  doJump(double) {
    const b = this.heroBody;
    this.controls.hideHint();
    if (!double) {
      b.velocity.y = -PHYS.jumpVelocity;
      this.squashTo(0.8, 1.2, 70, 220);
      this.fx.jump.explode(this.fxCount(5), b.center.x, b.bottom + GRASS_INSET);
      sfx.jump();
    } else {
      b.velocity.y = -PHYS.doubleJumpVelocity;
      this.flapTimer = 380;
      this.squashTo(1.15, 0.88, 60, 260);
      const ring = this.add.image(b.center.x, b.bottom, 'ring').setDepth(6).setScale(0.4).setAlpha(0.95);
      this.tweens.add({ targets: ring, scaleX: 1.3, scaleY: 1.1, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
      this.fx.jump.explode(this.fxCount(6), b.center.x, b.bottom);
      sfx.doubleJump();
    }
  }

  /** Bouncy mushroom: a gentle bounce, or a super bounce if jump is held on landing. */
  bounce(mushroom) {
    const b = this.heroBody;
    if (b.velocity.y < 0 || this.state !== 'play') return;
    const superBounce = this.controls.state.jumpHeld;
    b.velocity.y = -(superBounce ? BOUNCE.super : BOUNCE.normal);
    this.jump.reset();
    this.jump.coyote = 0;
    this.flapTimer = 0;
    this.squashTo(0.75, 1.3, 60, 300);
    this.tweens.killTweensOf(mushroom);
    mushroom.setScale(1);
    this.tweens.chain({ targets: mushroom, tweens: [{ scaleX: 1.25, scaleY: 0.7, duration: 70 }, { scaleX: 1, scaleY: 1, duration: 420, ease: 'Elastic.easeOut' }] });
    this.fx.jump.explode(this.fxCount(superBounce ? 10 : 5), b.center.x, b.bottom);
    sfx.boing();
  }

  onLand(speed) {
    const k = Phaser.Math.Clamp(speed / 1000, 0.25, 1);
    this.landTimer = 70 + 60 * k;
    this.squashTo(1 + 0.32 * k, 1 - 0.3 * k, 50, 260);
    const b = this.heroBody;
    this.fx.land.explode(this.fxCount(Math.round(3 + 6 * k)), b.center.x, b.bottom + GRASS_INSET);
    sfx.land(k);
  }

  /** Squash/stretch to (sx, sy) quickly, then spring back to 1. */
  squashTo(sx, sy, inMs, outMs) {
    this.tweens.killTweensOf(this.squash);
    this.tweens.chain({
      targets: this.squash,
      tweens: [
        { x: sx, y: sy, duration: inMs, ease: 'Quad.easeOut' },
        { x: 1, y: 1, duration: outMs, ease: 'Back.easeOut' },
      ],
    });
  }

  updateVisual(dt) {
    const h = this.hoppy, b = this.heroBody;
    this.landTimer -= dt;
    this.flapTimer -= dt;
    this.cheerTimer -= dt;

    if (this.state === 'play') {
      const grounded = this.isGrounded();
      const pushing = (this.facing > 0 && b.blocked.right) || (this.facing < 0 && b.blocked.left)
        || (this.facing > 0 && b.touching.right) || (this.facing < 0 && b.touching.left);
      let anim;
      if (this.swimming && !grounded) anim = this.flapTimer > 0 ? 'hoppy-flap' : 'hoppy-fall';
      else if (this.onSlope && !this.onSlope.solid) anim = 'hoppy-float';
      else if (grounded && this.cheerTimer > 0) anim = 'hoppy-dance';
      else if (grounded && this.landTimer > 0) anim = 'hoppy-land';
      else if (!grounded) anim = this.flapTimer > 0 ? 'hoppy-flap' : (b.velocity.y < 0 ? 'hoppy-jump' : 'hoppy-fall');
      else if (Math.abs(b.velocity.x) > 20 && !pushing) anim = 'hoppy-run';
      else anim = 'hoppy-idle';
      h.play(anim, true);
      h.anims.timeScale = anim === 'hoppy-run' ? Phaser.Math.Clamp(Math.abs(b.velocity.x) / PHYS.runSpeed, 0.6, 1.2) : 1;
      h.setFlipX(this.facing < 0);
      h.rotation = grounded ? 0 : Phaser.Math.Clamp(b.velocity.x / 6000, -0.06, 0.06);
      if (this.onSlope) h.rotation = -this.onSlope.rise * (this.onSlope.solid ? 0.18 : 0.4);
      if (this.swimming) h.rotation = Math.sin(this.time.now / 260) * 0.08;

      // Soft shadow on the surface under Hoppy (smaller the higher she is).
      const surf = surfaceBelow(this.level, b.center.x, b.bottom - 4);
      if (surf === null) this.shadow.setVisible(false);
      else {
        const dist = surf - b.bottom;
        const s = Phaser.Math.Clamp(1 - dist / 420, 0.35, 1);
        this.shadow.setVisible(true).setPosition(b.center.x, surf + GRASS_INSET + 1).setScale(s * 0.8, s * 0.8).setAlpha(s);
      }
      h.setScale(this.squash.x, this.squash.y);
      if (this.cheerTimer > 0 && grounded && !this.reduceMotion) {
        // Two happy little hops while dancing (visual only).
        h.y -= Math.abs(Math.sin((1 - this.cheerTimer / CHEER_MS) * Math.PI * 2)) * 22;
      }
    } else {
      this.shadow.setVisible(false);
      if (this.state === 'balloon') h.setScale(this.squash.x, this.squash.y);
    }
    this.updateBalloon();
  }

  // ---- Questions -------------------------------------------------------------------------
  canAsk() { return this.state === 'play' && !this.signOpen; }

  /** Give questions to blocks in left-to-right order, so "never the same fact twice in a row" holds as you play. */
  assignQuestionsUpTo(block) {
    for (const b of this.blocks) {
      if (b.x > block.x) break;
      if (!b.question && !b.solved) {
        b.question = this.picker.next();
        if (b.carve) b.carve(b.question);
      }
    }
  }

  carveUpcomingGates() {
    const hx = this.heroBody.center.x;
    for (const b of this.blocks) {
      if (b.type === 'gate' && !b.question && !b.solved && b.x - hx < GATE_LOOKAHEAD) this.assignQuestionsUpTo(b);
    }
  }

  /** Ask a block's question; `after` runs once the right answer is given. */
  ask(block, after, { question = null, progress = null, hold = false } = {}) {
    if (!question) this.assignQuestionsUpTo(block);
    this.openSign(question || block.question, after, { progress, hold });
  }

  /** Stop the action (physics + input) — used for signs and short cut-scenes. */
  pauseForCutscene() {
    this.signOpen = true;
    this.physics.pause();
    this.controls.setEnabled(false);
    this.controls.hideHint();
    this.tweens.killTweensOf(this.squash);
    this.squash.x = this.squash.y = 1;
    this.hoppy.setScale(1).setRotation(0).play('hoppy-think');
  }

  resumeGame() {
    this.signOpen = false;
    this.physics.resume();
    this.controls.setEnabled(true);
    this.jump.buffer = 0;
    this.cheerTimer = CHEER_MS;
  }

  /** A right answer: Hoppy does her happy dance with a burst of hearts and stars. */
  celebrate() {
    const h = this.hoppy;
    h.play('hoppy-dance');
    const x = h.x, y = h.y - 60;
    this.fx.hearts.explode(this.fxCount(9), x, y);
    this.fx.stars.explode(this.fxCount(14), x, y + 20);
    this.time.delayedCall(260, () => sfx.dance());
    if (!this.reduceMotion) {
      const base = h.y;
      this.tweens.add({ targets: h, y: base - 18, duration: 160, yoyo: true, repeat: 2, ease: 'Quad.easeOut', onComplete: () => { h.y = base; } });
    }
  }

  /** Pause the game and show the maths sign. With `hold`, the game stays paused afterwards (boss rounds). */
  openSign(question, after, { progress = null, hold = false } = {}) {
    this.pauseForCutscene();
    duckMusic(true);
    this.scene.launch('MathSign', {
      question,
      progress,
      method: this.config.answer,
      onCorrect: () => this.celebrate(),
      onDone: (res) => {
        duckMusic(false);
        this.picker.recordResult(question, res.firstTry);
        this.learn(question, res);
        this.stats.challenges++;
        if (res.firstTry) this.stats.firstTry++;
        if (!hold) this.resumeGame();
        after(res);
      },
    });
    this.scene.bringToTop('MathSign');
  }

  /** Update the learning record (GAME_DESIGN §7) and save it to this child's profile. */
  learn(q, res) {
    const before = new Set([q.a, q.b].filter((t) => this.mastery.tableMastered(t)));
    const change = this.mastery.record(q.a, q.b, { firstTry: res.firstTry, ms: res.ms });
    masteryStore.save(this.mastery.toJSON());
    if (change.mastered) this.time.delayedCall(500, () => this.toast(`🌟 You know ${q.a} × ${q.b}!`));
    // A whole table mastered earns a sticker for the sticker book (GAME_DESIGN §8).
    const won = newlyMasteredTables(q.a, q.b, (t) => before.has(t), (t) => this.mastery.tableMastered(t));
    won.forEach((t, i) => this.time.delayedCall(2600 + i * 2400, () => {
      this.toast(`🏅 New sticker: ×${t} Champion!`);
      sfx.starCarrot();
      speak(`You're a ${t} times table champion! A new sticker!`, { queue: true, mood: 'cheer' });
    }));
  }

  /** A "flip it!" question handed to a block the child never reached goes back in the queue. */
  keepUnseenFlips() {
    let changed = false;
    for (const b of this.blocks || []) {
      if (b.question && b.question.flip && !b.solved) { this.mastery.queueFlip(b.question.flip.a, b.question.flip.b); changed = true; }
    }
    if (changed) masteryStore.save(this.mastery.toJSON());
  }

  goToMap(scene = 'WorldMap') {
    if (this.leaving) return;
    this.leaving = true;
    if (this.scene.isActive('MathSign')) this.scene.stop('MathSign');
    stopSpeech();
    this.cameras.main.fadeOut(250, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, { from: this.levelId }));
  }

  // ---- Carrots, HUD, Star Carrot, checkpoints ------------------------------------------------
  createCarrots() {
    this.carrotCount = 0;
    this.carrotStreak = 0;
    this.lastCarrotAt = -9999;
    this.carrots = this.physics.add.staticGroup();
    for (const o of this.level.objects) {
      if (o.type !== 'carrot') continue;
      const c = this.carrots.create(o.col * TILE + TILE / 2, o.row * TILE + TILE / 2, 'carrot');
      c.setDepth(3);
      c.body.setSize(34, 44);
      if (!this.reduceMotion) {
        this.tweens.add({ targets: c, y: c.y - 6, angle: { from: -4, to: 4 }, duration: 800 + (o.col % 4) * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (o.col * 137) % 600 });
      }
    }
    this.physics.add.overlap(this.hero, this.carrots, (_h, c) => this.collectCarrot(c));
  }

  collectCarrot(c) {
    if (!c.body || !c.body.enable) return;
    c.body.enable = false;
    this.tweens.killTweensOf(c);
    const now = this.time.now;
    this.carrotStreak = now - this.lastCarrotAt < 900 ? this.carrotStreak + 1 : 0;
    this.lastCarrotAt = now;
    sfx.plink(this.carrotStreak);
    this.fx.sparkle.explode(this.fxCount(6), c.x, c.y);
    this.tweens.add({ targets: c, y: c.y - 34, scale: 1.3, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => c.destroy() });
    this.addCarrots(1);
  }

  /** Fly a carrot sprite (world space) into the HUD counter, then count it. */
  flyToCounter(c, delay = 0) {
    const start = { x: c.x, y: c.y };
    const cam = this.cameras.main;
    this.tweens.addCounter({
      from: 0, to: 1, delay, duration: 520, ease: 'Sine.easeIn',
      onUpdate: (tw) => {
        const t = tw.getValue();
        const tx = cam.scrollX + HUD.x - 66, ty = cam.scrollY + HUD.y;
        c.x = Phaser.Math.Linear(start.x, tx, t);
        c.y = Phaser.Math.Linear(start.y, ty, t) - Math.sin(t * Math.PI) * 60;
        c.setScale(Phaser.Math.Linear(0.9, 0.55, t));
      },
      onComplete: () => { c.destroy(); this.addCarrots(1); },
    });
  }

  createHud() {
    const ui = (o) => o.setScrollFactor(0).setDepth(1000);
    this.hudBg = ui(this.add.image(HUD.x, HUD.y, 'pill').setScale(0.86, 1));
    this.hudIcon = ui(this.add.image(HUD.x - 66, HUD.y - 2, 'carrot').setScale(0.95).setAngle(-12)).setDepth(1001);
    this.hudText = ui(this.add.text(HUD.x + 18, HUD.y - 4, '0', {
      fontFamily: FONT, fontSize: '46px', fontStyle: 'bold', color: '#6b4424',
    }).setOrigin(0.5)).setDepth(1001);
    this.hudStar = ui(this.add.image(HUD.x - 152, HUD.y, 'star-carrot').setScale(0.8)).setVisible(false);
    this.levelLabel = ui(this.add.text(VIEW_W / 2, 136, this.endless ? `🌈 ${this.levelDef.name}` : `${this.levelId}  ${this.levelDef.name || ''}`, {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#ffffff', stroke: '#6b4424', strokeThickness: 8,
    }).setOrigin(0.5));
    this.time.delayedCall(2500, () => this.tweens.add({ targets: this.levelLabel, alpha: 0, duration: 600 }));

    // Music, sound effects and speech on/off (96 px round buttons next to the control-mode toggle).
    [this.musicBtn, this.soundBtn, this.speechBtn] = soundToggles(this, 306, HUD.y).map((b) => ui(b));
    // Back to the World Map (progress is kept at the last checkpoint flower).
    this.mapBtn = ui(this.add.image(624, HUD.y, 'btnMap').setInteractive({ useHandCursor: true }));
    this.mapBtn.on('pointerdown', () => {
      if (this.state === 'end') return;
      this.tweens.add({ targets: this.mapBtn, scale: 0.88, duration: 80, yoyo: true });
      sfx.bump();
      this.time.delayedCall(140, () => this.goToMap());
    });
    // Quit to the title screen (same saving as going back to the map).
    this.quitBtn = ui(this.add.image(730, HUD.y, 'btnQuit').setInteractive({ useHandCursor: true }));
    this.quitBtn.on('pointerdown', () => {
      if (this.state === 'end') return;
      this.tweens.add({ targets: this.quitBtn, scale: 0.88, duration: 80, yoyo: true });
      sfx.bump();
      this.time.delayedCall(140, () => this.goToMap('Title'));
    });
  }

  addCarrots(n) {
    this.carrotCount += n;
    this.hudText.setText(String(this.carrotCount));
    this.tweens.killTweensOf([this.hudIcon, this.hudText]);
    this.hudIcon.setScale(0.95);
    this.hudText.setScale(1);
    this.tweens.add({ targets: this.hudIcon, scale: 1.25, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.hudText, scale: 1.2, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  }

  toast(text) {
    const t = this.add.text(VIEW_W / 2, 150, text, {
      fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#ffffff', stroke: '#6b4424', strokeThickness: 10,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.time.delayedCall(1800, () => this.tweens.add({ targets: t, alpha: 0, y: 120, duration: 400, onComplete: () => t.destroy() }));
  }

  findStarCarrot(star) {
    star.found = true;
    this.starFound = true;
    star.zone.body.enable = false;
    sfx.starCarrot();
    this.fx.sparkle.explode(this.fxCount(24), star.x, star.y);
    this.tweens.killTweensOf([star.img, star.glow]);
    star.glow.destroy();
    this.tweens.add({ targets: star.img, y: star.y - 60, scale: 1.6, duration: 450, ease: 'Back.easeOut', yoyo: true, hold: 200, onComplete: () => {
      star.img.destroy();
      this.hudStar.setVisible(true).setScale(0);
      this.tweens.add({ targets: this.hudStar, scale: 0.8, duration: 300, ease: 'Back.easeOut' });
    } });
    this.toast('⭐ You found the Star Carrot!');
    speak('Wow! You found the secret Star Carrot!', { mood: 'cheer' });
  }

  reachCheckpoint(f) {
    f.bloomed = true;
    sfx.checkpoint();
    f.img.setTexture('flower-bloom').setScale(0.4);
    this.tweens.add({ targets: f.img, scale: 1, duration: 450, ease: 'Back.easeOut' });
    this.fx.sparkle.explode(this.fxCount(10), f.x, f.groundY - 80);
    this.toast('🌼 Checkpoint!');
    speak('Checkpoint! Keep hopping!', { mood: 'cheer' });
    checkpoints.set(this.levelId, {
      x: f.x, y: f.groundY, carrots: this.carrotCount, stats: { ...this.stats }, star: this.starFound,
    });
  }

  /** If the child left the level part-way, start again at the last checkpoint flower. */
  resumeFromCheckpoint() {
    const cp = checkpoints.get(this.levelId);
    if (!cp) return;
    this.heroBody.reset(cp.x, cp.y - BODY_H / 2);
    this.hoppy.setPosition(cp.x, cp.y + GRASS_INSET);
    this.lastSafeX = cp.x;
    this.stats = { ...cp.stats };
    this.carrotCount = 0;
    this.addCarrots(cp.carrots);
    for (const b of this.blocks) if (b.x < cp.x) b.solve(true);
    this.carrots.getChildren().slice().forEach((c) => { if (c.x < cp.x) c.destroy(); });
    for (const f of this.props.flowers) {
      if (f.x <= cp.x) { f.bloomed = true; f.img.setTexture('flower-bloom'); }
    }
    if (cp.star && this.props.star) {
      this.starFound = true;
      this.props.star.found = true;
      this.props.star.zone.body.enable = false;
      this.props.star.img.destroy();
      this.props.star.glow.destroy();
      this.hudStar.setVisible(true);
    }
    this.time.delayedCall(400, () => this.toast('Welcome back! 🌼'));
  }

  // ---- The end: Golden Carrot, munch, propeller ears, confetti -----------------------------------
  reachGoal(goal) {
    if (this.state !== 'play' || this.signOpen) return;
    this.state = 'end';
    this.controls.setEnabled(false);
    const b = this.heroBody;
    b.setVelocity(0, 0);
    b.enable = false;
    const h = this.hoppy;
    this.facing = 1;
    h.setFlipX(false).setRotation(0).setScale(1);
    this.tweens.killTweensOf([goal.img, goal.glow]);

    const standX = goal.x - 40, standY = goal.groundY + GRASS_INSET;
    h.play('hoppy-jump');
    this.tweens.chain({
      targets: h,
      tweens: [
        { x: (h.x + standX) / 2, y: Math.min(h.y, standY) - 60, duration: 220, ease: 'Quad.easeOut' },
        { x: standX, y: standY, duration: 220, ease: 'Quad.easeIn' },
      ],
      onComplete: () => this.munch(goal, standX, standY),
    });
  }

  munch(goal, hx, hy) {
    const h = this.hoppy;
    this.fx.land.explode(this.fxCount(6), hx, hy);
    sfx.land(0.5);
    h.play('hoppy-munch');
    // Hoppy holds the carrot up to her mouth.
    goal.img.setOrigin(0.5, 0.5);
    this.tweens.add({ targets: goal.img, x: hx + 34, y: hy - 70, angle: -55, scale: 0.62, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: goal.glow, alpha: 0, duration: 300 });

    const words = ['crunch', 'crunch!', 'Yum!'];
    words.forEach((w, i) => {
      this.time.delayedCall(450 + i * 620, () => {
        sfx.munch();
        this.fx.crumb.explode(this.fxCount(8), hx + 30, hy - 64);
        if (i < 2) goal.img.setTexture(`golden-carrot${i + 1}`);
        else goal.img.destroy();
        const t = this.add.text(hx + (i % 2 ? 70 : -60), hy - 150 - i * 16, w, {
          fontFamily: FONT, fontSize: '46px', fontStyle: 'bold', color: '#ffd23f', stroke: '#6b4424', strokeThickness: 10,
        }).setOrigin(0.5).setDepth(20).setScale(0).setAngle(i % 2 ? 8 : -8);
        this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
        this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 700, duration: 400, onComplete: () => t.destroy() });
      });
    });
    speak('Crunch crunch! Yum!', { mood: 'cheer' });

    // Then the ears spin like a propeller, Hoppy lifts off a little, and carrot confetti rains down.
    this.time.delayedCall(2400, () => {
      h.play('hoppy-spin');
      sfx.fanfare();
      this.tweens.add({ targets: h, y: hy - 70, duration: 700, yoyo: true, hold: 500, ease: 'Sine.easeInOut', onComplete: () => h.play('hoppy-dance') });
      this.confetti();
    });
    this.time.delayedCall(4700, () => this.finishLevel());
  }

  confetti() {
    const cam = this.cameras.main;
    const zone = { source: new Phaser.Geom.Rectangle(0, 0, VIEW_W, 10), type: 'random' };
    const common = { lifespan: 3200, speedY: { min: 120, max: 320 }, speedX: { min: -80, max: 80 }, gravityY: 160, rotate: { start: 0, end: 540 }, emitting: false, emitZone: zone };
    const paper = this.add.particles(0, 0, 'confetti', { ...common, tint: [0xff6b6b, 0xffd23f, 0x6fcd4b, 0x5ec2ff, 0xff8fc8, 0xffa62b], scale: { min: 0.8, max: 1.3 } }).setDepth(30);
    const carrots = this.add.particles(0, 0, 'mini-carrot', { ...common, scale: { min: 0.9, max: 1.4 } }).setDepth(30);
    paper.explode(this.reduceMotion ? 20 : 90, cam.scrollX, cam.scrollY - 30);
    carrots.explode(this.reduceMotion ? 8 : 30, cam.scrollX, cam.scrollY - 30);
  }

  finishLevel() {
    const result = {
      levelId: this.levelId,
      name: this.levelDef.name,
      carrots: this.carrotCount,
      challenges: this.stats.challenges,
      firstTry: this.stats.firstTry,
      starCarrot: this.starFound,
    };
    checkpoints.clear(this.levelId);
    if (this.endless) {
      // Bank the carrots, remember the best round, and get a fresh map ready for the next round.
      const e = progress.endless;
      const best = Math.max(e.best || 0, this.round);
      progress.endless = { round: this.round + 1, seed: newEndlessSeed(), best };
      progress.addCarrots(this.carrotCount);
      Object.assign(result, { endless: true, round: this.round, best });
    } else {
      result.stars = starsFor(result);
      result.next = nextLevelId(this.levelId) || (this.levelId === ENDLESS.unlockAfter ? ENDLESS.id : null);
      const wasOpen = progress.isDone(this.levelId);   // the next level opens the first time this one is finished
      result.newBest = progress.complete(this.levelId, result.stars, this.carrotCount);
      if (!wasOpen && result.next) result.unlocked = result.next;
      if (!wasOpen && this.config.boss) result.sticker = true;   // the boss's sleepy sticker
    }
    this.scene.launch('LevelComplete', result);
    this.scene.bringToTop('LevelComplete');
  }

  // ---- Balloon rescue -------------------------------------------------------------------
  startBalloon(fromY = null) {
    const b = this.heroBody;
    const dir = Math.sign(b.velocity.x) || this.facing;
    this.state = 'balloon';
    this.controls.enabled = false;
    b.setVelocity(0, 0);
    b.enable = false;
    this.flapTimer = 0;

    const fallX = b.center.x;
    // Land a few tiles back from the edge so there's time to get ready for the next try.
    const from = dir > 0 ? Math.min(this.lastSafeX, fallX) : Math.max(this.lastSafeX, fallX);
    const safe = findSafeSpot(this.level, from - dir * TILE * 3, dir);
    const h = this.hoppy;
    h.play('hoppy-float');
    h.rotation = 0;
    h.setPosition(fallX, fromY === null ? this.level.height + 140 : fromY);
    this.squash.x = this.squash.y = 1;

    this.balloon = this.add.image(h.x, h.y - 120, 'balloon').setOrigin(0.5, 0.9).setDepth(5);
    this.balloon.setScale(0.2);
    this.tweens.add({ targets: this.balloon, scale: 1, duration: 350, ease: 'Back.easeOut' });
    sfx.balloon();

    const topY = safe.y - 230;
    this.tweens.chain({
      targets: h,
      tweens: [
        { x: (fallX + safe.x) / 2, y: topY, duration: 1300, ease: 'Sine.easeOut' },
        { x: safe.x, y: safe.y - 150, duration: 900, ease: 'Sine.easeInOut' },
        { y: safe.y + GRASS_INSET, duration: 650, ease: 'Sine.easeIn' },
      ],
      onComplete: () => this.endBalloon(safe),
    });
  }

  updateBalloon() {
    const g = this.balloonString;
    g.clear();
    if (!this.balloon || !this.balloon.active) return;
    const h = this.hoppy;
    const flip = h.flipX ? -1 : 1;
    const paw = { x: h.x + HOPPY_PAW.x * flip, y: h.y + HOPPY_PAW.y };
    const held = this.state === 'balloon';
    if (held) {
      const bx = Phaser.Math.Linear(this.balloon.x, paw.x + 6 * flip, 0.12);
      this.balloon.x = bx;
      this.balloon.y = paw.y - 70 + Math.sin(this.time.now / 260) * 3;
      this.balloon.rotation = Phaser.Math.Clamp((paw.x - bx) / -80, -0.25, 0.25);
      h.rotation = Math.sin(this.time.now / 300) * 0.05;
    }
    const kx = this.balloon.x, ky = this.balloon.y + 4;
    const end = held ? paw : { x: kx + Math.sin(this.time.now / 120) * 6, y: ky + 50 };
    g.lineStyle(2.5, 0x6b4424, 0.9);
    new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(kx, ky),
      new Phaser.Math.Vector2((kx + end.x) / 2 + 10, (ky + end.y) / 2),
      new Phaser.Math.Vector2(end.x, end.y)).draw(g, 10);
  }

  endBalloon(safe) {
    const b = this.heroBody;
    this.state = 'play';
    b.enable = true;
    b.reset(safe.x, safe.y - BODY_H / 2);
    this.hoppy.rotation = 0;
    this.jump.reset();
    this.wasGrounded = true;
    this.onLand(500);
    this.autoRunDelay = 700;
    this.facing = 1;
    this.controls.enabled = true;

    // Let go of the balloon: it floats away and pops into sparkles.
    const balloon = this.balloon;
    this.tweens.add({
      targets: balloon, y: balloon.y - 360, x: balloon.x + 60, rotation: 0.3, duration: 1500, ease: 'Sine.easeIn',
      onComplete: () => {
        this.fx.sparkle.explode(this.fxCount(10), balloon.x, balloon.y);
        sfx.pop();
        balloon.destroy();
      },
    });
  }
}
