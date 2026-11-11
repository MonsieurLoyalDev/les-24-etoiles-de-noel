import type Phaser from "phaser";
import type { Rect } from "../domain";
import { environmentKey } from "./assets35";
import { vegetationKey } from "./vegetation";
import { cleanKey } from "./prepare";
import {
  plan,
  inPolygon,
  safeScenery,
  overlaps,
  fenceRects,
  routeSegments,
  distanceToSegment,
} from "./village34";
import { witnessRegion351 } from "./composition351";
export type QuarterB = "Q1" | "Q2" | "Q4";
/** Existing neighbourhood hulls, their domestic aprons and their existing enclosed gardens. */
export function quarterRegion351b(x: number, y: number): QuarterB | null {
  if (witnessRegion351(x, y)) return null;
  for (const id of ["Q1", "Q2", "Q4"] as const) {
    const q = plan.quarters.find((q) => q.id === id)!;
    if (
      inPolygon({ x, y }, q.hull) ||
      plan.houses.some(
        (h) =>
          h.quarter === id &&
          x >= h.x - h.w / 2 - 60 &&
          x <= h.x + h.w / 2 + 60 &&
          y >= h.y - h.h - 20 &&
          y <= h.y + 65,
      )
    )
      return id;
    const garden = plan.gardens.find(
      (g) => g.id === { Q1: "J1", Q2: "J2", Q4: "J4" }[id],
    )!;
    if (inPolygon({ x, y }, garden.points)) return id;
  }
  if (x >= 1260 && x <= 1400 && y >= 940 && y <= 1030) return "Q4";
  return null;
}
type Item = {
  key: string;
  x: number;
  y: number;
  width: number;
  quarter: QuarterB;
  group: string;
};
const cluster = (
  quarter: QuarterB,
  group: string,
  items: [string, number, number, number][],
): Item[] =>
  items.map(([key, x, y, width]) => ({ key, x, y, width, quarter, group }));
export const quarterItems351b: Item[] = [
  ...cluster("Q1", "livres-lecture", [
    ["bench-rustic", 420, 400, 80],
    ["fir_young", 470, 393, 31],
    ["bush_berries_low", 471, 410, 27],
    ["bush_snowy", 449, 413, 24],
    ["prop-lantern", 373, 405, 14],
    ["prop-table", 362, 427, 22],
  ]),
  ...cluster("Q1", "livres-jardin", [
    ["prop-bare-tree", 266, 579, 39],
    ["bush_snowy", 252, 599, 30],
    ["bush_berries_low", 278, 608, 26],
    ["prop-planter", 274, 646, 25],
    ["prop-lantern", 310, 628, 14],
    ["prop-basket", 250, 626, 17],
  ]),
  ...cluster("Q1", "livres-maison-conteur", [
    ["prop-planter", 475, 332, 23],
    ["prop-lantern", 493, 345, 13],
    ["gift-pair", 464, 344, 17],
  ]),
  ...cluster("Q1", "livres-bouleau", [
    ["prop-bare-tree", 640, 570, 47],
    ["bush_berries_low", 625, 590, 25],
    ["bush_snowy", 646, 584, 23],
  ]),
  ...cluster("Q1", "livres-courrier", [
    ["prop-mailbox", 193, 427, 17],
    ["prop-lantern", 211, 445, 13],
    ["bush_snowy", 198, 449, 26],
  ]),
  ...cluster("Q2", "veillees-voisinage", [
    ["bench-village", 1465, 380, 80],
    ["prop-table", 1490, 366, 22],
    ["prop-lantern", 1450, 354, 14],
    ["bush_berries_low", 1494, 349, 23],
    ["prop-basket", 1450, 402, 18],
    ["bush_snowy", 1435, 365, 25],
  ]),
  ...cluster("Q2", "veillees-entre-foyers", [
    ["fir_young", 1525, 442, 32],
    ["bush_berries_low", 1550, 438, 24],
    ["prop-lantern", 1568, 439, 14],
  ]),
  ...cluster("Q2", "veillees-bois-maison", [
    ["wood-rack", 1700, 620, 28],
    ["prop-lantern", 1685, 646, 14],
    ["prop-basket", 1702, 638, 17],
    ["gift-cream", 1698, 630, 15],
    ["bush_berries_low", 1720, 623, 24],
  ]),
  ...cluster("Q2", "veillees-seuil-pierre", [
    ["wood-small", 1378, 556, 26],
    ["prop-lantern", 1375, 569, 14],
    ["prop-mailbox", 1335, 569, 17],
  ]),
  ...cluster("Q2", "veillees-petites-attentions", [
    ["bush_berries_low", 1265, 335, 22],
  ]),
  ...cluster("Q2", "veillees-jardin-famille", [
    ["fir_broad", 1770, 500, 41],
    ["fir_young", 1745, 520, 28],
    ["bush_berries_low", 1774, 524, 30],
    ["prop-lantern", 1704, 487, 14],
    ["prop-table", 1774, 563, 24],
    ["prop-planter", 1702, 463, 22],
    ["bench-garden", 1668, 443, 80],
  ]),
  ...cluster("Q4", "artisans-etabli", [
    ["d31-workshop-bench", 1515, 950, 48],
    ["prop-crates", 1555, 963, 24],
    ["prop-tools", 1495, 970, 18],
    ["prop-lantern", 1574, 967, 14],
    ["wood-kindling", 1480, 970, 21],
  ]),
  ...cluster("Q4", "artisans-cadeaux", [["gift-display", 1320, 968, 32]]),
  ...cluster("Q4", "artisans-reserve", [
    ["wood-rack", 1334, 1175, 34],
    ["wood-irregular", 1336, 1209, 27],
    ["wood-kindling", 1365, 1201, 23],
    ["prop-tools", 1388, 1209, 18],
    ["prop-lantern", 1378, 1228, 14],
  ]),
  ...cluster("Q4", "artisans-expedition", [
    ["gift-stack", 1865, 1221, 25],
    ["prop-crates", 1862, 1252, 24],
    ["prop-basket", 1839, 1247, 19],
    ["prop-lantern", 1845, 1234, 14],
  ]),
  ...cluster("Q4", "artisans-maison-rustique", [
    ["wood-small", 1420, 860, 30],
    ["prop-planter", 1429, 886, 24],
    ["prop-lantern", 1415, 888, 14],
  ]),
  ...cluster("Q4", "artisans-nature", [
    ["fir_windswept", 1584, 904, 35],
    ["bush_snowy", 1588, 889, 26],
  ]),
  ...cluster("Q4", "artisans-jardinet", [
    ["fir_young", 1832, 1017, 27],
    ["bush_berries_low", 1855, 1031, 27],
    ["prop-planter", 1861, 999, 23],
    ["prop-watering", 1827, 980, 20],
    ["wood-kindling", 1860, 1015, 19],
    ["prop-tools", 1831, 1030, 17],
    ["prop-lantern", 1845, 1042, 13],
  ]),
  ...cluster("Q4", "artisans-pause", [
    ["bench-copper", 1660, 1025, 80],
    ["prop-lantern", 1715, 1038, 14],
    ["prop-basket", 1685, 1051, 21],
    ["fir_young", 1710, 1013, 25],
  ]),
];
export const quarterGround351b = [
  { key: "snowbank-small", x: 467, y: 414, w: 43 },
  { key: "snowbank-small", x: 271, y: 607, w: 47 },
  { key: "packed-a", x: 1701, y: 632, w: 46 },
  { key: "packed-b", x: 1668, y: 449, w: 87 },
  { key: "snowbank-small", x: 1757, y: 526, w: 49 },
  { key: "packed-a", x: 1519, y: 965, w: 82 },
  { key: "packed-b", x: 1340, y: 1211, w: 57 },
];
type Placed = {
  key: string;
  texture: string;
  quarter: string;
  box: Rect;
  x: number;
  y: number;
  width: number;
  height: number;
  group?: string;
};
type Seat = { x: number; y: number; texture: string; positions: number[][] };
const isPlant = (key: string) =>
  /^(fir_|bush_|vegetation_)/.test(key) || key === "prop-bare-tree";
export function composeQuarters351b(
  scene: Phaser.Scene,
  placed: Placed[],
  solids: Rect[],
  seats: Seat[],
) {
  const removed: Placed[] = [],
    accepted: Placed[] = [],
    rejected: { item: Item; reason: string }[] = [];
  const localIds = new Set([
    "Q1",
    "Q2",
    "Q4",
    "J1",
    "J2",
    "J4",
    "BC1",
    "BC2",
    "BC4",
    "LC1",
    "LC2",
    "LC4",
  ]);
  for (let i = placed.length - 1; i >= 0; i--) {
    const p = placed[i];
    if (!quarterRegion351b(p.x, p.y) || !localIds.has(p.quarter)) continue;
    const image = scene.children.list.find((c) => {
      const im = c as Phaser.GameObjects.Image;
      return (
        im.name.startsWith("scenery:") &&
        im.x === p.x &&
        im.y === p.y &&
        im.texture?.key === p.texture
      );
    });
    if (!image) throw Error("Missing baseline scenery " + p.key);
    image.destroy();
    const ratio = p.key.startsWith("bench-")
      ? 0.86
      : p.key.startsWith("wood-")
        ? 0.8
        : p.key.startsWith("fir_") || p.key === "prop-bare-tree"
          ? 0.24
          : p.key.startsWith("prop-")
            ? 0.72
            : 0.54;
    const index = solids.findIndex(
      (r) =>
        Math.abs(r.x - (p.x - (p.width * ratio) / 2)) < 0.001 &&
        r.y === p.y - 6 &&
        Math.abs(r.w - p.width * ratio) < 0.001 &&
        r.h === 7,
    );
    if (index < 0) throw Error("Missing baseline collider " + p.key);
    solids.splice(index, 1);
    placed.splice(i, 1);
    removed.push(p);
    for (let s = seats.length - 1; s >= 0; s--)
      if (seats[s].x === p.x && seats[s].y === p.y) seats.splice(s, 1);
  }
  const ground = quarterGround351b.map((b, index) => {
    const key = "ground-d3-" + b.key,
      src = scene.textures.get(key).getSourceImage();
    const im = scene.add
      .image(b.x, b.y, key)
      .setOrigin(0.5, 1)
      .setScale(b.w / src.width)
      .setDepth(-94)
      .setName("quarters351b:ground:" + index);
    return { ...b, h: im.displayHeight, ratio: src.width / src.height };
  });
  for (const item of quarterItems351b) {
    const { key, x, y, width, quarter, group } = item;
    const texture = scene.textures.exists(environmentKey(key))
      ? environmentKey(key)
      : (vegetationKey(key) ??
        (scene.textures.exists(key) ? key : cleanKey(key)));
    if (!scene.textures.exists(texture))
      throw Error("Missing approved sprite " + texture);
    const src = scene.textures.get(texture).getSourceImage(),
      height = (width * src.height) / src.width,
      box = { x: x - width / 2, y: y - height, w: width, h: height };
    const ratio = key.startsWith("bench-")
      ? 0.86
      : isPlant(key)
        ? 0.24
        : key.startsWith("wood-") || key === "d31-workshop-bench"
          ? 0.8
          : 0.72;
    const base = {
      x: x - (width * ratio) / 2,
      y: y - 6,
      w: width * ratio,
      h: 7,
    };
    let reason =
      quarterRegion351b(x, y) !== quarter
        ? "outside-quarter"
        : !safeScenery(box, false)
          ? "facade-or-reserve"
          : "";
    if (
      !reason &&
      [
        [box.x, box.y],
        [box.x + box.w, box.y],
        [box.x, box.y + box.h],
        [box.x + box.w, box.y + box.h],
      ].some(([x, y]) => witnessRegion351(x, y))
    )
      reason = "protected-A2";
    if (!reason && [...solids, ...fenceRects].some((r) => overlaps(base, r)))
      reason = "occupied-base";
    if (!reason)
      for (let px = base.x - 6; px <= base.x + base.w + 6; px += 3)
        if (
          routeSegments.some(
            (s) =>
              distanceToSegment({ x: px, y: y - 2 }, s.a, s.b) <
              s.width / 2 + 4,
          )
        ) {
          reason = "walkway";
          break;
        }
    if (
      !reason &&
      placed.some((p) => p.group !== group && overlaps(box, p.box))
    )
      reason = "other-composition";
    if (reason) {
      rejected.push({ item, reason });
      continue;
    }
    scene.add
      .image(x, y, texture)
      .setOrigin(0.5, 1)
      .setScale(width / src.width)
      .setDepth(y)
      .setName(`scenery:quarters351b:${group}:${key}`);
    const p = { key, texture, x, y, width, height, quarter, group, box };
    accepted.push(p);
    placed.push(p);
    solids.push(base);
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
  }
  scene.game.canvas.dataset.quarters351b = JSON.stringify({
    removed,
    accepted,
    rejected,
    ground,
    groups: [...new Set(accepted.map((p) => p.group))],
    protected: "A.2 Foyer and central square unchanged",
  });
}
/** Independent, hand-shaped wind and passage traces for each neighbourhood. */
export const quarterDrifts351b = [
  {
    quarter: "Q1",
    id: "livres-lecture",
    points: [
      [333, 366],
      [355, 372],
      [362, 387],
      [379, 392],
      [391, 408],
      [386, 420],
      [366, 412],
      [351, 422],
      [329, 410],
    ],
  },
  {
    quarter: "Q1",
    id: "livres-cour-est",
    points: [
      [497, 360],
      [488, 381],
      [480, 397],
      [486, 414],
      [477, 436],
      [471, 448],
      [491, 454],
      [512, 425],
      [517, 385],
    ],
  },
  {
    quarter: "Q1",
    id: "livres-seuil",
    points: [
      [467, 449],
      [486, 453],
      [499, 461],
      [522, 456],
      [538, 461],
      [553, 458],
      [557, 467],
      [530, 471],
      [507, 466],
      [487, 470],
      [470, 461],
    ],
  },
  {
    quarter: "Q1",
    id: "livres-portillon",
    points: [
      [300, 669],
      [311, 674],
      [324, 672],
      [338, 666],
      [345, 673],
      [330, 683],
      [315, 685],
      [303, 681],
    ],
  },
  {
    quarter: "Q2",
    id: "veillees-placette",
    points: [
      [1370, 370],
      [1391, 377],
      [1398, 393],
      [1388, 408],
      [1396, 425],
      [1391, 447],
      [1376, 451],
      [1367, 416],
    ],
  },
  {
    quarter: "Q2",
    id: "veillees-passage",
    points: [
      [1399, 511],
      [1407, 516],
      [1411, 527],
      [1405, 536],
      [1407, 549],
      [1401, 557],
      [1395, 547],
      [1400, 531],
    ],
  },
  {
    quarter: "Q2",
    id: "veillees-seuils",
    points: [
      [1511, 391],
      [1520, 395],
      [1532, 393],
      [1540, 397],
      [1550, 394],
      [1555, 397],
      [1543, 401],
      [1536, 400],
      [1525, 402],
      [1514, 399],
    ],
  },
  {
    quarter: "Q2",
    id: "veillees-jardin",
    points: [
      [1731, 413],
      [1747, 416],
      [1763, 413],
      [1777, 420],
      [1770, 429],
      [1754, 424],
      [1742, 429],
      [1726, 422],
    ],
  },
  {
    quarter: "Q4",
    id: "artisans-cour",
    points: [
      [1521, 931],
      [1541, 939],
      [1550, 956],
      [1543, 972],
      [1553, 988],
      [1547, 1004],
      [1532, 998],
      [1512, 981],
    ],
  },
  {
    quarter: "Q4",
    id: "artisans-ruelle",
    points: [
      [1378, 991],
      [1399, 996],
      [1413, 993],
      [1430, 1000],
      [1451, 997],
      [1465, 1003],
      [1446, 1010],
      [1423, 1007],
      [1402, 1013],
      [1381, 1006],
    ],
  },
  {
    quarter: "Q4",
    id: "artisans-expedition",
    points: [
      [1641, 1187],
      [1649, 1201],
      [1641, 1215],
      [1652, 1230],
      [1647, 1241],
      [1630, 1234],
      [1634, 1216],
      [1628, 1201],
    ],
  },
  {
    quarter: "Q4",
    id: "artisans-portillon",
    points: [
      [1833, 937],
      [1845, 941],
      [1856, 937],
      [1866, 946],
      [1860, 954],
      [1848, 949],
      [1842, 953],
      [1829, 946],
    ],
  },
].map((d) => ({
  ...d,
  minX: Math.min(...d.points.map((p) => p[0])) - 12,
  maxX: Math.max(...d.points.map((p) => p[0])) + 12,
  minY: Math.min(...d.points.map((p) => p[1])) - 12,
  maxY: Math.max(...d.points.map((p) => p[1])) + 12,
}));
export function pathWeathering351b(x: number, y: number, distance: number) {
  if (distance > 3 || !quarterRegion351b(x, y)) return 0;
  let amount = 0;
  for (const d of quarterDrifts351b) {
    if (x < d.minX || x > d.maxX || y < d.minY || y > d.maxY) continue;
    let edge = Infinity;
    for (let i = 0; i < d.points.length; i++) {
      const a = d.points[i],
        b = d.points[(i + 1) % d.points.length];
      edge = Math.min(
        edge,
        distanceToSegment({ x, y }, { x: a[0], y: a[1] }, { x: b[0], y: b[1] }),
      );
    }
    const signed = inPolygon({ x, y }, d.points) ? -edge : edge;
    const ridge =
      Math.sin(x * 0.067 + y * 0.031) * 2.6 +
      Math.sin(y * 0.123 - x * 0.027) * 1.8 +
      Math.sin((x + y) * 0.31) * 0.45;
    amount = Math.max(
      amount,
      Math.min(0.9, Math.max(0, (2.5 - signed - ridge) / 4) * 0.9),
    );
  }
  return amount;
}
export const driftShadow351b = (
  previous: number,
  amount: number,
  x: number,
  y: number,
) =>
  quarterRegion351b(x, y)
    ? Math.min(0.24, Math.max(0, previous - amount) * 0.6)
    : 0;
