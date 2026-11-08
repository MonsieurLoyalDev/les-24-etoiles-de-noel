import type { Point } from "../domain";
export const villageSize = { width: 1920, height: 1408 };
export const humanDoorHeight = 44;
export const residentialPlots = [
  {
    key: "home-porch",
    x: 150,
    y: 1030,
    door: [0.5, 0.67, 0.5, 0.97],
    district: "calme",
  },
  {
    key: "home-garden",
    x: 950,
    y: 1290,
    door: [0.49, 0.63, 0.49, 0.95],
    district: "calme",
  },
  {
    key: "home-tall",
    x: 420,
    y: 1240,
    door: [0.3, 0.72, 0.3, 0.97],
    district: "calme",
  },
  {
    key: "home-oriel",
    x: 1230,
    y: 610,
    door: [0.68, 0.66, 0.68, 0.97],
    district: "residentiel",
  },
  {
    key: "home-family",
    x: 1200,
    y: 280,
    door: [0.52, 0.64, 0.52, 0.96],
    district: "residentiel",
  },
  {
    key: "home-chalet",
    x: 1480,
    y: 320,
    door: [0.58, 0.62, 0.58, 0.96],
    district: "residentiel",
  },
  {
    key: "home-narrow",
    x: 1150,
    y: 1040,
    door: [0.44, 0.79, 0.44, 0.98],
    district: "artisans",
  },
  {
    key: "home-shutters",
    x: 1730,
    y: 980,
    door: [0.52, 0.57, 0.52, 0.96],
    district: "artisans",
  },
  {
    key: "cottage-stone",
    x: 1770,
    y: 250,
    door: [0.52, 0.51, 0.52, 0.89],
    district: "residentiel",
  },
  {
    key: "cottage-twin",
    x: 1530,
    y: 650,
    door: [0.46, 0.59, 0.46, 0.88],
    district: "residentiel",
  },
  {
    key: "cottage-gable",
    x: 1780,
    y: 600,
    door: [0.62, 0.57, 0.62, 0.9],
    district: "residentiel",
  },
  {
    key: "cottage-humble",
    x: 730,
    y: 1050,
    door: [0.36, 0.47, 0.36, 0.864],
    district: "calme",
  },
  {
    key: "cottage-annex",
    x: 1440,
    y: 1040,
    door: [0.43, 0.52, 0.43, 0.87],
    district: "artisans",
  },
  {
    key: "cottage-porchwide",
    x: 1180,
    y: 1260,
    door: [0.54, 0.46, 0.54, 0.86],
    district: "artisans",
  },
  {
    key: "cottage-terrace",
    x: 1480,
    y: 1285,
    door: [0.36, 0.5, 0.36, 0.87],
    district: "artisans",
  },
  {
    key: "cottage-garden",
    x: 1760,
    y: 1235,
    door: [0.51, 0.47, 0.51, 0.85],
    district: "artisans",
  },
] as const;
export type UrbanLane = {
  id: string;
  material: "stone" | "dirt";
  width: number;
  points: Point[];
};
const points = (p: number[][]) => p.map(([x, y]) => ({ x, y }));
export const urbanLanes: UrbanLane[] = [
  {
    id: "allee-calme",
    material: "dirt",
    width: 24,
    points: points([
      [150, 1100],
      [512, 1100],
    ]),
  },
  {
    id: "porte-est",
    material: "stone",
    width: 34,
    points: points([
      [784, 348],
      [1000, 348],
      [1080, 400],
      [1320, 430],
      [1550, 405],
      [1740, 425],
      [1900, 400],
    ]),
  },
  {
    id: "rue-residentielle",
    material: "dirt",
    width: 30,
    points: points([
      [1030, 750],
      [1250, 780],
      [1500, 770],
      [1720, 745],
      [1900, 750],
    ]),
  },
  {
    id: "rue-artisans",
    material: "dirt",
    width: 30,
    points: points([
      [1030, 1100],
      [1280, 1120],
      [1500, 1130],
      [1740, 1090],
      [1900, 1100],
    ]),
  },
  {
    id: "rue-jardins",
    material: "dirt",
    width: 26,
    points: points([
      [900, 1360],
      [1080, 1340],
      [1310, 1370],
      [1560, 1350],
      [1760, 1365],
      [1880, 1360],
    ]),
  },
  {
    id: "liaison-est",
    material: "stone",
    width: 30,
    points: points([
      [1080, 400],
      [1050, 570],
      [1090, 750],
      [1060, 910],
      [1080, 1100],
      [1100, 1250],
      [1080, 1360],
    ]),
  },
  {
    id: "lisiere-est",
    material: "dirt",
    width: 26,
    points: points([
      [1900, 400],
      [1900, 1360],
      [1880, 1360],
    ]),
  },
  {
    id: "porte-sud",
    material: "stone",
    width: 38,
    points: points([
      [512, 752],
      [512, 920],
      [512, 1100],
      [1080, 1100],
    ]),
  },
  {
    id: "quartier-calme",
    material: "dirt",
    width: 26,
    points: points([
      [512, 920],
      [300, 920],
      [300, 1100],
      [300, 1320],
      [950, 1320],
      [950, 1360],
    ]),
  },
];
export const relocatedPine = {
  from: { x: 944, y: 416 },
  to: { x: 1860, y: 120 },
};
