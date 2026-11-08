import type Phaser from "phaser";
import type { Rect } from "../domain";
import {
  plan,
  safeScenery,
  routeSegments,
  distanceToSegment,
  overlaps,
  inPolygon,
} from "./village34";
import { vegetationKey } from "./vegetation";
import { cleanKey } from "./prepare";
export const extraSceneryKeys = [
  "stand_cadeaux",
  "caisse_fleurs",
  "banc_neige",
  "guirlande_lanternes",
];
export function drawScenery34(scene: Phaser.Scene): Rect[] {
  const solids: Rect[] = [],
    placed: {
      texture: string;
      key: string;
      quarter: string;
      box: Rect;
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [],
    rejected: string[] = [];
  const place = (
    key: string,
    x: number,
    y: number,
    width: number,
    quarter = "Centre",
    common = false,
  ) => {
    const texture =
      vegetationKey(key, x, y) ??
      (scene.textures.exists(cleanKey(key)) ? cleanKey(key) : key);
    if (!scene.textures.exists(texture))
      throw new Error("Missing scenery texture " + texture);
    const src = scene.textures
        .get(texture)
        .getSourceImage() as HTMLImageElement,
      height = (width * src.height) / src.width,
      box = { x: x - width / 2, y: y - height, w: width, h: height };
    if (!safeScenery(box, false) || placed.some((p) => overlaps(box, p.box))) {
      rejected.push(key);
      return false;
    }
    // Courts are public spaces: furniture may occupy an edge, never a through-route.
    for (let py = box.y; py <= y; py += 5)
      for (let px = box.x; px <= box.x + width; px += 5)
        if (
          routeSegments.some(
            (s) =>
              distanceToSegment({ x: px, y: py }, s.a, s.b) < s.width / 2 + 5,
          )
        ) {
          rejected.push(key);
          return false;
        }
    if (
      !common &&
      plan.fences.some(
        (f) =>
          distanceToSegment(
            { x, y },
            { x: f.points[0][0], y: f.points[0][1] },
            { x: f.points[1][0], y: f.points[1][1] },
          ) <
          width / 2 + 8,
      )
    )
      return false;
    const sprite = scene.add
      .image(x, y, texture)
      .setOrigin(0.5, 1)
      .setScale(width / src.width)
      .setDepth(y)
      .setName("scenery:" + quarter + ":" + key + ":" + placed.length);
    if (key.startsWith("vegetation_pine") || key.startsWith("fir_"))
      sprite.setData("windBase", 0);
    const base = { x: x - width * 0.27, y: y - 6, w: width * 0.54, h: 7 };
    solids.push(base);
    placed.push({ key, texture, quarter, box, x, y, width, height });
    return true;
  };
  // The two existing market stalls keep the exact approved positions and sizes.
  for (const s of plan.stalls) {
    const image = scene.add
      .image(s.x, s.y, cleanKey("stand_cadeaux"))
      .setOrigin(0.5, 1)
      .setScale(
        s.w /
          scene.textures.get(cleanKey("stand_cadeaux")).getSourceImage().width,
      )
      .setDepth(s.y)
      .setName("scenery:market:" + s.id);
    solids.push({ x: s.x - s.w * 0.35, y: s.y - 14, w: s.w * 0.7, h: 14 });
    scene.add
      .image(s.x, s.y + 1, "ground-d3-snowbank-small")
      .setDisplaySize(s.w * 0.7, 8)
      .setDepth(s.y + 0.1);
    image.setData("market", s.id);
  }
  for (const c of plan.commons) {
    const key = c.type.includes("banc") ? "banc_plaid" : "lampadaire",
      w = c.type.includes("banc") ? 43 : 19;
    for (const [dx, dy] of [
      [0, 0],
      [-12, 0],
      [12, 0],
      [0, -14],
      [0, 14],
      [-22, -12],
      [22, -12],
    ]) {
      if (place(key, c.x + dx, c.y + dy, w, c.id, true)) break;
    }
  }
  // Different small compositions, rather than the same three props at every door.
  for (const [i, h] of plan.houses.entries()) {
    const left = h.x - h.w / 2 - 25,
      right = h.x + h.w / 2 + 24,
      q = h.quarter;
    const entries =
      q === "Q1"
        ? [
            ["jardiniere", left, h.y + 13, 28],
            ["banc_neige", right, h.y + 12, 42],
            ["vegetation_bush_snow", left - 12, h.y - 30, 29],
          ]
        : q === "Q2"
          ? [
              ["logs", right, h.y + 12, 29],
              ["caisse_fleurs", left, h.y + 12, 30],
              ["vegetation_bush_berries", right + 9, h.y - 30, 25],
            ]
          : q === "Q3"
            ? [
                ["banc_plaid", i % 2 ? left : right, h.y + 15, 46],
                ["vegetation_bush_snow", left - 9, h.y - 20, 34],
                ["jardiniere", right + 5, h.y - 23, 25],
              ]
            : [
                ["logs", left, h.y + 10, 34],
                ["caisse_fleurs", right, h.y + 12, 30],
                ["gift", left - 5, h.y - 34, 22],
              ];
    for (const [k, x, y, w] of entries)
      place(k as string, x as number, y as number, w as number, q);
    place("lampadaire", i % 2 ? left - 8 : right + 7, h.y + 16, 19, q);
  }
  // Specific corners of the public buildings, all tested against the same circulation reserves.
  for (const [key, x, y, w] of [
    ["banc_plaid", 680, 650, 58],
    ["jardiniere", 870, 640, 28],
    ["caisse_fleurs", 1140, 615, 28],
    ["logs", 1330, 975, 36],
    ["vegetation_bush_berries", 1355, 955, 28],
    ["lampadaire", 900, 925, 23],
    ["lampadaire", 1055, 900, 23],
    ["lampadaire", 1080, 640, 22],
    ["arche_etoilebois", 960, 1378, 152],
  ] as const)
    place(key, x, y, w);
  // Gardens have different planting rhythms; shapes and gate locations come from the plan.
  for (const [index, g] of plan.gardens.entries()) {
    const points = g.points;
    const minX = Math.min(...points.map((p) => p[0])),
      maxX = Math.max(...points.map((p) => p[0])),
      minY = Math.min(...points.map((p) => p[1])),
      maxY = Math.max(...points.map((p) => p[1]));
    const step = index === 2 ? 30 : 40;
    for (let y = minY + 30; y < maxY - 6; y += step)
      for (let x = minX + 20; x < maxX - 10; x += step + 5) {
        if (inPolygon({ x, y }, points))
          place(
            index === 3
              ? "logs"
              : index % 2
                ? "vegetation_bush_berries"
                : "vegetation_bush_snow",
            x + (y % 3) * 3,
            y,
            index === 2 ? 24 : 29,
            g.id,
          );
      }
  }
  // Woodland compositions stay inside their planned canopy zones and never mask a facade.
  for (const z of plan.woods) {
    const xs = z.points.map((p) => p[0]),
      ys = z.points.map((p) => p[1]);
    for (let y = Math.min(...ys) + 75; y < Math.max(...ys); y += 64)
      for (let x = Math.min(...xs) + 35; x < Math.max(...xs); x += 72) {
        const xx = x + Math.sin(y * 0.04 + x * 0.015) * 16,
          yy = y + Math.sin(x * 0.03) * 12,
          w = 42 + ((Math.floor(x + y) * 7) % 25);
        if (inPolygon({ x: xx, y: yy }, z.points))
          place("vegetation_pine_large", xx, yy, w, z.id);
      }
  }
  for (const q of plan.quarters) {
    const offsets =
      q.id === "Q1"
        ? [
            [35, -40],
            [-40, -60],
          ]
        : q.id === "Q2"
          ? [
              [30, -45],
              [-40, -35],
              [35, -25],
            ]
          : q.id === "Q3"
            ? [[-35, -42]]
            : [
                [-35, -25],
                [40, -40],
              ];
    for (const h of plan.houses.filter((h) => h.quarter === q.id))
      for (const [dx, dy] of offsets) {
        const side = dx < 0 ? -1 : 1;
        place(
          "vegetation_bush_berries",
          h.x + side * (h.w / 2 + Math.abs(dx)),
          h.y + dy,
          26,
          q.id,
        );
        place(
          "vegetation_bush_snow",
          h.x + side * (h.w / 2 + Math.abs(dx) + 16),
          h.y + dy + 13,
          22,
          q.id,
        );
      }
  }
  // Additional planted edges are grouped by the gardens, not scattered over the snow.
  for (const [x, y, w] of [
    [190, 460, 58],
    [200, 680, 64],
    [650, 260, 60],
    [1120, 160, 66],
    [1730, 640, 70],
    [1835, 750, 57],
    [1820, 1275, 70],
    [690, 1260, 62],
    [360, 1310, 64],
    [1100, 1200, 57],
    [1230, 1300, 65],
  ])
    place("vegetation_pine_large", x, y, w, "lisiere");
  // Reuse the actual garland fence artwork, cut to segment length. Gates stay truly open.
  const fenceKey = "d34-fence-strip";
  if (!scene.textures.exists(fenceKey)) {
    const image = scene.textures
        .get(cleanKey("cloture_guirlande"))
        .getSourceImage() as HTMLImageElement,
      t = scene.textures.createCanvas(fenceKey, 128, 30)!;
    t.context.imageSmoothingEnabled = false;
    t.context.drawImage(image, 0, 0, 128, 30);
    t.refresh();
  }
  for (const f of plan.fences) {
    const [a, b] = f.points,
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    scene.add
      .tileSprite((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 10, len, 25, fenceKey)
      .setRotation(Math.atan2(b[1] - a[1], b[0] - a[0]))
      .setDepth(Math.max(a[1], b[1]))
      .setName("scenery:fence:" + f.garden);
  }
  scene.game.canvas.dataset.scenery34 = JSON.stringify({
    placed,
    rejected: rejected.length,
    collisions: solids,
    quarters: plan.quarters.map((q) => ({
      id: q.id,
      props: placed.filter((p) => p.quarter === q.id).length,
    })),
  });
  return solids;
}
