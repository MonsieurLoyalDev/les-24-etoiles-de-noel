export type TagBox = { x: number; y: number; w: number; h: number };
export const signNames = {
  loyal_house: "Maison de Loyal",
  library: "Bibliothèque de Célestine",
  workshop: "Atelier de Basile",
  inn: "Auberge des Étoiles",
  bakery: "Boulangerie de Madeleine",
  townhall: "Mairie d’Augustin",
  post: "Poste d’Émile",
};
// Coordinates use the camera's world view. Only labels move; actors never do.
export function fitTag(box: TagBox, view: TagBox, previous: TagBox[] = []) {
  const margin = 3;
  const result = {
    ...box,
    x: Math.max(
      view.x + margin,
      Math.min(box.x, view.x + view.w - box.w - margin),
    ),
    y: Math.max(view.y + margin, box.y),
  };
  for (const other of previous) {
    if (
      result.x < other.x + other.w + 2 &&
      result.x + result.w + 2 > other.x &&
      result.y < other.y + other.h + 2 &&
      result.y + result.h + 2 > other.y
    )
      result.y = Math.max(view.y + margin, other.y - result.h - 2);
  }
  return result;
}
