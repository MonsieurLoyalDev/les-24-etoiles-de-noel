import { it, expect } from "vitest";
import {
  activeHintTime,
  hintLevel,
  presentation,
  phaseOf,
} from "../src/narrative/orchestration";
import {
  initialRuntime,
  validateRuntime,
  type EpisodeProgress,
} from "../src/narrative/script";
import { technicalEpisode } from "./fixtures/narrative";
import {
  startEpisode,
  receiveEvent,
  finishScene,
} from "../src/narrative/engine";
import { initial } from "../src/domain";
import { dayOneBindings } from "../src/narrative/bindings";
import {
  dialogueGraph,
  advancePrivateDialogue,
} from "../src/narrative/dialogue-adapter";
import { choose, choicesFor } from "../src/rpg/dialogue";
it("migre les états de présentation sans effacer les faits E.1", () => {
  const p = {
    ...startEpisode(
      technicalEpisode(),
      { day: 1, unlocked: true },
      { world: initial, completedDays: [] },
    ),
    runtime: initialRuntime(),
  } as EpisodeProgress;
  p.runtime.origin = { x: 10, y: 20 };
  p.runtime.firstMetVillager = "emile";
  const facts = structuredClone(p);
  expect(presentation(p).introSeen).toBe(true);
  const { presentation: extension, ...legacy } = p.runtime;
  expect(legacy).toEqual(facts.runtime);
  expect(extension).toBeTruthy();
  expect(p.runtime.firstMetVillager).toBe("emile");
  expect(() => validateRuntime(p.runtime)).not.toThrow();
});
it("compte uniquement l'exploration active et borne les aides 30/60/90", () => {
  let ms = 0;
  for (let i = 0; i < 150; i++) ms = activeHintTime(ms, 200, false);
  expect(hintLevel(ms)).toBe(1);
  for (let i = 0; i < 1000; i++) ms = activeHintTime(ms, 200, true);
  expect(ms).toBe(30000);
  for (let i = 0; i < 150; i++) ms = activeHintTime(ms, 200, false);
  expect(hintLevel(ms)).toBe(2);
  for (let i = 0; i < 150; i++) ms = activeHintTime(ms, 200, false);
  expect(hintLevel(ms)).toBe(3);
});
it("dérive les phases sans remplacer la progression sauvegardée", () => {
  const p = {
    ...startEpisode(
      technicalEpisode(),
      { day: 1, unlocked: true },
      { world: initial, completedDays: [] },
    ),
    runtime: initialRuntime(),
  };
  expect(phaseOf(p, "arrival")).toBe("ARRIVAL");
  p.objectives.push("scene-1/welcome");
  expect(phaseOf(p, "arrival")).toBe("MOVEMENT_TUTORIAL");
  expect(phaseOf(p, "home")).toBe("CHALET_EPILOGUE");
  expect(phaseOf({ ...p, complete: true }, "home")).toBe("COMPLETE");
});
it.each([
  ["emile", "noe", "mira"],
  ["emile", "mira", "noe"],
  ["noe", "emile", "mira"],
  ["noe", "mira", "emile"],
  ["mira", "emile", "noe"],
  ["mira", "noe", "emile"],
])("rencontres libres : %s puis %s puis %s", (a, b, c) => {
  const content = technicalEpisode();
  content.scenes = [content.scenes[1]];
  let p = startEpisode(
    content,
    { day: 1, unlocked: true },
    { world: initial, completedDays: [] },
  );
  for (const id of [a, b, c])
    p = receiveEvent(content, p, { kind: "talk", target: id });
  p = receiveEvent(content, p, { kind: "explore", target: "central-square" });
  expect(
    finishScene(content, p, { world: initial, completedDays: [] }).complete,
  ).toBe(true);
});
it("les ancrages proviennent du plan et du mobilier existants", () => {
  expect(dayOneBindings.arrival.y).toBeGreaterThan(1100);
  expect(dayOneBindings.square.x).toBeGreaterThan(800);
  expect(dayOneBindings.houseBook.x).toBeLessThan(864);
  expect(dayOneBindings.foxCushion.y).toBeLessThan(352);
});
it("les répliques privées utilisent les graphes et choix du moteur RPG existant", () => {
  const scene = technicalEpisode().scenes[0],
    graph = dialogueGraph(scene, "welcome"),
    save = structuredClone(initial);
  expect(graph["beat-0"].speaker).toBe(scene.dialogues.welcome[0].speaker);
  expect(choicesFor(save, graph["beat-0"])).toHaveLength(2);
  expect(choose(save, graph, "beat-0", 1, "narrative-fixture")).toBeNull();
  expect(save.dialogueHistory).toContain("narrative-fixture:beat-0:1");
  expect(save.stars).toEqual(initial.stars);
  const before = structuredClone(save);
  for (let i = 0; i < 600; i++)
    advancePrivateDialogue(save, graph, "beat-0", 0);
  expect(save).toEqual(before);
});
