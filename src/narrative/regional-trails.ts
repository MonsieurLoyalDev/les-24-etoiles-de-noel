import type Phaser from "phaser";
import type { Point, WorldRoom } from "../domain";
import { edgeVariation } from "../art/ground35";
import { distanceToSegment, roundedRoute } from "../art/village34";

type Trail = { width: number; points: number[][] };
const trails: Partial<Record<WorldRoom, Trail[]>> = {
  forest: [
    {
      width: 21,
      points: [
        [512, 688],
        [493, 614],
        [512, 541],
        [550, 479],
        [534, 418],
        [560, 372],
        [557, 239],
      ],
    },
    {
      width: 11,
      points: [
        [548, 479],
        [427, 470],
        [333, 484],
        [220, 463],
      ],
    },
  ],
  lake: [
    {
      width: 24,
      points: [
        [100, 650],
        [108, 574],
        [92, 499],
        [133, 441],
        [207, 412],
        [250, 394],
        [269, 383],
      ],
    },
    {
      width: 12,
      points: [
        [133, 441],
        [112, 381],
        [133, 327],
        [168, 302],
      ],
    },
  ],
  hamlet: [
    {
      width: 31,
      points: [
        [512, 680],
        [488, 590],
        [510, 507],
        [555, 453],
        [632, 416],
        [720, 337],
      ],
    },
    {
      width: 22,
      points: [
        [555, 453],
        [451, 431],
        [379, 451],
        [280, 430],
      ],
    },
    {
      width: 17,
      points: [
        [451, 431],
        [402, 389],
        [357, 335],
        [272, 307],
      ],
    },
  ],
};

export const winterTrailRooms: readonly WorldRoom[] = ["forest", "lake", "hamlet", "glade"];

const mirror = (p: number) => {
  const tile = p % 224;
  return tile < 112 ? tile : 223 - tile;
};

/** Render the village's packed-snow material at world-pixel resolution, once per region. */
export function drawRegionalTrail(scene: Phaser.Scene, room: WorldRoom) {
  const paths = trails[room];
  if (!paths) return;
  const points = paths.flatMap(({ points }) => points);
  const left = Math.min(...points.map(([x]) => x)) - 24;
  const top = Math.min(...points.map(([, y]) => y)) - 24;
  const width = Math.max(...points.map(([x]) => x)) + 24 - left;
  const height = Math.max(...points.map(([, y]) => y)) + 24 - top;
  const key = `regional-trail:${room}`;
  if (!scene.textures.exists(key)) {
    const surface = scene.textures.createCanvas(key, width, height)!;
    const context = surface.context;
    const source = scene.textures
      .get("source-d35-paths")
      .getSourceImage() as HTMLImageElement;
    context.drawImage(source, 112, 0, 112, 112, 0, 0, 112, 112);
    const material = context.getImageData(0, 0, 112, 112).data;
    const pixels = context.createImageData(width, height);
    const field = new Float32Array(width * height).fill(Infinity);
    for (const path of paths) {
      const route = roundedRoute(path.points.map(([x, y]) => ({ x, y })));
      const margin = Math.ceil(path.width / 2) + 7;
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1],
          b = route[i];
        const point: Point = { x: 0, y: 0 };
        for (
          let y = Math.floor(Math.min(a.y, b.y)) - margin;
          y <= Math.ceil(Math.max(a.y, b.y)) + margin;
          y++
        )
          for (
            let x = Math.floor(Math.min(a.x, b.x)) - margin;
            x <= Math.ceil(Math.max(a.x, b.x)) + margin;
            x++
          ) {
            point.x = x;
            point.y = y;
            const index = (y - top) * width + x - left;
            field[index] = Math.min(
              field[index],
              distanceToSegment(point, a, b) - path.width / 2,
            );
          }
      }
    }
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const distance = field[y * width + x];
        if (distance > 7) continue;
        const wx = x + left,
          wy = y + top;
        const edge = distance + edgeVariation(wx, wy) * 1.45;
        if (edge > 2) continue;
        const weather = Math.sin(wx * 0.059 + wy * 0.047) * 0.13;
        const alpha = (edge > -1 ? 0.25 : edge > -3 ? 0.48 : 0.66) + weather;
        const from = (mirror(wy) * 112 + mirror(wx)) * 4;
        const to = (y * width + x) * 4;
        pixels.data[to] = material[from];
        pixels.data[to + 1] = material[from + 1];
        pixels.data[to + 2] = material[from + 2];
        pixels.data[to + 3] = Math.round(255 * alpha);
      }
    context.putImageData(pixels, 0, 0);
    surface.refresh();
  }
  scene.add.image(left, top, key).setOrigin(0).setDepth(-96);
}
