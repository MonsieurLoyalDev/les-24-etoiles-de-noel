import type Phaser from "phaser";
import type { Rect } from "../domain";
import {
  architecture33,
  furnishings33,
  annexDecor33,
} from "../art/room-render33";
import { interiorCollisions } from "../art/rooms33";
import { vegetationKey } from "../art/vegetation";
export const regionAnchorsB = {
  lake: {
    entry: { x: 100, y: 650 },
    shore: { x: 160, y: 430 },
    pier: { x: 330, y: 380 },
    lamp: { x: 180, y: 300 },
    tree: { x: 180, y: 230 },
    sky: { x: 330, y: 380 },
    bench: { x: 150, y: 540 },
    boat: { x: 160, y: 590 },
    legend: { x: 120, y: 350 },
    lookout: { x: 180, y: 150 },
  },
  hamlet: {
    entry: { x: 512, y: 680 },
    square: { x: 510, y: 430 },
    shop: { x: 720, y: 360 },
    cafe: { x: 280, y: 430 },
    lookout: { x: 850, y: 560 },
    trail: { x: 150, y: 570 },
  },
  clockshop: {
    entry: { x: 240, y: 315 },
    clock: { x: 580, y: 250 },
    desk: { x: 580, y: 195 },
    photo: { x: 100, y: 195 },
    shelf: { x: 360, y: 200 },
  },
};
/** Additional maps only; original village and four interiors remain unchanged. */
export function drawRegionB(
  scene: Phaser.Scene,
  room: keyof typeof regionAnchorsB,
): Rect[] {
  if (room === "clockshop") {
    architecture33(scene, "workshop");
    furnishings33(scene, "workshop");
    annexDecor33(scene, "workshop");
    for (const [x, y] of [
      [580, 172],
      [350, 145],
      [780, 380],
    ])
      scene.add
        .image(x, y, "production-clock")
        .setOrigin(0.5, 1)
        .setDisplaySize(54, 64)
        .setDepth(y);
    return interiorCollisions("workshop");
  }
  scene.add
    .tileSprite(0, 0, 1024, 768, "urban-snow-powder")
    .setOrigin(0)
    .setDepth(-100);
  const rects: Rect[] = [
    { x: 0, y: 0, w: 1024, h: 20 },
    { x: 0, y: 0, w: 20, h: 768 },
    { x: 1004, y: 0, w: 20, h: 768 },
    { x: 0, y: 748, w: 1024, h: 20 },
  ];
  for (let i = 0; i < 12; i++)
    for (const y of [80 + (i % 3) * 12, 745 - (i % 2) * 15]) {
      const x = 45 + i * 83,
        im = scene.add
          .image(x, y, vegetationKey("vegetation_pine_large", x, y)!)
          .setOrigin(0.5, 1)
          .setDepth(y);
      im.setScale((60 + (i % 3) * 10) / im.width);
      rects.push({ x: x - 9, y: y - 9, w: 18, h: 12 });
    }
  if (room === "lake") {
    scene.add
      .image(620, 360, "production-lake")
      .setDisplaySize(720, 480)
      .setDepth(-90);
    // The pond is never traversable. A short access corridor reaches the wooden pier.
    rects.push(
      { x: 420, y: 160, w: 480, h: 440 },
      { x: 285, y: 160, w: 135, h: 170 },
      { x: 285, y: 430, w: 135, h: 170 },
    );
    scene.add
      .image(160, 580, "production-boat")
      .setOrigin(0.5, 1)
      .setDisplaySize(80, 45)
      .setDepth(580);
    scene.add
      .image(150, 520, "d35-bench-garden")
      .setOrigin(0.5, 1)
      .setDisplaySize(80, 30)
      .setDepth(520);
    rects.push({ x: 110, y: 510, w: 80, h: 12 });
  } else {
    for (const [key, x, y] of [
      ["home-chalet", 270, 300],
      ["home-porch", 720, 330],
      ["home-tall", 450, 180],
      ["home-garden", 840, 650],
    ] as const) {
      const im = scene.add
        .image(x, y, "urban-" + key)
        .setOrigin(0.5, 1)
        .setDepth(y);
      im.setScale(150 / im.width);
      rects.push({ x: x - 65, y: y - 35, w: 130, h: 28 });
    }
    scene.add
      .image(510, 390, "production-clock")
      .setOrigin(0.5, 1)
      .setDisplaySize(70, 100)
      .setDepth(390);
    rects.push({ x: 485, y: 375, w: 50, h: 15 });
    for (const [x, y] of [
      [512, 620],
      [510, 510],
      [580, 440],
      [650, 400],
      [720, 365],
      [280, 450],
    ]) {
      const im = scene.add.image(x, y, "ground-d3-packed-a").setDepth(-95);
      im.setScale(85 / im.width).setAlpha(0.8);
    }
  }
  return rects;
}
