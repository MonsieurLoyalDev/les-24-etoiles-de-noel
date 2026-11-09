import { preloadEnvironment35, prepareEnvironment35 } from "./assets35";
import { extraSceneryKeys } from "./scenery34";
import Phaser from "phaser";
import catalog from "./catalog.json";
import { decorations } from "./village-design";
import { landscape } from "./landscape";
import { snowAssets } from "./snow-detail";
import {
  allVegetationAssets,
  vegetationKey,
  prepareVegetation,
} from "./vegetation";
import { prepareSprite, prepareSnow } from "./prepare";
import { terrainAssets } from "./terrain-design";
import { prepareTerrain } from "./terrain";
import { snowFinishingAssets } from "./snow-finishing";
import { interiorAssets } from "./interiors";
import { lifeAssetSizes } from "../decor/model";

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
  prepareEnvironment35(scene);
  prepareTerrain(scene);
  prepareVegetation(scene);
  for (const key of Object.values(buildingArt)) prepareSprite(scene, key, true);
  for (const key of [
    ...extraSceneryKeys,
    "arche_etoilebois",
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
  preloadEnvironment35(scene);
  for (const key of Object.keys(lifeAssetSizes).filter(
    (key) => !key.startsWith("home-"),
  ))
    scene.load.image("life-" + key, `/assets/life-d32/${key}.png`);
  for (const [key, path] of Object.entries(snowFinishingAssets))
    scene.load.image("d31-" + key, path);
  for (const [key, path] of Object.entries(interiorAssets).filter(
    ([key]) => !key.endsWith("-shell"),
  ))
    scene.load.image("d31-" + key, path);
  for (const [key, path] of Object.entries(terrainAssets))
    scene.load.image("source-ground-d3-" + key, path);
  for (const [key, url] of Object.entries(allVegetationAssets))
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
    ...extraSceneryKeys,
    "arche_etoilebois",
    ...Object.values(propArt).map((p) => p.key),
    ...decorations.map((d) => d.key),
    "bonhomme_neige",
    "jardiniere",
    "cloture_guirlande",
    "brasero",
  ]))
    scene.load.image(`art-${key}`, art[key as keyof typeof art]);
}
export function decorate(_scene: Phaser.Scene) {}
export function drawGround(scene: Phaser.Scene) {
  return landscape(scene, buildingWidths);
}
