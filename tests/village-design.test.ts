import { it, expect } from "vitest";
import {
  plan,
  anchors,
  villageMap,
  routeSegments,
  facadeBounds,
  fenceRects,
  restoreOutdoorPosition,
  overlaps,
} from "../src/art/village34";
import { readFileSync } from "node:fs";
import { blocked } from "../src/domain";
const approved = JSON.parse(
  readFileSync("docs/graphismes/d34/plan-valide-v2.json", "utf8"),
);
it("les vingt bâtiments suivent les positions V2 approuvées, quatre maisons par cour", () => {
  expect(plan.houses).toHaveLength(16);
  expect(plan.buildings).toHaveLength(4);
  for (const b of [...approved.houses, ...approved.buildings]) {
    const live = [...plan.houses, ...plan.buildings].find(
      (h) => h.id === b.id,
    )!;
    expect([live.x, live.y, live.w, live.h]).toEqual([b.x, b.y, b.w, b.h]);
  }
  for (const q of plan.quarters)
    expect(plan.houses.filter((h) => h.quarter === q.id)).toHaveLength(4);
});
it("les façades et leurs portes gardent les apparences et les destinations validées", () => {
  expect(villageMap.buildings.map((b) => b.id).sort()).toEqual([
    "inn",
    "library",
    "loyal_house",
    "workshop",
  ]);
  for (const b of villageMap.buildings) {
    const p = plan.buildings.find((p) => p.id === b.id)!;
    expect([b.entrance.x * 16, b.entrance.y * 16]).toEqual([p.x, p.y]);
  }
  for (const h of plan.houses) {
    const doorHeight = (h.sourceDoor[3] - h.sourceDoor[1]) * h.h;
    expect(doorHeight, h.key).toBeGreaterThan(41);
    expect(doorHeight, h.key).toBeLessThan(47);
  }
});
it("les courbes et leurs largeurs évitent les façades et les emprises physiques", () => {
  const solids = [
    ...facadeBounds,
    ...plan.houses.map((h) => h.collision),
    ...plan.buildings.map((b) => b.collision),
  ];
  for (const s of routeSegments) {
    const length = Math.ceil(Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y));
    for (let n = 0; n <= length; n++) {
      const t = n / (length || 1),
        p = { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t },
        box = {
          x: p.x - s.width / 2 - 6,
          y: p.y - s.width / 2 - 4,
          w: s.width + 12,
          h: s.width + 8,
        };
      expect(solids.some((r) => overlaps(box, r))).toBe(false);
    }
  }
});
it("les anciennes positions bloquées sont sauvées sans muter la sauvegarde", () => {
  const rects = [
    ...plan.houses.map((h) => h.collision),
    ...plan.buildings.map((b) => b.collision),
    ...fenceRects,
  ];
  const p = { x: plan.houses[0].x, y: plan.houses[0].y - 20 },
    snapshot = { ...p };
  const safe = restoreOutdoorPosition(p, rects);
  expect(p).toEqual(snapshot);
  expect(blocked(safe, rects, 1920, 1408)).toBe(false);
  expect(
    facadeBounds.some((r) =>
      overlaps({ x: safe.x - 6, y: safe.y - 4, w: 12, h: 8 }, r),
    ),
  ).toBe(false);
  const valid = { ...anchors.spawn };
  expect(restoreOutdoorPosition(valid, rects)).toBe(valid);
});
it("toutes les portes et les ancres restent reliées aux collisions de base, clôtures comprises", () => {
  const rects = [
    ...plan.houses.map((h) => h.collision),
    ...plan.buildings.map((b) => b.collision),
    ...fenceRects,
  ];
  const step = 4,
    nx = 480,
    ny = 352,
    seen = new Uint8Array(nx * ny),
    queue = [
      {
        x: Math.round(anchors.spawn.x / 4) * 4,
        y: Math.round(anchors.spawn.y / 4) * 4,
      },
    ];
  seen[(queue[0].y / step) * nx + queue[0].x / step] = 1;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    for (const [dx, dy] of [
      [4, 0],
      [-4, 0],
      [0, 4],
      [0, -4],
    ]) {
      const q = { x: p.x + dx, y: p.y + dy },
        key = (q.y / step) * nx + q.x / step;
      if (
        q.x >= 8 &&
        q.y >= 8 &&
        q.x <= 1912 &&
        q.y <= 1400 &&
        !seen[key] &&
        !blocked(q, rects, 1920, 1408)
      ) {
        seen[key] = 1;
        queue.push(q);
      }
    }
  }
  for (const p of [
    ...plan.houses.map((h) => h.door),
    ...plan.buildings.map((b) => b.returnPoint),
    ...anchors.hunts,
    anchors.advent,
    anchors.final,
  ])
    expect(seen[Math.round(p.y / 4) * nx + Math.round(p.x / 4)]).toBe(1);
});
