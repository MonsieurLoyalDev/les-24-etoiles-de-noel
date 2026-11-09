import type Phaser from "phaser";
import { plan } from "./village34";
import { environmentKey, type FenceStyle } from "./assets35";
import type { Point } from "../domain";

export const gardenStyle: Record<string, FenceStyle> = {
  J1: "rustic",
  J2: "copper",
  J3: "picket",
  J4: "logs",
  JL: "copper",
};
const pointKey = (p: Point) => `${p.x.toFixed(3)}:${p.y.toFixed(3)}`;
/** Shared corners are emitted once, with real gaps left exactly where the D34 gates are. */
export function fenceModules35() {
  const posts = new Map<
    string,
    Point & { garden: string; style: FenceStyle }
  >();
  const panels: { a: Point; b: Point; style: FenceStyle; garden: string }[] =
    [];
  for (const f of plan.fences) {
    const [a, b] = f.points,
      length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const count = Math.max(1, Math.ceil(length / 36)),
      style = gardenStyle[f.garden];
    const points = Array.from({ length: count + 1 }, (_, i) => ({
      x: a[0] + ((b[0] - a[0]) * i) / count,
      y: a[1] + ((b[1] - a[1]) * i) / count,
    }));
    points.forEach((p) =>
      posts.set(f.garden + ":" + pointKey(p), {
        ...p,
        garden: f.garden,
        style,
      }),
    );
    for (let i = 1; i < points.length; i++)
      panels.push({ a: points[i - 1], b: points[i], garden: f.garden, style });
  }
  return {
    posts: [...posts.values()],
    panels,
    gates: plan.gardens.map((g) => ({
      id: g.id,
      center: g.gate,
      width: g.gateWidth,
      style: gardenStyle[g.id],
    })),
  };
}

export function drawFences35(scene: Phaser.Scene) {
  const modules = fenceModules35();
  modules.panels.forEach((p, index) => {
    let a = p.a,
      b = p.b;
    if (a.x > b.x || (a.x === b.x && a.y > b.y)) [a, b] = [b, a];
    const dx = b.x - a.x,
      dy = b.y - a.y,
      length = Math.hypot(dx, dy);
    const side = Math.abs(dx) < length * 0.36,
      key = `fence35-panel-${index}`;
    const left = Math.floor(Math.min(a.x, b.x) - 5),
      top = Math.floor(Math.min(a.y, b.y) - 23);
    if (!scene.textures.exists(key)) {
      const t = scene.textures.createCanvas(
          key,
          Math.ceil(Math.abs(dx) + 11),
          Math.ceil(Math.abs(dy) + 27),
        )!,
        c = t.context;
      c.imageSmoothingEnabled = false;
      const source = scene.textures
        .get(environmentKey(`fence-${p.style}-${side ? "side" : "panel"}`))
        .getSourceImage() as HTMLImageElement;
      if (side) {
        // A real side-view module, not a horizontal fence rotated onto its side.
        c.drawImage(
          source,
          0,
          0,
          source.width,
          source.height,
          (a.x + b.x) / 2 - left - 3,
          Math.min(a.y, b.y) - top - 18,
          6,
          Math.abs(dy) + 17,
        );
      } else {
        // Project only the rails along the ground axis. Every picket stays screen-vertical.
        const inset = 2.5 / length,
          start = { x: a.x + dx * inset, y: a.y + dy * inset };
        const runX = dx * (1 - 2 * inset),
          runY = dy * (1 - 2 * inset);
        const sw = Math.floor(source.width * 0.84),
          sx = Math.floor(source.width * 0.08);
        c.setTransform(
          runX / sw,
          runY / sw,
          0,
          17 / source.height,
          start.x - left,
          start.y - top - 18,
        );
        c.drawImage(source, sx, 0, sw, source.height, 0, 0, sw, source.height);
        c.resetTransform();
      }
      t.refresh();
    }
    scene.add
      .image(left, top, key)
      .setOrigin(0)
      .setDepth(Math.max(a.y, b.y))
      .setName(`scenery:fence:${p.garden}:panel:${index}`);
  });
  for (const [index, p] of modules.posts.entries()) {
    const key = environmentKey(`fence-${p.style}-post`),
      src = scene.textures.get(key).getSourceImage();
    scene.add
      .image(p.x, p.y + 2, key)
      .setOrigin(0.5, 1)
      .setScale(25 / src.height)
      .setDepth(p.y + 2)
      .setName(`scenery:fence:${p.garden}:post:${index}`);
  }
  for (const gate of modules.gates) {
    const endpoints = modules.posts.filter(
      (p) =>
        p.garden === gate.id &&
        Math.abs(
          Math.hypot(p.x - gate.center[0], p.y - gate.center[1]) -
            gate.width / 2,
        ) < 0.05,
    );
    if (endpoints.length !== 2) throw Error("Invalid open gate: " + gate.id);
    const p = endpoints[0],
      away = {
        x: (p.x - gate.center[0]) / (gate.width / 2),
        y: (p.y - gate.center[1]) / (gate.width / 2),
      };
    const frame = environmentKey(`fence-${gate.style}-gate`),
      src = scene.textures.get(frame).getSourceImage();
    const key = "d35-folded-gate-" + gate.style;
    if (!scene.textures.exists(key)) {
      const t = scene.textures.createCanvas(
        key,
        Math.floor(src.width * 0.55),
        src.height,
      )!;
      t.context.imageSmoothingEnabled = false;
      t.context.drawImage(
        src as HTMLImageElement,
        src.width * 0.25,
        0,
        src.width * 0.55,
        src.height,
        0,
        0,
        t.width,
        t.height,
      );
      t.refresh();
    }
    // Leaf folded back against the neighbouring segment; nothing spans the walkable opening.
    scene.add
      .image(p.x + away.x * 9, p.y + away.y * 9, key)
      .setOrigin(0.5, 1)
      .setScale(23 / src.height)
      .setDepth(p.y + away.y * 9 + 1)
      .setName(`scenery:open-gate:${gate.id}`);
  }
  scene.game.canvas.dataset.fences35 = JSON.stringify({
    posts: modules.posts,
    panels: modules.panels,
    gates: modules.gates,
    styles: Object.values(gardenStyle),
    collisions: "unchanged-D34",
  });
}
