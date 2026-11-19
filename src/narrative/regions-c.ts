import type Phaser from "phaser";
import type { Rect } from "../domain";
import {
  architecture33,
  furnishings33,
  annexDecor33,
} from "../art/room-render33";
import { interiorCollisions } from "../art/rooms33";
import { vegetationKey } from "../art/vegetation";

/** Named approach points, deliberately separate from solid scenery. */
export const regionAnchorsC = {
  reserve: {
    entry: { x: 240, y: 315 },
    plans: { x: 410, y: 230 },
    theatre: { x: 410, y: 150 },
    note: { x: 105, y: 230 },
  },
  keeper: { entry: { x: 240, y: 315 }, photo: { x: 810, y: 205 } },
  glade: {
    entry: { x: 512, y: 688 },
    clearing: { x: 512, y: 470 },
    basin: { x: 512, y: 350 },
    seed: { x: 310, y: 470 },
    shoot: { x: 700, y: 460 },
    flower: { x: 650, y: 250 },
    stone1: { x: 390, y: 410 },
    stone2: { x: 625, y: 410 },
    stone3: { x: 515, y: 530 },
    tree: { x: 310, y: 240 },
    bench: { x: 690, y: 615 },
  },
};

/** Additive regions only: never redraw the village or an existing interior. */
export function drawRegionC(
  scene: Phaser.Scene,
  room: keyof typeof regionAnchorsC,
): Rect[] {
  if (room === "reserve") {
    const key = "narrative-reserve-shell";
    if (!scene.textures.exists(key)) {
      const texture = scene.textures.createCanvas(key, 640, 352)!;
      const context = texture.context;
      context.imageSmoothingEnabled = false;
      const floor = scene.textures
        .get("d33-rough-floor")
        .getSourceImage() as HTMLImageElement;
      const wall = scene.textures
        .get("d33-wall-panel")
        .getSourceImage() as HTMLImageElement;
      context.fillStyle = context.createPattern(floor, "repeat")!;
      context.fillRect(0, 0, 640, 352);
      for (let x = 0; x < 640; x += 160) context.drawImage(wall, x, 0, 160, 48);
      texture.refresh();
    }
    scene.add.image(0, 0, key).setOrigin(0).setDepth(-100);
    const solids: Rect[] = [
      { x: 0, y: 0, w: 640, h: 48 },
      { x: 0, y: 0, w: 12, h: 352 },
      { x: 628, y: 0, w: 12, h: 352 },
      { x: 0, y: 340, w: 640, h: 12 },
    ];
    for (const [key, x, y, width] of [
      ["d31-workshop-tools", 105, 170, 110],
      ["d31-workshop-bench", 410, 180, 130],
      ["d31-workshop-storage", 565, 170, 80],
    ] as const) {
      // Reuse detailed furnishings, not a second copy of the original room plan.
      if (!scene.textures.exists(key))
        throw Error("Mobilier de réserve absent");
      const texture = key;
      const image = scene.add
        .image(x, y, texture)
        .setOrigin(0.5, 1)
        .setDepth(y);
      image.setScale(width / image.width);
      solids.push({ x: x - width / 2, y: y - 20, w: width, h: 20 });
    }
    return solids;
  }
  if (room !== "glade") {
    const template = "house";
    architecture33(scene, template);
    furnishings33(scene, template);
    annexDecor33(scene, template);
    return interiorCollisions(template);
  }
  scene.add
    .tileSprite(0, 0, 1024, 768, "urban-snow-powder")
    .setOrigin(0)
    .setDepth(-100);
  const solids: Rect[] = [
    { x: 0, y: 0, w: 1024, h: 20 },
    { x: 0, y: 0, w: 20, h: 768 },
    { x: 1004, y: 0, w: 20, h: 768 },
    { x: 0, y: 748, w: 1024, h: 20 },
    { x: 400, y: 255, w: 224, h: 145 },
  ];
  scene.add
    .image(512, 325, "production-basin")
    .setDisplaySize(230, 150)
    .setDepth(-90);
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const x = 512 + Math.cos(angle) * 405,
      y = 375 + Math.sin(angle) * 290;
    if (y > 580 && Math.abs(x - 512) < 140) continue;
    const image = scene.add
      .image(x, y, vegetationKey("vegetation_pine_large", x, y)!)
      .setOrigin(0.5, 1)
      .setDepth(y);
    image.setScale((72 + (i % 3) * 10) / image.width);
    solids.push({ x: x - 10, y: y - 8, w: 20, h: 12 });
  }
  for (const key of ["stone1", "stone2", "stone3"] as const) {
    const p = regionAnchorsC.glade[key];
    scene.add
      .image(
        p.x,
        p.y - 20,
        "production-stone-" +
          { stone1: "seed", stone2: "shoot", stone3: "flower" }[key],
      )
      .setOrigin(0.5, 1)
      .setDisplaySize(48, 48)
      .setDepth(p.y - 20);
    solids.push({ x: p.x - 14, y: p.y - 32, w: 28, h: 12 });
  }
  for (const key of ["seed", "shoot", "flower"] as const) {
    const point = regionAnchorsC.glade[key];
    const plant = scene.add
      .image(point.x, point.y - 6, "production-winter-" + key)
      .setOrigin(0.5, 1)
      .setDepth(point.y - 6);
    plant.setScale(34 / plant.width);
  }
  const carving = scene.add
    .image(310, 210, "production-fox-carving")
    .setOrigin(0.5, 1)
    .setDepth(210);
  carving.setScale(65 / carving.width);
  const marks = scene.add
    .graphics()
    .setDepth(211)
    .setName("narrative:carved-marks")
    .setData("count", 24);
  marks.fillStyle(0x653a22, 1);
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    marks.fillRect(
      Math.round(carving.x + Math.cos(angle) * carving.displayWidth * 0.34),
      Math.round(
        carving.y -
          carving.displayHeight * 0.67 +
          Math.sin(angle) * carving.displayHeight * 0.22,
      ),
      1,
      1,
    );
  }
  scene.add
    .image(690, 590, "d35-bench-garden")
    .setOrigin(0.5, 1)
    .setDisplaySize(80, 30)
    .setDepth(590);
  solids.push({ x: 650, y: 580, w: 80, h: 12 });
  return solids;
}
