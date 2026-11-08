import plan from "./plan-d34.json" with { type: "json" };
import original from "../game/maps/place-des-lanternes.json" with { type: "json" };
import type { Point, Rect } from "../domain";
export { plan };
export const point = (p: number[]): Point => ({ x: p[0], y: p[1] });
export const anchors = {
  ...plan.anchors,
  tree: point(plan.anchors.tree),
  spawn: point(plan.anchors.spawn),
  advent: point(plan.anchors.advent),
  final: point(plan.anchors.final),
  finalLoyal: point(plan.anchors.finalLoyal),
  emile: point(plan.anchors.emile),
  flocon: point(plan.anchors.flocon),
  hunts: plan.anchors.hunts.map(point),
  augustin: plan.anchors.augustin.map(point),
};
export const villageMap = {
  ...original,
  buildings: original.buildings.map((b) => {
    const p = plan.buildings.find((p) => p.id === b.id)!;
    return {
      ...b,
      tileX: p.collision.x / 16,
      tileY: p.collision.y / 16,
      entrance: { x: p.x / 16, y: p.y / 16 },
    };
  }),
  props: original.props
    .filter((p) => p.interaction && p.sprite !== "quest_star")
    .map((p) => {
      const a =
        p.sprite === "pine_festive"
          ? [anchors.tree.x, anchors.tree.y - 10]
          : p.id === "gift_18"
            ? [805, 690]
            : p.id === "gift_19"
              ? [1070, 885]
              : p.id === "signpost_22"
                ? [775, 740]
                : [1140, 980];
      return { ...p, tileX: a[0] / 16, tileY: a[1] / 16 };
    }),
};
export function roundedRoute(points: Point[]) {
  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i],
      a = points[i - 1],
      b = points[i + 1],
      l = Math.hypot(p.x - a.x, p.y - a.y),
      r = Math.hypot(p.x - b.x, p.y - b.y),
      t = Math.min(24, l * 0.22, r * 0.22),
      u = { x: p.x + ((a.x - p.x) * t) / l, y: p.y + ((a.y - p.y) * t) / l },
      v = { x: p.x + ((b.x - p.x) * t) / r, y: p.y + ((b.y - p.y) * t) / r };
    result.push(u);
    for (let n = 1; n <= 12; n++) {
      const t = n / 12;
      result.push({
        x: (1 - t) ** 2 * u.x + 2 * (1 - t) * t * p.x + t * t * v.x,
        y: (1 - t) ** 2 * u.y + 2 * (1 - t) * t * p.y + t * t * v.y,
      });
    }
  }
  result.push(points.at(-1)!);
  return result;
}
export const routes34 = plan.routes.map((r) => ({
  ...r,
  material: r.type === "main" ? ("stone" as const) : ("dirt" as const),
  points: r.points.map(point),
}));
export function distanceToSegment(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy) || 0,
      ),
    );
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
export const routeSegments = routes34.flatMap((r) => {
  const ps = roundedRoute(r.points);
  return ps.slice(1).map((p, i) => ({ a: ps[i], b: p, width: r.width }));
});
export function inPolygon(p: Point, ps: number[][]) {
  let inside = false;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    const [xi, yi] = ps[i],
      [xj, yj] = ps[j];
    if (
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}
export const pedestrianCourts = [
  plan.central,
  ...plan.quarters.map((q) => q.court),
];
export function onNetwork(p: Point) {
  return (
    pedestrianCourts.some((c) => inPolygon(p, c.points)) ||
    routeSegments.some((s) => distanceToSegment(p, s.a, s.b) <= s.width / 2)
  );
}
export const facadeBounds: Rect[] = [
  ...plan.buildings,
  ...plan.houses,
  ...plan.stalls,
].map((b) => ({ x: b.x - b.w / 2, y: b.y - b.h, w: b.w, h: b.h }));
export const fenceRects: Rect[] = plan.fences.flatMap((f) => {
  const a = point(f.points[0]),
    b = point(f.points[1]),
    n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4);
  return Array.from({ length: n + 1 }, (_, i) => ({
    x: a.x + ((b.x - a.x) * i) / n - 2,
    y: a.y + ((b.y - a.y) * i) / n - 2,
    w: 4,
    h: 4,
  }));
});
export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export function safeScenery(box: Rect, paths = true) {
  if (box.x < 10 || box.y < 10 || box.x + box.w > 1910 || box.y + box.h > 1398)
    return false;
  if (
    facadeBounds.some((b) =>
      overlaps(box, { x: b.x - 8, y: b.y - 8, w: b.w + 16, h: b.h + 16 }),
    )
  )
    return false;
  const reserves = [
    anchors.tree,
    anchors.advent,
    anchors.final,
    anchors.emile,
    anchors.flocon,
    ...anchors.hunts,
    ...anchors.augustin,
    ...plan.buildings.map((b) => ({ x: b.x, y: b.y + 20 })),
  ];
  if (
    reserves.some(
      (p) =>
        p.x > box.x - 25 &&
        p.x < box.x + box.w + 25 &&
        p.y > box.y - 20 &&
        p.y < box.y + box.h + 20,
    )
  )
    return false;
  if (paths) {
    for (let y = box.y; y <= box.y + box.h; y += 6)
      for (let x = box.x; x <= box.x + box.w; x += 6)
        if (onNetwork({ x, y })) return false;
  }
  return true;
}
/** Preserve progress and valid positions; only rescue blocked/occluded outdoor positions. */
export function restoreOutdoorPosition(p: Point, rects: Rect[]): Point {
  const valid = (q: Point) =>
    q.x >= 8 &&
    q.y >= 8 &&
    q.x <= 1912 &&
    q.y <= 1400 &&
    !rects.some((r) => overlaps({ x: q.x - 6, y: q.y - 4, w: 12, h: 8 }, r)) &&
    !facadeBounds.some((r) =>
      overlaps({ x: q.x - 6, y: q.y - 4, w: 12, h: 8 }, r),
    );
  if (valid(p)) return p;
  const candidates = routeSegments
    .flatMap((s) => [s.a, s.b])
    .filter(valid)
    .sort(
      (a, b) =>
        Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
    );
  return candidates[0] ?? { ...anchors.spawn };
}
