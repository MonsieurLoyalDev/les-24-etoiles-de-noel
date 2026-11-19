import { expect, it } from "vitest";
import { NavigationGrid } from "../src/world/navigation";
import { advanceAlongRoute } from "../src/narrative/route-motion";
import {
  facadeBounds,
  plan,
  routeSegments,
  pedestrianCourts,
} from "../src/art/village34";
import environments from "./fixtures/world-d41-environments.json";

it("revient de la place à la bibliothèque sans couper les coins aux différents pas de temps", () => {
  const nav = new NavigationGrid(
    1920,
    1408,
    [...environments.find((r) => r.room === "village")!.rects, ...facadeBounds],
    routeSegments,
    pedestrianCourts.map((c) => c.points),
  );
  const goal = nav.nearestFree(
    plan.buildings.find((b) => b.id === "library")!.returnPoint,
  )!;
  for (const start of [
    { x: 1040, y: 780 },
    { x: 1015, y: 795 },
    { x: 896.0781324814982, y: 720.2603802432262 },
  ])
    for (const delta of [16.7, 50, 100, 200]) {
      let position = nav.nearestFree(start)!,
        route = nav.findPath(position, goal);
      expect(route).not.toBeNull();
      for (
        let frame = 0;
        frame < 10000 &&
        Math.hypot(position.x - goal.x, position.y - goal.y) >= 4;
        frame++
      ) {
        if (!route?.length) route = nav.findPath(position, goal);
        expect(route, JSON.stringify(position)).not.toBeNull();
        const step = advanceAlongRoute(
          position,
          route!,
          nav,
          (38 * delta) / 1000,
        );
        position = step.position;
        expect(nav.isFree(position), JSON.stringify(position)).toBe(true);
        if (step.blocked) route = null;
      }
      expect(Math.hypot(position.x - goal.x, position.y - goal.y)).toBeLessThan(
        4,
      );
    }
});
