import { plan, routes34 } from "./village34";
export const villageSize = plan.world;
export const humanDoorHeight = 44;
export const residentialPlots = plan.houses.map((h) => ({
  key: h.key,
  x: h.x,
  y: h.y,
  door: h.sourceDoor,
  district: h.quarter,
}));
export const urbanLanes = routes34;
export type UrbanLane = (typeof urbanLanes)[number];
// Legacy audit coordinate, no longer a special case in rendering.
export const relocatedPine = {
  from: { x: 944, y: 416 },
  to: { x: 1860, y: 120 },
};
