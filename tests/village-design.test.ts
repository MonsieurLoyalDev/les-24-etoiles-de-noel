import { it, expect } from "vitest";
import {
  decorations,
  lanes,
  interactionReserves,
  existingCollisionRects,
} from "../src/art/village-design";
import { blocked } from "../src/domain";
import catalog from "../src/art/catalog.json";
import inventory from "../docs/graphismes/INVENTAIRE.json";
import { crops } from "../src/art/prepare";
it("tous les ornements ont une source validée et restent dans le monde", () => {
  expect(new Set(decorations.map((d) => d.id)).size).toBe(decorations.length);
  expect(decorations.length).toBeLessThanOrEqual(90);
  for (const d of decorations) {
    const url = catalog.images[d.key as keyof typeof catalog.images];
    expect(url, d.id).toBeTruthy();
    const source = inventory.find((a) => a.integration === "public" + url)!;
    expect(source, d.key).toBeTruthy();
    const crop = crops[d.key] ?? [0, 0, source.width!, source.height!];
    const height = (d.width * crop[3]) / crop[2];
    expect(d.x - d.width / 2, d.id).toBeGreaterThanOrEqual(0);
    expect(d.x + d.width / 2, d.id).toBeLessThanOrEqual(1024);
    expect(d.y - height, d.id).toBeGreaterThanOrEqual(0);
    expect(d.y, d.id).toBeLessThanOrEqual(768);
  }
});
it("les nouvelles bases décoratives dégagent les points d'interaction", () => {
  for (const d of decorations.filter((d) => !d.back && !d.overhead))
    for (const p of interactionReserves) {
      const dx = Math.max(0, Math.abs(p.x - d.x) - d.width * 0.25),
        dy = Math.max(0, Math.abs(p.y - (d.y - 2)) - 4);
      expect(
        Math.hypot(dx, dy),
        `${d.id} à proximité de ${p.x},${p.y}`,
      ).toBeGreaterThanOrEqual(18);
    }
});
it("les allées gardent une largeur adaptée et les destinations d'origine", () => {
  expect(lanes.find((l) => l.id === "main")?.width).toBe(48);
  expect(
    lanes
      .filter((l) => l.material === "stone")
      .every((l) => l.width >= 28 && l.width <= 48),
  ).toBeTruthy();
  expect(lanes.find((l) => l.id === "house")?.points[0]).toEqual({
    x: 800,
    y: 644,
  });
  expect(lanes.find((l) => l.id === "library")?.points[0]).toEqual({
    x: 208,
    y: 314,
  });
});
it("les bancs ne se chevauchent pas et la patrouille d'Augustin reste dégagée", () => {
  const benches = decorations
    .filter((d) => d.key === "banc_plaid" || d.key === "banc_neige")
    .map((d) => ({
      id: d.id,
      x: d.x - d.width / 2,
      y: d.y - d.width * 0.65,
      w: d.width,
      h: d.width * 0.65,
    }));
  benches.push(
    { id: "banc-original-ouest", x: 302, y: 276, w: 68, h: 44 },
    { id: "banc-original-est", x: 638, y: 404, w: 68, h: 44 },
  );
  const overlaps = (
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  for (let i = 0; i < benches.length; i++)
    for (let j = i + 1; j < benches.length; j++)
      expect(
        overlaps(benches[i], benches[j]),
        `${benches[i].id} / ${benches[j].id}`,
      ).toBe(false);
  for (const d of decorations.filter((d) => !d.back && !d.overhead))
    expect(
      overlaps(
        { x: d.x - d.width * 0.25, y: d.y - 6, w: d.width * 0.5, h: 8 },
        { x: 642, y: 462, w: 106, h: 106 },
      ),
      d.id,
    ).toBe(false);
});
it("tous les accès et zones de quêtes restent reliés avec les collisions existantes", () => {
  const rects = existingCollisionRects(),
    step = 8,
    nx = 129,
    ny = 97,
    start = { x: 512, y: 608 };
  const visited = new Set<number>(),
    queue = [start];
  visited.add((start.y / step) * nx + start.x / step);
  for (let head = 0; head < queue.length; head++) {
    const p = queue[head];
    for (const [dx, dy] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ]) {
      const q = { x: p.x + dx, y: p.y + dy };
      if (
        q.x < 0 ||
        q.y < 0 ||
        q.x > 1024 ||
        q.y > 768 ||
        blocked(q, rects, 1024, 768)
      )
        continue;
      const id = (q.y / step) * nx + q.x / step;
      if (!visited.has(id)) {
        visited.add(id);
        queue.push(q);
      }
    }
  }
  expect(visited.size).toBeGreaterThan(6000);
  expect(visited.size).toBeLessThan(nx * ny);
  for (const target of interactionReserves) {
    const nearest = {
      x: Math.round(target.x / step) * step,
      y: Math.round(target.y / step) * step,
    };
    expect(
      visited.has((nearest.y / step) * nx + nearest.x / step),
      `accès ${target.x},${target.y}`,
    ).toBeTruthy();
  }
});
