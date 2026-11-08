import type Phaser from "phaser";
import { isolateSprite, alphaBounds } from "./pixels";
import { terrainAssets, terrainRegions, snowBanks } from "./terrain-design";
export function prepareTerrain(scene: Phaser.Scene) {
  const audit = [];
  for (const key of Object.keys(terrainAssets)) {
    const target = "ground-d3-" + key;
    if (scene.textures.exists(target)) continue;
    const raw = "source-ground-d3-" + key,
      source = scene.textures.get(raw).getSourceImage() as HTMLImageElement;
    const c = document.createElement("canvas");
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(source, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height),
      corners = [
        data.data[3],
        data.data[(c.width - 1) * 4 + 3],
        data.data[(c.height - 1) * c.width * 4 + 3],
        data.data[data.data.length - 1],
      ];
    if (key !== "paw-trail") isolateSprite(data);
    ctx.putImageData(data, 0, 0);
    const b = alphaBounds(data, { x: 0, y: 0, w: c.width, h: c.height });
    const x = Math.max(0, b.left - 3),
      y = Math.max(0, b.top - 3),
      w = Math.min(c.width - x, b.right - x + 4),
      h = Math.min(c.height - y, b.bottom - y + 4);
    const scale = Math.min(1, 508 / Math.max(w, h)),
      tex = scene.textures.createCanvas(
        target,
        Math.ceil(w * scale) + 4,
        Math.ceil(h * scale) + 4,
      )!;
    tex.context.imageSmoothingEnabled = false;
    tex.context.drawImage(c, x, y, w, h, 2, 2, tex.width - 4, tex.height - 4);
    tex.refresh();
    const renderCorners = [
      [0, 0],
      [tex.width - 1, 0],
      [0, tex.height - 1],
      [tex.width - 1, tex.height - 1],
    ].map(([cx, cy]) => tex.context.getImageData(cx, cy, 1, 1).data[3]);
    audit.push({
      key,
      rawCorners: corners,
      corners: renderCorners,
      transparent: renderCorners.every((a) => a === 0),
      width: tex.width,
      height: tex.height,
    });
    scene.textures.remove(raw);
  }
  if (audit.length)
    scene.game.canvas.dataset.terrainAssets = JSON.stringify(audit);
}
function stamp(
  scene: Phaser.Scene,
  ctx: CanvasRenderingContext2D,
  p: {
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
    flip?: boolean;
  },
) {
  const image = scene.textures
    .get("ground-d3-" + p.key)
    .getSourceImage() as HTMLCanvasElement;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.flip) ctx.scale(-1, 1);
  ctx.drawImage(image, -p.w / 2, -p.h / 2, p.w, p.h);
  ctx.restore();
}
export function drawTerrain(
  scene: Phaser.Scene,
  ctx: CanvasRenderingContext2D,
) {
  for (const p of terrainRegions) stamp(scene, ctx, p);
}
export function drawTerrainDetails(
  scene: Phaser.Scene,
  ctx: CanvasRenderingContext2D,
) {
  for (const p of snowBanks) stamp(scene, ctx, p);
}
export function auditTerrain(
  scene: Phaser.Scene,
  ctx: CanvasRenderingContext2D,
) {
  const d = ctx.getImageData(0, 0, 1024, 768).data;
  let snow = 0,
    earth = 0,
    opaque = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 255) opaque++;
    if (d[i] > 180 && d[i + 1] > 185 && d[i + 2] > 190) snow++;
    if (d[i] - d[i + 2] > 14 && d[i] > d[i + 1] * 1.08 && d[i + 1] < 170)
      earth++;
  }
  scene.game.canvas.dataset.terrain = JSON.stringify({
    snowFraction: snow / (1024 * 768),
    earthFraction: earth / (1024 * 768),
    opaqueFraction: opaque / (1024 * 768),
    regions: terrainRegions.length,
    details: snowBanks.length,
  });
}
