import type Phaser from "phaser";
import type { Rect } from "../domain";
import {
  architecture33,
  furnishings33,
  annexDecor33,
} from "../art/room-render33";
import { interiorCollisions } from "../art/rooms33";
import { vegetationKey } from "../art/vegetation";
import { plan } from "../art/village34";
import type { WorldRoom, Point } from "../domain";
import { regionAnchorsC, drawRegionC } from "./regions-c";
import { regionAnchorsB, drawRegionB } from "./regions-b";
export const extraRooms = [
  "forest",
  "bakery",
  "lake",
  "hamlet",
  "clockshop",
  "reserve",
  "glade",
  "keeper",
] as const;
export type ExtraRoom = (typeof extraRooms)[number];
export function isExtraRoom(room: string): room is ExtraRoom {
  return extraRooms.includes(room as ExtraRoom);
}
export const areaAnchors = {
  ...regionAnchorsB,
  ...regionAnchorsC,
  forest: {
    entry: { x: 512, y: 688 },
    track: { x: 420, y: 570 },
    lamp: { x: 650, y: 500 },
    stump: { x: 330, y: 400 },
    clearing: { x: 220, y: 480 },
    rhyme: { x: 560, y: 380 },
    stone1: { x: 470, y: 300 },
    stone2: { x: 650, y: 300 },
    stone3: { x: 560, y: 350 },
    tree: { x: 560, y: 260 },
  },
  bakery: {
    entry: { x: 240, y: 315 },
    counter: { x: 580, y: 195 },
    oven: { x: 760, y: 210 },
    shelf: { x: 105, y: 210 },
    table: { x: 580, y: 250 },
  },
};
export const areaPortals: Record<
  ExtraRoom,
  { village: Point; entry: Point; from?: WorldRoom }
> = {
  reserve: {
    from: "workshop",
    village: { x: 110, y: 210 },
    entry: regionAnchorsC.reserve.entry,
  },
  glade: {
    from: "forest",
    village: { x: 620, y: 310 },
    entry: regionAnchorsC.glade.entry,
  },
  keeper: {
    village: { ...plan.houses.find((h) => h.id === "H10")!.door },
    entry: regionAnchorsC.keeper.entry,
  },
  lake: {
    from: "forest",
    village: { x: 950, y: 500 },
    entry: regionAnchorsB.lake.entry,
  },
  hamlet: {
    from: "forest",
    village: { x: 512, y: 140 },
    entry: regionAnchorsB.hamlet.entry,
  },
  clockshop: {
    from: "hamlet",
    village: regionAnchorsB.hamlet.shop,
    entry: regionAnchorsB.clockshop.entry,
  },
  forest: { village: { x: 1800, y: 1200 }, entry: areaAnchors.forest.entry },
  bakery: {
    village: { ...plan.houses.find((h) => h.id === "H03")!.door },
    entry: areaAnchors.bakery.entry,
  },
};
/** Additional maps only. Validated village/room geometry is never moved or redrawn. */
export function drawExtraRoom(scene: Phaser.Scene, room: ExtraRoom): Rect[] {
  if (room === "reserve" || room === "glade" || room === "keeper")
    return drawRegionC(scene, room);
  if (room === "lake" || room === "hamlet" || room === "clockshop")
    return drawRegionB(scene, room);
  if (room === "bakery") {
    architecture33(scene, "inn");
    furnishings33(scene, "inn");
    annexDecor33(scene, "inn");
    // A dedicated functional oven in this additional room; the four validated interiors are untouched.
    for (const child of scene.children.list) {
      if (child.name.endsWith(":hearth-salon")) child.destroy();
    }
    const oven = scene.add
      .image(760, 155, "production-oven")
      .setOrigin(0.5, 1)
      .setDepth(155);
    oven.setScale(125 / oven.width);
    return interiorCollisions("inn");
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
  const trees: number[][] = [];
  for (let i = 0; i < 12; i++) {
    trees.push(
      [40 + i * 83, 85 + (i % 3) * 18],
      [45 + i * 83, 750 - (i % 3) * 12],
    );
  }
  for (let i = 1; i < 8; i++)
    trees.push(
      [45 + (i % 2) * 25, 90 + i * 80],
      [965 - (i % 3) * 15, 90 + i * 80],
    );
  trees.push(
    [220, 250],
    [290, 220],
    [790, 340],
    [840, 390],
    [180, 590],
    [750, 620],
    [800, 650],
    [360, 190],
  );
  for (const [x, y] of trees) {
    const image = scene.add
      .image(x, y, vegetationKey("vegetation_pine_large", x, y)!)
      .setOrigin(0.5, 1)
      .setDepth(y);
    image.setScale((55 + ((x + y) % 35)) / image.width);
    rects.push({ x: x - 9, y: y - 10, w: 18, h: 12 });
  }
  scene.add
    .image(220, 455, "d35-bench-garden")
    .setOrigin(0.5, 1)
    .setDisplaySize(80, 30)
    .setDepth(455);
  rects.push({ x: 180, y: 445, w: 80, h: 12 });
  const tree = scene.add
    .image(560, 232, "production-tree")
    .setOrigin(0.5, 1)
    .setDepth(232);
  tree.setScale(165 / tree.width);
  rects.push({ x: 545, y: 215, w: 30, h: 18 });
  return rects;
}
