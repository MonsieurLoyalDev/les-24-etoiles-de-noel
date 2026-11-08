export const variantAssets = {
  fir_slim: "/assets/refinements-d22/fir-slim.png",
  fir_broad: "/assets/refinements-d22/fir-broad.png",
  fir_young: "/assets/refinements-d22/fir-young.png",
  fir_windswept: "/assets/refinements-d22/fir-windswept.png",
  bush_low: "/assets/refinements-d22/bush-low.png",
  bush_snowy: "/assets/refinements-d22/bush-snowy.png",
  bush_berries_low: "/assets/refinements-d22/bush-berries-low.png",
};
export const pineVariants = [
  "vegetation_pine_large",
  "fir_slim",
  "fir_broad",
  "fir_young",
  "fir_windswept",
];
export const shrubVariants = {
  vegetation_bush_snow: ["vegetation_bush_snow", "bush_low", "bush_snowy"],
  vegetation_bush_berries: ["vegetation_bush_berries", "bush_berries_low"],
};
export function chooseVegetation(key: string, x?: number, y?: number) {
  if (x === undefined || y === undefined) return key;
  const variants =
    key === "vegetation_pine_large"
      ? pineVariants
      : shrubVariants[key as keyof typeof shrubVariants];
  if (!variants) return key;
  const seed =
    (Math.imul(Math.round(x), 73856093) ^
      Math.imul(Math.round(y), 19349663)) >>>
    0;
  return variants[seed % variants.length];
}
// Ornamental bases only, outside the circulation and original interaction reserves.
export const borderPlants = [
  { id: "west-low-1", key: "bush_low", x: 356, y: 372, width: 29 },
  { id: "west-low-2", key: "bush_berries_low", x: 344, y: 386, width: 24 },
  { id: "east-low-1", key: "bush_low", x: 655, y: 365, width: 30 },
  { id: "east-low-2", key: "bush_snowy", x: 673, y: 373, width: 22 },
  { id: "northwest-low-1", key: "bush_snowy", x: 392, y: 278, width: 26 },
  { id: "northwest-low-2", key: "bush_low", x: 408, y: 266, width: 24 },
  { id: "northeast-low-1", key: "bush_low", x: 588, y: 288, width: 30 },
  { id: "northeast-low-2", key: "bush_berries_low", x: 606, y: 301, width: 24 },
  { id: "southwest-low-1", key: "bush_snowy", x: 435, y: 520, width: 27 },
  { id: "southwest-low-2", key: "bush_berries_low", x: 419, y: 534, width: 24 },
  { id: "southeast-low-1", key: "bush_low", x: 625, y: 525, width: 29 },
  { id: "southeast-low-2", key: "bush_berries_low", x: 606, y: 539, width: 24 },
];
