import { it, expect } from "vitest";
import { allFurniture } from "../src/art/rooms33";
import { readFileSync } from "node:fs";
it("les emprises ne dépassent pas la largeur réellement affichée du meuble", () => {
  const errors = [];
  for (const room of ["house", "library", "workshop", "inn"] as const)
    for (const f of allFurniture(room)) {
      const folder =
        f.source === "new"
          ? "village-d33"
          : f.source === "life"
            ? "life-d32"
            : "interiors-d31";
      const image = readFileSync(`public/assets/${folder}/${f.key}.png`),
        width = image.readUInt32BE(16) * f.scale;
      if (f.footprint.w > width + 2)
        errors.push({
          room,
          key: f.key,
          physical: f.footprint.w,
          visual: width,
        });
    }
  expect(errors).toEqual([]);
});
