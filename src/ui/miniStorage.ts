import type { Memory } from "../rpg/minigames";
type Cached = {
  board?: number[];
  moves?: number;
  deck?: number[];
  open?: number[];
  matched?: number[];
  index?: number;
  attempts?: number;
};
export function readGame(key?: string): Cached | null {
  if (!key) return null;
  try {
    const value = JSON.parse(
      localStorage.getItem(`advent-minigame:${key}`) ?? "null",
    );
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}
export function writeGame(key: string | undefined, value: unknown) {
  if (!key) return;
  try {
    localStorage.setItem(`advent-minigame:${key}`, JSON.stringify(value));
  } catch {
    /* The game remains playable when storage is unavailable. */
  }
}
export function isBoard(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.length === 9 &&
    new Set(v).size === 9 &&
    v.every((n) => Number.isInteger(n) && n >= 0 && n < 9)
  );
}
export function validMemory(v: Cached | null): Memory | null {
  if (
    !v?.deck ||
    v.deck.length !== 8 ||
    ![0, 1, 2, 3].every((n) => v.deck!.filter((x) => x === n).length === 2) ||
    !v.open ||
    !v.matched ||
    !Number.isFinite(v.moves) ||
    v.moves! < 0
  )
    return null;
  for (const list of [v.open, v.matched])
    if (
      new Set(list).size !== list.length ||
      list.some((n) => !Number.isInteger(n) || n < 0 || n >= 8)
    )
      return null;
  if (
    v.open.length > 2 ||
    v.matched.length % 2 !== 0 ||
    v.open.some((i) => v.matched!.includes(i))
  )
    return null;
  return { deck: v.deck, open: v.open, matched: v.matched, moves: v.moves! };
}
