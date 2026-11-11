import { readFileSync } from "node:fs";
import { NavigationGrid } from "../src/world/navigation";
import { worldPoints } from "../src/world/points";
import {
  facadeBounds,
  routeSegments,
  pedestrianCourts,
} from "../src/art/village34";
import { roomDimensions } from "../src/art/rooms33";
import type { Room } from "../src/rpg/world";
const rooms = JSON.parse(
  readFileSync("tests/fixtures/world-d41-environments.json", "utf8"),
) as { room: Room; rects: { x: number; y: number; w: number; h: number }[] }[];
for (const row of rooms.filter(
  (r) => r.room === "village" || r.room === "library",
)) {
  const dims = roomDimensions(row.room),
    nav = new NavigationGrid(
      dims.width,
      dims.height,
      [...row.rects, ...(row.room === "village" ? facadeBounds : [])],
      row.room === "village" ? routeSegments : [],
      row.room === "village" ? pedestrianCourts.map((c) => c.points) : [],
    );
  console.log(
    row.room,
    worldPoints
      .filter((p) => p.room === row.room)
      .map((p) => ({
        id: p.id,
        free: nav.isFree(p.position),
        path:
          nav.findPath(
            row.room === "village" ? { x: 1070, y: 760 } : { x: 100, y: 230 },
            p.position,
          )?.length ?? null,
      })),
    nav.diagnostics(),
  );
}
