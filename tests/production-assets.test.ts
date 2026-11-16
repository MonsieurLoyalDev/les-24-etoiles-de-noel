import { it, expect } from "vitest";
import { rgbaPng } from "./png-rgba";
it("les nouvelles ressources gardent leurs bords transparents et les cellules isolées", () => {
  for (const name of [
    "tree",
    "oven",
    "letter",
    "blue-letter",
    "book",
    "stone",
  ]) {
    const im = rgbaPng(`public/assets/production/${name}.png`);
    expect(Math.max(im.width, im.height)).toBeLessThanOrEqual(388);
    for (let x = 0; x < im.width; x++) {
      expect(im.data[x * 4 + 3]).toBe(0);
      expect(im.data[((im.height - 1) * im.width + x) * 4 + 3]).toBe(0);
    }
    for (let y = 0; y < im.height; y++) {
      expect(im.data[y * im.width * 4 + 3]).toBe(0);
      expect(im.data[(y * im.width + im.width - 1) * 4 + 3]).toBe(0);
    }
  }
  const sheet = rgbaPng("public/assets/production/baker.png");
  expect([sheet.width, sheet.height]).toEqual([1024, 1280]);
  for (let cell = 0; cell < 20; cell++) {
    const cx = (cell % 4) * 256,
      cy = Math.floor(cell / 4) * 256;
    let solid = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const alpha = sheet.data[((cy + y) * sheet.width + cx + x) * 4 + 3];
        if (!x || !y || x === 255 || y === 255) expect(alpha).toBe(0);
        if (alpha > 200) solid++;
      }
    expect(solid).toBeGreaterThan(1000);
    expect(solid).toBeLessThan(256 * 256 * 0.8);
  }
});
