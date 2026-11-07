import original from "../game/maps/place-des-lanternes.json";
import type { Point, Rect } from "../domain";
export type District =
  | "place"
  | "library"
  | "workshop"
  | "inn"
  | "house"
  | "civic"
  | "post"
  | "forest";
export type Decoration = {
  id: string;
  key: string;
  x: number;
  y: number;
  width: number;
  district: District;
  back?: boolean;
  flip?: boolean;
  overhead?: boolean;
};
export type Lane = {
  id: string;
  material: "stone" | "dirt";
  width: number;
  points: Point[];
};
const points = (values: number[][]) => values.map(([x, y]) => ({ x, y }));
export const lanes: Lane[] = [
  {
    id: "main",
    material: "stone",
    width: 48,
    points: points([
      [512, 752],
      [512, 480],
      [512, 434],
    ]),
  },
  {
    id: "library",
    material: "stone",
    width: 40,
    points: points([
      [208, 314],
      [208, 420],
      [398, 420],
      [454, 432],
    ]),
  },
  {
    id: "inn",
    material: "stone",
    width: 40,
    points: points([
      [464, 204],
      [464, 274],
      [448, 330],
    ]),
  },
  {
    id: "workshop",
    material: "stone",
    width: 40,
    points: points([
      [784, 266],
      [784, 348],
      [654, 348],
      [594, 382],
    ]),
  },
  {
    id: "house",
    material: "stone",
    width: 40,
    points: points([
      [800, 644],
      [736, 644],
      [736, 584],
      [638, 584],
      [558, 548],
      [512, 548],
    ]),
  },
  {
    id: "civic",
    material: "stone",
    width: 36,
    points: points([
      [590, 458],
      [646, 486],
      [740, 515],
    ]),
  },
  {
    id: "reading-garden",
    material: "stone",
    width: 28,
    points: points([
      [208, 326],
      [284, 326],
      [336, 336],
      [374, 376],
      [415, 396],
    ]),
  },
  {
    id: "west-forest",
    material: "dirt",
    width: 28,
    points: points([
      [208, 452],
      [154, 490],
      [102, 528],
      [-24, 572],
    ]),
  },
  {
    id: "flocon",
    material: "dirt",
    width: 28,
    points: points([
      [818, 376],
      [878, 421],
      [932, 464],
      [1048, 488],
    ]),
  },
];
export const courts = [
  { id: "place", x: 512, y: 394, rx: 118, ry: 77 },
  { id: "library", x: 208, y: 326, rx: 75, ry: 30 },
  { id: "inn", x: 464, y: 209, rx: 86, ry: 25 },
  { id: "workshop", x: 784, y: 278, rx: 77, ry: 29 },
  { id: "house", x: 800, y: 640, rx: 78, ry: 27 },
  { id: "reading", x: 336, y: 334, rx: 46, ry: 20 },
];
const items: Decoration[] = [];
function add(
  district: District,
  key: string,
  x: number,
  y: number,
  width: number,
  options: Partial<Decoration> = {},
) {
  items.push({
    id: `${district}-${key}-${items.length}`,
    district,
    key,
    x,
    y,
    width,
    ...options,
  });
}
// The warm central crescent stays open in front of the tree and the Advent anchor.
add("place", "banc_neige", 374, 480, 62);
add("place", "lampadaire", 388, 383, 26);
add("place", "lampadaire", 637, 389, 26);
add("place", "jardiniere", 376, 346, 32);
add("place", "jardiniere", 642, 441, 31);
add("place", "vegetation_bush_snow", 382, 358, 31);
add("place", "vegetation_bush_berries", 367, 454, 28);
add("place", "vegetation_gift", 589, 369, 24);
// Exterior reading corner: existing solid bench and entrance remain at their exact positions.
add("library", "banc_neige", 144, 345, 58);
add("library", "jardiniere", 281, 321, 37);
add("library", "vegetation_bush_snow", 291, 357, 28);
add("library", "vegetation_bush_snow", 114, 315, 36);
add("library", "vegetation_bush_berries", 300, 365, 29);
add("library", "guirlande_lanternes", 185, 301, 103, { overhead: true });
add("library", "cloture_guirlande", 113, 367, 74);
// Madeleine's terrace belongs to the existing inn; no fictional bakery facade.
add("inn", "banc_plaid", 383, 225, 61);
add("inn", "banc_neige", 550, 225, 57);
add("inn", "jardiniere", 345, 264, 35);
add("inn", "jardiniere", 590, 236, 35);
add("inn", "guirlande_lanternes", 463, 190, 103, { overhead: true });
add("inn", "vegetation_bush_snow", 613, 258, 29);
add("inn", "vegetation_bush_berries", 348, 240, 26);
// Basile: one painted stall, wood and wrapped gifts, kept away from the doorway.
add("workshop", "stand_cadeaux", 863, 305, 65);
add("workshop", "vegetation_logs", 710, 294, 22);
add("workshop", "vegetation_logs", 720, 308, 16, { flip: true });
add("workshop", "vegetation_gift", 839, 276, 25);
add("workshop", "vegetation_gift", 880, 314, 20, { flip: true });
add("workshop", "jardiniere", 927, 293, 32);
add("workshop", "banc_neige", 668, 300, 58);
add("workshop", "cloture_guirlande", 908, 326, 91);
// Loyal's garden has a sheltered sitting area; the approach at (800,646) remains clear.
add("house", "banc_plaid", 859, 668, 58);
add("house", "jardiniere", 715, 636, 35);
add("house", "jardiniere", 899, 633, 33);
add("house", "vegetation_logs", 888, 612, 20);
add("house", "cloture_guirlande", 903, 697, 91);
add("house", "vegetation_bush_berries", 713, 676, 27);
add("house", "vegetation_bush_snow", 889, 676, 35);
// Civic and mail corners use existing furniture; neither creates an entrance or a quest.
add("civic", "panneau_direction", 793, 486, 36);
add("civic", "jardiniere", 837, 486, 30);
add("post", "panneau_direction", 278, 393, 36);
add("post", "vegetation_gift", 284, 405, 23);
add("post", "jardiniere", 300, 402, 30);
// Flocon's clearing and woodland frame: irregular small groups, not a repeated grid.
add("forest", "banc_neige", 885, 392, 57);
add("forest", "panneau_direction", 932, 515, 35);
add("forest", "vegetation_bush_berries", 904, 430, 28);
add("forest", "vegetation_bush_snow", 940, 444, 35);
const groves: number[][] = [
  [40, 115, 65],
  [73, 94, 72],
  [100, 132, 54],
  [35, 192, 58],
  [69, 216, 69],
  [958, 85, 72],
  [990, 128, 60],
  [913, 101, 63],
  [979, 337, 70],
  [988, 412, 63],
  [48, 685, 72],
  [94, 751, 67],
  [160, 723, 62],
  [35, 620, 58],
  [966, 750, 72],
  [918, 721, 61],
  [980, 652, 77],
  [937, 666, 56],
  [625, 91, 64],
  [655, 135, 58],
];
for (const [x, y, w] of groves)
  add("forest", "vegetation_pine_large", x, y, w, {
    back: true,
    flip: items.length % 3 === 0,
  });
for (const [x, y, w] of [
  [55, 134, 33],
  [109, 139, 26],
  [48, 254, 35],
  [957, 147, 33],
  [992, 437, 28],
  [44, 706, 32],
  [143, 750, 31],
  [929, 744, 33],
  [979, 678, 30],
  [636, 153, 32],
])
  add("forest", "vegetation_bush_snow", x, y, w, { back: true });
add("forest", "arche_etoilebois", 512, 767, 164);
export const decorations = items;

export const districtSigns = [
  { text: "Coin lecture de Célestine", x: 324, y: 347 },
  { text: "Terrasse de Madeleine", x: 555, y: 248 },
  { text: "Courrier d’Émile", x: 281, y: 424 },
  { text: "Allée d’Augustin", x: 804, y: 563 },
  { text: "Sentier de Flocon", x: 938, y: 538 },
];
// These reserves are also the test contract: new ornamental bases never occupy interaction points.
export const interactionReserves: Point[] = [
  { x: 512, y: 608 },
  { x: 512, y: 430 },
  { x: 512, y: 410 },
  { x: 560, y: 500 },
  { x: 440, y: 460 },
  { x: 700, y: 500 },
  { x: 240, y: 430 },
  { x: 850, y: 440 },
  ...original.buildings.map((b) => ({
    x: b.entrance.x * 16,
    y: b.entrance.y * 16 + 22,
  })),
  ...original.props
    .filter((p) => p.interaction)
    .map((p) => ({ x: p.tileX * 16, y: p.tileY * 16 + 14 })),
];
export function existingCollisionRects(): Rect[] {
  return [
    ...original.buildings.map((b) => ({
      x: b.tileX * 16,
      y: b.tileY * 16,
      w: b.widthTiles * 16,
      h: b.heightTiles * 16,
    })),
    ...original.props
      .filter((p) => p.solid)
      .map((p) => ({
        x: p.tileX * 16 - 14,
        y: p.tileY * 16 - 9,
        w: 28,
        h: 15,
      })),
  ];
}
