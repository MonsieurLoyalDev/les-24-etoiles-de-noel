import { originalProof } from "./original-proof";
import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import d3 from "../docs/graphismes/INVENTAIRE-D3.json";
import native from "../docs/graphismes/INVENTAIRE-D31.json";
import allowlist from "../ops/public-assets.json";
import { terrainRegions, snowBanks } from "../src/art/terrain-design";
import { furnitureSlots, furnitureByRoom } from "../src/art/interior-layout";
import { interiorRects } from "../src/rpg/world";
import { interiorCameraBounds } from "../src/art/interior-camera";
import { interiorLightPalette } from "../src/art/interior-light";
it("préserve exactement les PNG, coordonnées et tailles du terrain D.3 validé", () => {
  expect(terrainRegions).toEqual(d3.terrainRegions);
  expect(snowBanks).toEqual(d3.snowBanks);
  for (const a of d3.assets)
    expect(
      createHash("sha256").update(readFileSync(a.path)).digest("hex"),
    ).toBe(a.sha256);
});
it("les meubles hauts restent liés aux trois emprises physiques existantes", () => {
  expect(furnitureSlots.map((p) => p.footprint)).toEqual([
    interiorRects[5],
    interiorRects[4],
    interiorRects[6],
  ]);
  expect(new Set(Object.values(furnitureByRoom).flat()).size).toBe(12);
  for (const p of furnitureSlots) {
    expect(p.y - p.maxHeight).toBeGreaterThanOrEqual(0);
    expect(p.x - p.width / 2).toBeGreaterThanOrEqual(32);
    expect(p.x + p.width / 2).toBeLessThanOrEqual(448);
  }
});
it("le cadrage ajoute seulement une marge visuelle lorsque la pièce tient dans l’écran", () => {
  const pc = interiorCameraBounds(1280, 900, 2);
  expect(pc).toEqual({ x: -80, y: -49, width: 640, height: 450 });
  const phone = interiorCameraBounds(390, 750, 1.5);
  expect(phone.x).toBe(0);
  expect(phone.width).toBe(480);
  expect(phone.height).toBe(500);
  const small = interiorCameraBounds(320, 480, 1.5);
  expect(small.x).toBe(0);
  expect(small.y).toBe(0);
  expect(small.height).toBe(352);
});
it("la lumière intérieure se raccorde doucement au cycle existant et reste chaude près des lampes", () => {
  for (const t of [45000, 90000, 135000, 180000]) {
    const a = interiorLightPalette(t - 1),
      b = interiorLightPalette(t);
    expect(Math.abs(a.warm - b.warm)).toBeLessThan(0.001);
    for (const shift of [0, 8, 16])
      expect(
        Math.abs(((a.ambient >> shift) & 255) - ((b.ambient >> shift) & 255)),
      ).toBeLessThanOrEqual(1);
  }
  expect(interiorLightPalette(135000).warm).toBeGreaterThan(
    interiorLightPalette(45000).warm,
  );
});
it("les 24 exports natifs restent petits, transparents et conformes aux originaux conservés", () => {
  expect(native.assets).toHaveLength(24);
  expect(native.publicBytes).toBeLessThan(native.originalBytes * 0.15);
  for (const a of native.assets) {
    const bytes = readFileSync(a.public.path);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      a.public.sha256,
    );
    expect(allowlist).toContain(a.public.path);
    expect(Math.max(a.public.width, a.public.height)).toBeLessThanOrEqual(512);
    expect(originalProof(a.original.path).sha256).toBe(a.original.sha256);
    if (a.mode === "cutout") {
      expect(a.rawTransparentFraction).toBeGreaterThan(0.05);
      expect(a.renderCorners).toEqual([0, 0, 0, 0]);
    }
  }
});
