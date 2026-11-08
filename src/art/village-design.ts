import type { Point, Rect } from "../domain";
import { villageMap, anchors } from "./village34";
export type District =
  | "place"
  | "library"
  | "workshop"
  | "inn"
  | "house"
  | "civic"
  | "post"
  | "forest";
export type Decoration = {
  id: string;
  key: string;
  x: number;
  y: number;
  width: number;
  district: District;
  back?: boolean;
  flip?: boolean;
  overhead?: boolean;
};
export type Lane = {
  id: string;
  material: "stone" | "dirt";
  width: number;
  points: Point[];
};
export const decorations: Decoration[] = [];
export const lanes: Lane[] = [];
export const courts: { x: number; y: number; rx: number; ry: number }[] = [];
export const districtSigns: { text: string; x: number; y: number }[] = [];
export const interactionReserves = [
  anchors.spawn,
  anchors.advent,
  anchors.final,
  ...anchors.hunts,
  ...villageMap.buildings.map((b) => ({
    x: b.entrance.x * 16,
    y: b.entrance.y * 16 + 22,
  })),
];
export function existingCollisionRects(): Rect[] {
  return villageMap.buildings.map((b) => ({
    x: b.tileX * 16,
    y: b.tileY * 16,
    w: b.widthTiles * 16,
    h: b.heightTiles * 16,
  }));
}
