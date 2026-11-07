import { it, expect } from "vitest";
import {
  quietSnow,
  isolateSprite,
  alphaBounds,
  type PixelPlane,
} from "../src/art/pixels";
function plane(width: number, height: number): PixelPlane {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}
function pixel(p: PixelPlane, x: number, y: number, rgba: number[]) {
  p.data.set(rgba, (y * p.width + x) * 4);
}
it("la neige rebouche les trous alpha sans modifier le PNG source", () => {
  const p = plane(16, 16);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) pixel(p, x, y, [190, 200, 215, 255]);
  pixel(p, 8, 8, [20, 30, 40, 35]);
  const original = p.data.slice(),
    out = quietSnow(p);
  expect(p.data).toEqual(original);
  expect(
    Array.from(out)
      .filter((_, i) => i % 4 === 3)
      .every((a) => a === 255),
  ).toBe(true);
  expect(out[(8 * 16 + 8) * 4]).toBeGreaterThan(220);
  expect(
    Math.abs(out[(8 * 16 + 8) * 4] - out[(7 * 16 + 7) * 4]),
  ).toBeLessThanOrEqual(2);
});
it("les motifs continus restent légèrement variables sans pixels noirs", () => {
  const p = plane(24, 12);
  for (let y = 0; y < 12; y++)
    for (let x = 0; x < 24; x++)
      pixel(p, x, y, [x < 12 ? 170 : 220, 200, 215, 120]);
  const out = quietSnow(p);
  expect(out[0]).toBeLessThan(out[23 * 4]);
  expect(out[0]).toBeGreaterThan(215);
});
it("un fragment détaché est retiré, la silhouette sombre reste intacte", () => {
  const p = plane(12, 12);
  for (let y = 4; y < 9; y++)
    for (let x = 4; x < 9; x++) pixel(p, x, y, [8, 6, 4, 255]);
  pixel(p, 0, 0, [190, 120, 30, 255]);
  expect(isolateSprite(p)).toBeGreaterThan(0);
  expect(p.data[3]).toBe(0);
  expect(p.data[(6 * 12 + 6) * 4 + 3]).toBe(255);
});
it("le détourage ne retire pas un élément opaque relié au bâtiment", () => {
  const p = plane(8, 8);
  for (let y = 2; y < 6; y++)
    for (let x = 2; x < 6; x++) pixel(p, x, y, [140, 140, 145, 255]);
  pixel(p, 2, 1, [30, 25, 20, 255]);
  pixel(p, 0, 0, [130, 135, 145, 110]);
  isolateSprite(p, true);
  expect(p.data[3]).toBe(0);
  expect(p.data[(1 * 8 + 2) * 4 + 3]).toBe(255);
  expect(p.data[(3 * 8 + 3) * 4 + 3]).toBe(255);
});
it("le repère des pieds utilise les pixels visibles du cadre, sans rogner la texture", () => {
  const p = plane(10, 12);
  pixel(p, 4, 5, [120, 90, 70, 255]);
  pixel(p, 6, 9, [120, 90, 70, 255]);
  pixel(p, 2, 2, [255, 255, 255, 30]);
  const before = p.data.slice();
  expect(alphaBounds(p, { x: 2, y: 2, w: 6, h: 10 })).toEqual({
    top: 3,
    bottom: 7,
    left: 2,
    right: 4,
  });
  expect(p.data).toEqual(before);
});
