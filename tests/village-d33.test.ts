import { it, expect } from "vitest";
import {
  roomPlans,
  interiorCollisions,
  roomDimensions,
  allFurniture,
} from "../src/art/rooms33";
import { homes, frontPaths } from "../src/art/village33";
import {
  urbanLanes,
  villageSize,
  humanDoorHeight,
} from "../src/art/urban-plan";
import { blocked } from "../src/domain";
import { decorFor, decorationRects } from "../src/decor/model";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import houses from "../src/art/homes-d33.json";
import assets from "../docs/graphismes/d33/ASSETS-INTERIEURS.json";
import allowlist from "../ops/public-assets.json";
it("seize silhouettes, portes calibrées et exports alpha traçables", () => {
  expect(homes).toHaveLength(16);
  expect(new Set(homes.map((x) => x.key)).size).toBe(16);
  expect(humanDoorHeight).toBe(44);
  for (const a of [...houses, ...assets]) {
    for (const part of [a.original, a.public])
      expect(
        createHash("sha256").update(readFileSync(part.path)).digest("hex"),
      ).toBe(part.sha256);
    expect(allowlist).toContain(a.public.path);
    expect(a.width).toBeLessThanOrEqual(512);
    expect(a.height).toBeLessThanOrEqual(512);
    if (!a.key.includes("floor"))
      expect(a.corners.every((x) => x <= 1)).toBe(true);
  }
});
it("les axes et les allées évitent les emprises des seize maisons", () => {
  const rects = homes.map((h) => h.footprint);
  for (const lane of [...urbanLanes, ...frontPaths])
    for (let i = 1; i < lane.points.length; i++) {
      const a = lane.points[i - 1],
        b = lane.points[i],
        length = Math.hypot(b.x - a.x, b.y - a.y);
      for (let n = 0; n <= length; n += 4) {
        const p = {
          x: a.x + ((b.x - a.x) * n) / length,
          y: a.y + ((b.y - a.y) * n) / length,
        };
        expect(
          blocked(p, rects, villageSize.width, villageSize.height),
          lane.id + " " + JSON.stringify(p),
        ).toBe(false);
      }
    }
  for (const h of homes) {
    expect(h.x - h.width / 2).toBeGreaterThan(0);
    expect(h.x + h.width / 2).toBeLessThan(villageSize.width);
    expect(h.y - h.maxHeight).toBeGreaterThan(0);
  }
});
it("les quatre plans sont distincts, reliés et tous les objets restent accessibles", () => {
  expect(
    new Set(Object.values(roomPlans).map((x) => JSON.stringify(x.volumes)))
      .size,
  ).toBe(4);
  for (const room of ["house", "library", "workshop", "inn"] as const) {
    const { width, height } = roomDimensions(room),
      rects = [...interiorCollisions(room), ...decorationRects(room)],
      seen = new Set<string>(),
      queue = [{ x: 240, y: 280 }];
    for (let index = 0; index < queue.length; index++) {
      const p = queue[index];
      for (const [dx, dy] of [
        [8, 0],
        [-8, 0],
        [0, 8],
        [0, -8],
      ]) {
        const q = { x: p.x + dx, y: p.y + dy },
          key = q.x + "," + q.y;
        if (!seen.has(key) && !blocked(q, rects, width, height)) {
          seen.add(key);
          queue.push(q);
        }
      }
    }
    for (const item of [
      ...decorFor(room),
      { id: "exit", x: 240, y: 315 },
      { id: "quest", x: 240, y: 175 },
      { id: "mini", x: 370, y: 255 },
    ])
      expect(
        queue.some((p) => Math.hypot(p.x - item.x, p.y - item.y) < 22),
        room + ":" + item.id,
      ).toBe(true);
    for (const f of allFurniture(room))
      expect(
        queue.some(
          (p) => Math.abs(p.x - f.x) < 35 && p.y > f.y && p.y < f.y + 35,
        ),
        room + ":" + f.key,
      ).toBe(true);
    expect(seen.size).toBeGreaterThan(1000);
  }
});
it("le centre historique et le détour Phase B restent libres", () => {
  const r = homes.map((h) => h.footprint);
  for (let x = 208; x <= 736; x += 4)
    expect(blocked({ x, y: 608 }, r, 1920, 1408)).toBe(false);
  for (let y = 326; y <= 608; y += 4)
    expect(blocked({ x: 208, y }, r, 1920, 1408)).toBe(false);
});
