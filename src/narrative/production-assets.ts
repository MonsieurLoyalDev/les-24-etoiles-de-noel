import type Phaser from "phaser";
export function preloadProductionAssets(scene: Phaser.Scene) {
  scene.load.spritesheet(
    "production-clockmaker",
    "/assets/production/clockmaker.png",
    { frameWidth: 256, frameHeight: 256 },
  );
  for (const key of [
    "theatre-frame",
    "theatre-forest",
    "theatre-village",
    "theatre-night",
    "theatre-mechanism",
    "figure-debby",
    "figure-loyal",
    "figure-flocon",
    "notebook-closed",
    "notebook-open",
    "wooden-ornament",
    "stone-seed",
    "stone-shoot",
    "stone-flower",
    "fox-carving",
    "score-dawn",
    "score-paths",
    "score-lights",
    "score-vigil",
    "winter-seed",
    "winter-shoot",
    "winter-flower",
    "ornament-promise",
    "ornament-foxes",
    "basin",
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
