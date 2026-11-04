import { describe, it, expect, vi } from "vitest";
import { initial, decode, blocked, visible } from "../src/domain";
import { quests, acceptQuest, sendEvent } from "../src/rpg/quests";
import { dialogues, choose, choicesFor, satisfies } from "../src/rpg/dialogue";
import {
  photoStart,
  swapTiles,
  photoSolved,
  flipCard,
  matchesOrder,
  shuffle,
  type Memory,
} from "../src/rpg/minigames";
import { interiorRects, citizens, npcActivity, period } from "../src/rpg/world";
import { createServerCalendar } from "../src/calendar";
describe("migration Phase A", () => {
  for (let stage = 0; stage <= 4; stage++)
    it(`préserve l’étape ${stage}, la salle et les coordonnées`, () => {
      const s = decode({
        version: 1,
        stage,
        room: "house",
        position: { x: 240, y: 280 },
      })!;
      expect(s.version).toBe(2);
      expect(s.stage).toBe(stage);
      expect(s.quests["first-light"]).toEqual({
        step: stage,
        done: stage === 4,
      });
      expect(s.stars).toEqual(stage === 4 ? [1] : []);
      expect(s.position).toEqual({ x: 240, y: 280 });
      expect(decode(s)).toEqual(s);
    });
  it("refuse une sauvegarde v2 malformée", () => {
    expect(decode({ ...initial, stars: [25] })).toBeNull();
    expect(
      decode({ ...initial, quests: { bad: { step: -1, done: false } } }),
    ).toBeNull();
    expect(decode({ ...initial, clock: Infinity })).toBeNull();
  });
});
describe("quêtes génériques", () => {
  for (const q of quests)
    it(`accomplit ${q.id} sans double récompense`, () => {
      const s = structuredClone(initial);
      acceptQuest(s, q.id);
      sendEvent(s, { kind: "find", target: "inexistant" });
      expect(s.quests[q.id].step).toBe(0);
      for (const objective of q.objectives) sendEvent(s, objective);
      expect(s.quests[q.id].done).toBe(true);
      expect(s.stars).toContain(q.day);
      sendEvent(s, q.objectives.at(-1)!);
      expect(s.stars.filter((x) => x === q.day)).toHaveLength(1);
    });
  it("ne progresse pas avant acceptation et ne réinitialise pas une quête", () => {
    const s = structuredClone(initial);
    sendEvent(s, { kind: "explore", target: "library" });
    expect(s.quests.album).toBeUndefined();
    acceptQuest(s, "album");
    sendEvent(s, { kind: "find", target: "bookmark" });
    expect(s.quests.album.step).toBe(0);
    sendEvent(s, { kind: "explore", target: "library" });
    acceptQuest(s, "album");
    expect(s.quests.album.step).toBe(1);
  });
});
describe("dialogues et conditions", () => {
  it("sépare les historiques des habitants et conserve le nœud en sauvegarde", () => {
    const s = structuredClone(initial);
    choose(s, dialogues.mira, "greeting", 0, "mira");
    choose(s, dialogues.oscar, "greeting", 0, "oscar");
    expect(s.dialogueHistory).toContain("mira:greeting:0");
    expect(s.dialogueHistory).toContain("oscar:greeting:0");
    s.conversation = { key: "mira", node: "accepted" };
    expect(decode(s)?.conversation).toEqual({ key: "mira", node: "accepted" });
  });
  it("exécute les événements de choix et mémorise le choix", () => {
    const s = structuredClone(initial);
    expect(choose(s, dialogues.mira, "greeting", 0)).toBe("accepted");
    expect(s.quests.album.step).toBe(1);
    expect(s.dialogueHistory).toContain("greeting:0");
    expect(
      choicesFor(s, dialogues.mira.greeting).map((c) => c.label),
    ).not.toContain("Avec plaisir, je m’en occupe");
  });
  it("une réponse incorrecte ne résout pas l’énigme", () => {
    const s = structuredClone(initial);
    expect(choose(s, dialogues.riddle, "question", 1)).toBe("wrong");
    expect(s.flags).not.toContain("riddle-solved");
    choose(s, dialogues.riddle, "question", 0);
    expect(s.flags).toContain("riddle-solved");
  });
  it("combine drapeau, objet et négation", () => {
    const s = structuredClone(initial);
    expect(satisfies(s, { item: "ribbon" })).toBe(false);
    s.inventory.push("ribbon");
    expect(satisfies(s, { item: "ribbon" })).toBe(true);
    expect(satisfies(s, { item: "ribbon", not: true })).toBe(false);
  });
});
describe("mini-jeux", () => {
  it("la photo exige réellement les neuf fragments dans l’ordre", () => {
    let b = [...photoStart];
    expect(photoSolved(b)).toBe(false);
    for (let i = 0; i < 9; i++) b = swapTiles(b, i, b.indexOf(i));
    expect(photoSolved(b)).toBe(true);
    expect(photoSolved([])).toBe(false);
  });
  it("le mélange conserve les paires", () => {
    expect(shuffle([0, 0, 1, 1], () => 0.2).sort()).toEqual([0, 0, 1, 1]);
  });
  it("verrouille deux cartes différentes et interdit les doubles clics", () => {
    let s: Memory = { deck: [0, 1, 0, 1], open: [], matched: [], moves: 0 };
    s = flipCard(s, 0);
    expect(flipCard(s, 0)).toBe(s);
    s = flipCard(s, 1);
    expect(s.moves).toBe(1);
    expect(flipCard(s, 2)).toBe(s);
    s = { ...s, open: [] };
    s = flipCard(flipCard(s, 0), 2);
    expect(s.matched).toEqual([0, 2]);
    expect(s.open).toEqual([]);
  });
  it("vérifie les deux matériaux et la commande courante", () => {
    expect(matchesOrder(0, "Rouge", "Or")).toBe(true);
    expect(matchesOrder(0, "Rouge", "Argent")).toBe(false);
    expect(matchesOrder(1, "Rouge", "Or")).toBe(false);
    expect(matchesOrder(3, "Vert", "Or")).toBe(false);
  });
});
describe("monde", () => {
  it("garde les chemins PNJ libres de mobilier et la sortie accessible", () => {
    for (const n of citizens.filter((n) => n.room !== "village"))
      for (const p of n.path)
        expect(blocked(p, interiorRects, 480, 352)).toBe(false);
    expect(visible({ x: 240, y: 280 }, { x: 240, y: 315 }, interiorRects)).toBe(
      true,
    );
  });
  it("change les comportements à la nuit et boucle le cycle", () => {
    expect(period(180000)).toBe(0);
    expect(npcActivity("noe", 140000)).toContain("allume");
    expect(npcActivity("noe", 45000)).toContain("inspecte");
  });
});
describe("frontière calendrier serveur", () => {
  it("ne demande jamais un jour invalide et respecte les refus du serveur", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);
    const api = createServerCalendar();
    await expect(api.getDay(25)).rejects.toThrow("Jour invalide");
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(api.getDay(2)).rejects.toThrow("verrouillé");
    expect(fetchMock).toHaveBeenCalledWith("/api/advent/2", {
      credentials: "same-origin",
      cache: "no-store",
    });
    vi.unstubAllGlobals();
  });
});
