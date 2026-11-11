import { environmentKey } from "./assets35";
import { drawFences35 } from "./fences35";
import type Phaser from "phaser";
import type { Rect } from "../domain";
import {
  plan,
  fenceRects,
  safeScenery,
  routeSegments,
  distanceToSegment,
  overlaps,
  inPolygon,
} from "./village34";
import { vegetationKey } from "./vegetation";
import { cleanKey } from "./prepare";
import { composeWitness351 } from "./composition351";
import { composeQuarters351b } from "./quarters351b";
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
  const seats: {
    x: number;
    y: number;
    texture: string;
    positions: number[][];
  }[] = [];
  const place = (
    key: string,
    x: number,
    y: number,
    width: number,
    quarter = "Centre",
    common = false,
  ) => {
    const aliases: Record<string, string> = {
      banc_plaid: [
        "bench-rustic",
        "bench-village",
        "bench-copper",
        "bench-garden",
      ][Math.abs(Math.round(x + y)) % 4],
      banc_neige: "bench-garden",
      logs: [
        "wood-small",
        "wood-medium",
        "wood-rack",
        "wood-irregular",
        "wood-bundle",
        "wood-kindling",
      ][Math.abs(Math.round(x + y)) % 6],
      gift: [
        "gift-pair",
        "gift-trio",
        "gift-stack",
        "gift-basket",
        "gift-display",
      ][Math.abs(Math.round(x + y)) % 5],
      jardiniere: "prop-planter",
      caisse_fleurs: "prop-crates",
    };
    if (aliases[key]) {
      if (key.startsWith("banc")) width = 90;
      key = aliases[key];
    }
    const texture =
      (scene.textures.exists(environmentKey(key))
        ? environmentKey(key)
        : null) ??
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
    const footRatio = key.startsWith("bench-")
      ? 0.86
      : key.startsWith("wood-")
        ? 0.8
        : key.startsWith("fir_") || key === "prop-bare-tree"
          ? 0.24
          : key.startsWith("prop-")
            ? 0.72
            : 0.54;
    if (
      fenceRects.some((r) =>
        overlaps(
          {
            x: x - (width * footRatio) / 2,
            y: y - 6,
            w: width * footRatio,
            h: 7,
          },
          r,
        ),
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
    if (key.startsWith("bench-"))
      seats.push({
        x,
        y,
        texture,
        positions: [
          [x - 20, y - 15],
          [x + 20, y - 15],
        ],
      });
    const base = {
      x: x - (width * footRatio) / 2,
      y: y - 6,
      w: width * footRatio,
      h: 7,
    };
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
  // Seats are composed first: a real two-person footprint needs a reserved corner.
  for (const [key, x, y] of [
    ["bench-rustic", 420, 400],
    ["bench-village", 1465, 380],
    ["bench-garden", 375, 975],
    ["bench-copper", 1660, 1025],
  ] as [string, number, number][]) {
    const quarter =
      plan.quarters[
        [
          "bench-rustic",
          "bench-village",
          "bench-garden",
          "bench-copper",
        ].indexOf(key)
      ].id;
    for (const [dx, dy] of [
      [0, 0],
      [0, -5],
      [-5, 0],
      [5, 0],
      [0, 5],
      [-10, -5],
      [10, -5],
      [0, -10],
    ]) {
      if (place(key, x + dx, y + dy, 80, quarter, true)) break;
    }
  }
  place("bench-copper", 1260, 745, 82, "Centre", true);
  place("bench-copper", 732, 675, 80, "Centre", true);
  for (const [key, x, y, w, q] of [
    ["fir_young", 449, 366, 32, "Q1"],
    ["fir_windswept", 359, 414, 34, "Q1"],
    ["fir_young", 479, 414, 32, "Q1"],
    ["fir_young", 1453, 476, 32, "Q2"],
    ["fir_slim", 1453, 552, 24, "Q2"],
    ["fir_young", 1255, 578, 32, "Q2"],
    ["fir_young", 421, 922, 32, "Q3"],
    ["fir_windswept", 385, 904, 32, "Q3"],
    ["fir_young", 499, 880, 32, "Q3"],
    ["fir_young", 1539, 970, 32, "Q4"],
    ["fir_young", 1569, 1054, 32, "Q4"],
    ["fir_windswept", 1587, 898, 34, "Q4"],
    ["fir_slim", 715, 465, 29, "Centre"],
    ["fir_slim", 385, 855, 36, "Q3"],
    ["fir_slim", 1702, 400, 38, "Q2"],
    ["fir_slim", 1590, 780, 40, "Q4"],
    ["fir_young", 1635, 780, 30, "Q4"],
    ["fir_slim", 1000, 330, 42, "Centre"],
    ["fir_young", 1040, 345, 34, "Centre"],
    ["fir_windswept", 205, 600, 43, "Q1"],
    ["fir_young", 690, 740, 35, "Centre"],
    ["fir_windswept", 1180, 1075, 48, "Centre"],
  ] as [string, number, number, number, string][])
    place(key, x, y, w, q, true);
  // Deliberate inner-village pockets: not a uniform planting grid or a peripheral forest ring.
  const pockets: [string, number, number, number, string][] = [
    ["vegetation_pine_large", 472, 385, 38, "Q1"],
    ["vegetation_pine_large", 350, 465, 32, "Q1"],
    ["prop-bare-tree", 625, 565, 55, "Q1"],
    ["vegetation_pine_large", 565, 590, 42, "Q1"],
    ["vegetation_pine_large", 1430, 388, 34, "Q2"],
    ["vegetation_pine_large", 1505, 430, 32, "Q2"],
    ["prop-bare-tree", 1470, 540, 55, "Q2"],
    ["vegetation_pine_large", 1660, 440, 42, "Q2"],
    ["vegetation_pine_large", 385, 855, 38, "Q3"],
    ["prop-bare-tree", 500, 940, 54, "Q3"],
    ["vegetation_pine_large", 370, 1020, 40, "Q3"],
    ["vegetation_pine_large", 665, 1090, 45, "Q3"],
    ["vegetation_pine_large", 1550, 935, 34, "Q4"],
    ["prop-bare-tree", 1660, 1045, 52, "Q4"],
    ["vegetation_pine_large", 1770, 1045, 42, "Q4"],
    ["vegetation_pine_large", 1360, 1060, 42, "Q4"],
    ["vegetation_pine_large", 670, 450, 47, "Centre"],
    ["vegetation_pine_large", 1160, 730, 40, "Centre"],
    ["prop-bare-tree", 855, 480, 57, "Centre"],
    ["vegetation_pine_large", 1120, 1120, 50, "Centre"],
    ["vegetation_pine_large", 1190, 1105, 40, "Centre"],
    ["prop-bare-tree", 710, 1070, 56, "Centre"],
    ["vegetation_pine_large", 710, 435, 48, "Centre"],
    ["vegetation_pine_large", 1200, 430, 48, "Centre"],
    ["vegetation_pine_large", 720, 770, 35, "Centre"],
    ["vegetation_pine_large", 1135, 1020, 38, "Centre"],
  ];
  const fit = (
    key: string,
    x: number,
    y: number,
    width: number,
    quarter: string,
    range = 36,
  ) => {
    for (const [dx, dy] of [
      [0, 0],
      [-12, 0],
      [12, 0],
      [0, -12],
      [0, 12],
      [-24, -12],
      [24, 12],
      [-range, 0],
      [range, 0],
      [0, -range],
      [0, range],
    ])
      if (place(key, x + dx, y + dy, width, quarter, true)) return true;
    return false;
  };
  for (const [key, x, y, width, quarter] of pockets) {
    if (fit(key, x, y, width, quarter)) {
      fit("vegetation_bush_berries", x - width * 0.5, y + 12, 22, quarter, 18);
      fit("vegetation_bush_snow", x + width * 0.5, y + 8, 25, quarter, 18);
      if (key.startsWith("vegetation_pine"))
        fit(
          "vegetation_pine_large",
          x + width * 0.7,
          y + 14,
          width * 0.63,
          quarter,
          18,
        );
    }
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
      [77, -5],
      [-70, 10],
      [40, 45],
      [-42, -55],
      [100, 0],
      [-95, 35],
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
    const beds =
      index === 2
        ? [
            [0.22, 0.32],
            [0.35, 0.5],
            [0.68, 0.65],
            [0.75, 0.32],
            [0.43, 0.82],
          ]
        : index === 3
          ? [
              [0.3, 0.35],
              [0.65, 0.75],
              [0.35, 0.7],
            ]
          : [
              [0.28, 0.28],
              [0.58, 0.4],
              [0.72, 0.75],
              [0.32, 0.68],
            ];
    const gardenProps =
      index === 3
        ? ["wood-small", "prop-tools", "wood-kindling"]
        : index === 2
          ? [
              "fir_young",
              "prop-watering",
              "vegetation_bush_berries",
              "prop-planter",
              "vegetation_bush_snow",
            ]
          : index === 4
            ? [
                "vegetation_bush_snow",
                "prop-lantern",
                "gift-pair",
                "vegetation_bush_berries",
              ]
            : [
                "vegetation_bush_snow",
                "prop-planter",
                "vegetation_bush_berries",
                "fir_young",
              ];
    beds.forEach(([u, v], i) => {
      const x = minX + (maxX - minX) * u,
        y = minY + (maxY - minY) * v;
      const key = gardenProps[i % gardenProps.length];
      if (inPolygon({ x, y }, points))
        place(
          key,
          x,
          y,
          key === "prop-lantern" ? 16 : key === "fir_young" ? 29 : 25,
          g.id,
          true,
        );
    });
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
  // Each small still life belongs to its place: reading, home life, woodwork or hospitality.
  for (const [key, x, y, w, q] of [
    ["bench-rustic", 467, 385, 86, "Q1"],
    ["bench-village", 1450, 395, 86, "Q2"],
    ["bench-garden", 410, 940, 90, "Q3"],
    ["bench-copper", 1720, 1000, 90, "Q4"],
    ["bench-copper", 1150, 745, 94, "Centre"],
    ["bench-village", 860, 970, 92, "Centre"],
    ["prop-mailbox", 330, 430, 20, "Q1"],
    ["prop-basket", 525, 645, 25, "Q1"],
    ["prop-lantern", 620, 620, 18, "Q1"],
    ["prop-table", 1180, 665, 54, "Centre"],
    ["prop-table", 1150, 620, 50, "Centre"],
    ["prop-sled", 1540, 390, 40, "Q2"],
    ["prop-mailbox", 1685, 640, 20, "Q2"],
    ["prop-planter", 1450, 505, 34, "Q2"],
    ["prop-watering", 425, 1090, 28, "Q3"],
    ["wood-rack", 365, 930, 50, "Q3"],
    ["prop-sled", 660, 1090, 38, "Q3"],
    ["prop-tools", 1365, 940, 26, "Q4"],
    ["wood-medium", 1370, 975, 42, "Q4"],
    ["prop-crates", 1395, 995, 30, "Q4"],
    ["gift-display", 1290, 985, 42, "Q4"],
    ["gift-stack", 1390, 900, 28, "Q4"],
    ["prop-rocks", 1190, 1145, 40, "Centre"],
    ["prop-stump", 695, 1140, 30, "Centre"],
    ["prop-lantern", 875, 955, 18, "Centre"],
    ["gift-basket", 920, 960, 34, "Centre"],
  ] as [string, number, number, number, string][])
    fit(key, x, y, w, q, 32);
  // Small still lives checked against the final occupied layout, beside (never on) the routes.
  for (const [key, x, y, w, q] of [
    ["prop-table", 1140, 635, 34, "Centre"],
    ["prop-basket", 292, 614, 24, "J1"],
    ["prop-sled", 275, 647, 34, "J1"],
    ["wood-medium", 1386, 984, 34, "Q4"],
    ["gift-display", 1320, 968, 32, "Q4"],
    ["gift-tall", 1385, 955, 18, "Q4"],
  ] as [string, number, number, number, string][])
    place(key, x, y, w, q, true);
  for (const [key, x, y, w] of [
    ["fir_young", 1280, 710, 34],
    ["fir_windswept", 1315, 718, 28],
    ["prop-planter", 1322, 745, 26],
    ["prop-lantern", 1352, 750, 16],
  ] as [string, number, number, number][])
    place(key, x, y, w, "Centre", true);
  composeWitness351(scene, placed, solids, seats);
  composeQuarters351b(scene, placed, solids, seats);
  drawFences35(scene);
  scene.game.canvas.dataset.seats35 = JSON.stringify(seats);
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
