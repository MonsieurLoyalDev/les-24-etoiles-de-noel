import type Phaser from "phaser";
import type { Save } from "../domain";
import {
  furnitureByRoom,
  furnitureSlots,
  floorDecorByRoom,
  interiorDecorSizes,
  interiorLanterns,
} from "./interior-layout";
export type InteriorRoom = Exclude<Save["room"], "village">;
export const interiorAssets = Object.fromEntries(
  [
    ...["house", "library", "workshop", "inn"].map((room) => room + "-shell"),
    ...Object.values(furnitureByRoom).flat(),
    ...Object.keys(interiorDecorSizes),
  ].map((key) => [key, `/assets/interiors-d31/${key}.png`]),
);
export function drawRoomArchitecture(scene: Phaser.Scene, room: InteriorRoom) {
  scene.add
    .image(0, 0, "d31-" + room + "-shell")
    .setOrigin(0)
    .setDepth(-100)
    .setName("interior:architecture:" + room);
}
export function drawRoomFurnishings(scene: Phaser.Scene, room: InteriorRoom) {
  const audit = [];
  for (const [index, name] of furnitureByRoom[room].entries()) {
    const slot = furnitureSlots[index],
      key = "d31-" + name;
    const image = scene.add
      .image(slot.x, slot.y, key)
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(slot.y)
      .setName("interior:" + name);
    audit.push({
      name,
      width: image.displayWidth,
      height: image.displayHeight,
      x: slot.x,
      y: slot.y,
      footprint: slot.footprint,
    });
  }
  scene.game.canvas.dataset.interior = JSON.stringify({
    room,
    furniture: audit,
  });
}
export function drawRoomDecor(scene: Phaser.Scene, room: InteriorRoom) {
  for (const p of floorDecorByRoom[room]) {
    const size = interiorDecorSizes[p.key],
      key = "d31-" + p.key;
    scene.add
      .image(p.x, p.y, key)
      .setScale((0.5 * p.width) / size.width)
      .setDepth(-90)
      .setName("interior:floor:" + p.key);
  }
  const lamp = "d31-wall-lantern";
  for (const p of interiorLanterns)
    scene.add
      .image(p.x, p.y, lamp)
      .setScale(0.5)
      .setDepth(p.y)
      .setName("interior:lamp");
}
