import { isMapNote } from "../src/narrative/flow";
import { residentAnchorAvailable } from "../src/narrative/flow";
import { theatreBackdrop } from "../src/narrative/theatre";
import { audioGain, normalizeAudio } from "../src/art/audio";
import { expect, it } from "vitest";
import {
  validateScript,
  validateRuntime,
  initialRuntime,
} from "../src/narrative/script";
import {
  newFlowRuntime,
  validateFlowDefinition,
  validatePuzzle,
  newPuzzle,
  puzzleMove,
} from "../src/narrative/flow";
import {
  fireflyPoint,
  validatePerformance,
} from "../src/narrative/performance";
import { visibleConfidences } from "../src/narrative/confidences";
import { theatreKeepsake } from "../src/narrative/keepsakes";
import { completedEpisodeSnapshots } from "./fixtures/complete-episode";
import { technicalProductionEpisode } from "./fixtures/production";
import { regionAnchorsC } from "../src/narrative/regions-c";
import { roomDimensions } from "../src/art/rooms33";

it("accepte les régions additives sans modifier les quatre plans existants", () => {
  const definition = technicalProductionEpisode(13);
  definition.flow!.portals = ["reserve", "glade", "keeper"];
  definition.scenes[0].flow!.actions[0].point = {
    room: "glade",
    anchor: "area:stone1",
  };
  expect(validateScript(definition).flow!.portals).toHaveLength(3);
  for (const [room, anchors] of Object.entries(regionAnchorsC)) {
    const bounds = roomDimensions(room as "reserve" | "glade" | "keeper");
    for (const point of Object.values(anchors)) {
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(bounds.width);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(bounds.height);
    }
  }
});
it("borne les spectacles et leur reprise, sans second système de récompense", () => {
  validatePerformance({
    kind: "concert",
    duration: 24000,
    subtitles: ["Texte synthétique"],
  });
  expect(() =>
    validatePerformance({ kind: "concert", duration: Infinity }),
  ).toThrow();
  expect(() =>
    validatePerformance({ kind: "fireflies", duration: 120001 }),
  ).toThrow();
  const runtime = {
    ...initialRuntime(),
    flow: {
      ...newFlowRuntime(),
      performance: { action: "technical", elapsed: 4500 },
    },
  };
  expect(validateRuntime(runtime).flow!.performance!.elapsed).toBe(4500);
  expect(() =>
    validateRuntime({
      ...runtime,
      flow: {
        ...runtime.flow,
        performance: { action: "technical", elapsed: NaN },
      },
    }),
  ).toThrow();
});
it("les trajectoires sont finies et bornées dans les trois tableaux, y compris à faible densité", () => {
  for (const count of [12, 36])
    for (const phase of [0, 1, 2, 3])
      for (let i = 0; i < count; i++) {
        const p = fireflyPoint(i, count, phase, 2);
        expect(Number.isFinite(p.x + p.y)).toBe(true);
        expect(Math.abs(p.x)).toBeLessThan(150);
        expect(Math.abs(p.y)).toBeLessThan(150);
      }
});
it("distingue document privé et contenu volontairement partagé", () => {
  const flow = {
    schema: 1 as const,
    portals: [],
    confidences: [
      {
        id: "private-note",
        author: "Fixture",
        status: "draft" as const,
        requires: "activity/check",
        privateAfter: "award/restoration",
      },
      {
        id: "shared-note",
        author: "Fixture",
        status: "shared" as const,
        requires: "activity/check",
        text: "Texte synthétique",
      },
    ],
  };
  validateFlowDefinition(flow);
  expect(visibleConfidences(flow, [])).toEqual([]);
  const before = visibleConfidences(flow, ["activity/check"]);
  expect(before[0]).toEqual({
    id: "private-note",
    author: "Fixture",
    status: "draft",
  });
  expect(
    visibleConfidences(flow, ["activity/check", "award/restoration"])[0].status,
  ).toBe("private");
  expect(() =>
    validateFlowDefinition({
      ...flow,
      confidences: [{ ...flow.confidences[0], text: "INTERDIT" }],
    }),
  ).toThrow();
});
it("réutilise le choix autorisé et conserve un aperçu isolé neutre", () => {
  const c = technicalProductionEpisode(16),
    p = completedEpisodeSnapshots(
      c,
      Array.from({ length: 15 }, (_, i) => i + 1),
    ).at(-1)!;
  c.flow!.theatre = {
    inherited: "episode-13/appearance",
    built: "episode-13/built",
    point: { room: "village", anchor: "square" },
  };
  expect(theatreKeepsake(c, p)?.style).toBeNull();
  expect(
    theatreKeepsake(c, p, {
      pages: [],
      choices: {},
      facts: { "episode-13/appearance": "option-2", "episode-13/built": true },
    }),
  ).toMatchObject({ style: "option-2", built: true });
});
it("l’assistance conserve les vrais signaux et le même solveur", () => {
  const puzzle = {
    kind: "sequence" as const,
    title: "Fixture",
    prompt: "Fixture",
    hint: "Fixture",
    items: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    answer: ["a", "b"],
    assisted: true,
  };
  validatePuzzle(puzzle);
  let draft = newPuzzle(puzzle);
  for (const id of puzzle.answer)
    draft = puzzleMove(puzzle, draft, { type: "sequence", id });
  expect(draft.solved).toBe(false);
  draft = puzzleMove(puzzle, draft, { type: "check" });
  expect(draft.solved).toBe(true);
  expect(() =>
    validatePuzzle({
      ...puzzle,
      cards: { a: "https://external.invalid/private.png" },
    }),
  ).toThrow();
});

it("trois apparences distinctes, aucune apparence canonique inventée", () => {
  expect(["option-1", "option-2", "option-3"].map(theatreBackdrop)).toEqual([
    "forest",
    "village",
    "night",
  ]);
  expect(theatreBackdrop(undefined)).toBeNull();
  expect(theatreBackdrop("constructor")).toBeNull();
});
it("canaux audio indépendants sans changer les anciennes préférences", () => {
  expect(normalizeAudio({ muted: false, volume: 0.4 })).toEqual({
    muted: false,
    volume: 0.4,
  });
  const prefs = normalizeAudio({
    muted: false,
    volume: 0.8,
    channels: { music: 0.5, voices: 0, ambience: 2 },
  });
  expect(audioGain(prefs, "music")).toBe(0.4);
  expect(audioGain(prefs, "voices")).toBe(0);
  expect(audioGain(prefs, "ambience")).toBe(0.8);
});

it("une entrée ne résout pas un PNJ encore en trajet dans une autre pièce", () => {
  const action = {
    id: "talk",
    label: "Fixture",
    point: { room: "library" as const, anchor: "resident:mira" },
  };
  expect(residentAnchorAvailable(action, "library", [])).toBe(false);
  expect(residentAnchorAvailable(action, "library", ["mira"])).toBe(true);
  expect(residentAnchorAvailable(action, "village", [])).toBe(true);
});

it("un repère de Livre reste explicitement fermé, sans inventer un accès", () => {
  expect(isMapNote({ from: "Lieu A", to: "Lieu B", locked: true })).toBe(true);
  expect(isMapNote({ from: "Lieu A", to: "Lieu B", locked: false })).toBe(
    false,
  );
  expect(isMapNote({ from: "", to: "Lieu B", locked: true })).toBe(false);
});

it("garde les sous-titres dans le cadre malgré le zoom de caméra", async () => {
  const { subtitlePlacement } = await import("../src/narrative/performance");
  for (const [width, height] of [
    [1920, 982],
    [390, 754],
  ])
    for (const zoom of [0.9, 1, 2, 3]) {
      const p = subtitlePlacement(width, height, zoom);
      expect((p.y - height / 2) * zoom + height / 2).toBeCloseTo(height - 100);
      expect(p.scale * zoom).toBeCloseTo(1);
    }
});
