import { it, expect } from "vitest";
import { NavigationGrid } from "../src/world/navigation";
import {
  PointReservations,
  worldPoints,
  type WorldPoint,
} from "../src/world/points";
import { LivingWorld } from "../src/world/runtime";
import {
  worldProfiles,
  existingResidents,
  contextualWorldDialogue,
  markWorldEncounter,
} from "../src/world/registry";
import { initial, decode, type Rect } from "../src/domain";
import { dialogues } from "../src/rpg/dialogue";
import {
  facadeBounds,
  routeSegments,
  pedestrianCourts,
  plan,
} from "../src/art/village34";
import environments from "./fixtures/world-d41-environments.json";
const village = environments.find((r) => r.room === "village")!,
  library = environments.find((r) => r.room === "library")!;
const make = () => {
  const w = new LivingWorld();
  w.attach(
    "village",
    1920,
    1408,
    [...village.rects, ...facadeBounds],
    routeSegments,
    pedestrianCourts.map((c) => c.points),
  );
  w.attach("library", 960, 560, library.rects);
  return w;
};
const tick = (
  w: LivingWorld,
  clock: number,
  delta = 100,
  talking: string | null = null,
  shown = true,
) =>
  w.update(clock, delta, "village", { x: 1900, y: 1350 }, talking, () => shown);
it("registre : les six PNJ existants sont conservés, Flocon reste dédié", () => {
  expect(existingResidents.map((r) => r.id).sort()).toEqual([
    "alma",
    "emile",
    "flocon",
    "mira",
    "noe",
    "oscar",
  ]);
  expect(new Set(existingResidents.map((r) => r.id)).size).toBe(6);
  expect(worldProfiles.map((r) => r.id).sort()).toEqual([
    "emile",
    "mira",
    "noe",
  ]);
  expect(
    worldProfiles.every(
      (p) =>
        p.schedule.length === 4 &&
        p.schedule.every(
          (tasks) =>
            tasks.length &&
            tasks.every((t) =>
              worldPoints.some((q) => q.id === t.point && q.room === p.room),
            ),
        ),
    ),
  ).toBe(true);
});
it("navigation : contourne un mur, valide les segments et cache la route", () => {
  const n = new NavigationGrid(128, 112, [{ x: 48, y: 0, w: 16, h: 72 }]);
  const path = n.findPath({ x: 16, y: 24 }, { x: 104, y: 24 })!;
  expect(path).not.toBeNull();
  expect(path.some((p) => p.y >= 80)).toBe(true);
  for (let i = 1; i < path.length; i++)
    expect(n.clear(path[i - 1], path[i])).toBe(true);
  expect(n.findPath({ x: 16, y: 24 }, { x: 104, y: 24 })).toEqual(path);
  expect(n.cacheHits).toBe(1);
  expect(n.findPath({ x: 56, y: 24 }, { x: 104, y: 24 })).toBeNull();
});
it("navigation réelle : dix approches libres et itinéraires sans toit ni socle traversé", () => {
  const w = make();
  for (const p of worldPoints) {
    const n = w.environments.get(p.room)!;
    expect(n.isFree(p.position), p.id).toBe(true);
    const source = worldProfiles.find((r) => r.room === p.room)!.spawn,
      path = n.findPath(source, p.position);
    expect(path, p.id).not.toBeNull();
    let previous = source;
    for (const q of path!) {
      expect(n.clear(previous, q), p.id).toBe(true);
      previous = q;
    }
  }
});
it("navigation réelle : les cinq portillons restent atteignables", () => {
  const n = make().environments.get("village")!;
  for (const g of plan.gardens) {
    expect(n.isFree({ x: g.gate[0], y: g.gate[1] }), g.id).toBe(true);
    expect(
      n.findPath({ x: 1070, y: 760 }, { x: g.gate[0], y: g.gate[1] }),
      g.id,
    ).not.toBeNull();
  }
});
it("réservations : deux places, capacité ferme, libération et pas de fausse assise", () => {
  const r = new PointReservations(),
    p: WorldPoint = {
      id: "test-bench",
      room: "village",
      position: { x: 80, y: 80 },
      lookAt: { x: 80, y: 70 },
      capacity: 2,
      slots: [
        { x: 60, y: 80 },
        { x: 100, y: 80 },
      ],
      kind: "seat",
    };
  expect(r.reserve(p, "a", true)).toBe(false);
  expect(r.reserve(p, "a")).toBe(true);
  expect(r.reserve(p, "a")).toBe(true);
  expect(r.reserve(p, "b")).toBe(true);
  expect(r.reserve(p, "c")).toBe(false);
  expect(r.count(p.id)).toBe(2);
  expect(r.position(p, "a")).toEqual({ x: 60, y: 80 });
  expect(r.position(p, "b")).toEqual({ x: 100, y: 80 });
  r.release("a");
  expect(r.reserve(p, "c")).toBe(true);
  r.release("b");
  r.release("c");
  expect(r.snapshot()).toEqual([]);
});
it("routines : quatre périodes exactes, pas de deuxième horloge", () => {
  const w = make();
  for (const clock of [
    0, 44999, 45000, 89999, 90000, 134999, 135000, 179999, 0,
  ]) {
    tick(w, clock);
    expect(w.get("noe")!.phase).toBe(Math.floor(clock / 45000));
    expect(w.get("emile")!.intent!.point).toBe(
      worldProfiles[1].schedule[Math.floor(clock / 45000)][0].point,
    );
  }
});
it("simulation de deux cycles : activités atteintes, aucune collision ni superposition", () => {
  const w = make();
  for (let clock = 100; clock <= 360000; clock += 100) {
    tick(w, clock % 180000);
    if (clock % 500 === 0)
      for (const a of w.actors.values()) {
        expect(
          w.environments.get(a.profile.room)!.isFree(a.position),
          a.id,
        ).toBe(true);
        for (const b of w.actors.values())
          if (b.id !== a.id && b.profile.room === a.profile.room)
            expect(
              Math.hypot(
                a.position.x - b.position.x,
                a.position.y - b.position.y,
              ),
            ).toBeGreaterThanOrEqual(17.99);
      }
  }
  for (const a of w.actors.values()) expect(a.visits, a.id).toBeGreaterThan(3);
  expect(
    [...w.environments.values()].reduce((n, v) => n + v.searches, 0),
  ).toBeLessThan(100);
  expect(w.snapshot().points.every((p) => p.valid)).toBe(true);
});
it("dialogue : immobilisation, réservation conservée et reprise du trajet", () => {
  const w = make();
  for (let t = 100; t <= 2000; t += 100) tick(w, t);
  const a = w.get("mira")!,
    before = { ...a.position },
    point = a.intent!.point;
  for (let i = 0; i < 30; i++) tick(w, 2000, 0, "mira");
  expect(a.state).toBe("TALKING_TO_PLAYER");
  expect(a.position).toEqual(before);
  expect(w.reservations.count(point)).toBe(1);
  for (let t = 2100; t <= 5000; t += 100) tick(w, t);
  expect(a.state).not.toBe("TALKING_TO_PLAYER");
  expect(
    Math.hypot(a.position.x - before.x, a.position.y - before.y),
  ).toBeGreaterThan(10);
});
it("dialogues : aucune offre ni choix historique perdu et quatre variantes contextuelles", () => {
  const original = JSON.stringify(dialogues);
  for (const id of ["mira", "noe"] as const)
    for (const clock of [0, 45000, 90000, 135000]) {
      const g = contextualWorldDialogue(id, clock, dialogues[id])!;
      expect(g.greeting.text).toContain(dialogues[id].greeting.text);
      expect(g.greeting.choices).toBe(dialogues[id].greeting.choices);
      expect(g.accepted).toBe(dialogues[id].accepted);
    }
  expect(contextualWorldDialogue("oscar", 0, dialogues.oscar)).toBe(
    dialogues.oscar,
  );
  expect(
    new Set(
      [0, 45000, 90000, 135000].map(
        (c) => contextualWorldDialogue("emile", c)!.greeting.text,
      ),
    ).size,
  ).toBe(4);
  expect(JSON.stringify(dialogues)).toBe(original);
});
it("sauvegarde : rencontres idempotentes, v1/v2 compatibles, progression inchangée", () => {
  const save = structuredClone(initial);
  save.stars = [1, 3];
  save.inventory = ["souvenir"];
  const before = structuredClone(save);
  expect(markWorldEncounter(save, "emile")).toBe(true);
  expect(markWorldEncounter(save, "emile")).toBe(false);
  expect(markWorldEncounter(save, "flocon")).toBe(false);
  expect(decode(save)).toEqual({ ...before, flags: ["world:met:emile"] });
  expect(
    decode({
      version: 1,
      stage: 4,
      room: "village",
      position: { x: 1012, y: 1020 },
    })?.stars,
  ).toEqual([1]);
  save.flags = Array.from({ length: 500 }, (_, i) => "f" + i);
  expect(markWorldEncounter(save, "mira")).toBe(false);
  expect(save.flags).toHaveLength(500);
});
it("hors caméra : simulation logique proche du rendu fin, recherches plafonnées", () => {
  const a = make(),
    b = make();
  for (let t = 100; t <= 30000; t += 100) {
    tick(a, t, 100, null, true);
    tick(b, t, 100, null, false);
  }
  for (const [id, p] of a.actors) {
    const q = b.get(id)!;
    expect(
      Math.hypot(p.position.x - q.position.x, p.position.y - q.position.y),
    ).toBeLessThan(15);
    expect(p.phase).toBe(q.phase);
  }
  const c = make();
  for (let t = 1; t <= 100; t++) tick(c, t, 1);
  expect(c.environments.get("village")!.searches).toBe(0);
  tick(c, 300, 200);
  expect(c.environments.get("village")!.searches).toBe(1);
});
it("blocage : attente et nouvelle recherche, jamais de téléportation à travers un mur", () => {
  const w = new LivingWorld(),
    p = w.get("noe")!;
  p.position = { x: 1070, y: 760 };
  const walls: Rect[] = [{ x: 0, y: 0, w: 1920, h: 700 }];
  w.attach("village", 1920, 1408, walls);
  const before = { ...p.position };
  for (let t = 100; t < 6000; t += 100) tick(w, t);
  expect(p.position).toEqual(before);
  expect(p.blockedReason).toContain("unavailable");
});
