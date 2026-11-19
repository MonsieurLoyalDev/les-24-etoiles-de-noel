export type MapNote = { from: string; to: string; locked: true };
export function isMapNote(value: unknown): value is MapNote {
  const note = value as MapNote;
  return (
    !!note &&
    note.locked === true &&
    [note.from, note.to].every(
      (v) => typeof v === "string" && v.length > 0 && v.length <= 100,
    )
  );
}
import type { WorldRoom, Point } from "../domain";
export type AnchorRef = { room: WorldRoom; anchor: string; offset?: Point };
export type Puzzle = {
  hintAfterAttempt?: boolean;
  assisted?: boolean;
  cards?: Record<string, string>;
  assembly?: {
    base: string;
    layers: {
      id: string;
      src: string;
      x?: number;
      y?: number;
      width?: number;
    }[];
    choice?: string;
    backdrops?: Record<string, string>;
  };
  kind:
    | "circuit"
    | "matching"
    | "order"
    | "sequence"
    | "selection"
    | "cooking"
    | "dial";
  unique?: boolean;
  illustrations?: Record<string, { real: string; reflection: string }>;
  feedback?: { speaker: string; text: string };
  title: string;
  prompt: string;
  hint: string;
  items: { id: string; label: string; detail?: string }[];
  initial?: string[];
  answer?: string[];
  matches?: Record<string, string>;
  options?: { id: string; label: string }[];
  circuit?: {
    size: number;
    masks: number[];
    rotations: number[];
    source: number;
    input: number;
    outputs: { cell: number; port: number }[];
  };
  quantities?: Record<string, { target: number; step: number; unit: string }>;
  mix?: number;
  golden?: [number, number];
};
export type PuzzleDraft = {
  values: Record<string, string | number | boolean>;
  order: string[];
  rotations: number[];
  sequence: string[];
  mix: number;
  heat: number;
  phase: number;
  attempts: number;
  solved: boolean;
};
export type FlowAction = {
  moments?: Record<string, "hands" | "hug" | "glasses">;
  performance?: PerformanceDefinition;
  id: string;
  label: string;
  point: AnchorRef;
  anyRoom?: boolean;
  actor?: string;
  dialogue?: string;
  puzzle?: Puzzle;
  icon?: "letter" | "blue-letter" | "book" | "stone";
  gesture?: "assist" | "uncover" | "move";
  effect?: "restore" | "reveal" | "celebrate";
  constellation?: 6 | 12;
  variants?: { fact: string; value: string | boolean; dialogue: string }[];
  when?: { fact: string; value: string | boolean };
  waitForFollower?: string;
  inspect?: string;
  waitForGather?: boolean;
  optional?: boolean;
  replayable?: boolean;
  availableAfter?: number;
};
export type FlowScene = { actions: FlowAction[]; optional?: boolean };
/** A resident may still be walking between rooms. Do not invent an anchor or
 * crash room entry while its real sprite is absent. */
export function residentAnchorAvailable(
  action: FlowAction,
  room: WorldRoom,
  residents: readonly string[],
) {
  return (
    action.point.room !== room ||
    !action.point.anchor.startsWith("resident:") ||
    residents.includes(action.point.anchor.slice(9))
  );
}
export type FlowLights = {
  points: string[];
  requires: string;
  choice: string;
  styles: Record<string, { tint: number; shimmer?: boolean }>;
};
export type FlowDefinition = {
  period?: 0 | 1 | 2 | 3;
  periodFrom?: number;
  paths?: { room: WorldRoom; points: Point[]; from: number }[];
  theatre?: {
    style?: string;
    inherited?: string;
    built: string;
    point: AnchorRef;
    persistentPoint?: AnchorRef;
    requires?: string;
  };
  confidences?: {
    id: string;
    author: string;
    status: "shared" | "private" | "draft";
    privateAfter?: string;
    requires: string;
    text?: string;
  }[];
  media?: { key: string; day: number; path: string }[];
  placements?: {
    id: string;
    texture: string;
    point: AnchorRef;
    width: number;
    caption?: string;
    inscription?: string;
    requires?: string;
    persistent?: boolean;
    mirror?: boolean;
    choice?: { key: string; option: string };
  }[];
  schema: 1;
  portals: (
    | "forest"
    | "bakery"
    | "lake"
    | "hamlet"
    | "clockshop"
    | "reserve"
    | "glade"
    | "keeper"
  )[];
  portalAccess?: Partial<
    Record<
      | "forest"
      | "bakery"
      | "lake"
      | "hamlet"
      | "clockshop"
      | "reserve"
      | "glade"
      | "keeper",
      { label: string; after: number }
    >
  >;
  actors?: {
    id: string;
    name: string;
    appearance: "baker" | "clockmaker" | "basile" | "emile";
    point: AnchorRef;
    scenePoints?: { from: number; point: AnchorRef }[];
    projection?: { fixture: string; foregroundFrom: number };
  }[];
  gather?: {
    from: number;
    until: number;
    actors: string[];
    destinations?: Record<string, AnchorRef>;
  };
  facts?: Record<
    string,
    { scene: string; choice?: string; objective?: string }
  >;
  bookExtras?: {
    title: string;
    text: string;
    requires?: string;
    mapNote?: MapNote;
  }[];
  lights?: FlowLights;
  network?: { point: string; requires?: string; visual?: boolean }[];
  weather?: { from: number; until: number };
  follower?: {
    actor: string;
    from: number;
    until: number;
    requires: string;
    destination: AnchorRef;
  };
  audio?: Record<string, string>;
};
export type FlowRuntime = {
  performance?: { action: string; elapsed: number } | null;
  previousClock?: number;
  drafts: Record<string, PuzzleDraft>;
  active: string | null;
  steps: Record<string, number>;
  fx: { action: string; elapsed: number } | null;
  seen: string[];
  side: string | null;
  sideChoices: Record<string, string>;
  followers?: Record<string, { room: WorldRoom; x: number; y: number }>;
};
export type PerformanceDefinition = {
  kind: "theatre" | "fireflies" | "concert";
  duration: number;
  shape?: "trail" | "flower-tree-star";
  subtitles?: string[];
  destination?: AnchorRef;
  origin?: AnchorRef;
};
export const newFlowRuntime = (): FlowRuntime => ({
  drafts: {},
  active: null,
  steps: {},
  fx: null,
  seen: [],
  side: null,
  sideChoices: {},
});
export function newPuzzle(p: Puzzle): PuzzleDraft {
  return {
    values: {},
    order: [...(p.initial ?? p.items.map((i) => i.id))],
    rotations: [...(p.circuit?.rotations ?? [])],
    sequence: [],
    mix: 0,
    heat: 0,
    phase: 0,
    attempts: 0,
    solved: false,
  };
}
export function rotateMask(mask: number, rotation: number) {
  let result = mask;
  for (let i = 0; i < ((rotation % 4) + 4) % 4; i++)
    result = ((result << 1) & 15) | (result >> 3);
  return result;
}
export function circuitPower(
  p: NonNullable<Puzzle["circuit"]>,
  rotations: number[],
) {
  const masks = p.masks.map((m, i) => rotateMask(m, rotations[i] ?? 0));
  const powered = new Set<number>();
  if (!(masks[p.source] & p.input))
    return { cells: [] as number[], outputs: 0 };
  const queue = [p.source];
  powered.add(p.source);
  for (let at = 0; at < queue.length; at++) {
    const i = queue[at],
      x = i % p.size,
      y = Math.floor(i / p.size);
    for (const [dx, dy, port, opposite] of [
      [0, -1, 1, 4],
      [1, 0, 2, 8],
      [0, 1, 4, 1],
      [-1, 0, 8, 2],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        j = ny * p.size + nx;
      if (nx < 0 || ny < 0 || nx >= p.size || ny >= p.size || powered.has(j))
        continue;
      if (masks[i] & port && masks[j] & opposite) {
        powered.add(j);
        queue.push(j);
      }
    }
  }
  return {
    cells: [...powered],
    outputs: p.outputs.filter(
      (o) => powered.has(o.cell) && masks[o.cell] & o.port,
    ).length,
  };
}
export function puzzleSolved(p: Puzzle, d: PuzzleDraft) {
  if (p.kind === "circuit")
    return (
      !!p.circuit &&
      circuitPower(p.circuit, d.rotations).outputs === p.circuit.outputs.length
    );
  if (p.kind === "matching")
    return (
      !!p.matches &&
      Object.entries(p.matches).every(([k, v]) => d.values[k] === v)
    );
  if (p.kind === "order" || p.kind === "dial")
    return JSON.stringify(d.order) === JSON.stringify(p.answer);
  if (p.kind === "sequence")
    return JSON.stringify(d.sequence) === JSON.stringify(p.answer);
  if (p.kind === "selection")
    return p.items.every(
      (i) => Boolean(d.values[i.id]) === (p.answer ?? []).includes(i.id),
    );
  return (
    !!p.quantities &&
    Object.entries(p.quantities).every(
      ([id, q]) => d.values[id] === q.target,
    ) &&
    d.mix >= (p.mix ?? 5) &&
    d.heat >= (p.golden?.[0] ?? 60) &&
    d.heat <= (p.golden?.[1] ?? 80)
  );
}
export type PuzzleMove = {
  type:
    | "rotate"
    | "match"
    | "swap"
    | "sequence"
    | "toggle"
    | "measure"
    | "mix"
    | "heat"
    | "check"
    | "reset";
  id?: string;
  value?: string | number;
};
export function puzzleMove(
  p: Puzzle,
  previous: PuzzleDraft,
  move: PuzzleMove,
): PuzzleDraft {
  const d = structuredClone(previous);
  if (d.solved) return d;
  if (move.type === "reset") return { ...newPuzzle(p), attempts: d.attempts };
  const id = move.id ?? "",
    index = p.items.findIndex((i) => i.id === id);
  if (move.type === "rotate" && p.kind === "circuit" && index >= 0)
    d.rotations[index] = (d.rotations[index] + 1) % 4;
  if (
    move.type === "match" &&
    p.kind === "matching" &&
    index >= 0 &&
    p.options?.some((o) => o.id === move.value)
  ) {
    if (p.unique)
      for (const key of Object.keys(d.values))
        if (key !== id && d.values[key] === move.value) delete d.values[key];
    d.values[id] = String(move.value);
  }
  if (move.type === "toggle" && p.kind === "selection" && index >= 0)
    d.values[id] = !d.values[id];
  if (
    move.type === "swap" &&
    (p.kind === "order" || p.kind === "dial") &&
    index >= 0 &&
    [-1, 1].includes(Number(move.value))
  ) {
    const i = d.order.indexOf(id),
      j = i + Number(move.value);
    if (i >= 0 && j >= 0 && j < d.order.length)
      [d.order[i], d.order[j]] = [d.order[j], d.order[i]];
  }
  if (move.type === "rotate" && p.kind === "dial")
    d.order.push(d.order.shift()!);
  if (move.type === "sequence" && index >= 0) {
    d.sequence.push(id);
    if (
      !p.answer
        ?.slice(0, d.sequence.length)
        .every((v, i) => v === d.sequence[i])
    ) {
      d.sequence = [];
      d.attempts++;
    }
  }
  if (
    move.type === "measure" &&
    p.kind === "cooking" &&
    p.quantities?.[id] &&
    [-1, 1].includes(Number(move.value))
  ) {
    const q = p.quantities[id];
    d.values[id] = Math.max(
      0,
      Math.min(
        q.target * 2,
        Number(d.values[id] ?? 0) + q.step * Number(move.value),
      ),
    );
    d.mix = 0;
    d.heat = 0;
  }
  if (
    move.type === "mix" &&
    p.kind === "cooking" &&
    Object.entries(p.quantities ?? {}).every(
      ([key, q]) => d.values[key] === q.target,
    )
  )
    d.mix = Math.min(p.mix ?? 5, d.mix + 1);
  if (move.type === "heat" && p.kind === "cooking" && d.mix >= (p.mix ?? 5))
    d.heat = Math.min(100, d.heat + 10);
  if (move.type === "check") {
    d.solved = puzzleSolved(p, d);
    if (!d.solved) {
      d.attempts = Math.min(10000, d.attempts + 1);
      if (p.kind === "cooking" && d.heat > (p.golden?.[1] ?? 80)) d.heat = 0;
    }
  }
  return d;
}
export function validateFlowDefinition(f: FlowDefinition) {
  if (f.period !== undefined && ![0, 1, 2, 3].includes(f.period))
    throw Error("Période de présentation invalide");
  if (
    f.confidences &&
    (!Array.isArray(f.confidences) ||
      f.confidences.length > 20 ||
      new Set(f.confidences.map((v) => v.id)).size !== f.confidences.length ||
      f.confidences.some(
        (v) =>
          !v ||
          !/^[a-z][a-z0-9-]{0,79}$/.test(v.id) ||
          typeof v.author !== "string" ||
          !v.author.length ||
          v.author.length > 80 ||
          !["shared", "private", "draft"].includes(v.status) ||
          !/^[a-z][a-z0-9-]{0,79}\/[a-z][a-z0-9-]{0,79}$/.test(v.requires) ||
          (v.status !== "shared" && v.text !== undefined) ||
          (v.status === "shared" &&
            (typeof v.text !== "string" ||
              !v.text.length ||
              v.text.length > 4000)),
      ))
  )
    throw Error("Confidences incompatibles avec le consentement");
  if (
    f.media &&
    (!Array.isArray(f.media) ||
      f.media.length > 10 ||
      f.media.some(
        (v) =>
          !v ||
          !/^private-[a-z0-9-]{1,70}$/.test(v.key) ||
          !Number.isSafeInteger(v.day) ||
          v.day < 1 ||
          v.day > 24 ||
          !new RegExp("^" + v.day + "/[a-zA-Z0-9_-]+\\.(png|webp|jpg)$").test(
            v.path,
          ),
      ))
  )
    throw Error("Média privé invalide");
  if (
    f.schema !== 1 ||
    !Array.isArray(f.portals) ||
    f.portals.some(
      (v) =>
        ![
          "forest",
          "bakery",
          "lake",
          "hamlet",
          "clockshop",
          "reserve",
          "glade",
          "keeper",
        ].includes(v),
    )
  )
    throw Error("Régions narratives invalides");
  const id = (v: unknown) =>
    typeof v === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(v);
  const anchor = (p: AnchorRef) =>
    p &&
    [
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
      "reserve",
      "glade",
      "keeper",
    ].includes(p.room) &&
    typeof p.anchor === "string" &&
    p.anchor.length > 0 &&
    p.anchor.length <= 100 &&
    (!p.offset ||
      [p.offset.x, p.offset.y].every(
        (n) => Number.isFinite(n) && Math.abs(n) <= 512,
      ));
  if (
    f.theatre &&
    (!anchor(f.theatre.point) ||
      typeof f.theatre.built !== "string" ||
      f.theatre.built.length > 200 ||
      (f.theatre.style !== undefined &&
        (typeof f.theatre.style !== "string" ||
          f.theatre.style.length > 200)) ||
      (f.theatre.inherited !== undefined &&
        !/^episode-[0-9]{2}\/[a-z][a-z0-9-]{0,79}$/.test(f.theatre.inherited)))
  )
    throw Error("Objet personnalisable invalide");
  const range = (v: { from: number; until: number }) =>
    Number.isSafeInteger(v.from) &&
    Number.isSafeInteger(v.until) &&
    v.from >= 0 &&
    v.until >= v.from &&
    v.until <= 99;
  if (
    f.periodFrom !== undefined &&
    (!Number.isSafeInteger(f.periodFrom) ||
      f.periodFrom < 0 ||
      f.periodFrom > 99)
  )
    throw Error("Début d’ambiance invalide");
  if (
    f.paths &&
    (!Array.isArray(f.paths) ||
      f.paths.length > 8 ||
      f.paths.some(
        (path) =>
          !anchor({ room: path.room, anchor: "point:0,0" }) ||
          !Number.isSafeInteger(path.from) ||
          path.from < 0 ||
          path.from > 99 ||
          !Array.isArray(path.points) ||
          path.points.length < 2 ||
          path.points.length > 20 ||
          path.points.some(
            (p) =>
              !p ||
              !Number.isFinite(p.x + p.y) ||
              p.x < 0 ||
              p.x > 1920 ||
              p.y < 0 ||
              p.y > 1408,
          ) ||
          path.points
            .slice(1)
            .reduce(
              (length, p, i) =>
                length +
                Math.hypot(p.x - path.points[i].x, p.y - path.points[i].y),
              0,
            ) > 2000,
      ))
  )
    throw Error("Sentier de présentation invalide");
  const objective = (v: string) =>
    /^[a-z][a-z0-9-]{0,79}\/[a-z][a-z0-9-]{0,79}$/.test(v);
  if (f.weather && !range(f.weather)) throw Error("Période météo invalide");
  if (
    f.follower &&
    (!range(f.follower) ||
      !id(f.follower.actor) ||
      !objective(f.follower.requires) ||
      !anchor(f.follower.destination))
  )
    throw Error("Accompagnement invalide");
  if (
    f.network &&
    (!Array.isArray(f.network) ||
      f.network.length > 20 ||
      new Set(f.network.map((v) => v.point)).size !== f.network.length ||
      f.network.some(
        (v) =>
          !id(v.point) ||
          (v.visual !== undefined && typeof v.visual !== "boolean") ||
          (v.requires !== undefined && !objective(v.requires)),
      ))
  )
    throw Error("Réseau lumineux invalide");
  if (
    new Set(f.portals).size !== f.portals.length ||
    Object.entries(f.portalAccess ?? {}).some(
      ([key, value]) =>
        !f.portals.includes(
          key as
            | "forest"
            | "bakery"
            | "lake"
            | "hamlet"
            | "clockshop"
            | "reserve"
            | "glade"
            | "keeper",
        ) ||
        !value ||
        !Number.isSafeInteger(value.after) ||
        value.after < 0 ||
        value.after > 99 ||
        typeof value.label !== "string" ||
        !value.label.length ||
        value.label.length > 300,
    )
  )
    throw Error("Accès narratif invalide");
  if (
    f.actors &&
    (!Array.isArray(f.actors) ||
      f.actors.length > 10 ||
      new Set(f.actors.map((a) => a.id)).size !== f.actors.length ||
      f.actors.some(
        (a) =>
          !id(a.id) ||
          typeof a.name !== "string" ||
          !a.name.length ||
          a.name.length > 80 ||
          !["baker", "clockmaker", "basile", "emile"].includes(a.appearance) ||
          !anchor(a.point),
      ))
  )
    throw Error("Personnage narratif invalide");
  if (
    f.actors?.some(
      (a) =>
        a.scenePoints &&
        (!Array.isArray(a.scenePoints) ||
          a.scenePoints.length > 10 ||
          a.scenePoints.some(
            (p) =>
              !Number.isSafeInteger(p.from) ||
              p.from < 0 ||
              p.from > 99 ||
              !anchor(p.point),
          )),
    )
  )
    throw Error("Déplacement scénique invalide");
  if (
    f.gather &&
    (!Number.isSafeInteger(f.gather.from) ||
      !Number.isSafeInteger(f.gather.until) ||
      f.gather.from < 0 ||
      f.gather.until < f.gather.from ||
      f.gather.until > 99 ||
      !Array.isArray(f.gather.actors) ||
      !f.gather.actors.length ||
      new Set(f.gather.actors).size !== f.gather.actors.length ||
      f.gather.actors.some((a) => !["mira", "noe", "emile"].includes(a)))
  )
    throw Error("Rassemblement invalide");
  if (
    f.gather?.destinations &&
    Object.entries(f.gather.destinations).some(
      ([id, p]) => !f.gather!.actors.includes(id) || !anchor(p),
    )
  )
    throw Error("Destination scénique invalide");
  if (
    f.placements &&
    (!Array.isArray(f.placements) ||
      f.placements.length > 100 ||
      new Set(f.placements.map((p) => p.id)).size !== f.placements.length ||
      f.placements.some(
        (p) =>
          (p.inscription !== undefined &&
            (typeof p.inscription !== "string" ||
              !p.inscription.length ||
              p.inscription.length > 20)) ||
          !id(p.id) ||
          !anchor(p.point) ||
          typeof p.texture !== "string" ||
          !/^(production|private|d35|life|d31)-[a-z0-9-]{1,80}$/.test(
            p.texture,
          ) ||
          !Number.isFinite(p.width) ||
          p.width < 4 ||
          p.width > 200 ||
          (p.caption !== undefined &&
            (typeof p.caption !== "string" || p.caption.length > 100)),
      ))
  )
    throw Error("Composition narrative invalide");
  if (
    f.bookExtras &&
    (!Array.isArray(f.bookExtras) ||
      f.bookExtras.length > 10 ||
      f.bookExtras.some(
        (p) =>
          !p ||
          (p.mapNote !== undefined && !isMapNote(p.mapNote)) ||
          typeof p.title !== "string" ||
          !p.title.length ||
          p.title.length > 200 ||
          typeof p.text !== "string" ||
          !p.text.length ||
          p.text.length > 4000,
      ))
  )
    throw Error("Page narrative invalide");
  const l = f.lights;
  if (
    l &&
    (!Array.isArray(l.points) ||
      !l.points.length ||
      l.points.length > 20 ||
      l.points.some((p) => !id(p)) ||
      !l.styles ||
      Object.keys(l.styles).length > 4 ||
      Object.entries(l.styles).some(
        ([key, v]) =>
          !id(key) ||
          !v ||
          !Number.isSafeInteger(v.tint) ||
          v.tint < 0 ||
          v.tint > 0xffffff ||
          (v.shimmer !== undefined && typeof v.shimmer !== "boolean"),
      ))
  )
    throw Error("Style lumineux invalide");
}
export function validatePuzzle(p: Puzzle) {
  const image = (v: unknown) =>
    typeof v === "string" && /^\/assets\/[a-zA-Z0-9_\-/]+\.png$/.test(v);
  if (
    (p.hintAfterAttempt !== undefined &&
      typeof p.hintAfterAttempt !== "boolean") ||
    (p.assisted !== undefined &&
      (typeof p.assisted !== "boolean" || p.kind !== "sequence")) ||
    (p.cards &&
      (Object.keys(p.cards).length > 36 ||
        Object.entries(p.cards).some(
          ([id, src]) => !p.items.some((v) => v.id === id) || !image(src),
        ))) ||
    (p.assembly &&
      (p.kind !== "sequence" ||
        !image(p.assembly.base) ||
        !Array.isArray(p.assembly.layers) ||
        p.assembly.layers.length > 12 ||
        p.assembly.layers.some(
          (v) => !p.items.some((i) => i.id === v.id) || !image(v.src),
        )))
  )
    throw Error("Présentation d’activité invalide");
  if (
    p.assembly &&
    ((p.assembly.backdrops &&
      (Object.keys(p.assembly.backdrops).length > 3 ||
        Object.values(p.assembly.backdrops).some((src) => !image(src)))) ||
      (p.assembly.choice !== undefined &&
        (typeof p.assembly.choice !== "string" ||
          p.assembly.choice.length > 200)) ||
      p.assembly.layers.some((layer) =>
        [layer.x, layer.y, layer.width].some(
          (value) =>
            value !== undefined &&
            (!Number.isFinite(value) || value < 0 || value > 100),
        ),
      ))
  )
    throw Error("Calques de construction invalides");
  if (p.unique !== undefined && typeof p.unique !== "boolean")
    throw Error("Unicité invalide");
  if (
    p.illustrations &&
    (typeof p.illustrations !== "object" ||
      Object.values(p.illustrations).some(
        (v) =>
          !v ||
          ![v.real, v.reflection].every(
            (s) =>
              typeof s === "string" &&
              (s === "" || /^\/assets\/[a-zA-Z0-9_\-/]+\.png$/.test(s)),
          ),
      ))
  )
    throw Error("Illustration locale invalide");
  if (
    ![
      "dial",
      "circuit",
      "matching",
      "order",
      "sequence",
      "selection",
      "cooking",
    ].includes(p.kind) ||
    !p.title ||
    p.title.length > 180 ||
    !p.prompt ||
    p.prompt.length > 2000 ||
    !Array.isArray(p.items) ||
    p.items.length < 1 ||
    p.items.length > 36 ||
    new Set(p.items.map((i) => i.id)).size !== p.items.length
  )
    throw Error("Activité privée invalide");
  if (
    p.circuit &&
    (![2, 3, 4].includes(p.circuit.size) ||
      p.circuit.masks.length !== p.circuit.size ** 2 ||
      p.circuit.rotations.length !== p.circuit.masks.length ||
      p.circuit.masks.some((m) => !Number.isInteger(m) || m < 1 || m > 15))
  )
    throw Error("Circuit invalide");
  const ids = p.items.map((i) => i.id),
    validId = (v: string) =>
      typeof v === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(v),
    bounded = (n: number, min: number, max: number) =>
      Number.isSafeInteger(n) && n >= min && n <= max;
  if (
    p.items.some(
      (i) =>
        !validId(i.id) ||
        typeof i.label !== "string" ||
        !i.label.length ||
        i.label.length > 300 ||
        (i.detail !== undefined &&
          (typeof i.detail !== "string" || i.detail.length > 2000)),
    ) ||
    typeof p.hint !== "string" ||
    p.hint.length > 2000
  )
    throw Error("Descriptions d’activité invalides");
  if (p.kind === "circuit") {
    const c = p.circuit;
    if (
      !c ||
      ids.length !== c.masks.length ||
      c.rotations.some((r) => !bounded(r, 0, 3)) ||
      !bounded(c.source, 0, c.masks.length - 1) ||
      ![1, 2, 4, 8].includes(c.input) ||
      !Array.isArray(c.outputs) ||
      !c.outputs.length ||
      c.outputs.length > 16 ||
      c.outputs.some(
        (o) =>
          !bounded(o.cell, 0, c.masks.length - 1) ||
          ![1, 2, 4, 8].includes(o.port),
      )
    )
      throw Error("Bornes du circuit invalides");
  }
  if (["order", "dial", "sequence", "selection"].includes(p.kind)) {
    if (
      !Array.isArray(p.answer) ||
      !p.answer.length ||
      p.answer.length > 36 ||
      p.answer.some((id) => !ids.includes(id)) ||
      new Set(p.answer).size !== p.answer.length ||
      (["order", "dial"].includes(p.kind) && p.answer.length !== ids.length)
    )
      throw Error("Solution d’activité invalide");
  }
  if (
    ["order", "dial"].includes(p.kind) &&
    p.initial &&
    (p.initial.length !== ids.length ||
      new Set(p.initial).size !== ids.length ||
      p.initial.some((id) => !ids.includes(id)))
  )
    throw Error("Ordre initial invalide");
  if (p.kind === "matching") {
    if (
      !p.matches ||
      Object.keys(p.matches).length !== ids.length ||
      !Array.isArray(p.options) ||
      !p.options.length ||
      p.options.length > 36 ||
      new Set(p.options.map((o) => o.id)).size !== p.options.length ||
      p.options.some(
        (o) => !validId(o.id) || !o.label || o.label.length > 300,
      ) ||
      ids.some((id) => !p.options!.some((o) => o.id === p.matches![id]))
    )
      throw Error("Correspondances invalides");
  }
  if (
    p.kind === "cooking" &&
    (!p.quantities ||
      Object.keys(p.quantities).length !== ids.length ||
      ids.some((id) => !p.quantities![id]) ||
      Object.values(p.quantities).some(
        (q) =>
          !bounded(q.target, 1, 10000) ||
          !bounded(q.step, 1, q.target) ||
          q.target % q.step !== 0 ||
          typeof q.unit !== "string" ||
          q.unit.length > 30,
      ) ||
      (p.mix !== undefined && !bounded(p.mix, 1, 30)) ||
      (p.golden !== undefined &&
        (!Array.isArray(p.golden) ||
          p.golden.length !== 2 ||
          !bounded(p.golden[0], 0, 100) ||
          !bounded(p.golden[1], p.golden[0], 100) ||
          Math.ceil(p.golden[0] / 10) * 10 > p.golden[1])))
  )
    throw Error("Recette invalide");
}

/** Shape checks are also required at the server boundary; this is never an authorization decision. */
export function validateFlowRuntime(r: FlowRuntime) {
  if (
    (r.performance !== undefined &&
      r.performance !== null &&
      (!r.performance ||
        !/^[a-z][a-z0-9-]{0,79}$/.test(r.performance.action) ||
        !Number.isFinite(r.performance.elapsed) ||
        r.performance.elapsed < 0 ||
        r.performance.elapsed > 120000)) ||
    (r.previousClock !== undefined &&
      (!Number.isFinite(r.previousClock) ||
        r.previousClock < 0 ||
        r.previousClock >= 180000))
  )
    throw Error("Reprise de spectacle invalide");
  if (
    r?.followers !== undefined &&
    (!r.followers ||
      Array.isArray(r.followers) ||
      typeof r.followers !== "object" ||
      Object.entries(r.followers).length > 4 ||
      Object.entries(r.followers).some(
        ([id, p]) =>
          !/^[-a-z0-9]{1,80}$/.test(id) ||
          !p ||
          ![p.x, p.y].every((n) => Number.isFinite(n) && n >= 0) ||
          p.x > 1920 ||
          p.y > 1408 ||
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
            "reserve",
            "glade",
            "keeper",
          ].includes(p.room),
      ))
  )
    throw Error("Position de compagnon invalide");
  const object = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  const key = (s: string) =>
    /^[a-z][a-z0-9-]{0,79}\/[a-z][a-z0-9-]{0,79}$/.test(s);
  const integer = (v: unknown, max: number) =>
    typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max;
  if (
    !object(r) ||
    !object(r.drafts) ||
    Object.keys(r.drafts).length > 100 ||
    !object(r.steps) ||
    Object.keys(r.steps).length > 100 ||
    !Array.isArray(r.seen) ||
    r.seen.length > 100 ||
    new Set(r.seen).size !== r.seen.length ||
    r.seen.some((v) => typeof v !== "string" || !key(v)) ||
    !object(r.sideChoices) ||
    Object.keys(r.sideChoices).length > 100 ||
    (r.side !== null &&
      (typeof r.side !== "string" || !/^[a-z][a-z0-9-]{0,79}$/.test(r.side))) ||
    (r.active !== null &&
      (typeof r.active !== "string" ||
        !/^[a-z][a-z0-9-]{0,79}$/.test(r.active))) ||
    (r.fx !== null &&
      (!object(r.fx) ||
        typeof r.fx.action !== "string" ||
        !/^[a-z][a-z0-9-]{0,79}$/.test(r.fx.action) ||
        typeof r.fx.elapsed !== "number" ||
        !Number.isFinite(r.fx.elapsed) ||
        r.fx.elapsed < 0 ||
        r.fx.elapsed > 10000))
  )
    throw Error("État d’activité invalide");
  if (
    Object.entries(r.steps).some(([id, v]) => !key(id) || !integer(v, 1)) ||
    Object.entries(r.sideChoices).some(
      ([id, v]) =>
        !key(id) || typeof v !== "string" || !/^[a-z][a-z0-9-]{0,79}$/.test(v),
    )
  )
    throw Error("État facultatif invalide");
  for (const [id, d] of Object.entries(r.drafts)) {
    if (
      !key(id) ||
      !object(d) ||
      !object(d.values) ||
      Object.keys(d.values).length > 36 ||
      Object.entries(d.values).some(
        ([k, v]) =>
          !/^[a-z][a-z0-9-]{0,79}$/.test(k) ||
          !(
            typeof v === "boolean" ||
            (typeof v === "string" && v.length <= 80) ||
            (typeof v === "number" && integer(v, 20000))
          ),
      ) ||
      !Array.isArray(d.order) ||
      d.order.length > 36 ||
      !Array.isArray(d.sequence) ||
      d.sequence.length > 36 ||
      [...d.order, ...d.sequence].some(
        (v) => typeof v !== "string" || !/^[a-z][a-z0-9-]{0,79}$/.test(v),
      ) ||
      !Array.isArray(d.rotations) ||
      d.rotations.length > 16 ||
      d.rotations.some((v) => !integer(v, 3)) ||
      !integer(d.mix, 30) ||
      !integer(d.heat, 100) ||
      !integer(d.phase, 10) ||
      !integer(d.attempts, 10000) ||
      typeof d.solved !== "boolean"
    )
      throw Error("Brouillon d’activité invalide");
  }
}
