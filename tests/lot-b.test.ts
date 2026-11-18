import { describe, it, expect } from "vitest";
import {
  newPuzzle,
  puzzleMove,
  validateFlowRuntime,
  newFlowRuntime,
  validateFlowDefinition,
  validatePuzzle,
  type Puzzle,
} from "../src/narrative/flow";
import { technicalProductionEpisode } from "./fixtures/production";
import { validateScript } from "../src/narrative/script";
import { readFileSync, existsSync } from "node:fs";
const dial: Puzzle = {
  kind: "dial",
  title: "Fixture circulaire",
  prompt: "Fixture indépendante du cahier",
  hint: "Fixture",
  items: ["alpha", "beta", "gamma", "delta"].map((id) => ({ id, label: id })),
  answer: ["alpha", "gamma", "beta", "delta"],
  initial: ["beta", "delta", "alpha", "gamma"],
};
describe("extensions du Lot B sans contenu narratif original", () => {
  it("le cadran tourne réellement et son brouillon reprend sans être validé prématurément", () => {
    validatePuzzle(dial);
    let d = puzzleMove(dial, newPuzzle(dial), { type: "rotate" });
    d = JSON.parse(JSON.stringify(d));
    expect(puzzleMove(dial, d, { type: "check" }).solved).toBe(false);
    d = puzzleMove(dial, d, { type: "rotate" });
    expect(puzzleMove(dial, d, { type: "check" }).solved).toBe(true);
  });
  it("une pièce unique ne peut occuper deux logements", () => {
    const p: Puzzle = {
      ...dial,
      kind: "matching",
      unique: true,
      options: [{ id: "one", label: "Pièce fictive" }],
      matches: { alpha: "one" },
    };
    let d = puzzleMove(p, newPuzzle(p), {
      type: "match",
      id: "alpha",
      value: "one",
    });
    d = puzzleMove(p, d, { type: "match", id: "beta", value: "one" });
    expect(d.values).toEqual({ beta: "one" });
  });
  it("refuse les positions de compagnon manquantes ou non finies", () => {
    const r = newFlowRuntime();
    expect(() =>
      validateFlowRuntime({ ...r, followers: [] } as never),
    ).toThrow();
    expect(() =>
      validateFlowRuntime({
        ...r,
        followers: { fixture: { room: "village", x: 20, y: 20 } },
      }),
    ).not.toThrow();
    expect(() =>
      validateFlowRuntime({
        ...r,
        followers: { fixture: { room: "village", x: NaN, y: 20 } },
      }),
    ).toThrow();
  });
  it("les images narratives privées ne sont ni des URL externes ni des ressources publiques", () => {
    expect(() =>
      validateFlowDefinition({
        schema: 1,
        portals: [],
        media: [
          {
            key: "private-fixture",
            day: 2,
            path: "https://example.test/photo.png",
          },
        ],
      }),
    ).toThrow();
    const c = technicalProductionEpisode(2);
    c.flow!.media = [{ key: "private-fixture", day: 3, path: "3/fixture.png" }];
    expect(() => validateScript(c)).toThrow();
    expect(existsSync("public/assets/production/memory-photo.png")).toBe(false);
    expect(readFileSync("ops/public-assets.json", "utf8")).not.toContain(
      "memory-photo",
    );
  });
  it("les variantes doivent viser un bloc existant", () => {
    const c = technicalProductionEpisode();
    c.scenes[0].flow!.actions[0].variants = [
      { fact: "episode-01/fixture", value: true, dialogue: "missing" },
    ];
    expect(() => validateScript(c)).toThrow();
  });
});
