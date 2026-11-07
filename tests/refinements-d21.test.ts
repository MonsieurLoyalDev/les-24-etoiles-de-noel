import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fitTag, signNames } from "../src/art/tag-layout";
import { refinedAssets, fittedVegetationWidth } from "../src/art/vegetation";
import { snowAssets, snowVariant } from "../src/art/snow-detail";
import allowlist from "../ops/public-assets.json";
it("les quatre variantes de neige participent réellement au sol", () => {
  const variants = new Set<number>();
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 16; col++) variants.add(snowVariant(col, row));
  expect([...variants].sort()).toEqual([1, 2, 3, 4]);
});
it("les étiquettes restent dans le champ et se séparent sans déplacer les acteurs", () => {
  const view = { x: 0, y: 0, w: 260, h: 500 };
  const first = fitTag({ x: -12, y: -20, w: 40, h: 18 }, view);
  expect(first.x).toBe(3);
  expect(first.y).toBe(3);
  const a = fitTag({ x: 100, y: 100, w: 40, h: 18 }, view);
  const b = fitTag({ x: 110, y: 105, w: 42, h: 18 }, view, [a]);
  expect(b.y + b.h).toBeLessThan(a.y);
  const right = fitTag({ x: 250, y: 90, w: 42, h: 18 }, view);
  expect(right.x + right.w).toBeLessThan(view.w);
});
it("les nouvelles images sont explicitement autorisées et possèdent un canal alpha", () => {
  for (const path of [
    ...Object.values(refinedAssets),
    ...Object.values(snowAssets),
  ]) {
    expect(allowlist).toContain("public" + path);
    const bytes = readFileSync("public" + path);
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    if (path.includes("source")) expect(bytes[25]).toBe(6);
    else {
      expect(bytes.readUInt32BE(16)).toBe(64);
      expect(bytes.readUInt32BE(20)).toBe(64);
    }
  }
  expect(
    allowlist.some((path) => path.includes("planche_reference")),
  ).toBeFalsy();
});
it("un sapin placé près du bord reste entièrement dans le monde", () => {
  for (const [x, y, w] of [
    [40, 115, 65],
    [990, 128, 60],
    [958, 85, 72],
    [625, 91, 64],
  ]) {
    const width = fittedVegetationWidth(w, x, y, 0.65);
    expect(y - width / 0.65).toBeGreaterThanOrEqual(3);
    expect(x - width / 2).toBeGreaterThan(0);
    expect(x + width / 2).toBeLessThan(1024);
  }
});
it("les noms des enseignes sont des données, y compris les lieux futurs absents", () => {
  expect(signNames.library).toBe("Bibliothèque de Célestine");
  expect(signNames.inn).toBe("Auberge des Étoiles");
  expect(signNames.bakery).toBe("Boulangerie de Madeleine");
});
