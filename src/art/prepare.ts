import type Phaser from "phaser";
import { quietSnow, isolateSprite, alphaBounds } from "./pixels";
export const crops: Record<string, [number, number, number, number]> = {
  lampadaire: [61, 0, 82, 214],
  banc_plaid: [0, 0, 177, 114],
  panneau_direction: [27, 0, 108, 119],
  bonhomme_neige: [15, 12, 151, 195],
  jardiniere: [0, 0, 138, 95],
  cloture_guirlande: [42, 24, 331, 74],
  stand_cadeaux: [10, 8, 207, 228],
  brasero: [10, 0, 113, 129],
  banc_neige: [0, 0, 171, 111],
  guirlande_lanternes: [132, 38, 220, 148],
};
export const cleanKey = (key: string) => `clean-${key}`;
export function prepareSprite(
  scene: Phaser.Scene,
  key: string,
  building = false,
) {
  const target = cleanKey(key);
  if (scene.textures.exists(target)) return target;
  const source = scene.textures
    .get(`art-${key}`)
    .getSourceImage() as HTMLImageElement;
  const [x, y, w, h] = crops[key] ?? [0, 0, source.width, source.height];
  const texture = scene.textures.createCanvas(target, w, h)!;
  const ctx = texture.context;
  ctx.imageSmoothingEnabled = false;
  if (key === "arche_etoilebois") {
    // Existing approved gateway, following its outside contour and open centre; no new drawing.
    const outline = [
      [10, 316],
      [66, 298],
      [66, 270],
      [38, 263],
      [29, 244],
      [32, 220],
      [36, 210],
      [33, 170],
      [41, 140],
      [65, 110],
      [73, 87],
      [86, 83],
      [90, 41],
      [104, 24],
      [126, 24],
      [139, 39],
      [139, 62],
      [184, 43],
      [203, 17],
      [224, 24],
      [242, 34],
      [262, 20],
      [281, 22],
      [287, 51],
      [330, 60],
      [350, 33],
      [366, 20],
      [389, 25],
      [398, 43],
      [394, 72],
      [415, 100],
      [432, 97],
      [438, 107],
      [438, 135],
      [450, 153],
      [448, 184],
      [463, 215],
      [461, 246],
      [451, 266],
      [438, 266],
      [416, 247],
      [412, 290],
      [433, 305],
      [469, 322],
      [472, 342],
      [451, 351],
      [308, 352],
      [263, 342],
      [265, 329],
      [287, 317],
      [321, 306],
      [338, 283],
      [339, 228],
      [328, 214],
      [317, 215],
      [306, 199],
      [305, 183],
      [294, 182],
      [284, 203],
      [262, 216],
      [225, 207],
      [197, 204],
      [169, 187],
      [160, 192],
      [161, 214],
      [149, 224],
      [141, 222],
      [137, 283],
      [159, 306],
      [192, 322],
      [207, 338],
      [181, 351],
      [30, 351],
      [9, 343],
    ];
    ctx.save();
    ctx.beginPath();
    outline.forEach(([px, py], i) =>
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py),
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(source, 0, 0);
    ctx.restore();
  } else if (key === "lampadaire" || key === "brasero") {
    // Follow the original lantern silhouette, excluding its opaque baked brown halo.
    const outline =
      key === "lampadaire"
        ? [
            [110, 7],
            [119, 12],
            [119, 25],
            [135, 35],
            [143, 39],
            [143, 52],
            [135, 58],
            [132, 91],
            [126, 100],
            [126, 109],
            [119, 116],
            [120, 144],
            [129, 156],
            [129, 193],
            [143, 202],
            [143, 214],
            [69, 214],
            [71, 201],
            [89, 191],
            [93, 153],
            [99, 140],
            [99, 117],
            [90, 109],
            [89, 100],
            [82, 94],
            [78, 60],
            [73, 51],
            [74, 40],
            [92, 31],
            [103, 24],
            [103, 13],
          ]
        : [
            [70, 0],
            [79, 0],
            [83, 15],
            [91, 7],
            [93, 26],
            [104, 37],
            [102, 47],
            [116, 49],
            [123, 61],
            [116, 85],
            [104, 98],
            [112, 114],
            [101, 131],
            [25, 131],
            [0, 125],
            [7, 112],
            [17, 102],
            [16, 84],
            [13, 58],
            [18, 48],
            [34, 42],
            [37, 28],
            [42, 20],
            [47, 33],
            [56, 22],
            [57, 8],
            [62, 20],
          ];
    ctx.save();
    ctx.beginPath();
    outline.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px - x, py - y);
      else ctx.lineTo(px - x, py - y);
    });
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    ctx.restore();
  } else ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  if (key === "brasero") ctx.clearRect(0, 0, 26, 25);
  if (key === "stand_cadeaux") ctx.clearRect(167, 0, 40, 16);
  const pixels = ctx.getImageData(0, 0, w, h);
  isolateSprite(pixels, building);
  ctx.putImageData(pixels, 0, 0);
  texture.refresh();
  return target;
}
export function prepareSnow(scene: Phaser.Scene) {
  const key = "quiet-snow";
  if (scene.textures.exists(key)) return scene.textures.get(key);
  const source = scene.textures
    .get("art-snow")
    .getSourceImage() as HTMLImageElement;
  const t = scene.textures.createCanvas(key, source.width, source.height)!;
  t.context.drawImage(source, 0, 0);
  const data = t.context.getImageData(0, 0, source.width, source.height);
  data.data.set(quietSnow(data));
  t.context.putImageData(data, 0, 0);
  t.refresh();
  return t;
}
const metrics = new WeakMap<
  Phaser.Textures.TextureManager,
  Map<string, { height: number; foot: number }>
>();
export function actorMetric(scene: Phaser.Scene, key: string) {
  const cache = metrics.get(scene.textures) ?? new Map();
  metrics.set(scene.textures, cache);
  if (cache.has(key)) return cache.get(key)!;
  const texture = scene.textures.get(key),
    source = texture.getSourceImage() as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let top = Infinity,
    bottom = 0,
    frameHeight = 1;
  for (const name of texture.getFrameNames()) {
    const frame = texture.get(name);
    const b = alphaBounds(data, {
      x: frame.cutX,
      y: frame.cutY,
      w: frame.cutWidth,
      h: frame.cutHeight,
    });
    if (b.bottom >= 0) {
      top = Math.min(top, b.top);
      bottom = Math.max(bottom, b.bottom);
      frameHeight = frame.realHeight;
    }
  }
  const value = {
    height: Math.max(1, bottom - top + 1),
    foot: (bottom + 1) / frameHeight,
  };
  cache.set(key, value);
  return value;
}
