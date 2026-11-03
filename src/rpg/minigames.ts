export const photoStart = [1, 2, 0, 3, 5, 4, 6, 8, 7];
export function swapTiles(board: number[], a: number, b: number) {
  if (a < 0 || b < 0 || a >= board.length || b >= board.length) return board;
  const next = [...board];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
export function photoSolved(board: number[]) {
  return board.length === 9 && board.every((n, i) => n === i);
}
export type Memory = {
  deck: number[];
  open: number[];
  matched: number[];
  moves: number;
};
export function shuffle<T>(items: T[], random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function flipCard(state: Memory, index: number): Memory {
  if (
    index < 0 ||
    index >= state.deck.length ||
    state.open.length === 2 ||
    state.open.includes(index) ||
    state.matched.includes(index)
  )
    return state;
  const open = [...state.open, index];
  if (open.length === 2) {
    const moves = state.moves + 1;
    if (state.deck[open[0]] === state.deck[index])
      return {
        ...state,
        open: [],
        matched: [...state.matched, ...open],
        moves,
      };
    return { ...state, open, moves };
  }
  return { ...state, open };
}
export const orders = [
  { paper: "Rouge", ribbon: "Or" },
  { paper: "Bleu", ribbon: "Argent" },
  { paper: "Vert", ribbon: "Or" },
];
export function matchesOrder(index: number, paper: string, ribbon: string) {
  return orders[index]?.paper === paper && orders[index]?.ribbon === ribbon;
}
