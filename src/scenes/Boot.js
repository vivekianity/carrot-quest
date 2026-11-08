// Boot: turn every SVG string from src/art into Phaser textures (no image files, no network).
import { HOPPY_FRAMES } from '../art/hoppy.js';
import { BURROW_ART } from '../art/burrow.js';
import { STICKER_ART } from '../art/stickers.js';
import { dressHoppy } from '../skin.js';
import { groundTileSVG, platformTileSVG, iceTileSVG, slopeTileSVG, BLANK_TILE, PALETTES, DECOR } from '../art/tiles.js';
import { WORLD_ART, BG_W, BG_H } from '../art/worlds.js';
import { UI_ART } from '../art/ui.js';
import {
  BLOCK_ART, gateSVG, stoneSVG, END_ART, BRIDGE_ART, LOG_ART, MISC_ART, FENCE_ART,
  WATER_ART, MOVER_ART, BOUNCY_ART,
} from '../art/blocks.js';
import { BOSS_ART, BOSS_SIZE, PERCH_ART } from '../art/bosses.js';
import { AVATARS } from '../art/avatars.js';
import { MAP_ART } from '../art/map.js';
import { createHoppyAnims } from '../anims.js';
import { audioSettings } from '../audio.js';
import { settings } from '../save.js';
import { TILE, GROUND_VARIANTS, ICE_BASE, SLOPE_BASE, TILE_COUNT } from '../engine/level-map.js';

function loadSVG(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not draw an SVG sprite'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const label = this.add.text(640, 360, 'Loading…', {
      fontFamily: 'ui-rounded, system-ui, sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#6b4424',
    }).setOrigin(0.5);
    this.buildTextures()
      .then(() => {
        createHoppyAnims(this.anims);
        audioSettings.sound = settings.sound;
        audioSettings.music = settings.music;
        // Test links: ?level=2-1 jumps straight into a level, ?map opens the World Map.
        const q = new URLSearchParams(location.search);
        if (q.get('level')) this.scene.start('Level', { levelId: q.get('level') });
        else if (q.has('map')) this.scene.start('WorldMap');
        else this.scene.start('Title');
      })
      .catch((err) => { console.error(err); label.setText('Oops — ' + err.message); });
  }

  /** Draw an image onto a fresh canvas texture (works reliably for SVG on iOS WebGL). */
  addImage(key, img) {
    const tex = this.textures.createCanvas(key, img.width, img.height);
    tex.getContext().drawImage(img, 0, 0);
    tex.refresh();
  }

  async addSheet(key, frames, toSVG, w, h, perRow = 8) {
    const names = Object.keys(frames);
    const imgs = await Promise.all(names.map((n) => loadSVG(toSVG(frames[n]))));
    const cw = w + 4, ch = h + 4;
    const sheet = this.textures.createCanvas(key, cw * perRow, ch * Math.ceil(names.length / perRow));
    const ctx = sheet.getContext();
    names.forEach((n, i) => {
      const x = (i % perRow) * cw + 2, y = Math.floor(i / perRow) * ch + 2;
      ctx.drawImage(imgs[i], x, y);
      sheet.add(n, 0, x, y, w, h);
    });
    sheet.refresh();
    return names;
  }

  async addTileset(key, svgs) {
    const imgs = await Promise.all(svgs.map(loadSVG));
    const C = TILE + 2, cols = 12;
    const ts = this.textures.createCanvas(key, C * cols, C * Math.ceil(imgs.length / cols));
    const ctx = ts.getContext();
    const cv = ts.getCanvas();
    imgs.forEach((img, i) => {
      const x = (i % cols) * C, y = Math.floor(i / cols) * C;
      ctx.drawImage(img, x + 1, y + 1);
      ctx.drawImage(cv, x + 1, y + 1, 1, TILE, x, y + 1, 1, TILE);                 // left
      ctx.drawImage(cv, x + TILE, y + 1, 1, TILE, x + TILE + 1, y + 1, 1, TILE);   // right
      ctx.drawImage(cv, x, y + 1, C, 1, x, y, C, 1);                                // top
      ctx.drawImage(cv, x, y + TILE, C, 1, x, y + TILE + 1, C, 1);                  // bottom
    });
    ts.refresh();
    return imgs.length;
  }

  async buildTextures() {
    const T = this.textures;

    // Character sprite sheets: every pose in one padded canvas texture, one named frame each.
    // Hoppy is drawn wearing the current child's Burrow outfit (src/skin.js redraws it when it changes).
    await dressHoppy(this);
    const names = Object.keys(HOPPY_FRAMES);
    for (const [kind, b] of Object.entries(BOSS_ART)) await this.addSheet(kind, b.frames, b.draw, BOSS_SIZE, BOSS_SIZE);

    // Terrain tilesets (one per world): 64 px tiles in 66 px cells with 1 px extruded edges (no seams when scaled).
    let tileCount = 0;
    for (const [world, pal] of Object.entries(PALETTES)) {
      const tileSVGs = [];
      for (let v = 0; v < GROUND_VARIANTS; v++) for (let m = 0; m < 16; m++) tileSVGs.push(groundTileSVG(pal, m, v));
      for (let i = 0; i < 4; i++) tileSVGs.push(platformTileSVG(pal, !!(i & 1), !!(i & 2)));
      for (let m = 0; m < 16; m++) tileSVGs.push(iceTileSVG(pal, m));
      tileSVGs.push(slopeTileSVG(pal, 1), slopeTileSVG(pal, -1), BLANK_TILE, BLANK_TILE);
      console.assert(tileSVGs.length === TILE_COUNT && ICE_BASE === 36 && SLOPE_BASE === 52);
      tileCount += await this.addTileset(`tiles-${world}`, tileSVGs);
    }
    // Backgrounds, decorations, UI and effects.
    const singles = {};
    for (const [world, art] of Object.entries(WORLD_ART)) {
      for (const [layer, fn] of Object.entries(art)) singles[`bg-${world}-${layer}`] = fn();
    }
    for (const [world, set] of Object.entries(DECOR)) for (const [k, s] of Object.entries(set)) singles[`decor-${world}-${k}`] = s;
    for (const [k, a] of Object.entries(AVATARS)) singles[`avatar-${k}`] = a;
    Object.assign(singles, BURROW_ART, STICKER_ART, MAP_ART, UI_ART, BLOCK_ART, END_ART, BRIDGE_ART, LOG_ART, MISC_ART, FENCE_ART, WATER_ART, MOVER_ART, BOUNCY_ART, PERCH_ART);
    singles.gate = gateSVG();
    for (let i = 0; i < 3; i++) singles[`stone${i}`] = stoneSVG(i);
    const keys = Object.keys(singles);
    const loaded = await Promise.all(keys.map((k) => loadSVG(singles[k])));
    keys.forEach((k, i) => this.addImage(k, loaded[i]));

    console.info(`Carrot Quest: built ${names.length} Hoppy frames, ${tileCount} tiles, ${keys.length} images (bg ${BG_W}×${BG_H}).`);
  }
}
