import {
  validateDefinition,
  type EpisodeDefinition,
  type NarrativeScene,
  type NarrativeProgress,
} from "./engine";
import type { Point, Save } from "../domain";
import type { GameEvent } from "../rpg/quests";
import type { Presentation } from "./orchestration";

export type SceneKind =
  "arrival" | "meet" | "tree" | "scatter" | "trail" | "restore" | "home";
export type Beat = { speaker: string; text: string; choiceId?: string };
export type ScriptScene = Omit<NarrativeScene, "choices"> & {
  kind: SceneKind;
  title: string;
  prompt: string;
  dialogues: Record<string, Beat[]>;
  dialogueEvents: Record<string, GameEvent>;
  choices: (Omit<NarrativeScene["choices"][number], "options"> & {
    options: (NarrativeScene["choices"][number]["options"][number] & {
      label: string;
    })[];
  })[];
};
export type EpisodeScript = Omit<EpisodeDefinition, "scenes"> & {
  schema: 1;
  title: string;
  scenes: ScriptScene[];
  book: { title: string; text: string };
  hints?: string[];
};
export type EpisodeRuntime = {
  presentation?: Presentation;
  dialogue: { block: string; beat: number; actor: string | null } | null;
  origin: Point | null;
  firstMetVillager: string | null;
  clueIndex: number;
  hintMs: number;
  dispersalStarted: boolean;
  dispersed: boolean;
  restored: boolean;
  bookOpened: boolean;
  visited: Save["room"][];
  cinematic: { kind: "scatter" | "restore"; elapsed: number } | null;
  escort: {
    room: "library" | "village";
    position: Point;
    phase: "out" | "place" | "return" | "inside";
  } | null;
};
export type EpisodeProgress = NarrativeProgress & { runtime: EpisodeRuntime };
export const initialRuntime = (): EpisodeRuntime => ({
  dialogue: null,
  origin: null,
  firstMetVillager: null,
  clueIndex: 0,
  hintMs: 0,
  dispersalStarted: false,
  dispersed: false,
  restored: false,
  bookOpened: false,
  visited: [],
  cinematic: null,
  escort: null,
});
const text = (v: unknown, max = 2000): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
export function validateScript(input: unknown): EpisodeScript {
  const s = input as EpisodeScript;
  if (
    s?.hints !== undefined &&
    (!Array.isArray(s.hints) ||
      s.hints.length > 3 ||
      s.hints.some((h) => !text(h, 500)))
  )
    throw Error("Aides privées invalides");
  if (
    !s ||
    s.schema !== 1 ||
    !text(s.title, 180) ||
    !text(s.book?.title, 200) ||
    !text(s.book?.text, 4000) ||
    JSON.stringify(input).length > 200000
  )
    throw Error("Contenu narratif invalide");
  validateDefinition(s);
  for (const scene of s.scenes) {
    if (
      ![
        "arrival",
        "meet",
        "tree",
        "scatter",
        "trail",
        "restore",
        "home",
      ].includes(scene.kind) ||
      !text(scene.title, 180) ||
      !text(scene.prompt, 500) ||
      !scene.dialogues ||
      !scene.dialogueEvents
    )
      throw Error("Scène narrative non prise en charge");
    for (const [id, beats] of Object.entries(scene.dialogues)) {
      if (
        !/^[a-z][a-z0-9-]{0,79}$/.test(id) ||
        !Array.isArray(beats) ||
        !beats.length ||
        beats.length > 100
      )
        throw Error("Séquence de dialogue invalide");
      for (const beat of beats)
        if (
          !text(beat.speaker, 80) ||
          !text(beat.text) ||
          (beat.choiceId && !scene.choices.some((c) => c.id === beat.choiceId))
        )
          throw Error("Réplique invalide");
      const event = scene.dialogueEvents[id];
      if (
        !event ||
        !scene.objectives.some(
          (o) => o.event.kind === event.kind && o.event.target === event.target,
        )
      )
        throw Error("Dialogue sans objectif déclaré");
    }
    for (const choice of scene.choices)
      if (choice.options.some((o) => !text(o.label, 300)))
        throw Error("Option illisible");
  }
  return structuredClone(s);
}
export function validateRuntime(r: EpisodeRuntime) {
  const rooms = ["village", "house", "library", "workshop", "inn"];
  const p = r?.presentation;
  if (
    p?.location &&
    (!rooms.includes(p.location.room) ||
      [
        p.location.position,
        p.location.loyal,
        ...(p.location.flocon ? [p.location.flocon] : []),
      ].some(
        (point) =>
          !point ||
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y) ||
          point.x < 0 ||
          point.x > 1920 ||
          point.y < 0 ||
          point.y > 1408,
      ))
  )
    throw Error("Point de reprise invalide");
  if (
    p &&
    (typeof p.introSeen !== "boolean" ||
      !Number.isFinite(p.introRemaining) ||
      p.introRemaining < 0 ||
      p.introRemaining > 4000 ||
      ![null, "tree", "invitation"].includes(p.moment) ||
      !Array.isArray(p.optional) ||
      p.optional.length > 100 ||
      p.optional.some((id) => typeof id !== "string" || id.length > 80) ||
      !Number.isInteger(p.hintSpoken) ||
      p.hintSpoken < 0 ||
      p.hintSpoken > 3 ||
      (p.completedAt !== null && !Number.isFinite(Date.parse(p.completedAt))))
  )
    throw Error("État de présentation invalide");
  if (
    !r ||
    !Number.isInteger(r.clueIndex) ||
    r.clueIndex < 0 ||
    r.clueIndex > 3 ||
    !Number.isFinite(r.hintMs) ||
    r.hintMs < 0 ||
    r.hintMs > 86400000 ||
    [r.dispersalStarted, r.dispersed, r.restored, r.bookOpened].some(
      (b) => typeof b !== "boolean",
    ) ||
    !Array.isArray(r.visited) ||
    r.visited.length > 5 ||
    r.visited.some((room) => !rooms.includes(room)) ||
    new Set(r.visited).size !== r.visited.length ||
    (r.origin !== null &&
      (!Number.isFinite(r.origin.x) || !Number.isFinite(r.origin.y))) ||
    (r.firstMetVillager !== null &&
      !["emile", "augustin", "celestine"].includes(r.firstMetVillager)) ||
    (r.dialogue !== null &&
      (!/^[a-z][a-z0-9-]{0,79}$/.test(r.dialogue.block) ||
        !Number.isInteger(r.dialogue.beat) ||
        r.dialogue.beat < 0 ||
        r.dialogue.beat > 99 ||
        (r.dialogue.actor !== null &&
          !["mira", "noe", "emile"].includes(r.dialogue.actor)))) ||
    (r.cinematic !== null &&
      (!["scatter", "restore"].includes(r.cinematic.kind) ||
        !Number.isFinite(r.cinematic.elapsed) ||
        r.cinematic.elapsed < 0 ||
        r.cinematic.elapsed > 30000)) ||
    (r.escort !== null &&
      (!r.escort ||
        !["library", "village"].includes(r.escort.room) ||
        !["out", "place", "return", "inside"].includes(r.escort.phase) ||
        !Number.isFinite(r.escort.position?.x) ||
        !Number.isFinite(r.escort.position?.y)))
  )
    throw Error("État de scène incompatible");
  return r;
}
