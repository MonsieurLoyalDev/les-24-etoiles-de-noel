import { it, expect } from "vitest";
import {
  witnessItems351,
  witnessRegion351,
  pathWeathering351,
} from "../src/art/composition351";
it("D351 étape A : les compositions sont limitées aux deux secteurs témoins", () => {
  for (const p of witnessItems351) {
    expect(witnessRegion351(p.x, p.y), p.group).toBe(true);
    expect(p.width).toBeGreaterThan(10);
    expect(p.width).toBeLessThanOrEqual(80);
  }
  for (const p of [
    [420, 420],
    [1420, 430],
    [1530, 970],
    [1390, 635],
  ])
    expect(witnessRegion351(...(p as [number, number]))).toBe(false);
  expect(
    new Set(
      witnessItems351
        .filter((p) => p.key.startsWith("bench-"))
        .map((p) => p.group),
    ).size,
  ).toBe(2);
  expect(
    witnessItems351.filter(
      (p) => p.group === "place-conviviale" && p.key.startsWith("bench-"),
    ),
  ).toHaveLength(2);
});
it("D351 la neige additionnelle reste sur les chemins des secteurs témoins", () => {
  let changed = 0;
  for (let y = 0; y < 1408; y += 7)
    for (let x = 0; x < 1920; x += 7) {
      const value = pathWeathering351(x, y, -4);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0.9);
      if (!witnessRegion351(x, y)) expect(value).toBe(0);
      if (value > 0) changed++;
      expect(pathWeathering351(x, y, 4)).toBe(0);
    }
  expect(changed).toBeGreaterThan(100);
  expect(pathWeathering351(713, 939, -3)).toBeGreaterThan(0.7);
});
