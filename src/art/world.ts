import Phaser from "phaser";
import catalog from "./catalog.json";
import { decorations } from "./village-design";
import { landscape } from "./landscape";
import { snowAssets } from "./snow-detail";
import {
  refinedAssets,
  vegetationKey,
  prepareVegetation,
  fittedVegetationWidth,
} from "./vegetation";
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
  gift: { key: "vegetation_gift", width: 28 },
  pine_large: { key: "vegetation_pine_large", width: 64 },
};
export const buildingWidths: Record<string, number> = {
  loyal_house: 180,
  library: 208,
  workshop: 208,
  inn: 224,
};
export function prepareWorld(scene: Phaser.Scene) {
  prepareVegetation(scene);
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
  for (const d of decorations)
    if (!d.key.startsWith("vegetation_")) prepareSprite(scene, d.key);
  prepareSnow(scene);
}
export function preloadWorld(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(refinedAssets))
    scene.load.image(`raw-${vegetationKey(key)}`, url);
  for (const [key, url] of Object.entries(snowAssets))
    scene.load.image(key, url);
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
  for (const key of new Set([
    ...Object.values(propArt).map((p) => p.key),
    ...decorations.map((d) => d.key),
    "bonhomme_neige",
    "jardiniere",
    "cloture_guirlande",
    "brasero",
  ]))
    scene.load.image(`art-${key}`, art[key as keyof typeof art]);
}
export function decorate(scene: Phaser.Scene) {
  for (const d of decorations) {
    const key =
      vegetationKey(d.key) ??
      (scene.textures.exists(cleanKey(d.key))
        ? cleanKey(d.key)
        : "art-" + d.key);
    const image = scene.add
      .image(d.x, d.y, key)
      .setOrigin(0.5, 1)
      .setDepth(d.back ? -10 : d.y)
      .setFlipX(!!d.flip)
      .setName("scenery:" + d.id);
    const width = vegetationKey(d.key)
      ? fittedVegetationWidth(d.width, d.x, d.y, image.width / image.height)
      : d.width;
    image.setScale(width / image.width);
    if (d.back) image.setTint(0xe9f0f0);
    if (d.key === "panneau_direction") {
      const text =
        d.district === "post"
          ? "Courrier\nÉmile"
          : d.district === "civic"
            ? "Allée\nAugustin"
            : "Sentier\nFlocon";
      scene.add
        .text(d.x, d.y - image.displayHeight + 5, text, {
          fontFamily: "Marcellus",
          fontSize: 6,
          color: "#ffe3ad",
          stroke: "#4b2d1b",
          strokeThickness: 1,
          align: "center",
          lineSpacing: -1,
        })
        .setOrigin(0.5, 0)
        .setDepth(d.y + 0.2);
    }
  }
}
export function drawGround(scene: Phaser.Scene) {
  return landscape(scene, buildingWidths);
}
