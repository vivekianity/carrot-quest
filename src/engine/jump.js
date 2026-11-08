// Pure jump/run feel logic (no Phaser) — coyote time, jump buffer, variable height, double jump.

export const PHYS = {
  gravity: 2300,          // px/s²
  fallGravityMult: 1.35,  // fall a little faster than you rise (snappier)
  apexGravityMult: 0.6,   // floaty hang at the top while the button is held
  apexThreshold: 140,     // |vy| below this counts as "near the apex"
  jumpVelocity: 1000,     // ≈ 3.4 tiles with a full press
  doubleJumpVelocity: 860,
  cutVelocity: 560,       // releasing early caps upward speed → smaller hop (still a real hop for quick taps)
  maxFall: 1100,
  runSpeed: 330,          // Classic
  easyRunSpeed: 280,      // Easy auto-run
  groundAccel: 2600,
  airAccel: 1800,
  coyoteMs: 100,
  bufferMs: 120,
  airJumps: 1,
  // World elements
  swimGravity: 420,       // gentle sinking in swimming water
  swimMaxFall: 170,
  swimStroke: 440,        // each tap in the water
  swimJumpOut: 880,       // a tap at the surface hops out
  swimSpeedMult: 0.62,
  iceGrip: 0.12,          // ice: only 12% of normal grip, so Hoppy slides
  slopeBoost: 1.35,       // running down a snowy slope is faster
  slideSpeed: 640,        // whoosh down a rainbow slide
};

export function approach(value, target, maxDelta) {
  if (value < target) return Math.min(value + maxDelta, target);
  if (value > target) return Math.max(value - maxDelta, target);
  return value;
}

/** Gravity multiplier for the current vertical speed (vy > 0 is falling). */
export function gravityMult(vy, held, o = PHYS) {
  if (vy > 0 && !(held && vy < o.apexThreshold)) return o.fallGravityMult;
  if (held && Math.abs(vy) < o.apexThreshold) return o.apexGravityMult;
  return 1;
}

/** Upward speed after the button is released early (vy < 0 is up). */
export function cutJump(vy, o = PHYS) {
  return Math.max(vy, -o.cutVelocity);
}

export class JumpAssist {
  constructor(opts = PHYS) { this.o = opts; this.reset(); }

  reset() {
    this.coyote = 0;      // ms left in which a ground jump is still allowed
    this.buffer = 0;      // ms left on a remembered jump press
    this.airJumps = this.o.airJumps;
    this.rising = false;  // in a jump that can still be cut short
  }

  /**
   * @param {number} dtMs
   * @param {{grounded:boolean, pressed:boolean, held:boolean, vy:number}} s
   * @returns {{jump: null|'ground'|'double', cut: boolean}}
   */
  step(dtMs, { grounded, pressed, held, vy }) {
    const o = this.o;
    const out = { jump: null, cut: false };

    if (grounded && vy >= 0) {
      this.coyote = o.coyoteMs;
      this.airJumps = o.airJumps;
      this.rising = false;
    } else {
      this.coyote = Math.max(0, this.coyote - dtMs);
    }
    this.buffer = pressed ? o.bufferMs : Math.max(0, this.buffer - dtMs);

    if (this.buffer > 0) {
      if (this.coyote > 0) {
        out.jump = 'ground';
      } else if (pressed && this.airJumps > 0) {
        out.jump = 'double';
        this.airJumps--;
      }
      if (out.jump) { this.coyote = 0; this.buffer = 0; this.rising = true; return out; }
    }

    if (this.rising) {
      if (vy >= 0) this.rising = false;
      else if (!held) { out.cut = true; this.rising = false; }
    }
    return out;
  }
}
