import { plan } from "../src/art/village34";
import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  decorations,
  interactionReserves,
  existingCollisionRects,
} from "../src/art/village-design";
import {
  borderPlants,
  pineVariants,
  chooseVegetation,
  variantAssets,
} from "../src/art/vegetation-design";
import map from "../src/game/maps/place-des-lanternes.json";
import { blocked } from "../src/domain";
import allowlist from "../ops/public-assets.json";
it("les cinq silhouettes de sapins sont réellement réparties dans le village", () => {
  const points = [
    ...plan.woods.flatMap((z) => z.points.map(([x, y]) => ({ x, y }))),
    ...decorations.filter((d) => d.key === "vegetation_pine_large"),
    ...map.props
      .filter((p) => p.sprite === "pine_large")
      .map((p) => ({ x: p.tileX * 16, y: p.tileY * 16 })),
  ];
  const used = new Set(
    points.map((p) => chooseVegetation("vegetation_pine_large", p.x, p.y)),
  );
  expect([...used].sort()).toEqual([...pineVariants].sort());
  for (const p of points)
    expect(chooseVegetation("vegetation_pine_large", p.x, p.y)).toBe(
      chooseVegetation("vegetation_pine_large", p.x, p.y),
    );
});
it("les sept nouvelles silhouettes sont des fichiers alpha distincts et autorisés", () => {
  const hashes = new Set();
  for (const path of Object.values(variantAssets)) {
    const bytes = readFileSync("public" + path);
    expect(bytes[25], path).toBe(6);
    expect(allowlist).toContain("public" + path);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
  }
  expect(hashes.size).toBe(7);
});
it("les douze nouveaux buissons dégagent les interactions, portes et passages", () => {
  expect(borderPlants).toHaveLength(12);
  const rects = existingCollisionRects();
  for (const p of borderPlants) {
    expect(blocked(p, rects, 1024, 768), p.id).toBeFalsy();
    for (const point of interactionReserves) {
      const dx = Math.max(0, Math.abs(p.x - point.x) - p.width * 0.3);
      expect(Math.hypot(dx, p.y - point.y), p.id).toBeGreaterThan(22);
    }
    // Preserve the southern axis and the entire original NPC patrol rectangle.
    expect(
      p.x + p.width / 2 < 488 || p.x - p.width / 2 > 536 || p.y < 470,
      p.id,
    ).toBeTruthy();
    expect(p.x < 642 || p.x > 748 || p.y < 462 || p.y > 568, p.id).toBeTruthy();
  }
});
