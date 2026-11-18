import {
  validateDefinition,
  type EpisodeDefinition,
  type NarrativeScene,
  type NarrativeProgress,
} from "./engine";
import type { Point, Save } from "../domain";
import type { GameEvent } from "../rpg/quests";
import type { Presentation } from "./orchestration";
import {
  validateFlowDefinition,
  validatePuzzle,
  validateFlowRuntime,
  type FlowDefinition,
  type FlowScene,
  type FlowRuntime,
} from "./flow";

export type SceneKind =
  "arrival" | "meet" | "tree" | "scatter" | "trail" | "restore" | "home";
export type Beat = {
  speaker: string;
  text: string;
  choiceId?: string;
  nextByOption?: Record<string, number | null>;
};
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
  flow?: FlowScene;
};
export type EpisodeScript = Omit<EpisodeDefinition, "scenes"> & {
  schema: 1;
  title: string;
  scenes: ScriptScene[];
  book: { title: string; text: string };
  hints?: string[];
  flow?: FlowDefinition;
};
export type EpisodeRuntime = {
  flow?: FlowRuntime;
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
  if (s.flow) validateFlowDefinition(s.flow);
  if (s.flow?.media?.some((m) => m.day > s.day))
    throw Error("Média futur interdit");
  const actionIds = new Set<string>();
  for (const scene of s.scenes) {
    if (s.flow) {
      if (
        !scene.flow ||
        !Array.isArray(scene.flow.actions) ||
        scene.flow.actions.length > 100
      )
        throw Error("Actions narratives manquantes");
      for (const action of scene.flow.actions) {
        if (
          action.icon &&
          !["letter", "blue-letter", "book", "stone"].includes(action.icon)
        )
          throw Error("Objet narratif inconnu");
        if (
          actionIds.has(action.id) ||
          (action.replayable && !scene.flow.optional) ||
          (scene.flow.optional && s.scenes.at(-1) !== scene) ||
          (action.availableAfter !== undefined &&
            (!Number.isSafeInteger(action.availableAfter) ||
              action.availableAfter < 0 ||
              action.availableAfter >= s.scenes.length)) ||
          (action.anyRoom && action.point.anchor !== "companion:loyal")
        )
          throw Error("Portée d’action invalide");
        actionIds.add(action.id);
        if (
          !scene.objectives.some((o) => o.id === action.id) ||
          !text(action.label, 300) ||
          !action.point ||
          ![
            "village",
            "house",
            "library",
            "workshop",
            "inn",
            "forest",
            "bakery",
            "lake",
            "hamlet",
            "clockshop",
          ].includes(action.point.room) ||
          !text(action.point.anchor, 100)
        )
          throw Error("Point narratif invalide");
        if (action.dialogue && !scene.dialogues[action.dialogue])
          throw Error("Dialogue narratif absent");
        if (
          action.inspect &&
          !s.flow.media?.some((m) => m.key === action.inspect)
        )
          throw Error("Observation privée non déclarée");
        if (
          action.constellation !== undefined &&
          ![6, 12].includes(action.constellation)
        )
          throw Error("Constellation invalide");
        if (
          action.waitForFollower &&
          action.waitForFollower !== s.flow.follower?.actor
        )
          throw Error("Compagnon non déclaré");
        if (
          action.variants &&
          (!Array.isArray(action.variants) ||
            action.variants.length > 10 ||
            action.variants.some(
              (v) =>
                !v ||
                !text(v.fact, 160) ||
                !scene.dialogues[v.dialogue] ||
                !["string", "boolean"].includes(typeof v.value),
            ))
        )
          throw Error("Variante contextuelle invalide");
        if (action.puzzle) validatePuzzle(action.puzzle);
      }
    }
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
      for (const [index, beat] of beats.entries()) {
        if (
          !text(beat.speaker, 80) ||
          !text(beat.text) ||
          (beat.choiceId && !scene.choices.some((c) => c.id === beat.choiceId))
        )
          throw Error("Réplique invalide");
        if (
          beat.nextByOption &&
          (!beat.choiceId ||
            Object.entries(beat.nextByOption).some(
              ([id, next]) =>
                !scene.choices
                  .find((c) => c.id === beat.choiceId)
                  ?.options.some((o) => o.id === id) ||
                (next !== null &&
                  (!Number.isInteger(next) ||
                    next <= index ||
                    next >= beats.length)),
            ))
        )
          throw Error("Branche de dialogue invalide");
      }
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
  if (r?.flow) validateFlowRuntime(r.flow);
  const rooms = [
    "lake",
    "hamlet",
    "clockshop",
    "village",
    "house",
    "library",
    "workshop",
    "inn",
    "forest",
    "bakery",
  ];
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
    r.visited.length > 10 ||
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
          !["mira", "noe", "emile", "oscar"].includes(r.dialogue.actor)))) ||
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
