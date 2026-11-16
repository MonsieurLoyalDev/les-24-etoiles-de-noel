export type EpisodeContext = {
  regions?: ("forest" | "bakery")[];
  pages: { day: number; title: string; text: string }[];
  choices: Record<string, string>;
  facts: Record<string, string | boolean>;
  lights?: Record<string, { on: boolean; tint: number; shimmer?: boolean }>;
};
export const emptyEpisodeContext = (): EpisodeContext => ({
  pages: [],
  choices: {},
  facts: {},
});
/** Only the authenticated server supplies prior-episode content. Never preload future scripts. */
export function validateEpisodeContext(input: unknown): EpisodeContext {
  if (input === undefined) return emptyEpisodeContext();
  const c = input as EpisodeContext;
  if (
    c?.regions &&
    (!Array.isArray(c.regions) ||
      c.regions.some((r) => !["forest", "bakery"].includes(r)))
  )
    throw Error("Régions autorisées invalides");
  const object = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  if (
    !object(c) ||
    !Array.isArray(c.pages) ||
    c.pages.length > 100 ||
    c.pages.some(
      (p) =>
        !p ||
        !Number.isInteger(p.day) ||
        p.day < 1 ||
        p.day > 24 ||
        typeof p.title !== "string" ||
        !p.title.length ||
        p.title.length > 200 ||
        typeof p.text !== "string" ||
        !p.text.length ||
        p.text.length > 4000,
    ) ||
    !object(c.choices) ||
    Object.keys(c.choices).length > 1000 ||
    Object.entries(c.choices).some(
      ([k, v]) => k.length > 250 || typeof v !== "string" || v.length > 80,
    ) ||
    !object(c.facts) ||
    Object.keys(c.facts).length > 1000 ||
    Object.entries(c.facts).some(
      ([k, v]) =>
        k.length > 250 ||
        !(typeof v === "boolean" || (typeof v === "string" && v.length <= 80)),
    )
  )
    throw Error("Contexte narratif incompatible");
  if (
    c.lights &&
    (!object(c.lights) ||
      Object.keys(c.lights).length > 50 ||
      Object.values(c.lights).some(
        (v) =>
          !object(v) ||
          typeof v.on !== "boolean" ||
          !Number.isSafeInteger(v.tint) ||
          Number(v.tint) < 0 ||
          Number(v.tint) > 0xffffff ||
          (v.shimmer !== undefined && typeof v.shimmer !== "boolean"),
      ))
  )
    throw Error("Éclairage narratif incompatible");
  return structuredClone(c);
}
