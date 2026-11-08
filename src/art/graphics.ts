export type GraphicsQuality = "auto" | "full" | "soft" | "none";
export const graphicsStorageKey = "etoilebois-graphics-v1";
export function decorInView(
  p: { x: number; y: number; width: number; height: number },
  view: { x: number; y: number; width: number; height: number },
) {
  return (
    p.x + p.width / 2 > view.x &&
    p.x - p.width / 2 < view.x + view.width &&
    p.y > view.y &&
    p.y - p.height < view.y + view.height
  );
}
export const effectBudgets = {
  full: { snow: 40, smoke: 16, wind: 6, stars: 10, sway: 8 },
  soft: { snow: 14, smoke: 8, wind: 2, stars: 4, sway: 3 },
  none: { snow: 0, smoke: 0, wind: 0, stars: 0, sway: 0 },
};
let selected: GraphicsQuality | undefined;
export function normalizeGraphics(value: unknown): GraphicsQuality {
  return ["auto", "full", "soft", "none"].includes(String(value))
    ? (value as GraphicsQuality)
    : "auto";
}
export function readGraphics(): GraphicsQuality {
  if (selected) return selected;
  try {
    return normalizeGraphics(localStorage.getItem(graphicsStorageKey));
  } catch {
    return "auto";
  }
}
export function setGraphics(value: GraphicsQuality) {
  selected = normalizeGraphics(value);
  try {
    localStorage.setItem(graphicsStorageKey, selected);
  } catch {
    /* Presentation preference in memory; never a game save. */
  }
}
export function effectiveQuality(
  value: GraphicsQuality,
  width: number,
  reduced: boolean,
) {
  return reduced
    ? "none"
    : value === "auto"
      ? width < 700
        ? "soft"
        : "full"
      : value;
}
export function atmospherePalette(clock: number) {
  const palettes = [
    { color: 0x53678b, alpha: 0.065, warm: 0.22 },
    { color: 0x7893a7, alpha: 0.018, warm: 0.08 },
    { color: 0x745579, alpha: 0.15, warm: 0.82 },
    { color: 0x17305d, alpha: 0.27, warm: 1 },
  ];
  const phase = (((clock % 180000) + 180000) % 180000) / 45000,
    index = Math.floor(phase);
  const a = palettes[index],
    b = palettes[(index + 1) % 4];
  const t = Math.max(0, (phase - index - 0.8) / 0.2),
    blend = t * t * (3 - 2 * t);
  const channel = (shift: number) =>
    Math.round(
      ((a.color >> shift) & 255) * (1 - blend) +
        ((b.color >> shift) & 255) * blend,
    );
  return {
    color: (channel(16) << 16) | (channel(8) << 8) | channel(0),
    alpha: a.alpha + (b.alpha - a.alpha) * blend,
    warm: a.warm + (b.warm - a.warm) * blend,
  };
}
