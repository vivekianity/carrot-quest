// Dressing Hoppy: (re)draws her sprite sheet with the current outfit, so every scene that shows her —
// title, map, levels, burrow — has her in the clothes bought in the Burrow. The canvas texture is
// redrawn in place, so existing frames and animations keep working. Redraws are skipped when the
// outfit hasn't changed, and a newer request always wins over an older one still drawing.
import { hoppySVG, HOPPY_FRAMES, HOPPY_W, HOPPY_H } from './art/hoppy.js';
import { outfitOf, outfitKey } from './engine/shop.js';
import { wardrobeStore } from './save.js';

export function loadSVG(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not draw an SVG sprite'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

const PER_ROW = 8;
const drawn = {};      // texture key → outfit key currently on it
const latest = {};     // texture key → token of the newest request

/** The outfit the current child has on. */
export const currentOutfit = () => outfitOf(wardrobeStore.load());

/**
 * Draw Hoppy's frames (all of them by default) with `outfit` into the canvas texture `key`.
 * Resolves when the texture shows that outfit (or a newer request has taken over).
 */
export async function dressHoppy(scene, outfit = currentOutfit(), { key = 'hoppy', frames = Object.keys(HOPPY_FRAMES) } = {}) {
  const look = outfitKey(outfit);
  const T = scene.textures;
  if (drawn[key] === look && T.exists(key)) return;
  const token = {};
  latest[key] = token;
  const imgs = await Promise.all(frames.map((n) => loadSVG(hoppySVG(HOPPY_FRAMES[n], outfit))));
  if (latest[key] !== token) return;
  const cw = HOPPY_W + 4, ch = HOPPY_H + 4;
  let tex = T.exists(key) ? T.get(key) : null;
  if (!tex) {
    tex = T.createCanvas(key, cw * PER_ROW, ch * Math.ceil(frames.length / PER_ROW));
    frames.forEach((n, i) => tex.add(n, 0, (i % PER_ROW) * cw + 2, Math.floor(i / PER_ROW) * ch + 2, HOPPY_W, HOPPY_H));
  }
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, tex.width, tex.height);
  frames.forEach((n, i) => ctx.drawImage(imgs[i], (i % PER_ROW) * cw + 2, Math.floor(i / PER_ROW) * ch + 2));
  tex.refresh();
  drawn[key] = look;
}
