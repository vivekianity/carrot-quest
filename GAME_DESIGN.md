# Carrot Quest — Game Design Document

A side-scrolling platformer (Mario-style) for 7-year-olds that teaches the 1–10 times tables.
Platform: iPad (Safari web app, installed to the Home Screen, works offline).

---

## 1. The big idea — why a bunny and a carrot (not a flag)

**Hoppy**, a small round bunny with floppy ears and a red scarf, hops through each level to reach
the **Golden Carrot** at the end.

Why this beats "run to the flag" for 7-year-olds:
- **A goal they care about.** A flag means nothing to a young child; feeding a hungry bunny is a reason to keep going.
- **Hopping is the natural mechanic.** Bunnies jump, so jumping feels right and is easy to understand.
- **A gentle world.** Bunnies don't stomp enemies. Obstacles are puzzles, not fights, which suits a learning game.
- **A built-in collection.** Small carrots along the way work like Mario's coins, and the Golden Carrot is the trophy.

Level-end moment: Hoppy reaches the Golden Carrot on a little hill, munches it ("crunch crunch!"), the ears spin
like a propeller, fireworks of carrot confetti go off, and the stars earned appear.

Design principles:
- **No death, no game over.** Falling in a pit → Hoppy floats back up on a balloon. Bumping a critter → a soft bounce back.
- **Maths is the key, not a quiz in the way.** Every challenge block is a physical obstacle that the right answer removes.
- **Short levels.** About 2–3 minutes each, with 6–10 maths challenges.
- **Easy controls for small hands** (see section 4).
- **Private:** no ads, no accounts, no network, no tracking.

---

## 2. Challenge blocks — how maths stops the player

These are the heart of the game. When Hoppy touches one, the action pauses, a big wooden sign slides up
with the question, and the child answers (bubbles or number pad, depending on level).

| Block | What it looks like | What a right answer does |
|---|---|---|
| **Stone Gate** (main blocker) | A tall stone wall across the path with "3 × 4" carved on it | The wall cracks and crumbles into pebbles; the path opens |
| **Question Box** (bonus) | A floating golden box with "?" — Hoppy bumps it from below by jumping | Pops out 5 small carrots plus a burst of sparkles |
| **Broken Bridge** | A gap over water with a sign | Wooden planks fly in one by one and build the bridge |
| **Sleepy Log** | A giant log blocking a tunnel | Beavers pop out and chew it away |
| **Carrot Lift** | A platform too high to reach | A beanstalk spirals up to make stairs |
| **Boss Gate** (end of each world) | A grumpy (but cute) crow guarding the carrot patch | 5 questions in a row: each right answer makes the crow yawn; after 5 it falls asleep snoring "Zzz" |

Wrong answer: the sign wobbles, and Hoppy says "Let's count together!" The question is drawn as rows of little carrots
(3 × 4 = 3 rows of 4 carrots) that light up as they're counted aloud ("4, 8, 12"). The child tries again.
After a second miss, the right answer glows and the child taps it. That fact comes back later in the level.

---

## 3. Worlds and level progression

There are 5 worlds × 2 levels = 10 levels, plus a boss gate at the end of each world.
Each world has its own look, music and platform style.

| Level | World | Tables | Multipliers | Answer method | New platform element |
|---|---|---|---|---|---|
| 1-1 | 🌼 Meadow Hills | ×1, ×2 | 1–5 | Tap 1 of 3 bubbles | Flat ground, small hops |
| 1-2 | 🌼 Meadow Hills | ×2, ×10 | 1–10 | Tap 1 of 3 bubbles | Floating platforms, Question Boxes. **Boss:** crow |
| 2-1 | 🍄 Mushroom Forest | ×5 (+ review) | 1–10 | Tap 1 of 3 bubbles | Bouncy mushrooms (super jump) |
| 2-2 | 🍄 Mushroom Forest | ×3 (+ review) | 1–10 | Tap 1 of 4 bubbles | Broken Bridges. **Boss:** owl |
| 3-1 | 🏖️ Sunny Beach | ×4 (+ review) | 1–10 | Number pad | Moving platforms (turtles) |
| 3-2 | 🏖️ Sunny Beach | ×6 (+ review) | 1–10 | Number pad | Water you can swim through. **Boss:** crab |
| 4-1 | ❄️ Snowy Peaks | ×7 (+ review) | 1–10 | Number pad | Slippery ice, snowball slopes |
| 4-2 | ❄️ Snowy Peaks | ×8 (+ review) | 1–10 | Number pad | Carrot Lifts. **Boss:** penguin |
| 5-1 | 🍭 Candy Clouds | ×9 (+ review) | 1–10 | Number pad | Cloud platforms that drift |
| 5-2 | 🍭 Candy Clouds | all 1–10, incl. missing number (3 × ? = 12) | 1–10 | Number pad | Rainbow slides. **Final boss:** the Carrot Thief raccoon (falls asleep, gives back all carrots) |

Rules:
- Review levels mix about 60% new table, 40% earlier tables.
- **Stars per level (1–3):** 1 = reach the Golden Carrot; 2 = 75%+ of challenges right first try; 3 = 90%+ right first try **and** found the hidden Star Carrot.
- Finishing a level unlocks the next one. Any level can be replayed.
- After 5-2: **Endless Meadow** — an endlessly generated level with mixed facts.

---

## 4. Controls (designed for 7-year-olds on a touchscreen)

Two control modes, chosen in the parent corner (default: **Classic**):

- **Easy (auto-run):** Hoppy runs forward automatically and stops by herself in front of challenge blocks.
  The child only taps **anywhere on the right half of the screen to jump**. A longer press = a higher jump.
- **Classic:** big ◀ ▶ arrow buttons at bottom-left and a big round **JUMP** button at bottom-right (at least 100 px).

Other control rules:
- Forgiving jumps: "coyote time" (can still jump just after leaving a ledge) and a jump buffer (a tap just before landing still counts).
- Hoppy can double-jump (ears flap like wings) — makes gaps much less frustrating.
- No precision-platforming: gaps and heights are generous, and there are no spikes.
- When the maths sign is on screen, game controls are disabled so a stray tap can't jump.

---

## 5. Level layout pattern (per level)

```
START → easy run → [Stone Gate] → platforms + carrots → [Question Box] → [Broken Bridge]
      → mushroom bounce → [Stone Gate] → hidden Star Carrot (a little secret above the screen)
      → [Sleepy Log] → final run → [Stone Gate] → hill → GOLDEN CARROT 🥕
```
- Levels are about 4–6 screen widths long, built from a simple tile grid (defined as text/JSON so they are easy to edit).
- Checkpoint flowers in the middle: if the child leaves, the level resumes there.

---

## 6. Visual and audio style

- **Look:** bright, rounded, storybook-cartoon style, like a picture book come alive. Thick soft outlines, gentle gradients.
- **Parallax backgrounds:** 3 layers per world (far hills/sky, middle trees, near bushes) scrolling at different speeds.
- **Hoppy animations:** idle (ear twitch, blink), run, jump (ears up), double-jump (ears flap), land (squash and stretch),
  think (paw on chin while the sign is up), happy dance, munch.
- **Juice:** dust puffs on landing, sparkles on carrot pickup, screen shake (small!) when a Stone Gate crumbles,
  confetti at the Golden Carrot.
- **Font:** rounded system font (`ui-rounded` / SF Pro Rounded on iPad). Question numbers are at least 100 px.
- **Sound:** synthesised with Web Audio: boing (jump), plink (carrot, with rising pitch for streaks), crumble, munch,
  a happy fanfare, and a light bouncy music loop per world. Separate music and sound toggles.
- **Speech:** questions are read aloud ("three times four") with a replay button.
- Respect iPad "Reduce Motion"; nothing flashes more than 3 times per second.

---

## 7. Learning engine

- Track every fact `a × b` per child: attempts, first-try correct, average answer time, last seen.
- **Mastered** = right on the first try 3 times in a row, each in under 6 seconds.
- Recently missed facts are 3× more likely to appear on the next challenge blocks; mastered facts still return occasionally.
- `3 × 4` and `4 × 3` are linked: after one is learned, the other appears with a "flip it!" animation.
- Wrong-answer bubbles are believable (neighbouring products, a+b, digit swaps), never duplicates.
- The same fact never appears on two blocks in a row.

---

## 8. Rewards and extras

- **Carrot shop (Burrow):** spend collected carrots on outfits for Hoppy (hats, capes, sunglasses, scarves in new colours)
  and burrow decorations.
- **Sticker book:** one sticker per boss put to sleep, and one per table mastered ("×7 Champion").
- **World map:** a storybook-style map with a path between levels, showing stars earned; Hoppy hops along it.

## 9. Parent corner
- Grown-up gate: hold a button for 3 seconds, then type the answer to a simple sum (e.g. 14 + 27).
- 10×10 fact grid: grey (not seen), orange (learning), green (mastered).
- Settings: control mode (Easy / Classic), music, sounds, speech, always show the counting picture,
  unlock all levels, reset a profile. Up to 4 child profiles.

---

## 10. Technical summary
- **Phaser 3** game engine (arcade physics, cameras, tweens, parallax), with `phaser.min.js` saved inside the project
  (no CDN) so it works offline.
- All art drawn in code: SVG sprites rendered into textures at load time. No external image files.
- Levels defined as text tile maps in `src/levels/`.
- Installable **PWA** with manifest, icons and a service worker for offline play.
- Target: iPad Safari (iPadOS 16+), landscape, 60 fps on older iPads.
