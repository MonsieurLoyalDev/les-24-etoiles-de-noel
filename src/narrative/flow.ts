import type { WorldRoom, Point } from "../domain";
export type AnchorRef = { room: WorldRoom; anchor: string; offset?: Point };
export type Puzzle = {
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
export type FlowLights = {
  points: string[];
  requires: string;
  choice: string;
  styles: Record<string, { tint: number; shimmer?: boolean }>;
};
export type FlowDefinition = {
  media?: { key: string; day: number; path: string }[];
  placements?: {
    id: string;
    texture: string;
    point: AnchorRef;
    width: number;
    caption?: string;
    requires?: string;
    persistent?: boolean;
    mirror?: boolean;
    choice?: { key: string; option: string };
  }[];
  schema: 1;
  portals: ("forest" | "bakery" | "lake" | "hamlet" | "clockshop")[];
  portalAccess?: Partial<
    Record<
      "forest" | "bakery" | "lake" | "hamlet" | "clockshop",
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
  bookExtras?: { title: string; text: string; requires?: string }[];
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
  drafts: Record<string, PuzzleDraft>;
  active: string | null;
  steps: Record<string, number>;
  fx: { action: string; elapsed: number } | null;
  seen: string[];
  side: string | null;
  sideChoices: Record<string, string>;
  followers?: Record<string, { room: WorldRoom; x: number; y: number }>;
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
      (v) => !["forest", "bakery", "lake", "hamlet", "clockshop"].includes(v),
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
    ].includes(p.room) &&
    typeof p.anchor === "string" &&
    p.anchor.length > 0 &&
    p.anchor.length <= 100 &&
    (!p.offset ||
      [p.offset.x, p.offset.y].every(
        (n) => Number.isFinite(n) && Math.abs(n) <= 512,
      ));
  const range = (v: { from: number; until: number }) =>
    Number.isSafeInteger(v.from) &&
    Number.isSafeInteger(v.until) &&
    v.from >= 0 &&
    v.until >= v.from &&
    v.until <= 99;
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
          key as "forest" | "bakery" | "lake" | "hamlet" | "clockshop",
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
