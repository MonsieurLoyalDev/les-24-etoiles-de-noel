import type { Rect } from "../domain";
export type Home = {
  key: string;
  x: number;
  y: number;
  width: number;
  maxHeight: number;
  footprint: Rect;
  chimney: [number, number];
  windows: [number, number][];
};
// Four human-scale homes fit the audited plots. Eight tiny facades were rejected visually.
// World size, approved terrain, original paths and functional access points stay intact.
export const homes: Home[] = [
  {
    key: "home-porch",
    x: 48,
    y: 505,
    width: 92,
    maxHeight: 148,
    footprint: { x: 18, y: 460, w: 60, h: 45 },
    chimney: [0.76, 0.025],
    windows: [[0.47, 0.42]],
  },
  {
    key: "home-garden",
    x: 285,
    y: 630,
    width: 200,
    maxHeight: 145,
    footprint: { x: 215, y: 582, w: 140, h: 48 },
    chimney: [0.195, 0.025],
    windows: [
      [0.28, 0.72],
      [0.76, 0.72],
    ],
  },
  {
    key: "home-tall",
    x: 385,
    y: 740,
    width: 116,
    maxHeight: 140,
    footprint: { x: 351, y: 688, w: 68, h: 52 },
    chimney: [0.79, 0.06],
    windows: [
      [0.54, 0.49],
      [0.75, 0.8],
    ],
  },
  {
    key: "home-oriel",
    x: 960,
    y: 410,
    width: 118,
    maxHeight: 132,
    footprint: { x: 916, y: 365, w: 88, h: 45 },
    chimney: [0.16, 0.035],
    windows: [[0.31, 0.71]],
  },
];
export const homeSizes = Object.fromEntries(
  homes.map((x) => [x.key, { width: x.width, maxHeight: x.maxHeight }]),
);
