import type Phaser from "phaser";
export function preloadProductionAssets(scene: Phaser.Scene) {
  scene.load.spritesheet("production-baker", "/assets/production/baker.png", {
    frameWidth: 256,
    frameHeight: 256,
  });
  for (const key of ["tree", "oven", "blue-letter", "letter", "book", "stone"])
    scene.load.image("production-" + key, `/assets/production/${key}.png`);
}
