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
// Fixed world, additive plots only. Roofs may overlap tree canopies, never entrances.
export const homes: Home[] = [
  {
    key: "home-family",
    x: 300,
    y: 160,
    width: 112,
    maxHeight: 100,
    footprint: { x: 255, y: 125, w: 90, h: 35 },
    chimney: [0.76, 0.08],
    windows: [
      [0.23, 0.76],
      [0.77, 0.76],
    ],
  },
  {
    key: "home-chalet",
    x: 632,
    y: 210,
    width: 108,
    maxHeight: 104,
    footprint: { x: 590, y: 172, w: 84, h: 38 },
    chimney: [0.27, 0.055],
    windows: [
      [0.35, 0.73],
      [0.8, 0.73],
    ],
  },
  {
    key: "home-porch",
    x: 57,
    y: 470,
    width: 92,
    maxHeight: 96,
    footprint: { x: 37, y: 435, w: 40, h: 35 },
    chimney: [0.76, 0.06],
    windows: [[0.28, 0.62]],
  },
  {
    key: "home-garden",
    x: 310,
    y: 590,
    width: 124,
    maxHeight: 100,
    footprint: { x: 262, y: 550, w: 96, h: 40 },
    chimney: [0.25, 0.06],
    windows: [
      [0.27, 0.67],
      [0.75, 0.67],
    ],
  },
  {
    key: "home-tall",
    x: 337,
    y: 732,
    width: 116,
    maxHeight: 112,
    footprint: { x: 309, y: 691, w: 56, h: 41 },
    chimney: [0.77, 0.055],
    windows: [
      [0.3, 0.67],
      [0.72, 0.67],
    ],
  },
  {
    key: "home-narrow",
    x: 650,
    y: 704,
    width: 96,
    maxHeight: 108,
    footprint: { x: 634, y: 663, w: 32, h: 41 },
    chimney: [0.26, 0.06],
    windows: [[0.7, 0.62]],
  },
  {
    key: "home-shutters",
    x: 970,
    y: 610,
    width: 96,
    maxHeight: 90,
    footprint: { x: 933, y: 577, w: 74, h: 33 },
    chimney: [0.77, 0.06],
    windows: [
      [0.25, 0.68],
      [0.75, 0.68],
    ],
  },
  {
    key: "home-oriel",
    x: 965,
    y: 370,
    width: 100,
    maxHeight: 92,
    footprint: { x: 927, y: 335, w: 76, h: 35 },
    chimney: [0.24, 0.06],
    windows: [[0.67, 0.62]],
  },
];
export const homeSizes = Object.fromEntries(
  homes.map((x) => [x.key, { width: x.width, maxHeight: x.maxHeight }]),
);
