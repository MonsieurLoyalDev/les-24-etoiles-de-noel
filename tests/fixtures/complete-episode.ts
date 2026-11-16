import { initial } from "../../src/domain";
import {
  startEpisode,
  receiveEvent,
  selectNarrativeChoice,
  finishScene,
} from "../../src/narrative/engine";
import {
  initialRuntime,
  type EpisodeScript,
  type EpisodeProgress,
} from "../../src/narrative/script";
import {
  newFlowRuntime,
  newPuzzle,
  puzzleMove,
  type Puzzle,
} from "../../src/narrative/flow";
function solve(p: Puzzle) {
  let d = newPuzzle(p);
  if (p.kind === "circuit") {
    d.rotations = d.rotations.map(() => 0);
  }
  if (p.kind === "matching")
    for (const [id, value] of Object.entries(p.matches!))
      d = puzzleMove(p, d, { type: "match", id, value });
  if (p.kind === "order") d.order = [...p.answer!];
  if (p.kind === "sequence")
    for (const id of p.answer!) d = puzzleMove(p, d, { type: "sequence", id });
  if (p.kind === "selection")
    for (const id of p.answer!) d = puzzleMove(p, d, { type: "toggle", id });
  if (p.kind === "cooking") {
    for (const [id, q] of Object.entries(p.quantities!))
      for (let i = 0; i < q.target / q.step; i++)
        d = puzzleMove(p, d, { type: "measure", id, value: 1 });
    for (let i = 0; i < (p.mix ?? 5); i++)
      d = puzzleMove(p, d, { type: "mix" });
    for (let i = 0; i < Math.ceil((p.golden?.[0] ?? 60) / 10); i++)
      d = puzzleMove(p, d, { type: "heat" });
  }
  d = puzzleMove(p, d, { type: "check" });
  if (!d.solved)
    throw Error("La fixture d’activité ne possède pas la solution attendue");
  return d;
}
/** Fixture builder using the real reducers/solvers, never direct progress-row inserts. */
export function completedEpisodeSnapshots(
  c: EpisodeScript,
  completedDays: number[],
) {
  let p: EpisodeProgress = {
    ...startEpisode(
      c,
      { day: c.day, unlocked: true },
      { world: structuredClone(initial), completedDays },
    ),
    runtime: {
      ...initialRuntime(),
      ...(c.flow ? { flow: newFlowRuntime() } : {}),
    },
  };
  const snapshots: EpisodeProgress[] = [];
  for (const s of c.scenes) {
    for (const choice of s.choices.filter((q) => !q.optional))
      p = selectNarrativeChoice(c, p, choice.id, choice.options[0].id, {
        world: initial,
        completedDays,
      }) as EpisodeProgress;
    for (const action of s.flow?.actions ?? [])
      if (action.puzzle && !s.flow?.optional)
        p.runtime.flow!.drafts[`${s.id}/${action.id}`] = solve(action.puzzle);
    for (const o of s.objectives.filter((o) => !o.optional)) {
      if (o.event.target === "restored-star") p.runtime.restored = true;
      if (o.event.target === "book-at-home" || (c.flow && p.runtime.restored))
        p.runtime.bookOpened = true;
      if (o.event.target === "dispersal") {
        p.runtime.dispersalStarted = true;
        p.runtime.dispersed = true;
      }
      if (o.id.startsWith("clue-"))
        p.runtime.clueIndex = Math.min(3, p.runtime.clueIndex + 1);
      p = receiveEvent(c, p, o.event) as EpisodeProgress;
    }
    p = finishScene(c, p, { world: initial, completedDays }) as EpisodeProgress;
    snapshots.push(structuredClone(p));
  }
  if (!p.complete) throw Error("Fixture non terminée");
  return snapshots;
}
