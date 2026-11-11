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
  plan,
  inPolygon,
} from "./village34";

/** Étape A only. Deliberately excludes the other three residential quarters. */
export function witnessRegion351(x: number, y: number) {
  return (
    (x >= 170 && x <= 860 && y >= 690 && y <= 1280) ||
    (x >= 715 && x <= 1160 && y >= 635 && y <= 945) ||
    (x >= 1080 && x <= 1160 && y >= 945 && y <= 1050)
  );
}
type Item = {
  key: string;
  x: number;
  y: number;
  width: number;
  group: string;
  contact?: boolean;
};
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
  ...cluster("loyal-accueil", [
    ["wood-rack", 660, 909, 32],
    ["wood-kindling", 610, 907, 18],
    ["prop-lantern", 610, 889, 13],
  ]).map((p) => (p.key === "wood-rack" ? { ...p, contact: true } : p)),
  ...cluster("loyal-accueil", [
    ["prop-lantern", 687, 908, 13],
    ["bush_berries_low", 630, 907, 22],
  ]).map((p) => ({ ...p, contact: true })),
  ...cluster("loyal-bosquet", [
    ["fir_broad", 770, 1020, 50],
    ["fir_young", 743, 1000, 24],
    ["fir_windswept", 814, 1036, 34],
    ["bush_snowy", 749, 1039, 36],
    ["bush_berries_low", 791, 1051, 30],
    ["prop-rocks", 823, 1051, 23],
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
    ["prop-tools", 722, 1058, 16],
    ["prop-lantern", 715, 1067, 15],
    ["prop-planter", 680, 1094, 27],
  ]),
  ...cluster("foyer-jardin-commun", [
    ["fir_windswept", 401, 1206, 45],
    ["fir_young", 431, 1220, 31],
    ["bush_berries_low", 414, 1230, 36],
    ["bush_snowy", 386, 1221, 30],
    ["prop-watering", 545, 1212, 20],
    ["prop-planter", 567, 1199, 32],
    ["wood-kindling", 583, 1221, 28],
    ["prop-lantern", 478, 1251, 16],
  ]),
  ...cluster("foyer-jardin-calme", [
    ["fir_slim", 402, 1060, 32],
    ["fir_young", 373, 1097, 26],
    ["bush_snowy", 397, 1108, 32],
    ["bush_berries_low", 370, 1121, 26],
  ]),
  ...cluster("place-cadeaux", [
    ["gift-display", 849, 681, 36],
    ["gift-trio", 878, 706, 29],
    ["gift-basket", 881, 730, 25],
    ["prop-lantern", 875, 678, 16],
  ]),
  ...cluster("place-conviviale", [
    ["bench-copper", 934, 852, 80],
    ["bench-village", 1022, 794, 80],
    ["prop-table", 1000, 838, 24],
    ["prop-lantern", 1015, 858, 16],
    ["prop-basket", 996, 860, 19],
    ["prop-planter", 883, 854, 26],
    ["bush_snowy", 910, 897, 29],
    ["bush_berries_low", 887, 890, 22],
  ]),
  ...cluster("place-marche-ouest", [
    ["prop-crates", 760, 770, 18],
    ["prop-basket", 760, 735, 18],
    ["fir_young", 774, 745, 23],
    ["prop-lantern", 784, 775, 14],
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
  { x: 779, y: 1050, w: 89 },
  { x: 399, y: 919, w: 67 },
  { x: 410, y: 1234, w: 82 },
  { x: 1121, y: 720, w: 68 },
  { x: 633, y: 773, w: 46 },
];
const isPlant = (key: string) => /^(fir_|bush_|vegetation_)/.test(key);
const loyalBuilding351 = plan.buildings.find((b) => b.id === "loyal_house")!;
/** Low accessories touch only the bottom 16 px of Loyal's porch. No roof/window exception. */
export function loyalThreshold351(item: Item, box: Rect, base: Rect) {
  if (!item.contact) return false;
  const b = loyalBuilding351;
  if (
    !["prop-lantern", "bush_berries_low", "wood-rack"].includes(item.key) ||
    item.width > (item.key === "wood-rack" ? 34 : 26) ||
    box.h > 26 ||
    box.y < b.y - 16 ||
    item.y < b.y + 7 ||
    item.y > b.y + 10 ||
    Math.abs(item.x - b.x) < 32 ||
    Math.abs(item.x - b.x) > b.w * 0.5
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
  return !reserves.some(
    (p) =>
      p.x > base.x - 25 &&
      p.x < base.x + base.w + 25 &&
      p.y > base.y - 20 &&
      p.y < base.y + base.h + 20,
  );
}
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
    const thresholdContact = loyalThreshold351(item, box, base);
    let reason = !witnessRegion351(x, y)
      ? "outside-witness"
      : (!thresholdContact && !safeScenery(base, false)) ||
          facadeBounds.some(
            (r) =>
              !(
                thresholdContact &&
                r.x === loyalBuilding351.x - loyalBuilding351.w / 2 &&
                r.y === loyalBuilding351.y - loyalBuilding351.h
              ) &&
              overlaps(box, {
                x: r.x - 8,
                y: r.y - 8,
                w: r.w + 16,
                h: r.h + 16,
              }),
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
    phase: "A.2",
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

/** Wind-shaped drifts connected to existing edges, not repeated round snow stamps. */
export const snowDrifts352 = [
  {
    id: "place-ouest",
    points: [
      [834, 809],
      [860, 814],
      [878, 833],
      [900, 833],
      [917, 847],
      [949, 850],
      [958, 859],
      [944, 872],
      [914, 868],
      [897, 887],
      [912, 902],
      [886, 927],
      [854, 931],
    ],
  },
  {
    id: "place-sud",
    points: [
      [886, 936],
      [903, 923],
      [934, 918],
      [956, 911],
      [980, 898],
      [1000, 902],
      [1016, 932],
      [1000, 944],
      [930, 946],
    ],
  },
  {
    id: "place-nord-ouest",
    points: [
      [840, 644],
      [874, 639],
      [907, 641],
      [912, 666],
      [903, 690],
      [918, 717],
      [911, 737],
      [891, 734],
      [873, 714],
      [885, 694],
      [875, 667],
      [849, 658],
    ],
  },
  {
    id: "place-nord-est",
    points: [
      [1027, 626],
      [1061, 630],
      [1084, 640],
      [1107, 642],
      [1138, 662],
      [1134, 674],
      [1100, 665],
      [1085, 660],
      [1064, 649],
      [1041, 650],
    ],
  },
  {
    id: "place-est",
    points: [
      [1145, 680],
      [1110, 677],
      [1089, 695],
      [1093, 713],
      [1116, 727],
      [1135, 748],
      [1150, 750],
      [1161, 716],
    ],
  },
  {
    id: "alcove-banc",
    points: [
      [1120, 760],
      [1093, 770],
      [1085, 788],
      [1069, 797],
      [1052, 802],
      [1035, 806],
      [1019, 799],
      [1020, 790],
      [1045, 784],
      [1062, 770],
      [1082, 749],
      [1111, 738],
    ],
  },
  {
    id: "seuil-nord",
    points: [
      [710, 920],
      [733, 922],
      [751, 928],
      [771, 928],
      [790, 934],
      [812, 933],
      [838, 916],
      [845, 927],
      [825, 943],
      [789, 941],
      [762, 937],
      [740, 941],
      [718, 935],
    ],
  },
  {
    id: "seuil-sud",
    points: [
      [713, 952],
      [738, 949],
      [756, 946],
      [780, 952],
      [799, 951],
      [815, 958],
      [801, 964],
      [772, 960],
      [749, 958],
      [728, 963],
    ],
  },
  {
    id: "foyer-jonction",
    points: [
      [578, 904],
      [595, 909],
      [610, 914],
      [628, 913],
      [648, 920],
      [648, 931],
      [626, 928],
      [605, 930],
      [591, 924],
      [580, 922],
    ],
  },
  {
    id: "foyer-cour-est",
    points: [
      [502, 877],
      [509, 895],
      [500, 913],
      [505, 936],
      [491, 962],
      [475, 973],
      [464, 965],
      [478, 948],
      [482, 928],
      [492, 912],
      [487, 894],
    ],
  },
  {
    id: "foyer-cour-ouest",
    points: [
      [377, 859],
      [397, 867],
      [400, 886],
      [394, 901],
      [403, 919],
      [391, 931],
      [377, 920],
      [373, 897],
      [365, 884],
    ],
  },
  {
    id: "sentier-jardin",
    points: [
      [350, 1004],
      [364, 1009],
      [359, 1026],
      [357, 1040],
      [348, 1046],
      [342, 1035],
      [346, 1019],
    ],
  },
  {
    id: "portillon-foyer",
    points: [
      [427, 1104],
      [435, 1113],
      [436, 1127],
      [447, 1131],
      [449, 1141],
      [439, 1145],
      [428, 1132],
      [429, 1119],
    ],
  },
].map((d) => ({
  ...d,
  minX: Math.min(...d.points.map((p) => p[0])) - 12,
  maxX: Math.max(...d.points.map((p) => p[0])) + 12,
  minY: Math.min(...d.points.map((p) => p[1])) - 12,
  maxY: Math.max(...d.points.map((p) => p[1])) + 12,
}));
export function pathWeathering351(x: number, y: number, distance: number) {
  if (!witnessRegion351(x, y) || distance > 3) return 0;
  let amount = 0;
  for (const drift of snowDrifts352) {
    if (x < drift.minX || x > drift.maxX || y < drift.minY || y > drift.maxY)
      continue;
    let boundary = Infinity;
    for (let i = 0; i < drift.points.length; i++) {
      const a = drift.points[i],
        b = drift.points[(i + 1) % drift.points.length];
      boundary = Math.min(
        boundary,
        distanceToSegment({ x, y }, { x: a[0], y: a[1] }, { x: b[0], y: b[1] }),
      );
    }
    const signed = inPolygon({ x, y }, drift.points) ? -boundary : boundary;
    const ridge =
      Math.sin(x * 0.071 + y * 0.024) * 2.8 +
      Math.sin(y * 0.147 + Math.sin(x * 0.033)) * 1.6 +
      Math.sin((x + y) * 0.37) * 0.55;
    amount = Math.max(
      amount,
      Math.min(0.9, Math.max(0, (2.5 - signed - ridge) / 4) * 0.9),
    );
  }
  return amount;
}

/** Raised stones show through powder; dark joints remain filled. No random pixel noise. */
export function driftRelief351(amount: number, luminance: number) {
  return Math.max(
    0,
    Math.min(
      0.9,
      amount -
        Math.max(0, Math.min(0.5, (luminance - 140) / 90)) *
          Math.sin(amount * Math.PI) *
          0.27,
    ),
  );
}
/** A one-pixel cold contact on the lower lip, restricted to the same witness footprint. */
export function driftShadow351(
  previous: number,
  amount: number,
  x: number,
  y: number,
) {
  return witnessRegion351(x, y)
    ? Math.min(0.24, Math.max(0, previous - amount) * 0.6)
    : 0;
}
