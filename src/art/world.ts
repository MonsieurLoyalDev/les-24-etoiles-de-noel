import Phaser from "phaser";
import catalog from "./catalog.json";
import original from "../game/maps/place-des-lanternes.json";

export const art = catalog.images;
export const buildingArt: Record<string, string> = {
  loyal_house: "maison_loyal",
  library: "bibliotheque_etoilebois",
  workshop: "atelier_cadeaux",
  inn: "auberge_etoiles",
};
export const propArt: Record<string, { key: string; width: number }> = {
  lantern: { key: "lampadaire", width: 38 },
  bench: { key: "banc_plaid", width: 68 },
  signpost: { key: "panneau_direction", width: 58 },
  gift: { key: "stand_cadeaux", width: 70 },
  pine_large: { key: "vegetation_pine_large", width: 80 },
};
export function preloadWorld(scene: Phaser.Scene) {
  for (const key of ["snow", "stone", "dirt"] as const)
    scene.load.spritesheet(`art-${key}`, art[key], {
      frameWidth: 32,
      frameHeight: 32,
    });
  scene.load.spritesheet("art-autotile", art.autotile, {
    frameWidth: 32,
    frameHeight: 32,
  });
  for (const key of Object.values(buildingArt))
    scene.load.image(`art-${key}`, art[key as keyof typeof art]);
  for (const key of [
    ...Object.values(propArt).map((p) => p.key),
    "bonhomme_neige",
    "jardiniere",
    "cloture_guirlande",
    "brasero",
  ])
    scene.load.image(`art-${key}`, art[key as keyof typeof art]);
}
export function decorate(scene: Phaser.Scene) {
  const placements: [string, number, number, number][] = [
    ["bonhomme_neige", 90, 600, 56],
    ["jardiniere", 152, 345, 46],
    ["cloture_guirlande", 880, 290, 100],
    ["brasero", 360, 160, 48],
  ];
  for (const [key, x, y, width] of placements) {
    const obj = scene.add
      .image(x, y, `art-${key}`)
      .setOrigin(0.5, 1)
      .setDepth(y);
    obj.setScale(width / obj.width);
  }
}
/** Continuous macrotextures retain their spatial neighbours, without random tile indices. */
export function drawGround(scene: Phaser.Scene) {
  const floor = scene.add
    .renderTexture(0, 0, 1024, 768)
    .setOrigin(0)
    .setDepth(-100);
  floor.beginDraw();
  const isPath = (x: number, y: number) =>
    x >= 0 && x < 32 && y >= 0 && y < 24 && original.ground[y * 2][x * 2] === 8;
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < 32; x++) {
      const path = isPath(x, y);
      const forest = x < 3 || x > 28;
      floor.batchDrawFrame(
        `art-${path ? "stone" : forest && y > 18 ? "dirt" : "snow"}`,
        y * 32 + x,
        x * 32,
        y * 32,
      );
      if (path) {
        const mask =
          (isPath(x, y - 1) ? 0 : 1) |
          (isPath(x + 1, y) ? 0 : 2) |
          (isPath(x, y + 1) ? 0 : 4) |
          (isPath(x - 1, y) ? 0 : 8);
        // The V6 mask means snow on the outside only; never insert borders inside a road.
        if (mask)
          floor.batchDrawFrame(
            "art-autotile",
            128 + mask * 8 + ((x * 7 + y * 3) % 8),
            x * 32,
            y * 32,
          );
      }
    }
  floor.endDraw();
  return floor;
}
