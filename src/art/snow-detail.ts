import type Phaser from "phaser";
import map from "../game/maps/place-des-lanternes.json";
import { decorations, courts } from "./village-design";
export const snowAssets = Object.fromEntries(
  [1, 2, 3, 4].map((i) => [
    `snow-d21-${i}`,
    `/assets/refinements-d21/neige_subtile_${i}_64.png`,
  ]),
);
export const snowTrails = [
  { x: 493, y: 620, dx: 0.3, dy: -1, count: 7 },
  { x: 192, y: 373, dx: 0.1, dy: -1, count: 5 },
  { x: 753, y: 304, dx: 1, dy: -0.3, count: 4 },
  { x: 461, y: 250, dx: 0.15, dy: -1, count: 4 },
];
export function snowVariant(column: number, row: number) {
  return (
    (((Math.imul(column + 31, 374761393) ^ Math.imul(row + 17, 668265263)) >>>
      3) %
      4) +
    1
  );
}
export function texturedSnow(
  scene: Phaser.Scene,
  ctx: CanvasRenderingContext2D,
) {
  ctx.globalAlpha = 0.76;
  for (let y = 0; y < 768; y += 64)
    for (let x = 0; x < 1024; x += 64) {
      const n = snowVariant(x / 64, y / 64);
      ctx.drawImage(
        scene.textures
          .get(`snow-d21-${n}`)
          .getSourceImage() as HTMLImageElement,
        x,
        y,
      );
    }
  ctx.globalAlpha = 1;
  for (const [x, y, rx, ry] of [
    [95, 92, 140, 70],
    [910, 110, 160, 80],
    [90, 620, 160, 90],
    [940, 655, 140, 110],
    [620, 235, 110, 64],
    [310, 490, 100, 55],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, "rgba(118,151,191,.12)");
    gradient.addColorStop(1, "rgba(118,151,191,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
}
function drift(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  ctx.fillStyle = "rgba(120,146,181,.14)";
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 2, w * 0.55, h * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 1 ? "#eef2f7" : "#e0e8f2";
    ctx.beginPath();
    ctx.ellipse(
      x + (i - 1) * w * 0.22,
      y - (i === 1 ? h * 0.25 : 0),
      w * (0.28 + (seed % 3) * 0.02),
      h * (i === 1 ? 0.8 : 0.65),
      0,
      Math.PI,
      Math.PI * 2,
    );
    ctx.fill();
  }
}
export function snowAccents(ctx: CanvasRenderingContext2D) {
  // Small baked accents only. Nothing is spawned per frame and no collider is introduced.
  map.buildings.forEach((b, i) => {
    const x = b.entrance.x * 16,
      y = b.entrance.y * 16;
    drift(ctx, x - b.widthTiles * 6, y + 4, 26, 5, i);
    drift(ctx, x + b.widthTiles * 5.5, y + 7, 22, 4, i + 1);
  });
  decorations
    .filter((d) => d.key.includes("pine") || d.key.includes("cloture"))
    .forEach((d, i) =>
      drift(ctx, d.x, d.y + 1, d.width * 0.52, 3 + (i % 3), i),
    );
  courts.forEach((c, i) => {
    for (let j = 0; j < 4; j++) {
      const angle = j * 0.77 + i * 0.43 + 0.2;
      drift(
        ctx,
        c.x + Math.cos(angle) * c.rx,
        c.y + Math.sin(angle) * c.ry,
        7 + ((i + j) % 5),
        2,
        i + j,
      );
    }
  });
  ctx.fillStyle = "rgba(102,130,165,.23)";
  for (const t of snowTrails)
    for (let i = 0; i < t.count; i++) {
      const side = i % 2 ? 1 : -1,
        x = t.x + t.dx * i * 7 - t.dy * side * 2,
        y = t.y + t.dy * i * 7 + t.dx * side * 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 1.4, 2.2, -Math.atan2(t.dx, t.dy), 0, Math.PI * 2);
      ctx.fill();
    }
}
