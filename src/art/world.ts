import Phaser from "phaser";
import catalog from "./catalog.json";
import original from "../game/maps/place-des-lanternes.json";

export const art = catalog.images;
export const buildingArt: Record<string, string> = {
  loyal_house: "maison_loyal", library: "bibliotheque_etoilebois",
  workshop: "atelier_cadeaux", inn: "auberge_etoiles",
};
export function preloadWorld(scene: Phaser.Scene) {
  for (const key of ["snow", "stone", "dirt"] as const)
    scene.load.spritesheet(`art-${key}`, art[key], { frameWidth: 32, frameHeight: 32 });
  for (const key of Object.values(buildingArt))
    scene.load.image(`art-${key}`, art[key as keyof typeof art]);
}
/** Continuous macrotextures retain their spatial neighbours, without random tile indices. */
export function drawGround(scene: Phaser.Scene) {
  const floor = scene.add.renderTexture(0, 0, 1024, 768).setOrigin(0).setDepth(-100);
  floor.beginDraw();
  for (let y = 0; y < 24; y++) for (let x = 0; x < 32; x++) {
    const path = original.ground[y * 2][x * 2] === 8;
    const forest = x < 3 || x > 28;
    floor.batchDrawFrame(`art-${path ? "stone" : forest && y > 18 ? "dirt" : "snow"}`, y * 32 + x, x * 32, y * 32);
  }
  floor.endDraw();
  return floor;
}
