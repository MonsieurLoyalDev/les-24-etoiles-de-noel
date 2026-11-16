import "fake-indexeddb/auto";
import { openDB } from "idb";
import { expect, it } from "vitest";
import { initial } from "../src/domain";
import { episodeCatalog, episodeId } from "../src/narrative/catalog";
import {
  startEpisode,
  receiveEvent,
  finishScene,
  selectNarrativeChoice,
  restoreProgress,
  discoveredJournal,
  rewardKey,
  validateDefinition,
  type EpisodeDefinition,
} from "../src/narrative/engine";
import { loadCheckpoint, saveCheckpoint } from "../src/narrative/checkpoint";

// Technical fixtures only. These never contain the private Episode 01 script.
const definition = (): EpisodeDefinition => ({
  day: 1,
  version: 1,
  scriptStatus: "validated",
  dependsOn: [],
  scenes: [
    {
      id: "fixture-a",
      objectives: [
        { id: "talk", event: { kind: "talk", target: "fixture-npc" } },
        {
          id: "extra",
          optional: true,
          event: { kind: "find", target: "fixture-item" },
        },
      ],
      choices: [
        { id: "answer", options: [{ id: "yes" }, { id: "later" }] },
        { id: "optional", optional: true, options: [{ id: "extra" }] },
      ],
    },
    {
      id: "fixture-b",
      objectives: [
        { id: "visit", event: { kind: "explore", target: "fixture-room" } },
      ],
      choices: [],
    },
  ],
});
const context = () => ({
  world: structuredClone(initial),
  completedDays: [] as number[],
});
const access = { day: 1, unlocked: true };
const start = (d = definition()) => startEpisode(d, access, context());
const firstDone = (d = definition()) =>
  selectNarrativeChoice(
    d,
    receiveEvent(d, start(d), { kind: "talk", target: "fixture-npc" }),
    "answer",
    "yes",
    context(),
  );

it("réserve exactement 24 épisodes incomplets, sans scénario inventé", () => {
  expect(episodeCatalog).toHaveLength(24);
  expect(new Set(episodeCatalog.map((e) => e.id)).size).toBe(24);
  expect(
    episodeCatalog.every((e) => e.scriptStatus === "private-content-required"),
  ).toBe(true);
  expect(episodeCatalog[0].outline).toHaveLength(7);
  expect(
    episodeCatalog.slice(1).every((e) => e.title === null && !e.outline.length),
  ).toBe(true);
  for (const bad of [0, 25, 1.5, NaN]) expect(() => episodeId(bad)).toThrow();
});
it("refuse un cahier manquant, un accès fermé ou une mauvaise journée", () => {
  expect(() => start({ ...definition(), scriptStatus: "missing" })).toThrow();
  expect(() =>
    startEpisode(definition(), { ...access, unlocked: false }, context()),
  ).toThrow();
  expect(() =>
    startEpisode(definition(), { day: 2, unlocked: true }, context()),
  ).toThrow();
});
it("valide les dépendances, identifiants uniques et 1 à 4 options", () => {
  const d = definition();
  d.day = 2;
  d.dependsOn = [1];
  expect(() =>
    startEpisode(d, { day: 2, unlocked: true }, context()),
  ).toThrow();
  expect(
    startEpisode(
      d,
      { day: 2, unlocked: true },
      { ...context(), completedDays: [1] },
    ).episodeId,
  ).toBe("episode-02");
  d.dependsOn = [2];
  expect(() => validateDefinition(d)).toThrow();
  const duplicate = definition();
  duplicate.scenes.push(duplicate.scenes[0]);
  expect(() => validateDefinition(duplicate)).toThrow();
  const empty = definition();
  empty.scenes[0].choices[0].options = [];
  expect(() => validateDefinition(empty)).toThrow();
  empty.scenes[0].choices[0].options = Array.from({ length: 5 }, (_, i) => ({
    id: `option-${i}`,
  }));
  expect(() => validateDefinition(empty)).toThrow();
});
it("réutilise les conditions de dialogue et ne modifie pas la sauvegarde village", () => {
  const d = definition(),
    ctx = context(),
    before = structuredClone(ctx.world);
  d.scenes[0].choices[0].options[0].condition = { flag: "fixture-permitted" };
  expect(() =>
    selectNarrativeChoice(d, start(d), "answer", "yes", ctx),
  ).toThrow();
  ctx.world.flags.push("fixture-permitted");
  const snapshot = structuredClone(ctx.world);
  expect(
    selectNarrativeChoice(d, start(d), "answer", "yes", ctx).choices[
      "fixture-a/answer"
    ],
  ).toBe("yes");
  expect(ctx.world).toEqual(snapshot);
  expect(initial).toEqual(before);
});
it("ignore les événements d'autres scènes et les doublons", () => {
  const d = definition(),
    p = start(d),
    before = structuredClone(p);
  expect(
    receiveEvent(d, p, { kind: "explore", target: "fixture-room" }),
  ).toEqual(p);
  const next = receiveEvent(d, p, { kind: "talk", target: "fixture-npc" });
  expect(next.objectives).toEqual(["fixture-a/talk"]);
  expect(
    receiveEvent(d, next, { kind: "talk", target: "fixture-npc" }),
  ).toEqual(next);
  expect(p).toEqual(before);
});
it("exige les objectifs/choix obligatoires, laisse les facultatifs neutres", () => {
  const d = definition();
  expect(() => finishScene(d, start(d), context())).toThrow();
  const p = firstDone(d),
    advanced = finishScene(d, p, context());
  expect(advanced.sceneIndex).toBe(1);
  expect(advanced.objectives).not.toContain("fixture-a/extra");
  expect(advanced.choices["fixture-a/optional"]).toBeUndefined();
  expect(discoveredJournal(p).scenes).not.toContain("fixture-b");
});
it("préserve un choix effectué au lieu de le réécrire rétroactivement", () => {
  const d = definition(),
    p = firstDone(d);
  expect(selectNarrativeChoice(d, p, "answer", "yes", context())).toEqual(p);
  expect(() =>
    selectNarrativeChoice(d, p, "answer", "later", context()),
  ).toThrow();
});
it("bloque une scène suivante conditionnelle sans sa condition réelle", () => {
  const d = definition();
  d.scenes[1].requires = [{ flag: "fixture-open" }];
  expect(() => finishScene(d, firstDone(d), context())).toThrow();
  const ctx = context();
  ctx.world.flags.push("fixture-open");
  expect(finishScene(d, firstDone(d), ctx).sceneIndex).toBe(1);
});
it("reprend exactement après sérialisation et refuse une autre version du contenu", () => {
  const d = definition(),
    p = firstDone(d);
  expect(restoreProgress(d, JSON.parse(JSON.stringify(p)))).toEqual(p);
  expect(() => restoreProgress({ ...d, version: 2 }, p)).toThrow();
  expect(() => restoreProgress(d, { ...p, complete: true })).toThrow();
  expect(() =>
    restoreProgress(d, { ...p, objectives: ["fixture-b/visit"] }),
  ).toThrow();
  expect(() =>
    restoreProgress(d, {
      ...p,
      sceneIndex: 1,
      completedScenes: ["fixture-a"],
      objectives: [],
    }),
  ).toThrow();
});
it("parcourt sept scènes techniques dans l'ordre avec une clé de récompense stable", () => {
  const d = definition();
  d.scenes = Array.from({ length: 7 }, (_, i) => ({
    id: `fixture-${i}`,
    objectives: [
      {
        id: "goal",
        event: { kind: "interact" as const, target: `fixture-${i}` },
      },
    ],
    choices: [],
  }));
  let p = start(d);
  expect(rewardKey(p)).toBeNull();
  for (let i = 0; i < 7; i++) {
    expect(() => finishScene(d, p, context())).toThrow();
    p = receiveEvent(d, p, { kind: "interact", target: `fixture-${i}` });
    p = finishScene(d, p, context());
  }
  expect(p.complete).toBe(true);
  expect(p.completedScenes).toHaveLength(7);
  expect(rewardKey(p)).toBe("episode-01/star");
  expect(finishScene(d, p, context())).toEqual(p);
  expect(initial.stars).toEqual([]); // No actual/calendar star awarded by a local prototype.
});
it("impose l'ordre des indices à l'exécution et à la restauration", () => {
  const d = definition();
  d.scenes = [
    {
      id: "trail",
      choices: [],
      objectives: [
        { id: "first", event: { kind: "find", target: "first" } },
        {
          id: "second",
          after: ["first"],
          event: { kind: "find", target: "second" },
        },
      ],
    },
  ];
  let p = start(d);
  expect(
    receiveEvent(d, p, { kind: "find", target: "second" }).objectives,
  ).toEqual([]);
  expect(() =>
    restoreProgress(d, { ...p, objectives: ["trail/second"] }),
  ).toThrow("séquence");
  p = receiveEvent(d, p, { kind: "find", target: "first" });
  p = receiveEvent(d, p, { kind: "find", target: "second" });
  expect(finishScene(d, p, context()).complete).toBe(true);
});
it("isole le checkpoint joueur/aperçu et préserve les anciennes données IndexedDB", async () => {
  const d = definition(),
    scope = { userId: "fixture-owner", preview: false },
    p = start(d);
  const db = await openDB("etoilebois", 1, {
    upgrade(d) {
      d.createObjectStore("saves");
    },
  });
  await db.put("saves", structuredClone(initial), "phase-b");
  await saveCheckpoint(scope, d, p, null);
  expect(await loadCheckpoint(scope, d)).toEqual(p);
  expect(await loadCheckpoint({ ...scope, preview: true }, d)).toBeNull();
  expect(
    await loadCheckpoint({ ...scope, userId: "another-owner" }, d),
  ).toBeNull();
  expect(await db.get("saves", "phase-b")).toEqual(initial);
  db.close();
});
it("refuse les écritures périmées et préserve un checkpoint de version inconnue", async () => {
  const d = definition(),
    scope = { userId: "fixture-conflict", preview: false },
    p = start(d);
  await saveCheckpoint(scope, d, p, null);
  const next = receiveEvent(d, p, { kind: "talk", target: "fixture-npc" });
  await saveCheckpoint(scope, d, next, 0);
  await saveCheckpoint(scope, d, next, 0); // Idempotent retry of the same write.
  const competing = selectNarrativeChoice(d, p, "answer", "yes", context());
  await expect(saveCheckpoint(scope, d, competing, 0)).rejects.toThrow(
    "Conflit",
  );
  await expect(loadCheckpoint(scope, { ...d, version: 2 })).rejects.toThrow();
  await expect(
    saveCheckpoint(scope, { ...d, version: 2 }, start({ ...d, version: 2 }), 1),
  ).rejects.toThrow("Conflit");
  expect(await loadCheckpoint(scope, d)).toEqual(next);
});
