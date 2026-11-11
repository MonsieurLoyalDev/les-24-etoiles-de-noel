import { it, expect } from "vitest";
import {
  quarterItems351b,
  quarterGround351b,
  quarterRegion351b,
  pathWeathering351b,
  driftShadow351b,
  quarterDrifts351b,
} from "../src/art/quarters351b";
import { witnessRegion351 } from "../src/art/composition351";
it("B : compositions de quartiers distinctes, hors A.2", () => {
  for (const item of quarterItems351b) {
    expect(quarterRegion351b(item.x, item.y), item.group).toBe(item.quarter);
    expect(witnessRegion351(item.x, item.y)).toBe(false);
  }
  expect(new Set(quarterItems351b.map((p) => p.group)).size).toBe(19);
  expect(
    quarterItems351b.filter((p) => p.key === "d31-workshop-bench"),
  ).toHaveLength(1);
  for (const p of quarterGround351b)
    expect(quarterRegion351b(p.x, p.y)).not.toBeNull();
});
it("B : neige localisée, stable, bornée et sans débordement A.2", () => {
  let changed = 0;
  for (let y = 0; y < 1408; y += 11)
    for (let x = 0; x < 1920; x += 11) {
      const value = pathWeathering351b(x, y, -3);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0.9);
      if (!quarterRegion351b(x, y) || witnessRegion351(x, y)) {
        expect(value).toBe(0);
        expect(driftShadow351b(0.9, 0, x, y)).toBe(0);
      }
      if (value > 0) changed++;
      expect(pathWeathering351b(x, y, 4)).toBe(0);
    }
  expect(changed).toBeGreaterThan(50);
  expect(quarterDrifts351b).toHaveLength(12);
});
