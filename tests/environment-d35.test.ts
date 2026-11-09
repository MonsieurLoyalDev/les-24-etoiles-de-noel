import { it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { rgbaPng } from "./png-rgba";
import metadata from "../src/art/environment-d35.json";
import proof from "../docs/graphismes/d35/PRESERVATION.json";
import { fenceModules35 } from "../src/art/fences35";
import {
  edgeVariation,
  polygonDistance,
  pathMaterial,
} from "../src/art/ground35";
import { plan, overlaps } from "../src/art/village34";
it("D35 préserve les fichiers publics et sources validés protégés", () => {
  for (const f of proof.files)
    expect(
      createHash("sha256").update(readFileSync(f.path)).digest("hex"),
      f.path,
    ).toBe(f.sha256);
});
it("D35 atlas compact : 47 images exactes, sans fond ni débordement de cellule", () => {
  const im = rgbaPng("public/assets/environment-d35/sprites.png");
  expect([im.width, im.height]).toEqual([1820, 1820]);
  expect(metadata.frames).toHaveLength(47);
  for (const f of metadata.frames) {
    const r = f.frame,
      b = Buffer.alloc(r.w * r.h * 4);
    for (let y = 0; y < r.h; y++)
      im.data.copy(
        b,
        y * r.w * 4,
        ((r.y + y) * im.width + r.x) * 4,
        ((r.y + y) * im.width + r.x + r.w) * 4,
      );
    expect(createHash("sha256").update(b).digest("hex"), f.name).toBe(
      f.pixelSha256,
    );
    for (let x = 0; x < r.w; x++) {
      expect(b[x * 4 + 3]).toBe(0);
      expect(b[((r.h - 1) * r.w + x) * 4 + 3]).toBe(0);
    }
    for (let y = 0; y < r.h; y++) {
      expect(b[y * r.w * 4 + 3]).toBe(0);
      expect(b[(y * r.w + r.w - 1) * 4 + 3]).toBe(0);
    }
    for (const other of metadata.frames.filter((o) => o.name !== f.name))
      expect(
        overlaps(
          { x: r.x, y: r.y, w: r.w, h: r.h },
          {
            x: other.frame.x,
            y: other.frame.y,
            w: other.frame.w,
            h: other.frame.h,
          },
        ),
      ).toBe(false);
  }
});
it("D35 quatre bancs bas et larges, sans étirement des proportions", () => {
  const frames = metadata.frames.filter((f) => f.name.startsWith("bench-"));
  expect(frames).toHaveLength(4);
  for (const f of frames) {
    expect(f.width / f.height).toBeGreaterThan(2.4);
    expect((80 * f.height) / f.width).toBeLessThan(34);
  }
});
it("D35 clôtures : jonctions uniques, quatre styles et cinq entrées de 32 pixels", () => {
  const m = fenceModules35(),
    keys = m.posts.map(
      (p) => p.garden + ":" + p.x.toFixed(3) + ":" + p.y.toFixed(3),
    );
  expect(new Set(keys).size).toBe(keys.length);
  expect(new Set(m.posts.map((p) => p.style)).size).toBe(4);
  expect(m.gates).toHaveLength(5);
  for (const g of m.gates) {
    expect(g.width).toBe(32);
    expect(
      m.posts.filter(
        (p) =>
          p.garden === g.id &&
          Math.abs(Math.hypot(p.x - g.center[0], p.y - g.center[1]) - 16) <
            0.05,
      ),
    ).toHaveLength(2);
    for (const p of m.panels.filter((p) => p.garden === g.id)) {
      const mid = { x: (p.a.x + p.b.x) / 2, y: (p.a.y + p.b.y) / 2 };
      expect(
        Math.hypot(mid.x - g.center[0], mid.y - g.center[1]),
      ).toBeGreaterThan(15);
    }
  }
  expect(plan.fences.length).toBe(32);
});
it("D35 bordures corrélées et matières différenciées sans bruit pixel aléatoire", () => {
  for (let x = 0; x < 400; x += 3)
    for (let y = 0; y < 400; y += 3) {
      expect(Math.abs(edgeVariation(x, y))).toBeLessThan(3.56);
      expect(
        Math.abs(edgeVariation(x + 1, y) - edgeVariation(x, y)),
      ).toBeLessThan(0.5);
      expect(
        Math.abs(edgeVariation(x, y + 1) - edgeVariation(x, y)),
      ).toBeLessThan(0.5);
    }
  expect([
    pathMaterial("main"),
    pathMaterial("lane"),
    pathMaterial("access"),
  ]).toEqual([0, 1, 2]);
  expect(
    polygonDistance({ x: 5, y: 5 }, [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]),
  ).toBe(-5);
  expect(
    polygonDistance({ x: 15, y: 5 }, [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]),
  ).toBe(5);
});
