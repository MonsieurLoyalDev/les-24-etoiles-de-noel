import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  normalizeGraphics,
  effectiveQuality,
  effectBudgets,
  atmospherePalette,
  graphicsStorageKey,
  decorInView,
} from "../src/art/graphics";
import {
  terrainAssets,
  terrainRegions,
  snowBanks,
} from "../src/art/terrain-design";
import allowlist from "../ops/public-assets.json";
it("le budget de mouvement garde les branches visibles même si leur pied est hors écran", () => {
  const view = { x: 464, y: 118, width: 640, height: 351 };
  expect(
    decorInView({ x: 700, y: 85, width: 64, height: 128 }, view),
  ).toBeFalsy();
  expect(
    decorInView({ x: 700, y: 500, width: 64, height: 128 }, view),
  ).toBeTruthy();
  expect(
    decorInView({ x: 430, y: 300, width: 64, height: 128 }, view),
  ).toBeFalsy();
});
it("la réduction des mouvements reste prioritaire sur la qualité complète", () => {
  expect(effectiveQuality("full", 1280, true)).toBe("none");
  expect(effectiveQuality("auto", 390, false)).toBe("soft");
  expect(effectiveQuality("auto", 800, false)).toBe("full");
  expect(normalizeGraphics("broken")).toBe("auto");
  expect(normalizeGraphics(null)).toBe("auto");
  expect(graphicsStorageKey).toBe("etoilebois-graphics-v1");
});
it("les budgets restent bornés avec un vrai mode sans particules", () => {
  const sum = (v: typeof effectBudgets.full) =>
    v.snow + v.smoke + v.wind + v.stars;
  expect(sum(effectBudgets.full)).toBe(72);
  expect(sum(effectBudgets.soft)).toBe(28);
  expect(sum(effectBudgets.none)).toBe(0);
});
it("le cycle horaire existant se raccorde sans saut de teinte ni de luminosité", () => {
  for (const clock of [45000, 90000, 135000, 180000]) {
    const a = atmospherePalette(clock - 1),
      b = atmospherePalette(clock);
    expect(Math.abs(a.alpha - b.alpha)).toBeLessThan(0.001);
    for (const shift of [0, 8, 16])
      expect(
        Math.abs(((a.color >> shift) & 255) - ((b.color >> shift) & 255)),
      ).toBeLessThanOrEqual(1);
  }
  expect(atmospherePalette(135000).warm).toBeGreaterThan(
    atmospherePalette(45000).warm,
  );
  expect(atmospherePalette(135000).alpha).toBeLessThan(0.3);
});
it("les dix nouveaux terrains et détails sont distincts et réellement utilisés", () => {
  const used = new Set([...terrainRegions, ...snowBanks].map((p) => p.key)),
    hashes = new Set();
  expect([...used].sort()).toEqual(Object.keys(terrainAssets).sort());
  for (const path of Object.values(terrainAssets)) {
    expect(allowlist).toContain("public" + path);
    const bytes = readFileSync("public" + path);
    expect(bytes[25]).toBe(6);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
  }
  expect(hashes.size).toBe(10);
  expect(
    terrainRegions.every((p) => p.place.length > 8 && p.w > 0 && p.h > 0),
  ).toBeTruthy();
  expect(
    terrainRegions.filter((p) => p.key.startsWith("thaw")).length,
  ).toBeGreaterThanOrEqual(2);
});
