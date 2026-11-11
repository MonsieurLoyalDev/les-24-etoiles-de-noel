import { blocked, move, type Point, type Rect } from "../domain";
export type RouteSegment = { a: Point; b: Point; width: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
/** Static geometry indexed once. Full facades are supplied in addition to physical socles. */
export class NavigationGrid {
  readonly step = 8;
  readonly nx: number;
  readonly ny: number;
  private mask: Uint8Array;
  private costs: Float32Array;
  private buckets = new Map<string, Rect[]>();
  private cache = new Map<string, Point[]>();
  searches = 0;
  cacheHits = 0;
  lastExpanded = 0;
  constructor(
    readonly width: number,
    readonly height: number,
    readonly rects: Rect[],
    routes: RouteSegment[] = [],
    courts: number[][][] = [],
  ) {
    this.nx = Math.floor(width / this.step) + 1;
    this.ny = Math.floor(height / this.step) + 1;
    this.mask = new Uint8Array(this.nx * this.ny);
    this.costs = new Float32Array(this.mask.length).fill(
      routes.length ? 2.6 : 1,
    );
    for (let y = 0; y < this.ny; y++)
      for (let x = 0; x < this.nx; x++)
        if (blocked({ x: x * 8, y: y * 8 }, [], width, height))
          this.mask[y * this.nx + x] = 1;
    for (const r of rects) {
      for (
        let by = Math.floor(r.y / 64);
        by <= Math.floor((r.y + r.h) / 64);
        by++
      )
        for (
          let bx = Math.floor(r.x / 64);
          bx <= Math.floor((r.x + r.w) / 64);
          bx++
        ) {
          const key = bx + ":" + by;
          const bucket = this.buckets.get(key) ?? [];
          bucket.push(r);
          this.buckets.set(key, bucket);
        }
      for (
        let y = Math.max(0, Math.floor((r.y - 4) / 8));
        y <= Math.min(this.ny - 1, Math.ceil((r.y + r.h + 4) / 8));
        y++
      )
        for (
          let x = Math.max(0, Math.floor((r.x - 6) / 8));
          x <= Math.min(this.nx - 1, Math.ceil((r.x + r.w + 6) / 8));
          x++
        )
          if (blocked({ x: x * 8, y: y * 8 }, [r], width, height))
            this.mask[y * this.nx + x] = 1;
    }
    for (const s of routes) {
      const radius = s.width / 2 + 6;
      this.region(
        Math.min(s.a.x, s.b.x) - radius,
        Math.min(s.a.y, s.b.y) - radius,
        Math.max(s.a.x, s.b.x) + radius,
        Math.max(s.a.y, s.b.y) + radius,
        (x, y, i) => {
          const dx = s.b.x - s.a.x,
            dy = s.b.y - s.a.y,
            t = Math.max(
              0,
              Math.min(
                1,
                ((x - s.a.x) * dx + (y - s.a.y) * dy) /
                  (dx * dx + dy * dy || 1),
              ),
            );
          if (Math.hypot(x - s.a.x - t * dx, y - s.a.y - t * dy) <= radius)
            this.costs[i] = 1;
        },
      );
    }
    for (const poly of courts) {
      const xs = poly.map((p) => p[0]),
        ys = poly.map((p) => p[1]);
      this.region(
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys),
        (x, y, i) => {
          let inside = false;
          for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
            const [ax, ay] = poly[a],
              [bx, by] = poly[b];
            if (
              ay > y !== by > y &&
              x < ((bx - ax) * (y - ay)) / (by - ay) + ax
            )
              inside = !inside;
          }
          if (inside) this.costs[i] = 1;
        },
      );
    }
  }
  private region(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    fn: (x: number, y: number, i: number) => void,
  ) {
    for (
      let y = Math.max(0, Math.floor(y0 / 8));
      y <= Math.min(this.ny - 1, Math.ceil(y1 / 8));
      y++
    )
      for (
        let x = Math.max(0, Math.floor(x0 / 8));
        x <= Math.min(this.nx - 1, Math.ceil(x1 / 8));
        x++
      )
        fn(x * 8, y * 8, y * this.nx + x);
  }
  private nearby(p: Point, reach = 12) {
    const found = new Set<Rect>();
    for (
      let y = Math.floor((p.y - reach) / 64);
      y <= Math.floor((p.y + reach) / 64);
      y++
    )
      for (
        let x = Math.floor((p.x - reach) / 64);
        x <= Math.floor((p.x + reach) / 64);
        x++
      )
        for (const r of this.buckets.get(x + ":" + y) ?? []) found.add(r);
    return [...found];
  }
  isFree(p: Point) {
    return !blocked(p, this.nearby(p), this.width, this.height);
  }
  clear(a: Point, b: Point) {
    const n = Math.max(1, Math.ceil(distance(a, b) / 2));
    for (let i = 0; i <= n; i++)
      if (
        !this.isFree({
          x: a.x + ((b.x - a.x) * i) / n,
          y: a.y + ((b.y - a.y) * i) / n,
        })
      )
        return false;
    return true;
  }
  advance(p: Point, dx: number, dy: number) {
    return move(
      p,
      dx,
      dy,
      this.nearby(p, Math.abs(dx) + Math.abs(dy) + 12),
      this.width,
      this.height,
    );
  }
  nearestFree(p: Point, occupied: Point[] = []): Point | null {
    if (this.isFree(p) && occupied.every((q) => distance(p, q) >= 22))
      return { ...p };
    let best: Point | null = null,
      score = Infinity;
    this.region(p.x - 96, p.y - 96, p.x + 96, p.y + 96, (x, y, i) => {
      const q = { x, y },
        d = distance(p, q);
      if (
        !this.mask[i] &&
        d < score &&
        occupied.every((o) => distance(o, q) >= 22)
      ) {
        best = q;
        score = d;
      }
    });
    return best;
  }
  private snap(p: Point): number | null {
    let best: number | null = null,
      score = Infinity;
    this.region(p.x - 16, p.y - 16, p.x + 16, p.y + 16, (x, y, i) => {
      const d = distance(p, { x, y });
      if (!this.mask[i] && d < score && this.clear(p, { x, y })) {
        best = i;
        score = d;
      }
    });
    return best;
  }
  private point(i: number): Point {
    return { x: (i % this.nx) * 8, y: Math.floor(i / this.nx) * 8 };
  }
  findPath(start: Point, goal: Point, avoid: Point[] = []): Point[] | null {
    if (!this.isFree(start) || !this.isFree(goal)) return null;
    const from = this.snap(start),
      to = this.snap(goal);
    if (from === null || to === null) return null;
    const key = from + ":" + to + ":" + goal.x + "," + goal.y,
      cached = this.cache.get(key);
    if (!avoid.length && cached && this.clear(start, cached[0])) {
      this.cacheHits++;
      return cached.map((p) => ({ ...p }));
    }
    this.searches++;
    const heap: { i: number; f: number }[] = [],
      g = new Float64Array(this.mask.length).fill(Infinity),
      parent = new Int32Array(this.mask.length).fill(-1),
      closed = new Uint8Array(this.mask.length);
    const push = (n: { i: number; f: number }) => {
      heap.push(n);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p].f <= heap[i].f) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
    };
    const pop = () => {
      const first = heap[0],
        last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          let j = i;
          const a = i * 2 + 1,
            b = a + 1;
          if (a < heap.length && heap[a].f < heap[j].f) j = a;
          if (b < heap.length && heap[b].f < heap[j].f) j = b;
          if (i === j) break;
          [heap[i], heap[j]] = [heap[j], heap[i]];
          i = j;
        }
      }
      return first.i;
    };
    g[from] = 0;
    push({ i: from, f: 0 });
    let end = -1,
      expanded = 0;
    while (heap.length && expanded < 20000) {
      const i = pop();
      if (closed[i]) continue;
      closed[i] = 1;
      expanded++;
      if (i === to) {
        end = i;
        break;
      }
      const p = this.point(i);
      for (const offset of [-1, 1, -this.nx, this.nx]) {
        const n = i + offset;
        if (n < 0 || n >= this.mask.length || closed[n] || this.mask[n])
          continue;
        const q = this.point(n);
        if (
          distance(p, q) > 8.01 ||
          avoid.some((a) => distance(q, a) < 18) ||
          !this.isFree({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 })
        )
          continue;
        const score = g[i] + this.costs[n];
        if (score >= g[n]) continue;
        g[n] = score;
        parent[n] = i;
        push({
          i: n,
          f: score + (Math.abs(q.x - goal.x) + Math.abs(q.y - goal.y)) / 8,
        });
      }
    }
    this.lastExpanded = expanded;
    if (end < 0) return null;
    const path: Point[] = [];
    for (let i = end; i >= 0; i = parent[i]) {
      path.push(this.point(i));
      if (i === from) break;
    }
    path.reverse();
    const compact = path.filter(
      (p, i) =>
        i === 0 ||
        i === path.length - 1 ||
        p.x - path[i - 1].x !== path[i + 1].x - p.x ||
        p.y - path[i - 1].y !== path[i + 1].y - p.y,
    );
    if (distance(compact.at(-1)!, goal) > 0.1) compact.push({ ...goal });
    if (!avoid.length) {
      if (this.cache.size >= 64)
        this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, compact);
    }
    return compact.map((p) => ({ ...p }));
  }
  diagnostics() {
    return {
      cellSize: 8,
      cells: this.mask.length,
      searches: this.searches,
      cacheHits: this.cacheHits,
      cachedRoutes: this.cache.size,
      lastExpanded: this.lastExpanded,
    };
  }
}
