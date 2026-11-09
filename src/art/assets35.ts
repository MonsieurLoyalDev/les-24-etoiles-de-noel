import metadata from "./environment-d35.json" with { type: "json" };
import type Phaser from "phaser";

export const environmentAtlases = {
  benches: {
    columns: 2,
    rows: 2,
    names: ["bench-rustic", "bench-village", "bench-copper", "bench-garden"],
  },
  gifts: {
    columns: 3,
    rows: 3,
    names: [
      "gift-red",
      "gift-tall",
      "gift-cream",
      "gift-pair",
      "gift-trio",
      "gift-kraft",
      "gift-stack",
      "gift-basket",
      "gift-display",
    ],
  },
  firewood: {
    columns: 3,
    rows: 2,
    names: [
      "wood-small",
      "wood-medium",
      "wood-rack",
      "wood-irregular",
      "wood-bundle",
      "wood-kindling",
    ],
  },
  accessories: {
    columns: 3,
    rows: 4,
    names: [
      "prop-lantern",
      "prop-mailbox",
      "prop-planter",
      "prop-table",
      "prop-sled",
      "prop-crates",
      "prop-basket",
      "prop-tools",
      "prop-watering",
      "prop-bare-tree",
      "prop-stump",
      "prop-rocks",
    ],
  },
};
export const fenceStyles = ["rustic", "picket", "logs", "copper"] as const;
export type FenceStyle = (typeof fenceStyles)[number];
export const fenceParts = ["panel", "post", "side", "gate"] as const;
export const environmentKey = (name: string) => "d35-" + name;
export function preloadEnvironment35(scene: Phaser.Scene) {
  scene.load.image("source-d35-sprites", "/assets/environment-d35/sprites.png");
  scene.load.image(
    "source-d35-paths",
    "/assets/environment-d35/path-materials.png",
  );
}
/** Pre-exported frames retain the exact pixels of the authoring preparer, without loading native sheets. */
export function prepareEnvironment35(scene: Phaser.Scene) {
  for (const row of metadata.frames) {
    const key = environmentKey(row.name);
    if (scene.textures.exists(key)) continue;
    const im = scene.textures
      .get("source-d35-sprites")
      .getSourceImage() as HTMLImageElement;
    const t = scene.textures.createCanvas(key, row.frame.w, row.frame.h)!;
    t.context.imageSmoothingEnabled = false;
    t.context.drawImage(
      im,
      row.frame.x,
      row.frame.y,
      row.frame.w,
      row.frame.h,
      0,
      0,
      row.frame.w,
      row.frame.h,
    );
    t.refresh();
  }
  scene.game.canvas.dataset.assets35 = JSON.stringify(metadata.frames);
}
