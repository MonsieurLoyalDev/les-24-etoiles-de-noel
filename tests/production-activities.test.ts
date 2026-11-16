import { describe, it, expect } from "vitest";
import {
  newPuzzle,
  puzzleMove,
  puzzleSolved,
  circuitPower,
  rotateMask,
  validatePuzzle,
  newFlowRuntime,
  validateFlowRuntime,
  type Puzzle,
} from "../src/narrative/flow";
import { dialogueGraph } from "../src/narrative/dialogue-adapter";
import { technicalEpisode } from "./fixtures/narrative";
import { validateScript } from "../src/narrative/script";
import { technicalProductionEpisode } from "./fixtures/production";
import {
  startEpisode,
  receiveEvent,
  finishScene,
} from "../src/narrative/engine";
import { initial } from "../src/domain";
const item = (id: string) => ({ id, label: `Fixture ${id}` });
const base = {
  title: "Fixture synthétique",
  prompt: "Consigne technique",
  hint: "Aide technique",
  items: ["a", "b", "c"].map(item),
};
describe("activités déclaratives sans contenu personnel", () => {
  it("accepte les six ordres de collecte et garde la jonction verrouillée tant qu’un objet manque", () => {
    const c = technicalProductionEpisode();
    c.scenes[0].objectives = ["a", "b", "c"].map((id) => ({
      id,
      event: { kind: "find", target: id },
    }));
    c.scenes[0].objectives.push({
      id: "gate",
      event: { kind: "interact", target: "gate" },
      after: ["a", "b", "c"],
    });
    const context = { world: initial, completedDays: [1] };
    for (const order of [
      ["a", "b", "c"],
      ["a", "c", "b"],
      ["b", "a", "c"],
      ["b", "c", "a"],
      ["c", "a", "b"],
      ["c", "b", "a"],
    ]) {
      let p = startEpisode(c, { day: 2, unlocked: true }, context);
      p = receiveEvent(c, p, { kind: "interact", target: "gate" });
      expect(p.objectives).toEqual([]);
      for (const id of order)
        p = receiveEvent(c, p, { kind: "find", target: id });
      expect(() => finishScene(c, p, context)).toThrow("incomplets");
      p = receiveEvent(c, p, { kind: "interact", target: "gate" });
      expect(finishScene(c, p, context).sceneIndex).toBe(1);
    }
  });
  it("alimente uniquement les connexions réciproques réellement reliées à la source", () => {
    const c = {
      size: 2,
      masks: [10, 12, 0, 1],
      rotations: [0, 0, 0, 0],
      source: 0,
      input: 8,
      outputs: [{ cell: 3, port: 1 }],
    };
    expect(circuitPower(c, c.rotations)).toEqual({
      cells: [0, 1, 3],
      outputs: 1,
    });
    expect(circuitPower(c, [0, 1, 0, 0]).outputs).toBe(0);
    expect(circuitPower({ ...c, input: 1 }, c.rotations).cells).toEqual([]);
    expect(rotateMask(1, 4)).toBe(1);
    expect(rotateMask(1, -1)).toBe(8);
  });
  it("une solution est calculée et non accordée en fermant une fenêtre", () => {
    const p: Puzzle = {
      ...base,
      kind: "matching",
      options: [
        { id: "x", label: "X" },
        { id: "y", label: "Y" },
      ],
      matches: { a: "x", b: "y", c: "x" },
    };
    let d = newPuzzle(p);
    expect(puzzleSolved(p, d)).toBe(false);
    for (const [id, value] of Object.entries(p.matches!))
      d = puzzleMove(p, d, { type: "match", id, value });
    expect(d.solved).toBe(false);
    d = puzzleMove(p, d, { type: "check" });
    expect(d.solved).toBe(true);
    expect(puzzleMove(p, d, { type: "reset" })).toEqual(d);
  });
  it("conserve les brouillons sans muter une ancienne sauvegarde", () => {
    const p: Puzzle = {
      ...base,
      kind: "order",
      initial: ["b", "a", "c"],
      answer: ["a", "b", "c"],
    };
    const before = newPuzzle(p),
      after = puzzleMove(p, before, { type: "swap", id: "a", value: -1 });
    expect(before.order).toEqual(["b", "a", "c"]);
    expect(after.order).toEqual(["a", "b", "c"]);
    expect(puzzleSolved(p, JSON.parse(JSON.stringify(after)))).toBe(true);
  });
  it("réinitialise une séquence erronée sans bloquer une nouvelle tentative", () => {
    const p: Puzzle = { ...base, kind: "sequence", answer: ["b", "a", "c"] };
    let d = newPuzzle(p);
    d = puzzleMove(p, d, { type: "sequence", id: "a" });
    expect(d.sequence).toEqual([]);
    expect(d.attempts).toBe(1);
    for (const id of p.answer!) d = puzzleMove(p, d, { type: "sequence", id });
    expect(puzzleMove(p, d, { type: "check" }).solved).toBe(true);
  });
  it("refuse les actions appartenant à un autre type d’activité", () => {
    const p: Puzzle = { ...base, kind: "selection", answer: ["a"] };
    const d = newPuzzle(p);
    for (const type of ["match", "swap", "measure", "rotate"] as const)
      expect(puzzleMove(p, d, { type, id: "a", value: 1 })).toEqual(d);
  });
  it("valide toute la sélection, y compris l’absence des leurres", () => {
    const p: Puzzle = { ...base, kind: "selection", answer: ["a", "c"] };
    let d = newPuzzle(p);
    for (const id of ["a", "b", "c"])
      d = puzzleMove(p, d, { type: "toggle", id });
    expect(puzzleSolved(p, d)).toBe(false);
    d = puzzleMove(p, d, { type: "toggle", id: "b" });
    expect(puzzleSolved(p, d)).toBe(true);
  });
  it("la cuisson requiert mesures, mélange et cuisson ; un échec ne relance pas l’enquête", () => {
    const p: Puzzle = {
      ...base,
      kind: "cooking",
      quantities: {
        a: { target: 2, step: 1, unit: "u" },
        b: { target: 1, step: 1, unit: "u" },
        c: { target: 3, step: 1, unit: "u" },
      },
      mix: 2,
      golden: [60, 70],
    };
    let d = newPuzzle(p);
    expect(puzzleMove(p, d, { type: "heat" }).heat).toBe(0);
    for (const [id, q] of Object.entries(p.quantities!))
      for (let i = 0; i < q.target; i++)
        d = puzzleMove(p, d, { type: "measure", id, value: 1 });
    for (let i = 0; i < 2; i++) d = puzzleMove(p, d, { type: "mix" });
    for (let i = 0; i < 9; i++) d = puzzleMove(p, d, { type: "heat" });
    d = puzzleMove(p, d, { type: "check" });
    expect(d.solved).toBe(false);
    expect(d.heat).toBe(0);
    expect(d.mix).toBe(2);
    for (let i = 0; i < 6; i++) d = puzzleMove(p, d, { type: "heat" });
    expect(puzzleMove(p, d, { type: "check" }).solved).toBe(true);
  });
  it("ne permet pas de mélanger après changement des quantités", () => {
    const p: Puzzle = {
      ...base,
      kind: "cooking",
      quantities: {
        a: { target: 1, step: 1, unit: "u" },
        b: { target: 1, step: 1, unit: "u" },
        c: { target: 1, step: 1, unit: "u" },
      },
      mix: 1,
    };
    let d = newPuzzle(p);
    for (const id of ["a", "b", "c"])
      d = puzzleMove(p, d, { type: "measure", id, value: 1 });
    d = puzzleMove(p, d, { type: "mix" });
    d = puzzleMove(p, d, { type: "measure", id: "a", value: -1 });
    expect(d.mix).toBe(0);
    expect(d.heat).toBe(0);
  });
  it("refuse NaN, infinis et paramètres d’énigmes insolubles", () => {
    const p: Puzzle = { ...base, kind: "selection", answer: ["a"] };
    expect(
      puzzleMove(p, newPuzzle(p), { type: "measure", id: "a", value: NaN }),
    ).toEqual(newPuzzle(p));
    expect(() =>
      validatePuzzle({
        ...base,
        kind: "cooking",
        quantities: {
          a: { target: 3, step: 2, unit: "u" },
          b: { target: 1, step: 1, unit: "u" },
          c: { target: 1, step: 1, unit: "u" },
        },
      }),
    ).toThrow();
    expect(() => validatePuzzle({ ...p, answer: ["unknown"] })).toThrow();
    expect(() =>
      validatePuzzle({
        ...base,
        kind: "order",
        answer: ["a", "b", "c"],
        initial: ["a", "a", "c"],
      }),
    ).toThrow();
  });
  it("borne les brouillons persistés et les identifiants facultatifs", () => {
    const r = newFlowRuntime();
    expect(() => validateFlowRuntime(r)).not.toThrow();
    expect(() =>
      validateFlowRuntime({ ...r, fx: { action: "fixture", elapsed: 216.75 } }),
    ).not.toThrow();
    expect(() => validateFlowRuntime({ ...r, side: "invalid/key" })).toThrow();
    expect(() => validateFlowRuntime({ ...r, seen: ["x/y", "x/y"] })).toThrow();
    expect(() =>
      validateFlowRuntime({
        ...r,
        drafts: {
          "x/y": {
            ...newPuzzle({ ...base, kind: "selection", answer: ["a"] }),
            heat: Infinity,
          },
        },
      }),
    ).toThrow();
  });
  it("les réponses conditionnelles réutilisent le moteur de dialogue RPG", () => {
    const s = technicalEpisode();
    const scene = s.scenes[0];
    scene.dialogues.welcome = [
      {
        speaker: "Fixture",
        text: "Choix synthétique",
        choiceId: "fixture-choice",
        nextByOption: { one: 1, two: null },
      },
      { speaker: "Fixture", text: "Réponse synthétique A" },
    ];
    validateScript(s);
    const graph = dialogueGraph(scene, "welcome");
    expect(graph["beat-0"].choices[0].next).toBe("beat-1");
    expect(graph["beat-0"].choices[1].next).toBeUndefined();
    scene.dialogues.welcome[0].nextByOption = { one: 0 };
    expect(() => validateScript(s)).toThrow();
  });
});
