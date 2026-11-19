import type { Point } from "../domain";
import type { NavigationGrid } from "../world/navigation";

/** Consume the final subpixel before turning a corner. Skipping a waypoint a
 * pixel early can cut into a facade and cause the same route to fail forever. */
export function advanceAlongRoute(
  start: Point,
  points: Point[],
  nav: NavigationGrid,
  budget: number,
  avoid?: Point,
) {
  let position = { ...start };
  while (budget > 0 && points.length) {
    const point = points[0],
      length = Math.hypot(point.x - position.x, point.y - position.y);
    if (length < 0.001) {
      position = { ...point };
      points.shift();
      continue;
    }
    const amount = Math.min(length, budget);
    const next = nav.advance(
      position,
      ((point.x - position.x) / length) * amount,
      ((point.y - position.y) / length) * amount,
    );
    if (
      (avoid && Math.hypot(next.x - avoid.x, next.y - avoid.y) < 18) ||
      Math.hypot(next.x - position.x, next.y - position.y) < 0.0001
    )
      return { position, blocked: true };
    position = next;
    budget -= amount;
    if (Math.hypot(position.x - point.x, position.y - point.y) < 0.001) {
      position = { ...point };
      points.shift();
    }
  }
  return { position, blocked: false };
}
