import type Phaser from "phaser";
import metadata from "./homes-d33.json" with { type: "json" };
import { residentialPlots, urbanLanes, villageSize } from "./urban-plan";
import type { Home } from "../decor/neighbourhood";
import { drawScenery34 } from "./scenery34";
import { plan, roundedRoute, pedestrianCourts } from "./village34";
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
export const frontPaths: typeof urbanLanes = [];
export function preloadVillage33(scene: Phaser.Scene) {
  for (const h of homes)
    scene.load.image("urban-" + h.key, `/assets/village-d33/${h.key}.png`);
  for (const k of ["snow-powder", "snow-soft"])
    scene.load.image("urban-" + k, `/assets/interiors-d31/${k}.png`);
}
export function urbanGround(scene: Phaser.Scene) {
  for (const h of homes) {
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
        for (const p of roundedRoute(lane.points).slice(1)) m.lineTo(p.x, p.y);
        m.lineWidth = lane.width;
        m.stroke();
      }
      for (const court of pedestrianCourts.filter(
        (c) => (c.id === "C3" ? "dirt" : "stone") === material,
      )) {
        m.beginPath();
        court.points.forEach(([x, y], i) =>
          i ? m.lineTo(x, y) : m.moveTo(x, y),
        );
        m.closePath();
        m.fillStyle = "#fff";
        m.fill();
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
  for (const h of homes)
    scene.add
      .image(h.x, h.y, "urban-" + h.key)
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(h.y - 8)
      .setName("home:" + h.key);
  scene.game.canvas.dataset.village34 = JSON.stringify({
    world: plan.world,
    houses: plan.houses.map((h) => ({
      id: h.id,
      key: h.key,
      x: h.x,
      y: h.y,
      quarter: h.quarter,
    })),
    quarters: plan.quarters.map((q) => ({
      id: q.id,
      name: q.name,
      court: q.court,
    })),
    doors: plan.houses.map((h) => ({
      key: h.key,
      height: h.sourceDoor[3] - h.sourceDoor[1],
    })),
  });
}
export { drawScenery34 };
