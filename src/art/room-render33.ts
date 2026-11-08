import type Phaser from "phaser";
import { allFurniture, inFloor, roomPlans, type Room33 } from "./rooms33";
export const roomAssets33 = [
  "oak-floor",
  "rough-floor",
  "wall-panel",
  "winter-window",
  "hearth-salon",
  "reading-corner",
  "artisan-station",
  "tea-banquette",
];
export function preloadRooms33(scene: Phaser.Scene) {
  for (const key of roomAssets33)
    scene.load.image("d33-" + key, `/assets/village-d33/${key}.png`);
}
export function architecture33(scene: Phaser.Scene, room: Room33) {
  const key = "shell-d33-" + room,
    plan = roomPlans[room];
  if (!scene.textures.exists(key)) {
    const t = scene.textures.createCanvas(key, plan.width, plan.height)!,
      c = t.context;
    c.imageSmoothingEnabled = false;
    const floor = scene.textures
      .get("d33-" + (room === "workshop" ? "rough-floor" : "oak-floor"))
      .getSourceImage() as HTMLImageElement;
    c.save();
    c.beginPath();
    for (const v of plan.volumes) c.rect(v.x, v.y, v.w, v.h);
    c.clip();
    c.fillStyle = c.createPattern(floor, "repeat")!;
    c.fillRect(0, 0, plan.width, plan.height);
    c.restore();
    const wall = scene.textures
      .get("d33-wall-panel")
      .getSourceImage() as HTMLImageElement;
    for (let y = 0; y < plan.height; y += 16) {
      for (let x = 0; x < plan.width; x += 16) {
        if (!inFloor(room, x + 8, y + 8)) continue;
        if (!inFloor(room, x + 8, y - 8)) {
          let end = x + 16;
          while (
            end < plan.width &&
            inFloor(room, end + 8, y + 8) &&
            !inFloor(room, end + 8, y - 8)
          )
            end += 16;
          for (let p = x; p < end; p += 192) {
            const w = Math.min(192, end - p);
            c.drawImage(
              wall,
              0,
              0,
              (wall.width * w) / 192,
              wall.height,
              p,
              y,
              w,
              48,
            );
          }
          x = end - 16;
        }
      }
    }
    // Narrow side posts and skirting use the real walnut ends of the modular wall asset.
    for (let y = 0; y < plan.height; y += 16)
      for (let x = 0; x < plan.width; x += 16) {
        if (!inFloor(room, x + 8, y + 8)) continue;
        if (!inFloor(room, x - 8, y + 8))
          c.drawImage(
            wall,
            0,
            0,
            wall.width * 0.035,
            wall.height,
            x,
            y,
            12,
            16,
          );
        if (!inFloor(room, x + 24, y + 8))
          c.drawImage(
            wall,
            wall.width * 0.965,
            0,
            wall.width * 0.035,
            wall.height,
            x + 4,
            y,
            12,
            16,
          );
        if (
          !inFloor(room, x + 8, y + 24) &&
          !(y === 336 && x >= 208 && x <= 256)
        )
          c.drawImage(
            wall,
            0,
            wall.height * 0.88,
            wall.width,
            wall.height * 0.12,
            x,
            y + 8,
            16,
            8,
          );
      }
    t.refresh();
  }
  scene.add
    .image(0, 0, key)
    .setOrigin(0)
    .setDepth(-100)
    .setName("interior:architecture:" + room);
  const positions: Record<Room33, number[][]> = {
    house: [
      [270, 34],
      [540, 34],
    ],
    library: [
      [270, 34],
      [480, 34],
    ],
    workshop: [
      [275, 34],
      [615, 66],
      [840, 66],
    ],
    inn: [
      [270, 34],
      [470, 34],
      [860, 34],
    ],
  };
  for (const [x, y] of positions[room])
    scene.add
      .image(x, y, "d33-winter-window")
      .setScale(0.5)
      .setDepth(-95)
      .setName("interior:window");
  scene.game.canvas.dataset.roomPlan = JSON.stringify(plan);
}
export function furnishings33(scene: Phaser.Scene, room: Room33) {
  const audit = [];
  for (const [index, f] of allFurniture(room).entries()) {
    const image = scene.add
      .image(
        f.x,
        f.y,
        (f.source === "new" ? "d33-" : f.source === "life" ? "life-" : "d31-") +
          f.key,
      )
      .setOrigin(0.5, 1)
      .setScale(f.scale)
      .setDepth(f.y)
      .setName(f.name ?? "interior:annex:" + index + ":" + f.key);
    if (room === "inn" && f.key === "inn-table" && f.x > 800) {
      const oldWidth = image.displayWidth,
        oldHeight = image.displayHeight;
      image
        .setTexture("d31-house-table")
        .setScale(Math.min(oldWidth / image.width, oldHeight / image.height));
    }
    if (room === "library" && f.key === "library-shelves" && index % 2)
      image.setFlipX(true);
    if (
      (room === "inn" && f.key === "inn-table") ||
      (room === "workshop" && f.key === "workshop-bench")
    )
      scene.add
        .image(
          f.x,
          f.y - 22,
          room === "inn"
            ? f.x > 800
              ? "d31-cards-keepsakes"
              : "d31-photo-keepsakes"
            : "d31-wrapping-plans",
        )
        .setScale(0.35)
        .setDepth(f.y + 0.2)
        .setName("interior:table-story:" + index);
    audit.push({
      name: f.key,
      x: f.x,
      y: f.y,
      width: image.displayWidth,
      height: image.displayHeight,
      footprint: f.footprint,
    });
  }
  scene.game.canvas.dataset.interior = JSON.stringify({
    room,
    furniture: audit,
  });
}
export function annexDecor33(scene: Phaser.Scene, room: Room33) {
  const compositions: Record<Room33, number[][]> = {
    house: [
      [665, 260, 220],
      [690, 430, 170],
    ],
    library: [
      [720, 265, 210],
      [710, 458, 180],
    ],
    workshop: [[730, 310, 140]],
    inn: [
      [580, 250, 150],
      [800, 410, 180],
      [110, 430, 120],
    ],
  };
  for (const [x, y, w] of compositions[room])
    scene.add
      .image(
        x,
        y,
        room === "house" || room === "inn" ? "d31-rug-oval" : "d31-rug-woven",
      )
      .setScale((0.5 * w) / 200)
      .setDepth(-90)
      .setName("interior:annex:rug");
  const small =
    room === "workshop"
      ? "wrapping-plans"
      : room === "library"
        ? "cards-keepsakes"
        : "photo-keepsakes";
  const p =
    room === "house"
      ? [750, 274]
      : room === "library"
        ? [742, 270]
        : room === "workshop"
          ? [782, 341]
          : [575, 270];
  scene.add
    .image(p[0], p[1], "d31-" + small)
    .setScale(0.65)
    .setDepth(p[1] + 31)
    .setName("interior:annex:story");
}
