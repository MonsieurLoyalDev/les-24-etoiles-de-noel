import type { Room } from "../rpg/world";
export type Value =
  null | boolean | number | string | Value[] | { [key: string]: Value };
export type StepKind =
  | "read"
  | "choice"
  | "input"
  | "write"
  | "collect"
  | "sequence"
  | "melody"
  | "photo"
  | "memory"
  | "wrap"
  | "media"
  | "hunt"
  | "decorate"
  | "story"
  | "voucher"
  | "connect"
  | "scene";
export type Item = { id: string; label: string; detail?: string };
export type StoryNode = {
  text: string;
  choices: { id: string; label: string; next: string }[];
};
export type Step = {
  id: string;
  kind: StepKind;
  prompt: string;
  text?: string;
  items?: Item[];
  options?: Item[];
  minimum?: number;
  mediaPath?: string;
  mediaType?: "image" | "video";
  transcript?: string[];
  story?: Record<string, StoryNode>;
  style?: string;
};
export type Day = {
  day: number;
  title: string;
  intro: string;
  room: Room;
  reward: string;
  steps: Step[];
  version: number;
};
export type Rule = { expected?: Value; minimum?: number; minLength?: number };
export type EditableDay = { content: Day; rules: Record<string, Rule> };
export type Run = {
  day: number;
  runId: string;
  contentVersion?: number;
  checked: string[];
  complete: boolean;
  completedAt: string | null;
  values: Record<string, Value>;
  memory: Record<string, Value>;
};
export type DayStatus = {
  day: number;
  unlocked: boolean;
  complete: boolean;
  run: Run | null;
};
export const kinds: StepKind[] = [
  "read",
  "choice",
  "input",
  "write",
  "collect",
  "sequence",
  "melody",
  "photo",
  "memory",
  "wrap",
  "media",
  "hunt",
  "decorate",
  "story",
  "voucher",
  "connect",
  "scene",
];
export const rooms: Room[] = ["village", "house", "library", "workshop", "inn"];
export function unlockInstant(day: number) {
  if (!Number.isInteger(day) || day < 1 || day > 24)
    throw Error("Jour invalide");
  return Date.UTC(2026, 11, day - 1, 23);
}
// Display/demo only. Production authorization is exclusively PostgreSQL/RLS.
export function demoUnlocked(day: number, now: number) {
  return now >= unlockInstant(day);
}
export const normalize = (v: Value) =>
  typeof v === "string" ? v.trim().toLocaleLowerCase("fr") : v;
export function validEvidence(step: Step, rule: Rule, value: Value): boolean {
  if (rule.expected !== undefined) {
    if (Array.isArray(rule.expected)) {
      if (!Array.isArray(value)) return false;
      return ["sequence", "melody", "photo", "connect"].includes(step.kind)
        ? JSON.stringify(value) === JSON.stringify(rule.expected)
        : JSON.stringify([...value].sort()) ===
            JSON.stringify([...rule.expected].sort());
    }
    return normalize(value) === normalize(rule.expected);
  }
  if (["read", "collect", "decorate", "hunt"].includes(step.kind)) {
    return (
      Array.isArray(value) &&
      new Set(value).size === value.length &&
      value.length >=
        (rule.minimum ?? step.minimum ?? step.items?.length ?? 1) &&
      value.every((v) => step.items?.some((i) => i.id === v))
    );
  }
  if (step.kind === "choice")
    return (
      typeof value === "string" && !!step.options?.some((i) => i.id === value)
    );
  if (["write", "input"].includes(step.kind))
    return (
      typeof value === "string" &&
      value.trim().length >= (rule.minLength ?? 12) &&
      value.length <= 10000
    );
  if (step.kind === "media") return value === true;
  if (step.kind === "voucher") {
    if (!value || Array.isArray(value) || typeof value !== "object")
      return false;
    return (
      typeof value.recipient === "string" &&
      value.recipient.trim().length > 0 &&
      typeof value.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
      !!step.options?.some((i) => i.id === value.option)
    );
  }
  if (step.kind === "story") {
    if (!Array.isArray(value) || !step.story) return false;
    let node = "start";
    for (const token of value) {
      const choice = step.story[node]?.choices.find(
        (c) => `${node}:${c.id}` === token,
      );
      if (!choice) return false;
      node = choice.next;
    }
    return node === "end" && value.length > 0;
  }
  if (step.kind === "scene") return value === 4;
  return false;
}
export function validateEditable(input: unknown): EditableDay {
  const d = input as EditableDay;
  const c = d?.content;
  if (
    !c ||
    !Number.isInteger(c.day) ||
    c.day < 1 ||
    c.day > 24 ||
    typeof c.title !== "string" ||
    !c.title.trim() ||
    typeof c.intro !== "string" ||
    typeof c.reward !== "string" ||
    !rooms.includes(c.room) ||
    !Number.isInteger(c.version) ||
    !Array.isArray(c.steps) ||
    c.steps.length < 1 ||
    c.steps.length > 12 ||
    !d.rules ||
    typeof d.rules !== "object"
  )
    throw Error("Définition de journée invalide");
  const ids = new Set<string>();
  for (const s of c.steps) {
    if (
      !s ||
      typeof s.id !== "string" ||
      !/^[a-z0-9_-]{1,40}$/.test(s.id) ||
      ids.has(s.id) ||
      !kinds.includes(s.kind) ||
      typeof s.prompt !== "string" ||
      s.prompt.length > 4000 ||
      "expected" in s ||
      "answer" in s ||
      "rules" in s
    )
      throw Error("Étape invalide ou réponse dans le contenu public");
    ids.add(s.id);
    for (const list of [s.items, s.options])
      if (
        list &&
        (!Array.isArray(list) ||
          list.some(
            (i) =>
              !i || typeof i.id !== "string" || typeof i.label !== "string",
          ) ||
          new Set(list.map((i) => i.id)).size !== list.length)
      )
        throw Error("Liste d’éléments invalide");
    if (
      s.mediaPath &&
      !s.mediaPath.startsWith(`${c.day}/`) &&
      !s.mediaPath.startsWith("/demo/")
    )
      throw Error("Le média doit appartenir à cette journée");
    if (
      s.minimum !== undefined &&
      (!Number.isInteger(s.minimum) ||
        s.minimum < 1 ||
        s.minimum > (s.items?.length ?? 0))
    )
      throw Error("Objectif impossible");
    if (s.kind === "story" && (!s.story?.start || !s.story?.end))
      throw Error("Histoire sans début ou fin");
    if (!d.rules[s.id]) throw Error("Règle de réussite manquante");
  }
  if (JSON.stringify(d).length > 200000)
    throw Error("Journée trop volumineuse");
  return structuredClone(d);
}
export function newRun(day: number, previous?: Run | null): Run {
  return {
    day,
    runId: crypto.randomUUID(),
    checked: [],
    complete: !!previous?.complete,
    completedAt: previous?.completedAt ?? null,
    values: {},
    memory: previous?.memory ?? {},
  };
}
