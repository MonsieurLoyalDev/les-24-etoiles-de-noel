import type Phaser from "phaser";
import metadata from "./homes-d33.json" with { type: "json" };
import { residentialPlots, urbanLanes, villageSize } from "./urban-plan";
import type { Home } from "../decor/neighbourhood";
import { vegetationKey } from "./vegetation";
import { cleanKey } from "./prepare";
const fixtures: Record<
  string,
  { chimney: [number, number]; windows: [number, number][] }
> = {
  "home-porch": {
    chimney: [0.76, 0.025],
    windows: [[0.47, 0.42]],
  },
  "home-garden": {
    chimney: [0.195, 0.025],
    windows: [
      [0.28, 0.72],
      [0.76, 0.72],
    ],
  },
  "home-tall": {
    chimney: [0.79, 0.06],
    windows: [
      [0.54, 0.49],
      [0.75, 0.8],
    ],
  },
  "home-oriel": {
    chimney: [0.16, 0.035],
    windows: [[0.31, 0.71]],
  },
  "home-family": {
    chimney: [0.76, 0.08],
    windows: [
      [0.22, 0.73],
      [0.8, 0.73],
    ],
  },
  "home-chalet": {
    chimney: [0.28, 0.03],
    windows: [
      [0.3, 0.7],
      [0.78, 0.7],
    ],
  },
  "home-narrow": {
    chimney: [0.28, 0.05],
    windows: [
      [0.48, 0.5],
      [0.53, 0.25],
    ],
  },
  "home-shutters": {
    chimney: [0.9, 0.04],
    windows: [
      [0.28, 0.7],
      [0.74, 0.7],
    ],
  },
  "cottage-stone": {
    chimney: [0.87, 0.045],
    windows: [
      [0.25, 0.68],
      [0.77, 0.68],
    ],
  },
  "cottage-terrace": {
    chimney: [0.25, 0.02],
    windows: [
      [0.53, 0.66],
      [0.83, 0.66],
    ],
  },
  "cottage-humble": {
    chimney: [0.75, 0.06],
    windows: [[0.74, 0.64]],
  },
  "cottage-twin": {
    chimney: [0.76, 0.08],
    windows: [
      [0.3, 0.63],
      [0.78, 0.73],
    ],
  },
  "cottage-porchwide": {
    chimney: [0.85, 0.1],
    windows: [
      [0.23, 0.66],
      [0.85, 0.66],
    ],
  },
  "cottage-gable": {
    chimney: [0.27, 0.1],
    windows: [
      [0.64, 0.39],
      [0.25, 0.72],
    ],
  },
  "cottage-annex": {
    chimney: [0.2, 0.01],
    windows: [
      [0.25, 0.64],
      [0.45, 0.25],
    ],
  },
  "cottage-garden": {
    chimney: [0.28, 0.02],
    windows: [
      [0.34, 0.66],
      [0.74, 0.66],
    ],
  },
};
export const homes: Home[] = residentialPlots.map((p) => {
  const a = metadata.find((a) => a.key === p.key)!;
  const width = a.width / 2,
    height = a.height / 2;
  return {
    key: p.key,
    x: p.x,
    y: p.y,
    width,
    maxHeight: height,
    footprint: { x: p.x - width * 0.39, y: p.y - 44, w: width * 0.78, h: 36 },
    ...fixtures[p.key],
  };
});
export const frontPaths = residentialPlots.map((p, i) => {
  const h = homes[i],
    doorX = p.x + (p.door[0] - 0.5) * h.width;
  let endY = p.y < 400 ? 400 : p.y < 750 ? 750 : p.y < 1100 ? 1100 : 1360;
  const laneId =
    p.y < 400
      ? "porte-est"
      : p.y < 800
        ? "rue-residentielle"
        : p.y < 1150
          ? "rue-artisans"
          : "rue-jardins";
  const road = urbanLanes.find((l) => l.id === laneId)!;
  for (let n = 1; n < road.points.length; n++) {
    const a = road.points[n - 1],
      b = road.points[n];
    if (
      doorX + 10 >= Math.min(a.x, b.x) &&
      doorX + 10 <= Math.max(a.x, b.x) &&
      Math.abs(b.x - a.x) > Math.abs(b.y - a.y)
    )
      endY = a.y + ((b.y - a.y) * (doorX + 10 - a.x)) / (b.x - a.x);
  }
  if (p.key === "cottage-humble") endY = 1100;
  if (p.key === "home-porch") endY = 1100;
  if (p.key === "home-tall") endY = 1320;
  return {
    id: p.key,
    material: "dirt" as const,
    width: 15,
    points: [
      { x: doorX, y: p.y + 2 },
      { x: doorX, y: p.y + 18 },
      { x: doorX + 10, y: endY },
    ],
  };
});
export function preloadVillage33(scene: Phaser.Scene) {
  for (const h of homes)
    scene.load.image("urban-" + h.key, `/assets/village-d33/${h.key}.png`);
  for (const k of ["snow-powder", "snow-soft"])
    scene.load.image("urban-" + k, `/assets/interiors-d31/${k}.png`);
}
export function urbanGround(scene: Phaser.Scene) {
  const key = "village-extension-d33";
  if (!scene.textures.exists(key)) {
    const t = scene.textures.createCanvas(
        key,
        villageSize.width,
        villageSize.height,
      )!,
      c = t.context;
    c.imageSmoothingEnabled = false;
    c.fillStyle = c.createPattern(
      scene.textures.get("quiet-snow").getSourceImage() as HTMLCanvasElement,
      "repeat",
    )!;
    c.fillRect(0, 0, t.width, t.height);
    c.globalAlpha = 0.76;
    for (let y = 0; y < t.height; y += 64)
      for (let x = 0; x < t.width; x += 64)
        c.drawImage(
          scene.textures
            .get("snow-d21-" + (1 + ((x / 64 + y / 64) % 4)))
            .getSourceImage() as HTMLImageElement,
          x,
          y,
        );
    for (const [k, alpha] of [
      ["snow-powder", 0.38],
      ["snow-soft", 0.18],
    ] as const) {
      c.globalAlpha = alpha;
      const image = scene.textures
        .get("urban-" + k)
        .getSourceImage() as HTMLImageElement;
      for (let y = 0; y < t.height; y += 1024)
        for (let x = 0; x < t.width; x += 1024)
          c.drawImage(image, x, y, 1024, 1024);
    }
    c.globalAlpha = 1;
    t.refresh();
  }
  scene.add.image(0, 0, key).setOrigin(0).setDepth(-102);
  for (const [i, h] of homes.entries()) {
    const patch = scene.add
      .image(h.x - 20, h.y - 25, "ground-d3-" + (i % 2 ? "earth-a" : "earth-b"))
      .setDisplaySize(h.width + 80, 110)
      .setDepth(-101);
    patch.setFlipX(i % 2 === 0);
    scene.add
      .image(h.x + h.width / 2, h.y - 12, "ground-d3-grass-rocks")
      .setDisplaySize(42, 29)
      .setDepth(-98);
    scene.add
      .image(h.x, h.y + 19, "ground-d3-paw-trail")
      .setDisplaySize(23, 35)
      .setAlpha(0.38)
      .setDepth(-98);
  }
}
export function urbanPaths(scene: Phaser.Scene) {
  const key = "village-paths-d33";
  if (!scene.textures.exists(key)) {
    const t = scene.textures.createCanvas(
        key,
        villageSize.width,
        villageSize.height,
      )!,
      c = t.context;
    for (const material of ["dirt", "stone"] as const) {
      const layer = document.createElement("canvas");
      layer.width = t.width;
      layer.height = t.height;
      const p = layer.getContext("2d")!;
      p.imageSmoothingEnabled = false;
      p.fillStyle = p.createPattern(
        scene.textures
          .get("art-" + material)
          .getSourceImage() as HTMLImageElement,
        "repeat",
      )!;
      p.fillRect(0, 0, t.width, t.height);
      p.globalCompositeOperation = "destination-in";
      const mask = document.createElement("canvas");
      mask.width = t.width;
      mask.height = t.height;
      const m = mask.getContext("2d")!;
      m.strokeStyle = "#fff";
      m.lineJoin = "round";
      m.lineCap = "round";
      for (const lane of [...urbanLanes, ...frontPaths].filter(
        (l) => l.material === material,
      )) {
        m.beginPath();
        m.moveTo(lane.points[0].x, lane.points[0].y);
        for (let n = 1; n < lane.points.length; n++) {
          const a = lane.points[n],
            b = lane.points[n + 1];
          if (b) m.arcTo(a.x, a.y, b.x, b.y, 16);
          else m.lineTo(a.x, a.y);
        }
        m.lineWidth = lane.width;
        m.stroke();
      }
      p.drawImage(mask, 0, 0);
      c.globalAlpha = material === "stone" ? 0.85 : 0.53;
      c.drawImage(layer, 0, 0);
    }
    c.globalAlpha = 1;
    t.refresh();
  }
  scene.add.image(0, 0, key).setOrigin(0).setDepth(-99);
}
export function drawHomes(scene: Phaser.Scene) {
  // Intentional garden and grove compositions, outside all facade/door corridors.
  const groves = [
    [140, 845, 72],
    [219, 870, 59],
    [675, 855, 64],
    [726, 840, 78],
    [870, 1020, 57],
    [1370, 730, 60],
    [1404, 720, 42],
    [1670, 720, 56],
    [1700, 710, 40],
    [1280, 1070, 60],
    [1580, 1055, 52],
    [1330, 1310, 55],
    [1620, 1310, 52],
  ];
  for (const [x, y, width] of groves) {
    const key = vegetationKey("vegetation_pine_large", x, y)!;
    const image = scene.add
      .image(x, y, key)
      .setOrigin(0.5, 1)
      .setDepth(y)
      .setName("urban:grove");
    image.setScale(width / image.width);
    scene.add
      .image(x, y + 3, "ground-d3-snowbank-small")
      .setDisplaySize(width * 0.6, 15)
      .setDepth(y + 0.1);
  }

  for (const [i, h] of homes.entries()) {
    scene.add
      .image(h.x, h.y, "urban-" + h.key)
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(h.y - 8)
      .setName("home:" + h.key);
    const prop = (key: string, x: number, y: number, width: number) => {
      const texture = vegetationKey(key, x, y) ?? cleanKey(key);
      const image = scene.add
        .image(x, y, texture)
        .setOrigin(0.5, 1)
        .setDepth(y)
        .setName("urban:detail:" + h.key + ":" + key);
      image.setScale(width / image.width);
    };
    const left =
        h.key === "home-narrow" || h.key === "cottage-porchwide"
          ? h.x + h.width / 2 + 48
          : h.x - h.width / 2 - 13,
      right = h.x + h.width / 2 + 12;
    prop("lampadaire", right, h.y + 16, 21);
    prop(i % 2 ? "banc_plaid" : "jardiniere", left, h.y + 14, i % 2 ? 48 : 28);
    prop("vegetation_bush_snow", left + 12, h.y - 18, 27);
    if (i % 3 === 0)
      prop(
        "cloture_guirlande",
        right + (h.key === "cottage-garden" ? -12 : 20),
        h.y - 25,
        55,
      );
    if (i % 4 === 0) prop("vegetation_pine_large", left - 15, h.y - 65, 52);
  }
}
