import { expect, type Page } from "@playwright/test";
import { blocked, type Point, type Rect } from "../../src/domain";
import { facadeBounds } from "../../src/art/village34";
import { roomDimensions } from "../../src/art/rooms33";
import type { WorldRoom } from "../../src/domain";
/** Independent A* over read-only actual colliders. Movement uses real keyboard events. */
export async function navigateTo(
  page: Page,
  target: Point,
  following?: string,
) {
  await expect(page.locator(".dialogue")).toHaveCount(0);
  const state = await page.locator("canvas").evaluate((el) => ({
    x: Number((el as HTMLElement).dataset.playerX),
    y: Number((el as HTMLElement).dataset.playerY),
    room: (el as HTMLElement).dataset.room,
    rects: JSON.parse((el as HTMLElement).dataset.collisions ?? "[]") as Rect[],
  }));
  const rects = [
      ...state.rects,
      ...(state.room === "village" ? facadeBounds : []),
    ],
    routingRects = rects.map((r) => ({
      x: r.x - 3,
      y: r.y - 3,
      w: r.w + 6,
      h: r.h + 6,
    })),
    step = 4,
    width = roomDimensions(state.room as WorldRoom).width,
    height = roomDimensions(state.room as WorldRoom).height,
    nx = Math.ceil(width / step),
    start = { x: Math.round(state.x / step), y: Math.round(state.y / step) },
    key = (x: number, y: number) => y * nx + x;
  const parents = new Map<number, number>(),
    points = new Map<number, Point>(),
    cost = new Map<number, number>(),
    closed = new Set<number>();
  type Node = { x: number; y: number; g: number; f: number };
  const heap: Node[] = [];
  const push = (p: Node) => {
    heap.push(p);
    let i = heap.length - 1;
    while (i > 0) {
      const j = (i - 1) >> 1;
      if (heap[j].f <= heap[i].f) break;
      [heap[i], heap[j]] = [heap[j], heap[i]];
      i = j;
    }
  };
  const pop = () => {
    const first = heap[0],
      last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const a = i * 2 + 1,
          b = a + 1;
        let j = i;
        if (a < heap.length && heap[a].f < heap[j].f) j = a;
        if (b < heap.length && heap[b].f < heap[j].f) j = b;
        if (j === i) break;
        [heap[j], heap[i]] = [heap[i], heap[j]];
        i = j;
      }
    }
    return first;
  };
  push({ ...start, g: 0, f: 0 });
  cost.set(key(start.x, start.y), 0);
  let end: number | undefined;
  while (heap.length) {
    const p = pop(),
      id = key(p.x, p.y);
    if (closed.has(id)) continue;
    closed.add(id);
    points.set(id, { x: p.x * step, y: p.y * step });
    if (Math.hypot(p.x * step - target.x, p.y * step - target.y) <= 7) {
      end = id;
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = p.x + dx,
        y = p.y + dy,
        k = key(x, y),
        g = p.g + 1;
      if (
        closed.has(k) ||
        blocked({ x: x * step, y: y * step }, routingRects, width, height) ||
        g >= (cost.get(k) ?? Infinity)
      )
        continue;
      cost.set(k, g);
      parents.set(k, id);
      push({
        x,
        y,
        g,
        f:
          g +
          (Math.abs(x * step - target.x) + Math.abs(y * step - target.y)) /
            step,
      });
    }
  }
  expect(end, "itinéraire vers " + JSON.stringify(target)).toBeDefined();
  const path: Point[] = [];
  for (let id = end!; parents.has(id); id = parents.get(id)!)
    path.push(points.get(id)!);
  path.reverse();
  const compressed = path.filter(
    (p, i) =>
      i === path.length - 1 ||
      i === 0 ||
      p.x - path[i - 1].x !== path[i + 1].x - p.x ||
      p.y - path[i - 1].y !== path[i + 1].y - p.y,
  );
  await page.evaluate(
    async ({ points, following }) => {
      const keys: { [key: string]: number } = {
        ArrowRight: 39,
        ArrowLeft: 37,
        ArrowUp: 38,
        ArrowDown: 40,
      };
      let held = "";
      const set = (key: string) => {
        if (held === key) return;
        if (held)
          window.dispatchEvent(
            new KeyboardEvent("keyup", {
              key: held,
              code: held,
              keyCode: keys[held],
              bubbles: true,
            }),
          );
        held = key;
        if (key)
          window.dispatchEvent(
            new KeyboardEvent("keydown", {
              key,
              code: key,
              keyCode: keys[key],
              bubbles: true,
            }),
          );
      };
      try {
        await new Promise<void>((resolve, reject) => {
          let i = 0,
            last = performance.now(),
            lastX = NaN,
            lastY = NaN,
            waiting = false,
            waitStart = 0;
          function frame() {
            const c = document.querySelector("canvas")!,
              x = Number(c.dataset.playerX),
              y = Number(c.dataset.playerY);
            if (following) {
              const companion = JSON.parse(c.dataset.narrative ?? "null")
                ?.runtime?.flow?.followers?.[following];
              if (companion) {
                const gap = Math.hypot(x - companion.x, y - companion.y);
                if (gap > 130 && !waiting) {
                  waiting = true;
                  waitStart = performance.now();
                }
                if (gap < 70) waiting = false;
                if (waiting) {
                  last = performance.now();
                  set("");
                  if (performance.now() - waitStart > 30000) {
                    reject(
                      Error(
                        "Le compagnon ne rejoint pas le joueur : " +
                          JSON.stringify({ player: { x, y }, companion }),
                      ),
                    );
                    return;
                  }
                  requestAnimationFrame(frame);
                  return;
                }
              }
            }
            if (
              !Number.isFinite(lastX) ||
              Math.hypot(x - lastX, y - lastY) > 1
            ) {
              last = performance.now();
              lastX = x;
              lastY = y;
            }
            if (performance.now() - last > 3500) {
              reject(
                Error(
                  "Navigation bloquée près de " +
                    x +
                    "," +
                    y +
                    " → " +
                    JSON.stringify(points[i]),
                ),
              );
              return;
            }
            while (
              i < points.length &&
              Math.hypot(points[i].x - x, points[i].y - y) < 3
            )
              i++;
            if (i === points.length) {
              resolve();
              return;
            }
            const p = points[i],
              dx = p.x - x,
              dy = p.y - y;
            set(
              Math.abs(dx) > Math.abs(dy)
                ? dx > 0
                  ? "ArrowRight"
                  : "ArrowLeft"
                : dy > 0
                  ? "ArrowDown"
                  : "ArrowUp",
            );
            requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        });
      } finally {
        set("");
      }
    },
    { points: compressed, following },
  );
  const p = await page.locator("canvas").evaluate((el) => ({
    x: Number(el.dataset.playerX),
    y: Number(el.dataset.playerY),
  }));
  expect(Math.hypot(p.x - target.x, p.y - target.y)).toBeLessThan(12);
}
