import type { Rect, Save } from "../domain";
import { furnitureByRoom } from "./interior-layout";
export type Room33 = "house" | "library" | "workshop" | "inn";
export const roomPlans: Record<
  Room33,
  { width: number; height: number; volumes: Rect[]; title: string }
> = {
  house: {
    width: 864,
    height: 560,
    title: "Salon et alcôve des souvenirs",
    volumes: [
      { x: 0, y: 0, w: 480, h: 352 },
      { x: 448, y: 0, w: 416, h: 560 },
    ],
  },
  library: {
    width: 960,
    height: 560,
    title: "Grande lecture et refuge des histoires",
    volumes: [
      { x: 0, y: 0, w: 960, h: 352 },
      { x: 544, y: 320, w: 320, h: 240 },
    ],
  },
  workshop: {
    width: 896,
    height: 512,
    title: "Fabrication, passage et emballage",
    volumes: [
      { x: 0, y: 0, w: 480, h: 352 },
      { x: 448, y: 176, w: 144, h: 112 },
      { x: 560, y: 32, w: 336, h: 480 },
    ],
  },
  inn: {
    width: 960,
    height: 544,
    title: "Salle commune et deux salons",
    volumes: [
      { x: 0, y: 0, w: 960, h: 352 },
      { x: 32, y: 320, w: 160, h: 192 },
      { x: 656, y: 320, w: 272, h: 224 },
    ],
  },
};
export function roomDimensions(room: Save["room"]) {
  return room === "village"
    ? { width: 1920, height: 1408 }
    : room === "forest"
      ? { width: 1024, height: 768 }
      : roomPlans[room === "bakery" ? "inn" : room];
}
export function inFloor(room: Room33, x: number, y: number) {
  return roomPlans[room].volumes.some(
    (r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h,
  );
}
export function wallCell(room: Room33, x: number, y: number) {
  if (!inFloor(room, x + 8, y + 8)) return true;
  return (
    !inFloor(room, x - 8, y + 8) ||
    !inFloor(room, x + 24, y + 8) ||
    !inFloor(room, x + 8, y + 24) ||
    !inFloor(room, x + 8, y - 40)
  );
}
export type Furnishing33 = {
  key: string;
  x: number;
  y: number;
  scale: number;
  footprint: Rect;
  name?: string;
  source?: "d31" | "life" | "new";
};
const f = (
  key: string,
  x: number,
  y: number,
  width: number,
  depth = 27,
  scale = 0.75,
  source: "d31" | "life" | "new" = "d31",
): Furnishing33 => ({
  key,
  x,
  y,
  scale,
  source,
  footprint: { x: x - width / 2, y: y - depth, w: width, h: depth },
});
export const furniture33: Record<Room33, Furnishing33[]> = {
  house: [
    f("hearth-salon", 660, 154, 124, 36, 0.5, "new"),
    f("reading-corner", 720, 470, 148, 36, 0.5, "new"),
    f("house-lounge", 590, 324, 130),
    f("house-table", 733, 300, 95),
    f("house-console", 810, 155, 50, 26, 0.8, "life"),
    f("house-nook", 570, 510, 135, 30, 0.8, "life"),
  ],
  library: [
    f("reading-corner", 744, 486, 148, 36, 0.5, "new"),
    f("library-shelves", 590, 156, 125),
    f("library-shelves", 784, 156, 125),
    f("library-desk", 740, 300, 100),
    f("library-shelves", 560, 305, 100, 30, 0.6),
    f("library-console", 913, 158, 56, 25, 0.8, "life"),
    f("library-nook", 910, 310, 78, 28, 0.6),
  ],
  workshop: [
    f("artisan-station", 724, 174, 120, 36, 0.5, "new"),
    f("workshop-storage", 630, 425, 95, 30, 0.8),
    f("workshop-bench", 783, 373, 120, 32, 0.8),
    f("workshop-tools", 810, 468, 104, 28, 0.65),
    f("workshop-nook", 680, 468, 90, 25, 0.65, "life"),
  ],
  inn: [
    f("tea-banquette", 790, 460, 150, 32, 0.5, "new"),
    f("hearth-salon", 760, 150, 124, 36, 0.5, "new"),
    f("inn-table", 577, 300, 100),
    f("inn-table", 855, 300, 100),
    f("inn-nook", 110, 450, 76, 25, 0.65, "life"),
    f("inn-counter", 580, 150, 100),
    f("inn-console", 920, 150, 50, 25, 0.75, "life"),
  ],
};
export function coreFurniture(room: Room33): Furnishing33[] {
  return furnitureByRoom[room].map((key, i) => ({
    ...f(
      key,
      [105, 240, 385][i],
      [155, 150, 160][i],
      [room === "workshop" ? 120 : 128, 108, 100][i],
      [36, 40, 42][i],
    ),
    name: "interior:" + key,
  }));
}
export function allFurniture(room: Room33) {
  return [...coreFurniture(room), ...furniture33[room]];
}
export function interiorCollisions(room: Room33): Rect[] {
  const plan = roomPlans[room],
    rects: Rect[] = [];
  for (let y = 0; y < plan.height; y += 16) {
    let start = -1;
    for (let x = 0; x <= plan.width; x += 16) {
      const solid = x < plan.width && wallCell(room, x, y);
      if (solid && start < 0) start = x;
      if (!solid && start >= 0) {
        rects.push({ x: start, y, w: x - start, h: 16 });
        start = -1;
      }
    }
  }
  return [...rects, ...allFurniture(room).map((f) => f.footprint)];
}

export function lanterns33(room: Room33) {
  return [
    { x: 300, y: 24 },
    { x: 18, y: 178 },
    { x: roomPlans[room].width - 12, y: 214 },
  ];
}
