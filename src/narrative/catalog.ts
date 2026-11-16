// Public planning metadata only. Actual scripts must come from private storage.
export const episodeId = (day: number) => {
  if (!Number.isInteger(day) || day < 1 || day > 24)
    throw Error("Jour invalide");
  return `episode-${String(day).padStart(2, "0")}`;
};
export const episodeCatalog = Array.from({ length: 24 }, (_, i) => ({
  id: episodeId(i + 1),
  day: i + 1,
  scriptStatus: "private-content-required" as const,
  constellation: Math.floor(i / 6) + 1,
  // Future private scripts are not shipped in the public planning registry.
  title: null,
  outline:
    i === 0
      ? Array.from({ length: 7 }, (_, j) => ({ id: `scene-${j + 1}` }))
      : [],
}));
