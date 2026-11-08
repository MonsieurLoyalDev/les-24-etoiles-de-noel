import { it, expect } from "vitest";
import {
  DecorationState,
  decorationKey,
  decorativeObjects,
  decorFor,
  decorationRects,
  decorLabel,
} from "../src/decor/model";
import { initial, blocked } from "../src/domain";
import { interiorRects } from "../src/rpg/world";
import { homes } from "../src/decor/neighbourhood";
import { lanes } from "../src/art/village-design";
import map from "../src/game/maps/place-des-lanternes.json";
import inventory from "../docs/graphismes/INVENTAIRE-D32.json";
import allowlist from "../ops/public-assets.json";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
it("les 24 nouveaux sprites sont isolés, natifs et traçables, avec des collisions adaptées à leur silhouette", () => {
  expect(inventory.assets).toHaveLength(24);
  for (const a of inventory.assets) {
    for (const part of [a.original, a.public])
      expect(
        createHash("sha256").update(readFileSync(part.path)).digest("hex"),
      ).toBe(part.sha256);
    expect(allowlist).toContain(a.public.path);
    expect(Math.max(...a.rawCorners)).toBeLessThanOrEqual(1);
    expect(a.transparentFraction).toBeGreaterThan(0.05);
    expect(Math.max(a.width, a.height)).toBeLessThanOrEqual(256);
    const raw = readFileSync(a.original.path);
    expect(a.bounds.left).toBeGreaterThan(0);
    expect(a.bounds.top).toBeGreaterThan(0);
    expect(a.bounds.right).toBeLessThan(raw.readUInt32BE(16) - 1);
    expect(a.bounds.bottom).toBeLessThan(raw.readUInt32BE(20) - 1);
    const h = homes.find((h) => h.key === a.key);
    if (h) {
      expect(h.footprint.x).toBeGreaterThanOrEqual(h.x - a.width / 4);
      expect(h.footprint.x + h.footprint.w).toBeLessThanOrEqual(
        h.x + a.width / 4,
      );
    }
  }
});
it("les huit nouvelles emprises laissent tous les chemins et accès existants libres", () => {
  const rects = homes.map((x) => x.footprint);
  for (const lane of lanes)
    for (let i = 1; i < lane.points.length; i++) {
      const a = lane.points[i - 1],
        b = lane.points[i],
        length = Math.hypot(b.x - a.x, b.y - a.y);
      for (let t = 0; t <= 1; t += 4 / length)
        for (const side of [-1, 0, 1]) {
          const p = {
            x:
              a.x +
              (b.x - a.x) * t -
              (((b.y - a.y) / length) * side * lane.width) / 2,
            y:
              a.y +
              (b.y - a.y) * t +
              (((b.x - a.x) / length) * side * lane.width) / 2,
          };
          if (p.x > 8 && p.x < 1016 && p.y > 8 && p.y < 760)
            expect(
              blocked(p, rects, 1024, 768),
              `${lane.id} ${JSON.stringify(p)}`,
            ).toBe(false);
        }
    }
  for (const b of map.buildings)
    for (const dy of [9, 20, 35])
      expect(
        blocked(
          { x: b.entrance.x * 16, y: b.entrance.y * 16 + dy },
          rects,
          1024,
          768,
        ),
      ).toBe(false);
  for (const p of [
    { x: 512, y: 608 },
    { x: 512, y: 430 },
    { x: 560, y: 500 },
    { x: 440, y: 460 },
    { x: 700, y: 500 },
    { x: 240, y: 430 },
    { x: 850, y: 440 },
  ])
    expect(blocked(p, rects, 1024, 768)).toBe(false);
  for (const h of homes) {
    expect(h.x - h.width / 2).toBeGreaterThanOrEqual(0);
    expect(h.x + h.width / 2).toBeLessThanOrEqual(1024);
    expect(h.y - h.maxHeight).toBeGreaterThanOrEqual(0);
    expect(h.y).toBeLessThanOrEqual(768);
  }
});
it("les 17 objets ont des identifiants stables uniques et chaque pièce dispose de quatre actions au moins", () => {
  expect(decorativeObjects).toHaveLength(17);
  expect(new Set(decorativeObjects.map((x) => x.id)).size).toBe(17);
  for (const room of ["house", "library", "workshop", "inn"] as const) {
    expect(decorFor(room).length).toBeGreaterThanOrEqual(4);
    for (const x of decorFor(room))
      expect(
        blocked(x, [...interiorRects, ...decorationRects(room)], 480, 352),
      ).toBe(false);
    for (const p of [
      { x: 240, y: 280 },
      { x: 240, y: 315 },
      { x: 300, y: 270 },
      { x: 100, y: 230 },
      { x: 160, y: 175 },
    ])
      expect(blocked(p, decorationRects(room), 480, 352)).toBe(false);
  }
});
it("les interrupteurs persistent dans une clé indépendante, sans modifier le RPG", () => {
  const save = structuredClone(initial),
    before = JSON.stringify(save),
    writes = new Map<string, string>();
  const storage = {
    getItem: (key: string) => writes.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes.set(key, value);
    },
  };
  const state = new DecorationState(storage),
    item = decorativeObjects[0];
  expect(state.isOn(item)).toBe(false);
  expect(decorLabel(item, state)).toMatch(/^Allumer/);
  state.toggle(item);
  expect(state.isOn(item)).toBe(true);
  expect(new DecorationState(storage).isOn(item)).toBe(true);
  state.toggle(item);
  expect(new DecorationState(storage).isOn(item)).toBe(false);
  expect([...writes.keys()]).toEqual([decorationKey]);
  expect(JSON.stringify(save)).toBe(before);
});
it("stockage corrompu, champs inconnus et interdiction de stockage ne cassent pas les objets", () => {
  const item = decorativeObjects[0];
  for (const raw of [
    "oops",
    "{}",
    '{"version":2,"switches":{"house-candle":true}}',
    '{"version":1,"switches":{"house-candle":"true","__proto__":true}}',
  ])
    expect(
      new DecorationState({ getItem: () => raw, setItem: () => {} }).isOn(item),
    ).toBe(false);
  const denied = new DecorationState({
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("denied");
    },
  });
  denied.toggle(item);
  expect(denied.isOn(item)).toBe(true);
  denied.toggle(decorativeObjects[1]);
  expect(denied.isOn(item)).toBe(true);
});
