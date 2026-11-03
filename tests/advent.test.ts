import "fake-indexeddb/auto";
import { it, expect, vi } from "vitest";
import { uuid } from "../src/advent/id";
it("crée des identifiants de manche sur un téléphone en HTTP local", () => {
  const real = globalThis.crypto;
  vi.stubGlobal("crypto", { getRandomValues: real.getRandomValues.bind(real) });
  try {
    const first = uuid();
    expect(first).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
    );
    expect(uuid()).not.toBe(first);
  } finally {
    vi.unstubAllGlobals();
  }
});
import { demoDays } from "../src/advent/demo";
import { createDemoAPI } from "../src/advent/demoApi";
import {
  demoUnlocked,
  unlockInstant,
  validEvidence,
  validateEditable,
  type Step,
  type Value,
} from "../src/advent/model";
function evidence(s: Step): Value {
  switch (s.kind) {
    case "voucher":
      return { recipient: "Debby", date: "2026-12-24", option: "1" };
    case "story":
      return ["start:foret", "foret:retour"];
    case "scene":
      return 4;
    case "media":
      return true;
    case "write":
      return "Une lettre assez longue pour raconter notre futur ensemble sous les étoiles.";
    case "choice":
      return "1";
    default:
      return s.items!.map((i) => i.id);
  }
}
it.each(demoDays)(
  "la journée $content.day possède un objectif réellement validable",
  (d) => {
    expect(validateEditable(d)).toEqual(d);
    for (const step of d.content.steps) {
      const rule = d.rules[step.id];
      const v = rule.expected ?? evidence(step);
      expect(validEvidence(step, rule, v)).toBe(true);
      expect(validEvidence(step, rule, null)).toBe(false);
    }
  },
);
it("teste toutes les frontières des 24 minuits parisiens", () => {
  for (let d = 1; d <= 24; d++) {
    expect(demoUnlocked(d, unlockInstant(d) - 1)).toBe(false);
    expect(demoUnlocked(d, unlockInstant(d))).toBe(true);
  }
  expect(() => unlockInstant(25)).toThrow();
});
it("ne publie pas les réponses dans les définitions des étapes", () => {
  for (const d of demoDays)
    for (const s of d.content.steps) {
      expect(s).not.toHaveProperty("expected");
      expect(s).not.toHaveProperty("rules");
    }
});
it("rejette les objectifs incomplets, les doublons et les chemins inventés", () => {
  expect(
    validEvidence(demoDays[0].content.steps[0], { minimum: 3 }, [
      "1",
      "1",
      "2",
    ]),
  ).toBe(false);
  expect(validEvidence(demoDays[14].content.steps[0], {}, ["start:fin"])).toBe(
    false,
  );
  expect(() => validateEditable({ ...demoDays[0], rules: {} })).toThrow();
});
it("garde les récompenses, reprend les manches et isole le développeur", async () => {
  const api = createDemoAPI(true, () => Date.parse("2026-12-01T00:00:00Z"));
  await expect(api.day(24, false)).rejects.toThrow();
  const run = await api.start(1, true, true);
  expect((await api.check(1, run.runId, "reponse", "1", true)).accepted).toBe(
    false,
  );
  await api.check(1, run.runId, "lettre", ["1", "2", "3"], true);
  expect((await api.start(1, true)).checked).toEqual(["lettre"]);
  await api.check(1, run.runId, "reponse", "1", true);
  expect((await api.status(false))[0].complete).toBe(false);
  expect((await api.status(true))[0].complete).toBe(true);
  const replay = await api.start(1, true, true);
  expect(replay.checked).toEqual([]);
  expect(replay.complete).toBe(true);
  const edited = await api.adminGet(1);
  edited.content.title = "Titre personnalisé";
  await api.adminSave(edited);
  const upgraded = await api.start(1, true);
  expect(upgraded.runId).not.toBe(replay.runId);
  expect(upgraded.complete).toBe(true);
  expect(upgraded.memory.reponse).toBe("1");
});
