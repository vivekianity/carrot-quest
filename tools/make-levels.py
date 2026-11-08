"""Builds the text tile maps for levels 2-1 … 5-2 (src/levels/*.js).

Each level follows GAME_DESIGN §5:
START → Gate → platforms + carrots → Question Box → Broken Bridge → mushroom → Gate → Star Carrot (secret)
      → Sleepy Log → final run → Gate → hill → Golden Carrot
with the world's new platform element worked in, and the boss gate before the hill on the second level.
Run:  python3 tools/make-levels.py   (then `node --test`). The maps can also be edited by hand afterwards.
"""
import os

H, GT = 16, 13  # 16 rows; the ground surface is row 13
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'levels')


class Map:
    def __init__(self, w):
        self.w = w
        self.g = [['.'] * w for _ in range(H)]

    def put(self, c, r, ch): self.g[r][c] = ch

    def fill(self, c0, c1, r0, r1, ch='#'):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1): self.g[r][c] = ch

    def clear(self, c0, c1): self.fill(c0, c1, 0, H - 1, '.')
    def ground(self, c0, c1, top=GT): self.fill(c0, c1, top, H - 1)
    def carrots(self, cols, r):
        for c in cols: self.put(c, r, 'c')

    def bridge(self, c0, c1):              # Broken Bridge: planks over water
        self.clear(c0, c1)
        for c in range(c0, c1 + 1):
            self.put(c, GT, '_'); self.fill(c, c, GT + 1, H - 1, '~')

    def tunnel(self, c0, c1, logc, top=6):  # Sleepy Log under a hill too tall to jump
        self.fill(c0, c1, top, GT - 3)
        self.put(logc, GT - 1, 'L')

    def lift(self, kc, c1, top=6):          # Carrot Lift next to a tall cliff
        self.put(kc, GT - 1, 'K')
        self.fill(kc + 1, c1, top, GT - 1)

    def star(self, mc, pr=4):               # mushroom + secret Star Carrot platform above the screen
        self.put(mc, GT - 1, 'm')
        self.carrots([mc], GT - 3); self.carrots([mc + 1], GT - 5); self.carrots([mc + 2], GT - 7)
        self.fill(mc, mc + 4, pr, pr, '=')
        self.put(mc + 3, pr - 1, '*'); self.carrots([mc + 1, mc + 2], pr - 1)

    def water(self, c0, c1):                # open water (fall in → balloon)
        self.clear(c0, c1); self.fill(c0, c1, GT, H - 1, '~')

    def turtle(self, c0, c1):               # turtle ride across open water
        self.water(c0, c1)
        self.put(c0 + 1, GT - 1, 'T')
        for c in range(c0 + 2, c1): self.put(c, GT - 1, '-')

    def cloud(self, c0, c1):                # drifting cloud across a wide gap
        self.clear(c0, c1)
        self.put(c0 + 1, GT, 'D')
        for c in range(c0 + 2, c1): self.put(c, GT, '-')

    def pool(self, c0, c1, a0, a1):         # swimming pool with a rock arch you dive under
        self.fill(c0, c1, GT, GT + 1, 'w')
        self.fill(c0, c1, GT + 2, H - 1, '#')
        self.fill(a0, a1, 6, GT - 1)
        self.carrots(range(c0 + 1, c1), GT + 1)

    def snow_hill(self, c, steps, flat, spawner=True):  # / up, a plateau, \\ down; snowballs roll down the left side
        top = GT - steps
        for i in range(steps):
            self.put(c + i, GT - 1 - i, '/'); self.fill(c + i, c + i, GT - i, H - 1)
        p0, p1 = c + steps, c + steps + flat - 1
        self.ground(p0, p1, top)
        if spawner: self.put(p0, top - 1, 'S')
        for i in range(steps):
            d = p1 + 1 + i
            self.put(d, top + i, '\\'); self.fill(d, d, top + i + 1, H - 1)
        return top, p0, p1

    def ice(self, c0, c1, r=GT):
        for c in range(c0, c1 + 1): self.put(c, r, 'I')

    def stairs(self, c, tops, width=3):     # solid steps up to a rainbow
        for i, t in enumerate(tops): self.ground(c + i * width, c + (i + 1) * width - 1, t)
        return c + len(tops) * width

    def rainbow(self, c, r):                # rainbow slide from (c, r) down to the ground, over a gap
        n = GT - r
        self.clear(c, c + n - 1)
        for i in range(n): self.put(c + i, r + i, ')')
        return c + n

    def hill_end(self, c, goal):            # the final hill with the Golden Carrot
        self.fill(c, c + 2, GT - 1, GT - 1)
        self.fill(c + 3, self.w - 1, GT - 2, GT - 1)
        self.carrots([c + 4, c + 5], GT - 3)
        self.put(goal, GT - 3, 'C')

    def text(self): return '\n'.join(''.join(r) for r in self.g)


def start(m):
    m.ground(0, m.w - 1)
    m.put(3, GT - 1, 'P')
    m.carrots(range(6, 10), GT - 1)


def opening(m, gate=12, box=24):
    """Gate → platforms + carrots → Question Box (the first stretch of every level)."""
    m.put(gate, GT - 1, 'G')
    m.fill(gate + 4, gate + 6, GT - 2, GT - 2, '='); m.carrots(range(gate + 4, gate + 7), GT - 3)
    m.fill(gate + 8, gate + 10, GT - 4, GT - 4, '='); m.carrots(range(gate + 8, gate + 11), GT - 5)
    m.put(box, GT - 3, '?')
    m.carrots([box + 2, box + 3], GT - 1)


LEVELS = {}

# ---- 2-1 Toadstool Trail: bouncy mushrooms everywhere --------------------------------------------
m = Map(120); start(m)
m.put(13, 12, 'G')
m.put(18, 12, 'm'); m.carrots([18], 9); m.carrots([19, 20], 7)
m.fill(21, 24, 9, 9, '='); m.carrots(range(21, 25), 8)
m.put(27, 10, '?')
m.put(29, 12, 'm'); m.clear(30, 32); m.carrots([30, 31, 32], 8)          # mushroom launch over a pit
m.bridge(36, 41); m.carrots(range(37, 41), 11)
m.put(45, 12, 'F')
m.put(47, 12, 'm'); m.clear(48, 50); m.carrots([48, 49, 50], 8)
m.put(52, 12, 'm'); m.clear(53, 55); m.carrots([53, 54, 55], 7)
m.put(57, 12, 'm'); m.fill(58, 60, 7, 7, '='); m.carrots(range(58, 61), 6)
m.star(63)
m.put(71, 12, 'G')
m.tunnel(78, 85, 80); m.carrots(range(82, 85), 12)
m.put(88, 12, 'F')
m.put(91, 12, 'm'); m.fill(92, 95, 8, 8, '='); m.carrots(range(92, 96), 7)
m.put(98, 10, '?')
m.put(102, 12, 'G')
m.hill_end(106, 113)
LEVELS['2-1'] = ('Toadstool Trail', 'mushroom', m,
  'bouncy mushrooms everywhere: boing over pits and up to high platforms')

# ---- 2-2 Fern Falls: Broken Bridges, the owl ------------------------------------------------------
m = Map(134); start(m); opening(m)
m.bridge(28, 32); m.carrots(range(29, 32), 11)
m.bridge(37, 43); m.carrots(range(38, 43), 11)
m.put(47, 12, 'F')
m.star(50)
m.put(58, 12, 'G')
m.tunnel(65, 72, 67); m.carrots(range(69, 72), 12)
m.bridge(77, 81); m.carrots(range(78, 81), 11)
m.put(86, 12, 'F')
m.fill(89, 92, 10, 10, '='); m.carrots(range(89, 93), 9)
m.put(100, 12, 'B')
m.put(111, 12, 'G')
m.hill_end(115, 124)
LEVELS['2-2'] = ('Fern Falls', 'mushroom', m, 'three Broken Bridges, then the night owl guards the gate')

# ---- 3-1 Turtle Bay: ride the turtles ------------------------------------------------------------
m = Map(120); start(m); opening(m, box=25)
m.bridge(29, 34); m.carrots(range(30, 34), 11)
m.put(38, 12, 'F')
m.turtle(42, 49); m.carrots(range(44, 48), 10)
m.star(53)
m.put(61, 12, 'G')
m.turtle(65, 73); m.carrots(range(67, 72), 10)
m.put(77, 12, 'F')
m.tunnel(81, 88, 83); m.carrots(range(85, 88), 12)
m.put(92, 10, '?')
m.put(97, 12, 'G')
m.hill_end(102, 111)
LEVELS['3-1'] = ('Turtle Bay', 'beach', m, 'friendly turtles carry Hoppy across the bay')

# ---- 3-2 Coral Cove: swim under the rocks, the crab -------------------------------------------------
m = Map(132); start(m); opening(m)
m.bridge(28, 33); m.carrots(range(29, 33), 11)
m.pool(38, 48, 41, 44)
m.put(52, 12, 'F')
m.star(55)
m.put(63, 12, 'G')
m.pool(67, 78, 70, 74)
m.put(82, 12, 'F')
m.tunnel(86, 93, 88); m.carrots(range(90, 93), 12)
m.put(101, 12, 'B')
m.put(110, 12, 'G')
m.hill_end(114, 123)
LEVELS['3-2'] = ('Coral Cove', 'beach', m, 'dive under the rock arches, then meet the grumpy crab')

# ---- 4-1 Frosty Slopes: slippery ice and snowball slopes ---------------------------------------------
m = Map(128); start(m)
m.ice(7, 11)
m.put(14, 12, 'G')
m.fill(18, 20, 11, 11, '='); m.carrots(range(18, 21), 10)
m.fill(22, 24, 9, 9, '='); m.carrots(range(22, 25), 8)
m.put(27, 10, '?')
m.bridge(31, 36); m.carrots(range(32, 36), 11)
m.put(40, 12, 'F')
top, p0, p1 = m.snow_hill(44, 4, 8); m.carrots(range(p0 + 2, p1), top - 1)
m.ice(61, 67)
m.star(70)
m.put(79, 12, 'G')
m.tunnel(84, 91, 86); m.carrots(range(88, 91), 12)
m.put(93, 12, 'F')
top, p0, p1 = m.snow_hill(96, 3, 5); m.put(p0 + 2, top - 3, '?')
m.ice(104, 108)
m.put(110, 12, 'G')
m.hill_end(114, 121)
LEVELS['4-1'] = ('Frosty Slopes', 'snow', m, 'slide on the ice and hop over the rolling snowballs')

# ---- 4-2 Icicle Climb: Carrot Lifts, the penguin ------------------------------------------------------
m = Map(140); start(m); opening(m)
m.bridge(28, 33); m.carrots(range(29, 33), 11)
m.lift(41, 49); m.ice(44, 48, 6); m.carrots(range(43, 49), 5)
m.put(54, 12, 'F')
m.star(59)
m.put(67, 12, 'G')
m.lift(74, 83); m.carrots(range(76, 83, 2), 5)
m.put(88, 12, 'F')
m.tunnel(98, 105, 100); m.carrots(range(102, 105), 12)
m.ice(108, 112)
m.put(117, 12, 'B')
m.hill_end(126, 133)
LEVELS['4-2'] = ('Icicle Climb', 'snow', m, 'two beanstalk Carrot Lifts up icy cliffs, then the bossy penguin')

# ---- 5-1 Cotton Sky: drifting clouds over wide gaps ----------------------------------------------------
m = Map(124); start(m); opening(m)
m.bridge(28, 33); m.carrots(range(29, 33), 11)
m.put(38, 12, 'F')
m.cloud(41, 47); m.carrots(range(43, 46), 10)
m.star(51)
m.put(59, 12, 'G')
m.cloud(63, 71); m.carrots(range(65, 70), 10)
m.put(75, 12, 'F')
m.tunnel(79, 86, 81); m.carrots(range(83, 86), 12)
m.cloud(90, 95); m.carrots(range(91, 95), 10)
m.put(99, 10, '?')
m.put(103, 12, 'G')
m.hill_end(108, 117)
LEVELS['5-1'] = ('Cotton Sky', 'candy', m, 'cotton-candy clouds drift across the gaps')

# ---- 5-2 Rainbow Road: rainbow slides, the Carrot Thief ------------------------------------------------
m = Map(138); start(m); opening(m)
m.bridge(28, 33); m.carrots(range(29, 33), 11)
end = m.stairs(40, [11, 9, 7]); end = m.rainbow(end, 7); m.carrots(range(41, 49, 2), 6)
m.put(57, 12, 'F')
m.star(60)
m.put(68, 12, 'G')
end = m.stairs(72, [11, 9, 7, 5]); end = m.rainbow(end, 5); m.carrots(range(73, 84, 2), 4)
m.put(95, 12, 'F')
m.tunnel(99, 106, 101); m.carrots(range(103, 106), 12)
m.put(112, 12, 'B')
m.put(121, 12, 'G')
m.hill_end(125, 132)
LEVELS['5-2'] = ('Rainbow Road', 'candy', m, 'climb the candy steps and whoosh down the rainbows; the Carrot Thief waits at the end')

for lid, (name, world, mp, blurb) in LEVELS.items():
    js = f"""// Level {lid} — {name}: {blurb}.
// Built by tools/make-levels.py (GAME_DESIGN §5 layout); map format: see README.md in this folder.
export default {{
  id: '{lid}',
  name: '{name}',
  world: '{world}',
  questions: '{lid}', // level config in src/engine/levels-config.js
  map: String.raw`
{mp.text()}
`,
}};
"""
    with open(os.path.join(OUT, f'{lid}.js'), 'w') as f: f.write(js)
    print(lid, name, mp.w, 'cols')
