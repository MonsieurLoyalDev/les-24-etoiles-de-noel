import Phaser from "phaser";
import catalog from "./catalog.json";
import original from "../game/maps/place-des-lanternes.json";
import { prepareSprite, prepareSnow, cleanKey } from "./prepare";

export const art = catalog.images;
export const buildingArt: Record<string, string> = {
  loyal_house: "maison_loyal",
  library: "bibliotheque_etoilebois",
  workshop: "atelier_cadeaux",
  inn: "auberge_etoiles",
};
export const propArt: Record<string, { key: string; width: number }> = {
  lantern: { key: "lampadaire", width: 26 },
  bench: { key: "banc_plaid", width: 68 },
  signpost: { key: "panneau_direction", width: 38 },
  gift: { key: "stand_cadeaux", width: 62 },
  pine_large: { key: "vegetation_pine_large", width: 64 },
};
export const buildingWidths: Record<string, number> = {
  loyal_house: 180,
  library: 208,
  workshop: 208,
  inn: 224,
};
export function prepareWorld(scene: Phaser.Scene) {
  for (const key of Object.values(buildingArt)) prepareSprite(scene, key, true);
  for (const key of [
    "lampadaire",
    "banc_plaid",
    "panneau_direction",
    "stand_cadeaux",
    "bonhomme_neige",
    "jardiniere",
    "cloture_guirlande",
    "brasero",
  ])
    prepareSprite(scene, key);
  prepareSnow(scene);
}
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
      .image(x, y, cleanKey(key))
      .setOrigin(0.5, 1)
      .setDepth(y);
    obj.setScale(width / obj.width);
  }
}
/** Continuous macrotextures retain their spatial neighbours, without random tile indices. */
export function drawGround(scene: Phaser.Scene) {
  const key = "village-floor-d1";
  if (!scene.textures.exists(key)) {
    const t = scene.textures.createCanvas(key, 1024, 768)!,
      ctx = t.context;
    const snow = scene.textures
      .get("quiet-snow")
      .getSourceImage() as HTMLCanvasElement;
    const stone = scene.textures
      .get("art-stone")
      .getSourceImage() as HTMLImageElement;
    const dirt = scene.textures
      .get("art-dirt")
      .getSourceImage() as HTMLImageElement;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(snow, 0, 0);
    const path = (x: number, y: number) =>
      x >= 0 && x < 64 && y >= 0 && y < 48 && original.ground[y][x] === 8;
    for (let y = 0; y < 48; y++)
      for (let x = 0; x < 64; x++) {
        const road = path(x, y),
          soil = (x < 6 || x > 57) && y > 37;
        if (!road && !soil) continue;
        if (soil && !road)
          ctx.globalAlpha =
            0.45 *
            Math.min(1, (y - 37) / 3) *
            Math.min(1, (x < 6 ? 6 - x : x - 57) / 2);
        // Same logical 16 px footprint, finer source sampling; never shuffle unrelated tiles.
        ctx.drawImage(
          road ? stone : dirt,
          (x * 32) % 1024,
          (y * 32) % 1024,
          32,
          32,
          x * 16,
          y * 16,
          16,
          16,
        );
        ctx.globalAlpha = 1;
        if (road) {
          ctx.globalAlpha = 0.5;
          if (!path(x, y - 1))
            ctx.drawImage(snow, x * 16, y * 16, 16, 2, x * 16, y * 16, 16, 2);
          if (!path(x + 1, y))
            ctx.drawImage(
              snow,
              x * 16 + 14,
              y * 16,
              2,
              16,
              x * 16 + 14,
              y * 16,
              2,
              16,
            );
          if (!path(x, y + 1))
            ctx.drawImage(
              snow,
              x * 16,
              y * 16 + 14,
              16,
              2,
              x * 16,
              y * 16 + 14,
              16,
              2,
            );
          if (!path(x - 1, y))
            ctx.drawImage(snow, x * 16, y * 16, 2, 16, x * 16, y * 16, 2, 16);
          ctx.globalAlpha = 1;
        }
      }
    t.refresh();
  }
  return scene.add.image(0, 0, key).setOrigin(0).setDepth(-100);
}
