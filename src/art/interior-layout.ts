export const furnitureByRoom = {
  house: ["house-lounge", "house-table", "house-hearth"],
  library: ["library-shelves", "library-desk", "library-nook"],
  workshop: ["workshop-tools", "workshop-bench", "workshop-storage"],
  inn: ["inn-counter", "inn-table", "inn-hearth"],
} as const;
/** Existing physical footprints, not new colliders. Decorative overhangs rise north of their base. */
export const furnitureSlots = [
  {
    x: 95,
    y: 95,
    width: 90,
    maxHeight: 86,
    footprint: { x: 50, y: 50, w: 90, h: 45 },
  },
  {
    x: 240,
    y: 138,
    width: 80,
    maxHeight: 72,
    footprint: { x: 200, y: 100, w: 80, h: 38 },
  },
  {
    x: 385,
    y: 120,
    width: 70,
    maxHeight: 88,
    footprint: { x: 350, y: 70, w: 70, h: 50 },
  },
] as const;
export const floorDecorByRoom = {
  house: [
    { key: "rug-woven", x: 240, y: 224, width: 200 },
    { key: "rug-oval", x: 385, y: 145, width: 90 },
    { key: "photo-keepsakes", x: 296, y: 192, width: 35 },
  ],
  library: [
    { key: "rug-woven", x: 105, y: 223, width: 125 },
    { key: "rug-woven", x: 346, y: 226, width: 160 },
    { key: "photo-keepsakes", x: 370, y: 235, width: 45 },
  ],
  workshop: [{ key: "wrapping-plans", x: 370, y: 235, width: 60 }],
  inn: [
    { key: "rug-oval", x: 235, y: 224, width: 210 },
    { key: "rug-woven", x: 370, y: 243, width: 95 },
    { key: "cards-keepsakes", x: 370, y: 235, width: 45 },
  ],
} as const;
export const interiorDecorSizes: Record<
  string,
  { width: number; maxHeight: number }
> = {
  "rug-woven": { width: 200, maxHeight: 130 },
  "rug-oval": { width: 210, maxHeight: 140 },
  "photo-keepsakes": { width: 45, maxHeight: 35 },
  "cards-keepsakes": { width: 45, maxHeight: 35 },
  "wrapping-plans": { width: 60, maxHeight: 45 },
  "wall-lantern": { width: 14, maxHeight: 25 },
};
export const interiorLanterns = [
  { x: 300, y: 24 },
  { x: 18, y: 178 },
  { x: 462, y: 214 },
] as const;
