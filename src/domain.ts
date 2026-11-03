export type Point = { x: number; y: number };
export type Rect = Point & { w: number; h: number };
export type Stage = 0 | 1 | 2 | 3 | 4;
export type Save = {
  version: 1;
  stage: Stage;
  room: "village" | "house";
  position: Point;
};
export const initial: Save = {
  version: 1,
  stage: 0,
  room: "village",
  position: { x: 512, y: 608 },
};
export const objectives = [
  "Parler à Loyal · E près de lui",
  "Entrer dans la Maison de Loyal · au sud-est",
  "Trouver la lettre sur la table",
  "Revenir au sapin et placer votre étoile",
  "Votre première étoile brille. Merci, Debby ♥",
];
export function advance(stage: Stage, event: string): Stage {
  return ((
    { "0:loyal": 1, "1:enter": 2, "2:letter": 3, "3:tree": 4 } as Record<
      string,
      Stage
    >
  )[`${stage}:${event}`] ?? stage) as Stage;
}
export function blocked(p: Point, rects: Rect[], w: number, h: number) {
  return (
    p.x < 8 ||
    p.y < 8 ||
    p.x > w - 8 ||
    p.y > h - 8 ||
    rects.some(
      (r) =>
        p.x + 6 > r.x &&
        p.x - 6 < r.x + r.w &&
        p.y + 4 > r.y &&
        p.y - 4 < r.y + r.h,
    )
  );
}
export function move(
  p: Point,
  dx: number,
  dy: number,
  rects: Rect[],
  w: number,
  h: number,
): Point {
  let n = { x: p.x, y: p.y };
  if (!blocked({ x: n.x + dx, y: n.y }, rects, w, h)) n.x += dx;
  if (!blocked({ x: n.x, y: n.y + dy }, rects, w, h)) n.y += dy;
  return n;
}
export function visible(a: Point, b: Point, rects: Rect[]) {
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  for (let i = 1; i < d; i += 3) {
    const t = i / d;
    if (
      rects.some(
        (r) =>
          a.x + (b.x - a.x) * t > r.x &&
          a.x + (b.x - a.x) * t < r.x + r.w &&
          a.y + (b.y - a.y) * t > r.y &&
          a.y + (b.y - a.y) * t < r.y + r.h,
      )
    )
      return false;
  }
  return true;
}
export function decode(value: unknown): Save | null {
  const s = value as Save;
  if (
    !s ||
    s.version !== 1 ||
    !Number.isInteger(s.stage) ||
    s.stage < 0 ||
    s.stage > 4 ||
    !["village", "house"].includes(s.room) ||
    !Number.isFinite(s.position?.x) ||
    !Number.isFinite(s.position?.y)
  )
    return null;
  return s;
}
