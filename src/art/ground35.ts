import type Phaser from "phaser";
import {
  plan,
  roundedRoute,
  routes34,
  pedestrianCourts,
  inPolygon,
  distanceToSegment,
} from "./village34";
import type { Point } from "../domain";
import {
  pathWeathering351,
  driftRelief351,
  driftShadow351,
} from "./composition351";

/** Broad correlated variations, not independently scattered speckles. Deterministic on reload. */
export function edgeVariation(x: number, y: number) {
  return (
    Math.sin(x * 0.079 + Math.sin(y * 0.037) * 2.1) * 1.7 +
    Math.sin(y * 0.113 + x * 0.027) * 1.3 +
    Math.sin(x * 0.29 - y * 0.21) * 0.55
  );
}
export function polygonDistance(p: Point, points: number[][]) {
  let d = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    d = Math.min(
      d,
      distanceToSegment(p, { x: a[0], y: a[1] }, { x: b[0], y: b[1] }),
    );
  }
  return inPolygon(p, points) ? -d : d;
}
export function pathMaterial(type: string) {
  return type === "main" ? 0 : type === "access" ? 2 : 1;
}
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** One static surface. No strokes, tiled sprites, or per-frame terrain work. */
export function drawGround35(scene: Phaser.Scene) {
  const key = "paths-d35-integrated";
  if (!scene.textures.exists(key)) {
    const started = performance.now(),
      { width, height } = plan.world,
      count = width * height;
    const fields = Array.from({ length: 4 }, () =>
      new Float32Array(count).fill(1000),
    );
    const region = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      fn: (x: number, y: number, i: number) => void,
    ) => {
      for (
        let y = Math.max(0, Math.floor(y0));
        y <= Math.min(height - 1, Math.ceil(y1));
        y++
      )
        for (
          let x = Math.max(0, Math.floor(x0));
          x <= Math.min(width - 1, Math.ceil(x1));
          x++
        )
          fn(x, y, y * width + x);
    };
    for (const r of routes34) {
      const points = roundedRoute(r.points),
        field = fields[pathMaterial(r.type)],
        radius = r.width / 2;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i],
          margin = radius + 7;
        region(
          Math.min(a.x, b.x) - margin,
          Math.min(a.y, b.y) - margin,
          Math.max(a.x, b.x) + margin,
          Math.max(a.y, b.y) + margin,
          (x, y, index) => {
            field[index] = Math.min(
              field[index],
              distanceToSegment({ x, y }, a, b) - radius,
            );
          },
        );
      }
    }
    for (const court of pedestrianCourts) {
      const field = fields[court.id === "C3" ? 1 : 3],
        xs = court.points.map((p) => p[0]),
        ys = court.points.map((p) => p[1]);
      region(
        Math.min(...xs) - 8,
        Math.min(...ys) - 8,
        Math.max(...xs) + 8,
        Math.max(...ys) + 8,
        (x, y, index) => {
          field[index] = Math.min(
            field[index],
            polygonDistance({ x, y }, court.points),
          );
        },
      );
    }
    const source = scene.textures
      .get("source-d35-paths")
      .getSourceImage() as HTMLImageElement;
    // The artwork's stones are exported at a deliberate game scale, not sampled at full sheet size.
    const samples = [96, 112, 100, 112].map((size, material) => {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        source,
        (material % 2) * 112,
        Math.floor(material / 2) * 112,
        size,
        size,
        0,
        0,
        size,
        size,
      );
      return { size, data: ctx.getImageData(0, 0, size, size).data };
    });
    const texture = scene.textures.createCanvas(key, width, height)!,
      c = texture.context;
    const pixels = c.createImageData(width, height),
      dst = pixels.data;
    let covered = 0,
      irregularEdge = 0,
      snowIslands = 0;
    const materialPixel = (material: number, x: number, y: number) => {
      const sample = samples[material],
        s = sample.size;
      // Mirror extension gives exact colour continuity at tile boundaries; no visible grid cuts.
      const u = ((x % (s * 2)) + s * 2) % (s * 2),
        v = ((y % (s * 2)) + s * 2) % (s * 2);
      return (
        ((v < s ? v : s * 2 - 1 - v) * s + (u < s ? u : s * 2 - 1 - u)) * 4
      );
    };
    const previousDriftRow = new Float32Array(width);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const previousDrift = previousDriftRow[x];
        previousDriftRow[x] = 0;
        const i = y * width + x;
        let material = 0,
          distance = fields[0][i],
          second = 1,
          next = fields[1][i];
        for (let m = 1; m < 4; m++) {
          const d = fields[m][i];
          if (d < distance) {
            second = material;
            next = distance;
            material = m;
            distance = d;
          } else if (m !== material && d < next) {
            second = m;
            next = d;
          }
        }
        if (distance > 8) continue;
        const variation = edgeVariation(x, y) * (material === 2 ? 0.85 : 1.6),
          edge = distance + variation;
        if (edge > 2.5) continue;
        const index = i * 4,
          src = samples[material].data,
          si = materialPixel(material, x, y);
        const blend = next < 4 ? clamp(0.5 - (next - distance) / 9, 0, 0.5) : 0;
        const other = samples[second].data,
          oi = materialPixel(second, x, y);
        // Small joined snow tongues and islands, restricted to the path's own footprint.
        const dune =
          Math.sin(x * 0.032 + Math.sin(y * 0.044) * 2.5) +
          Math.sin(y * 0.073 - x * 0.019);
        const snow =
          clamp((dune - 0.75) * 0.8, 0, 0.9) * (distance > -9 ? 1 : 0.48);
        const edgeAlpha =
          edge > 1.5 ? 0 : edge > -0.7 ? 0.35 : edge > -2.3 ? 0.72 : 1;
        const drift = pathWeathering351(x, y, distance);
        previousDriftRow[x] = drift;
        const relief = driftRelief351(
          drift,
          (src[si] + src[si + 1] + src[si + 2]) / 3,
        );
        const contact = driftShadow351(previousDrift, drift, x, y);
        const alpha =
          edgeAlpha *
          (material === 1 ? 0.84 : 0.97) *
          (1 - snow) *
          (1 - relief);
        for (let rgb = 0; rgb < 3; rgb++)
          dst[index + rgb] =
            (src[si + rgb] * (1 - blend) + other[oi + rgb] * blend) *
              (1 - contact) +
            [118, 143, 165][rgb] * contact;
        dst[index + 3] = Math.round(alpha * 255);
        if (alpha > 0.3) covered++;
        if (edgeAlpha > 0 && edgeAlpha < 1) irregularEdge++;
        if (snow > 0.14) snowIslands++;
      }
    c.putImageData(pixels, 0, 0);
    texture.refresh();
    scene.game.canvas.dataset.ground35 = JSON.stringify({
      width,
      height,
      covered,
      irregularEdge,
      snowIslands,
      materials: 4,
      routes: routes34.length,
      courts: pedestrianCourts.length,
      baked: true,
      milliseconds: Math.round(performance.now() - started),
    });
  }
  scene.add
    .image(0, 0, key)
    .setOrigin(0)
    .setDepth(-99)
    .setName("d35:integrated-ground");
}
