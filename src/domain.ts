export type Point = { x: number; y: number };
export type Rect = Point & { w: number; h: number };
export type Stage = 0 | 1 | 2 | 3 | 4;
export type Save = {
  version: 2;
  stage: Stage;
  room: "village" | "house" | "library" | "workshop" | "inn";
  position: Point;
  quests: Record<string, { step: number; done: boolean }>;
  flags: string[];
  inventory: string[];
  stars: number[];
  clock: number;
  dialogueHistory: string[];
  conversation: { key: string; node: string } | null;
  scores: Record<string, number>;
};
export const initial: Save = {
  version: 2,
  stage: 0,
  room: "village",
  position: { x: 512, y: 608 },
  quests: { "first-light": { step: 0, done: false } },
  flags: [],
  inventory: [],
  stars: [],
  clock: 90000,
  dialogueHistory: [],
  conversation: null,
  scores: {},
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
    ![1, 2].includes(s.version) ||
    !Number.isInteger(s.stage) ||
    s.stage < 0 ||
    s.stage > 4 ||
    !["village", "house", "library", "workshop", "inn"].includes(s.room) ||
    !Number.isFinite(s.position?.x) ||
    !Number.isFinite(s.position?.y)
  )
    return null;
  if ((value as { version: number }).version === 1) {
    if (!["village", "house"].includes(s.room)) return null;
    return {
      ...structuredClone(initial),
      stage: s.stage,
      room: s.room,
      position: { x: s.position.x, y: s.position.y },
      quests: { "first-light": { step: s.stage, done: s.stage === 4 } },
      stars: s.stage === 4 ? [1] : [],
    };
  }
  const strings = (a: unknown): a is string[] =>
    Array.isArray(a) &&
    a.length <= 500 &&
    a.every((x) => typeof x === "string" && x.length <= 100);
  if (
    !s.quests ||
    typeof s.quests !== "object" ||
    Object.values(s.quests).some(
      (q) =>
        !q ||
        !Number.isInteger(q.step) ||
        q.step < 0 ||
        q.step > 100 ||
        typeof q.done !== "boolean",
    ) ||
    !strings(s.flags) ||
    !strings(s.inventory) ||
    !strings(s.dialogueHistory) ||
    !Array.isArray(s.stars) ||
    s.stars.some((n) => !Number.isInteger(n) || n < 1 || n > 24) ||
    !Number.isFinite(s.clock) ||
    s.clock < 0 ||
    !s.scores ||
    Object.values(s.scores).some((n) => !Number.isFinite(n) || n < 0)
  )
    return null;
  if (
    s.conversation != null &&
    (typeof s.conversation.key !== "string" ||
      typeof s.conversation.node !== "string")
  )
    return null;
  return {
    ...structuredClone(s),
    conversation: s.conversation ?? null,
    stars: [...new Set(s.stars)],
  };
}
