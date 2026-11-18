import type { Village } from "../game/Game";
import type { Point } from "../domain";
import { anchors, plan } from "../art/village34";
import { allFurniture, type Room33 } from "../art/rooms33";
import { worldPoints } from "../world/points";
import { areaAnchors, areaPortals, isExtraRoom } from "./areas";
import type { AnchorRef } from "./flow";
export function flowAnchor(scene: Village, ref: AnchorRef, raw = false): Point {
  let p: Point | undefined;
  const [kind, key] = ref.anchor.split(":");
  if (kind === "companion" && key === "loyal") p = scene.loyal;
  if (kind === "resident") p = scene.npcs.find((n) => n.id === key)?.image;
  if (kind === "world") p = worldPoints.find((v) => v.id === key)?.position;
  if (kind === "building")
    p = plan.buildings.find((v) => v.id === key)?.returnPoint;
  if (kind === "home") p = plan.houses.find((v) => v.id === key)?.door;
  if (kind === "portal" && isExtraRoom(key))
    p =
      ref.room === (areaPortals[key].from ?? "village")
        ? areaPortals[key].village
        : areaPortals[key].entry;
  if (kind === "area" && isExtraRoom(ref.room))
    p =
      areaAnchors[ref.room][key as keyof (typeof areaAnchors)[typeof ref.room]];
  if (
    kind === "furniture" &&
    ref.room !== "village" &&
    !["forest", "lake", "hamlet"].includes(ref.room)
  )
    p = allFurniture(
      ref.room === "bakery"
        ? "inn"
        : ref.room === "clockshop"
          ? "workshop"
          : (ref.room as Room33),
    ).find((v) => v.key === key);
  if (kind === "square") p = anchors.advent;
  if (kind === "trail") p = anchors.hunts[Number(key)];
  if (kind === "point") {
    const [x, y] = key.split(",").map(Number);
    if (Number.isFinite(x + y)) p = { x, y };
  }
  if (!p) throw Error("Ancrage narratif inconnu : " + ref.anchor);
  const point = {
    x: p.x + (ref.offset?.x ?? 0),
    y: p.y + (ref.offset?.y ?? 0),
  };
  const grid = scene.living.environments.get(ref.room);
  return raw
    ? point
    : (grid?.nearestFree(
        point,
        kind === "resident" ? [{ x: p.x, y: p.y }] : [],
      ) ?? point);
}
