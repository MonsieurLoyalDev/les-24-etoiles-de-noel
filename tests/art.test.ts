import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import catalog from "../src/art/catalog.json";
import inventory from "../docs/graphismes/INVENTAIRE.json";
import { dialoguePresentation } from "../src/art/Dialogue";
import { normalizeAudio } from "../src/art/audio";
import slots from "../src/art/audio-slots.json";
it("les 24 positions correspondent exactement aux jours 1–24 sans doublons", () => {
  expect(catalog.positions.map((p) => Number(p.jour))).toEqual(
    Array.from({ length: 24 }, (_, i) => i + 1),
  );
  expect(new Set(catalog.positions.map((p) => `${p.x},${p.y}`)).size).toBe(24);
  for (const p of catalog.positions) {
    expect(Number(p.x)).toBeGreaterThan(0);
    expect(Number(p.x)).toBeLessThan(1536);
    expect(Number(p.y)).toBeLessThan(1024);
  }
});
it("le sapin possède 25 états complets sans ajouter une 25e journée", () => {
  const frames =
    catalog.atlases["sapin_atlas-Etoilebois_Sapin_V11_4"].data.frames;
  expect(frames.map((f) => f.filename)).toEqual(
    Array.from({ length: 25 }, (_, i) => `sapin_${String(i).padStart(2, "0")}`),
  );
});
it("les 32 portraits correspondent aux huit personnages et quatre émotions", () => {
  for (const person of [
    "loyal",
    "debby",
    "augustin",
    "madeleine",
    "emile",
    "celestine",
    "basile",
    "flocon",
  ])
    for (const emotion of ["neutre", "joyeux", "surpris", "triste"])
      expect(
        catalog.images[`${person}_${emotion}` as keyof typeof catalog.images],
      ).toContain("/portraits/");
});
it("aucune réinterprétation du portrait et du locuteur", () => {
  expect(dialoguePresentation("Loyal — Merci Debby ♥")).toMatchObject({
    name: "Loyal",
    emotion: "joyeux",
    portrait: catalog.images.loyal_joyeux,
  });
  expect(
    dialoguePresentation("Célestine · Bibliothécaire — Ce livre est ancien.")
      .portrait,
  ).toBe(catalog.images.celestine_neutre);
  expect(dialoguePresentation("Le livre — Exactement !").portrait).toBeNull();
  expect(dialoguePresentation("Un souvenir se réveille.").name).toBe(
    "Étoilebois",
  );
});
it("les images copiées conservent les octets du pack validé", () => {
  for (const asset of inventory) {
    if (!asset.integration?.startsWith("public/")) continue;
    const bytes = readFileSync(asset.integration);
    expect(createHash("sha256").update(bytes).digest("hex"), asset.source).toBe(
      asset.sha256,
    );
    expect(bytes.readUInt32BE(16)).toBe(asset.width);
    expect(bytes.readUInt32BE(20)).toBe(asset.height);
  }
});
it("les atlas restent dans les dimensions de leurs textures", () => {
  for (const atlas of Object.values(catalog.atlases)) {
    const data = atlas.data,
      frames = Object.values(data.frames);
    for (const { frame } of frames) {
      expect(frame.x + frame.w).toBeLessThanOrEqual(data.meta.size.w);
      expect(frame.y + frame.h).toBeLessThanOrEqual(data.meta.size.h);
    }
  }
});
it("l'audio absent reste silencieux et les réglages corrompus sont bornés", () => {
  expect(Object.values(slots).every((s) => s === null)).toBe(true);
  expect(normalizeAudio({ volume: 90, muted: false })).toEqual({
    volume: 1,
    muted: false,
  });
  expect(normalizeAudio({ volume: NaN })).toEqual({ volume: 0.5, muted: true });
});
