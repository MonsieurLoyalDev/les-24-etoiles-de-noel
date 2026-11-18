import type Phaser from "phaser";
export function preloadProductionAssets(scene: Phaser.Scene) {
  scene.load.spritesheet(
    "production-clockmaker",
    "/assets/production/clockmaker.png",
    { frameWidth: 256, frameHeight: 256 },
  );
  for (const key of [
    "clock",
    "music-box",
    "gears",
    "boat",
    "blossom",
    "lantern-off",
    "lantern-on",
    "lake",
  ])
    scene.load.image("production-" + key, `/assets/production/${key}.png`);
  scene.load.image(
    "production-reflection-star",
    "/assets/validated/vegetation/quest_star.png",
  );
  scene.load.spritesheet("production-baker", "/assets/production/baker.png", {
    frameWidth: 256,
    frameHeight: 256,
  });
  for (const key of ["tree", "oven", "blue-letter", "letter", "book", "stone"])
    scene.load.image("production-" + key, `/assets/production/${key}.png`);
}
