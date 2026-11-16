import type { Point } from "../domain";
/** Bounded cubic arc, evaluated only while one of the at-most 24 stars is in flight. */
export function starFlight(
  from: Point,
  to: Point,
  time: number,
  bend: number,
): Point {
  const t = Math.max(0, Math.min(1, time)),
    u = 1 - t;
  const dx = to.x - from.x,
    dy = to.y - from.y;
  return {
    x:
      u * u * u * from.x +
      3 * u * u * t * (from.x + dx * 0.25 + bend) +
      3 * u * t * t * (from.x + dx * 0.75 - bend * 0.35) +
      t * t * t * to.x,
    y:
      u * u * u * from.y +
      3 * u * u * t * (from.y + dy * 0.3 - 45) +
      3 * u * t * t * (from.y + dy * 0.7 - 30) +
      t * t * t * to.y,
  };
}
