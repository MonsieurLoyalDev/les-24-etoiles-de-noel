import type Phaser from "phaser";
import type { Rect } from "../domain";
import { environmentKey } from "./assets35";
import { vegetationKey } from "./vegetation";
import { cleanKey } from "./prepare";
import {
  anchors,
  safeScenery,
  facadeBounds,
  fenceRects,
  overlaps,
  routeSegments,
  distanceToSegment,
} from "./village34";

/** Étape A only. Deliberately excludes the other three residential quarters. */
export function witnessRegion351(x: number, y: number) {
  return (
    (x >= 170 && x <= 860 && y >= 690 && y <= 1280) ||
    (x >= 715 && x <= 1160 && y >= 635 && y <= 945) ||
    (x >= 1080 && x <= 1160 && y >= 945 && y <= 1050)
  );
}
type Item = { key: string; x: number; y: number; width: number; group: string };
const cluster = (
  group: string,
  items: [string, number, number, number][],
): Item[] => items.map(([key, x, y, width]) => ({ key, x, y, width, group }));
/** Hand-composed still lives. No scattering, random fitting, or automatic multiplication. */
export const witnessItems351: Item[] = [
  ...cluster("loyal-jardin", [
    ["fir_broad", 644, 746, 42],
    ["bush_berries_low", 625, 769, 30],
    ["bush_snowy", 644, 765, 27],
    ["prop-lantern", 619, 744, 15],
  ]),
  ...cluster("loyal-entree", [
    ["wood-rack", 817, 1000, 36],
    ["prop-lantern", 843, 1022, 15],
    ["prop-mailbox", 607, 842, 18],
  ]),
  ...cluster("loyal-bosquet", [
    ["fir_slim", 758, 1042, 57],
    ["fir_windswept", 793, 1057, 40],
    ["bush_snowy", 746, 1052, 38],
    ["bush_berries_low", 783, 1070, 33],
    ["prop-rocks", 812, 1066, 29],
  ]),
  ...cluster("foyer-lecture", [
    ["bench-garden", 365, 969, 80],
    ["prop-lantern", 436, 972, 16],
    ["fir_young", 389, 881, 39],
    ["fir_windswept", 417, 905, 32],
    ["bush_snowy", 383, 893, 29],
    ["bush_berries_low", 400, 913, 27],
  ]),
  ...cluster("foyer-maison-haute", [
    ["wood-small", 211, 909, 31],
    ["prop-lantern", 195, 927, 16],
    ["fir_young", 197, 868, 39],
    ["bush_snowy", 211, 881, 30],
  ]),
  ...cluster("foyer-porche", [
    ["wood-irregular", 704, 1037, 36],
    ["prop-tools", 705, 1068, 22],
    ["prop-lantern", 688, 1083, 16],
    ["prop-planter", 503, 1123, 29],
  ]),
  ...cluster("loyal-entree", [
    ["fir_broad", 605, 794, 28],
    ["bush_snowy", 607, 810, 24],
  ]),
  ...cluster("foyer-jardin-commun", [
    ["fir_windswept", 401, 1206, 45],
    ["fir_young", 431, 1220, 31],
    ["bush_berries_low", 414, 1230, 36],
    ["bush_snowy", 386, 1221, 30],
    ["prop-watering", 543, 1190, 23],
    ["prop-planter", 567, 1199, 32],
    ["wood-kindling", 583, 1221, 28],
    ["prop-lantern", 478, 1251, 16],
  ]),
  ...cluster("foyer-jardin-calme", [
    ["fir_slim", 398, 1070, 32],
    ["fir_young", 394, 1101, 31],
    ["bush_snowy", 372, 1102, 32],
    ["bush_berries_low", 401, 1117, 29],
  ]),
  ...cluster("place-cadeaux", [
    ["gift-display", 849, 681, 36],
    ["gift-trio", 878, 706, 29],
    ["gift-basket", 881, 730, 25],
    ["prop-lantern", 875, 678, 16],
  ]),
  ...cluster("place-conviviale", [
    ["bench-copper", 934, 852, 80],
    ["bench-village", 1018, 865, 80],
    ["prop-table", 982, 838, 26],
    ["prop-lantern", 1001, 883, 16],
  ]),
  ...cluster("place-marche-ouest", [
    ["prop-crates", 686, 714, 28],
    ["gift-stack", 725, 677, 24],
    ["prop-lantern", 740, 655, 16],
  ]),
  ...cluster("place-marche-est", [["prop-crates", 1135, 748, 22]]),
  ...cluster("place-jardin-est", [
    ["fir_broad", 1120, 690, 38],
    ["fir_young", 1092, 687, 27],
    ["bush_berries_low", 1104, 701, 30],
    ["bush_snowy", 1133, 725, 27],
    ["prop-planter", 1126, 708, 31],
  ]),
  ...cluster("place-rive-sud", [
    ["fir_windswept", 1113, 1016, 46],
    ["fir_young", 1140, 1050, 29],
    ["bush_snowy", 1098, 1033, 35],
    ["bush_berries_low", 1132, 1045, 31],
  ]),
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
};
type Seat = { x: number; y: number; texture: string; positions: number[][] };
export const witnessSnowbanks351 = [
  { x: 780, y: 1074, w: 106 },
  { x: 399, y: 919, w: 67 },
  { x: 410, y: 1234, w: 82 },
  { x: 1121, y: 720, w: 68 },
  { x: 633, y: 773, w: 46 },
];
const isPlant = (key: string) => /^(fir_|bush_|vegetation_)/.test(key);
export function composeWitness351(
  scene: Phaser.Scene,
  placed: Placed[],
  solids: Rect[],
  seats: Seat[],
) {
  const resources: Record<string, { width: number; height: number }> = {};
  const removed: Placed[] = [],
    accepted: (Placed & { group: string })[] = [],
    rejected: { item: Item; reason: string }[] = [];
  // First build D35 unchanged, then remove only the two selected sectors. No changes to neighbours.
  for (let i = placed.length - 1; i >= 0; i--) {
    const p = placed[i];
    if (!witnessRegion351(p.x, p.y)) continue;
    scene.children.getByName(`scenery:${p.quarter}:${p.key}:${i}`)?.destroy();
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
      (b) =>
        Math.abs(b.x - (p.x - (p.width * ratio) / 2)) < 0.001 &&
        b.y === p.y - 6 &&
        Math.abs(b.w - p.width * ratio) < 0.001 &&
        b.h === 7,
    );
    if (index < 0) throw Error("Missing D35 scenery collider: " + p.key);
    solids.splice(index, 1);
    removed.push(p);
    placed.splice(i, 1);
    for (let s = seats.length - 1; s >= 0; s--)
      if (seats[s].x === p.x && seats[s].y === p.y) seats.splice(s, 1);
  }
  const accumulations = witnessSnowbanks351.map((b, index) => {
    const source = scene.textures
      .get("ground-d3-snowbank-small")
      .getSourceImage();
    const image = scene.add
      .image(b.x, b.y, "ground-d3-snowbank-small")
      .setOrigin(0.5, 1)
      .setScale(b.w / source.width)
      .setDepth(-94)
      .setName(`witness351:accumulation:${index}`);
    return {
      ...b,
      h: image.displayHeight,
      sourceRatio: source.width / source.height,
    };
  });
  for (const item of witnessItems351) {
    const { key, x, y, width, group } = item;
    const texture = scene.textures.exists(environmentKey(key))
      ? environmentKey(key)
      : (vegetationKey(key) ?? cleanKey(key));
    const src = scene.textures.get(texture).getSourceImage(),
      height = (width * src.height) / src.width;
    resources[key] = { width: src.width, height: src.height };
    const box = { x: x - width / 2, y: y - height, w: width, h: height };
    const ratio = key.startsWith("bench-")
      ? 0.86
      : isPlant(key)
        ? 0.24
        : key.startsWith("wood-")
          ? 0.8
          : 0.72;
    const base = {
      x: x - (width * ratio) / 2,
      y: y - 6,
      w: width * ratio,
      h: 7,
    };
    // Preserve all facade bounds. Reserves apply to the actual base, never an empty canopy rectangle.
    let reason = !witnessRegion351(x, y)
      ? "outside-witness"
      : !safeScenery(base, false) ||
          facadeBounds.some((r) =>
            overlaps(box, { x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 }),
          )
        ? "facade-or-reserve"
        : "";
    if (!reason && [...solids, ...fenceRects].some((r) => overlaps(base, r)))
      reason = "occupied-base";
    if (!reason)
      for (let px = base.x - 6; px <= base.x + base.w + 6; px += 3) {
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
      }
    if (
      !reason &&
      accepted.some((p) => p.group !== group && overlaps(box, p.box))
    )
      reason = "other-composition";
    if (
      !reason &&
      placed.some(
        (p) =>
          !accepted.includes(p as (typeof accepted)[number]) &&
          overlaps(box, p.box),
      )
    )
      reason = "existing-decoration";
    if (reason) {
      rejected.push({ item, reason });
      continue;
    }
    const sprite = scene.add
      .image(x, y, texture)
      .setOrigin(0.5, 1)
      .setScale(width / src.width)
      .setDepth(y)
      .setName(`scenery:witness351:${group}:${key}`);
    if (key.startsWith("fir_")) sprite.setData("windBase", 0);
    const p = {
      key,
      texture,
      quarter: group.startsWith("place-") ? "Centre" : "Q3",
      box,
      x,
      y,
      width,
      height,
      group,
    };
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
  scene.game.canvas.dataset.witness351 = JSON.stringify({
    phase: "A",
    removed,
    accepted,
    rejected,
    groups: [...new Set(accepted.map((p) => p.group))],
    unchanged: [
      "buildings",
      "fences",
      "gates",
      "interiors",
      "calendar",
      "saves",
      "HUD",
    ],
    tree: anchors.tree,
    resources,
    accumulations,
  });
}

/** Snow overlays on existing routes only; the underlying D31 snow and D34 network never change. */
export function pathWeathering351(x: number, y: number, distance: number) {
  if (!witnessRegion351(x, y) || distance > 3) return 0;
  const lobes = [
    [713, 939, 27, 9],
    [766, 945, 22, 11],
    [595, 921, 25, 9],
    [445, 895, 20, 13],
    [466, 966, 18, 12],
    [352, 1014, 13, 20],
    [467, 1092, 18, 9],
    [440, 1125, 13, 10],
    [805, 719, 12, 15],
    [870, 662, 26, 13],
    [883, 907, 23, 15],
    [1122, 684, 15, 23],
    [1091, 851, 14, 21],
    [837, 801, 13, 24],
  ];
  let snow = 0;
  for (const [cx, cy, rx, ry] of lobes) {
    const d =
      Math.hypot((x - cx) / rx, (y - cy) / ry) +
      Math.sin(x * 0.19 + y * 0.11) * 0.09 +
      Math.sin(y * 0.33 - x * 0.07) * 0.06;
    snow = Math.max(snow, Math.min(0.9, Math.max(0, (1.25 - d) * 1.7)));
  }
  return snow;
}
