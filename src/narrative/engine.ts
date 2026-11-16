import type { Save } from "../domain";
import { satisfies, type Condition } from "../rpg/dialogue";
import type { GameEvent } from "../rpg/quests";
import type { DayStatus } from "../advent/model";
import { episodeId } from "./catalog";

export type NarrativeScene = {
  id: string;
  requires?: Condition[];
  dialogueKey?: string; // Reuse existing DialogueGraph, never a second text engine.
  objectives: {
    id: string;
    event: GameEvent;
    optional?: boolean;
    after?: string[];
  }[];
  choices: {
    id: string;
    optional?: boolean;
    options: {
      id: string;
      condition?: Condition;
    }[];
  }[];
};
export type EpisodeDefinition = {
  day: number;
  version: number;
  scriptStatus: "missing" | "validated";
  dependsOn: number[];
  scenes: NarrativeScene[];
};
export type NarrativeProgress = {
  schema: 1;
  episodeId: string;
  definitionVersion: number;
  revision: number;
  sceneIndex: number;
  complete: boolean;
  objectives: string[];
  choices: Record<string, string>;
  completedScenes: string[];
};
export type NarrativeContext = { world: Save; completedDays: number[] };
const key = (scene: string, id: string) => `${scene}/${id}`;
const validId = (id: string) => /^[a-z][a-z0-9-]{0,79}$/.test(id);
function unique(ids: string[]) {
  if (new Set(ids).size !== ids.length || ids.some((id) => !validId(id)))
    throw Error("Identifiants narratifs invalides ou dupliqués");
}
export function validateDefinition(d: EpisodeDefinition) {
  episodeId(d.day);
  if (
    d.scriptStatus !== "validated" ||
    !Number.isSafeInteger(d.version) ||
    d.version < 1 ||
    !d.scenes.length ||
    d.scenes.length > 100 ||
    new Set(d.dependsOn).size !== d.dependsOn.length ||
    d.dependsOn.some((n) => !Number.isInteger(n) || n < 1 || n >= d.day)
  )
    throw Error("Cahier validé ou définition narrative manquant");
  unique(d.scenes.map((s) => s.id));
  for (const scene of d.scenes) {
    unique(scene.objectives.map((o) => o.id));
    unique(scene.choices.map((c) => c.id));
    for (const [index, goal] of scene.objectives.entries())
      if (
        goal.after?.some(
          (id) => !scene.objectives.slice(0, index).some((o) => o.id === id),
        )
      )
        throw Error("Dépendance d'objectif invalide");
    if (!scene.objectives.length && !scene.choices.length)
      throw Error("Scène sans objectif");
    for (const objective of scene.objectives)
      if (
        !["talk", "explore", "find", "solve", "minigame", "interact"].includes(
          objective.event.kind,
        ) ||
        !objective.event.target ||
        objective.event.target.length > 160
      )
        throw Error("Événement invalide");
    for (const choice of scene.choices) {
      if (!choice.options.length || choice.options.length > 4)
        throw Error("Un à quatre choix requis");
      unique(choice.options.map((o) => o.id));
    }
  }
}
function allowed(scene: NarrativeScene, context: NarrativeContext) {
  return (scene.requires ?? []).every((c) => satisfies(context.world, c));
}
// Access is a result from AdventAPI.status(). This local reducer is NOT server authorization.
export function startEpisode(
  d: EpisodeDefinition,
  access: Pick<DayStatus, "day" | "unlocked">,
  context: NarrativeContext,
): NarrativeProgress {
  validateDefinition(d);
  if (
    access.day !== d.day ||
    !access.unlocked ||
    !d.dependsOn.every((n) => context.completedDays.includes(n)) ||
    !allowed(d.scenes[0], context)
  )
    throw Error("Épisode indisponible");
  return {
    schema: 1,
    episodeId: episodeId(d.day),
    definitionVersion: d.version,
    revision: 0,
    sceneIndex: 0,
    complete: false,
    objectives: [],
    choices: {},
    completedScenes: [],
  };
}
export function restoreProgress(
  d: EpisodeDefinition,
  raw: unknown,
): NarrativeProgress {
  validateDefinition(d);
  const p = raw as NarrativeProgress;
  if (
    !p ||
    p.schema !== 1 ||
    p.episodeId !== episodeId(d.day) ||
    p.definitionVersion !== d.version ||
    !Number.isSafeInteger(p.revision) ||
    p.revision < 0 ||
    !Number.isInteger(p.sceneIndex) ||
    p.sceneIndex < 0 ||
    p.sceneIndex > d.scenes.length ||
    p.complete !== (p.sceneIndex === d.scenes.length) ||
    !Array.isArray(p.completedScenes) ||
    JSON.stringify(p.completedScenes) !==
      JSON.stringify(d.scenes.slice(0, p.sceneIndex).map((s) => s.id)) ||
    !Array.isArray(p.objectives) ||
    new Set(p.objectives).size !== p.objectives.length ||
    !p.choices ||
    typeof p.choices !== "object" ||
    Array.isArray(p.choices)
  )
    throw Error("Checkpoint narratif incompatible");
  const seen = d.scenes.slice(0, Math.min(p.sceneIndex + 1, d.scenes.length));
  const goals = seen.flatMap((s) => s.objectives.map((o) => key(s.id, o.id)));
  if (
    p.objectives.some((id) => !goals.includes(id)) ||
    Object.entries(p.choices).some(
      ([id, option]) =>
        !seen.some((s) =>
          s.choices.some(
            (c) =>
              key(s.id, c.id) === id && c.options.some((o) => o.id === option),
          ),
        ),
    )
  )
    throw Error("Checkpoint narratif invalide");
  for (const s of d.scenes.slice(0, p.sceneIndex))
    if (!requirementsMet(s, p))
      throw Error("Scène terminée sans ses objectifs");
  for (const s of seen)
    for (const o of s.objectives)
      if (
        p.objectives.includes(key(s.id, o.id)) &&
        o.after?.some((id) => !p.objectives.includes(key(s.id, id)))
      )
        throw Error("Objectifs hors séquence");
  return structuredClone(p);
}
function requirementsMet(s: NarrativeScene, p: NarrativeProgress) {
  return (
    s.objectives.every(
      (o) => o.optional || p.objectives.includes(key(s.id, o.id)),
    ) &&
    s.choices.every(
      (c) => c.optional || p.choices[key(s.id, c.id)] !== undefined,
    )
  );
}
export function receiveEvent(
  d: EpisodeDefinition,
  previous: NarrativeProgress,
  event: GameEvent,
) {
  const p = restoreProgress(d, previous);
  if (p.complete) return p;
  const scene = d.scenes[p.sceneIndex];
  for (const o of scene.objectives)
    if (
      o.event.kind === event.kind &&
      o.event.target === event.target &&
      (o.after ?? []).every((id) => p.objectives.includes(key(scene.id, id))) &&
      !p.objectives.includes(key(scene.id, o.id))
    )
      p.objectives.push(key(scene.id, o.id));
  if (p.objectives.length !== previous.objectives.length) p.revision++;
  return p;
}
export function selectNarrativeChoice(
  d: EpisodeDefinition,
  previous: NarrativeProgress,
  choiceId: string,
  optionId: string,
  context: NarrativeContext,
) {
  const p = restoreProgress(d, previous);
  if (p.complete) throw Error("Épisode terminé");
  const scene = d.scenes[p.sceneIndex],
    choice = scene.choices.find((c) => c.id === choiceId),
    option = choice?.options.find((o) => o.id === optionId),
    id = key(scene.id, choiceId);
  if (
    !option ||
    !allowed(scene, context) ||
    !satisfies(context.world, option.condition)
  )
    throw Error("Choix indisponible");
  if (p.choices[id] !== undefined && p.choices[id] !== optionId)
    throw Error("Choix déjà enregistré");
  if (p.choices[id] === undefined) {
    p.choices[id] = optionId;
    p.revision++;
  }
  return p;
}
export function finishScene(
  d: EpisodeDefinition,
  previous: NarrativeProgress,
  context: NarrativeContext,
) {
  const p = restoreProgress(d, previous);
  if (p.complete) return p;
  const scene = d.scenes[p.sceneIndex],
    next = d.scenes[p.sceneIndex + 1];
  if (
    !requirementsMet(scene, p) ||
    !allowed(scene, context) ||
    (next && !allowed(next, context))
  )
    throw Error("Objectifs ou conditions incomplets");
  p.completedScenes.push(scene.id);
  p.sceneIndex++;
  p.revision++;
  p.complete = p.sceneIndex === d.scenes.length;
  return p;
}
// Only discovered facts, no future labels/texts. No fabricated neutral choices.
export function discoveredJournal(p: NarrativeProgress) {
  return { scenes: [...p.completedScenes], choices: { ...p.choices } };
}
// A stable reconciliation key, NOT an award to Save.stars or the private backend.
export const rewardKey = (p: NarrativeProgress) =>
  p.complete ? `${p.episodeId}/star` : null;
