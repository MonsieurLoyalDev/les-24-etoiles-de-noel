import { it, expect, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { rgbaPng } from "./png-rgba";
import assets from "../src/narrative/polish-assets.json";
import allowlist from "../ops/public-assets.json";
import { starFlight } from "../src/narrative/star-flight";
vi.mock("phaser", () => ({ default: {} }));
vi.mock("../src/art/actors", () => ({ animateActor: vi.fn() }));
import { DayOnePolish, gestureFrames } from "../src/narrative/polish";
import { reaction } from "../src/art/reactions";
import type Phaser from "phaser";

it("24 frames RGBA bornées, distinctes, transparentes et autorisées en privé", () => {
  for (const a of Object.values(assets)) {
    expect(allowlist).toContain("public" + a.file);
    const im = rgbaPng("public" + a.file);
    expect([im.width, im.height]).toEqual([1024, 512]);
    const hashes = new Set();
    for (let frame = 0; frame < 8; frame++) {
      const pixels = Buffer.alloc(256 * 256 * 4);
      for (let y = 0; y < 256; y++)
        im.data.copy(
          pixels,
          y * 256 * 4,
          ((Math.floor(frame / 4) * 256 + y) * 1024 + (frame % 4) * 256) * 4,
          ((Math.floor(frame / 4) * 256 + y) * 1024 + (frame % 4) * 256 + 256) *
            4,
        );
      for (let p = 0; p < 256; p++)
        for (const index of [p, 255 * 256 + p, p * 256, p * 256 + 255])
          expect(pixels[index * 4 + 3]).toBe(0);
      hashes.add(createHash("sha256").update(pixels).digest("hex"));
    }
    expect(hashes.size).toBe(8);
  }
});
it("les anciens atlas du couple renard ne figurent pas dans la présentation E2.1", () => {
  const source = readFileSync("src/narrative/polish.ts", "utf8");
  expect(source).not.toMatch(/calin_atlas|mains_atlas|bisou_atlas/);
  expect(gestureFrames.hug).toEqual([4, 5, 6, 7, 7, 6, 5, 4]);
});
it("aucun déclencheur ambiant historique ne charge un couple renard pendant l'épisode", () => {
  const scene = {
    narrative: {},
    get textures() {
      throw Error("Legacy couple texture requested");
    },
  };
  for (const kind of ["calin", "bisou", "mains", "rechauffe"] as const)
    expect(() =>
      reaction(scene as never, kind, {} as never, {} as never),
    ).not.toThrow();
});
it("trajectoires : extrémités exactes, courbe continue et coordonnées finies", () => {
  const a = { x: 100, y: 80 },
    b = { x: 500, y: 20 };
  expect(starFlight(a, b, -1, 55)).toEqual(a);
  expect(starFlight(a, b, 2, 55)).toEqual(b);
  expect(starFlight(a, b, 0.5, 55).y).toBeLessThan(50);
  let previous = a;
  for (let i = 0; i <= 100; i++) {
    const next = starFlight(a, b, i / 100, 55);
    expect(Number.isFinite(next.x + next.y)).toBe(true);
    expect(Math.hypot(next.x - previous.x, next.y - previous.y)).toBeLessThan(
      10,
    );
    previous = next;
  }
});
function actor(x: number) {
  return {
    x,
    y: 100,
    active: true,
    visible: true,
    setVisible(v: boolean) {
      this.visible = v;
      return this;
    },
  };
}
function setup() {
  const overlay = {
    active: true,
    frame: 0,
    setOrigin() {
      return this;
    },
    setScale() {
      return this;
    },
    setDepth() {
      return this;
    },
    setName() {
      return this;
    },
    setFrame(f: number) {
      this.frame = f;
      return this;
    },
    destroy() {
      this.active = false;
    },
  };
  const scene = {
    textures: { exists: () => true },
    add: { sprite: () => overlay },
  };
  return {
    director: new DayOnePolish(scene as unknown as Phaser.Scene),
    overlay,
    a: actor(100),
    b: actor(130),
  };
}
it("le câlin dessiné termine sans déplacer les corps ni toucher une sauvegarde", () => {
  const { director, overlay, a, b } = setup();
  director.start("hug", a as never, b as never);
  expect(a.visible).toBe(false);
  expect(b.visible).toBe(false);
  for (let i = 0; i < 17; i++) director.update(100, false, false);
  expect(overlay.frame).toBe(7);
  for (let i = 0; i < 16; i++) director.update(100, false, false);
  expect(director.active).toBe(false);
  expect(a.visible && b.visible).toBe(true);
  expect([a.x, b.x]).toEqual([100, 130]);
});
it("dialogue, marche, destruction et réduction des mouvements nettoient les gestes", () => {
  for (const mode of ["dialogue", "walk", "destroy", "reduced"]) {
    const { director, a, b } = setup();
    director.start("hands", a as never, b as never);
    if (mode === "dialogue") director.update(16, true, false);
    if (mode === "walk") {
      a.x += 5;
      director.update(16, false, false);
    }
    if (mode === "destroy") director.destroy();
    if (mode === "reduced")
      for (let i = 0; i < 5; i++) director.update(100, false, true);
    expect(director.active).toBe(false);
    expect(a.visible && b.visible).toBe(true);
  }
});
it("une pose assise exige un vrai banc proche", () => {
  const { director, a, b } = setup();
  director.start("sit", a as never, b as never);
  expect(director.active).toBe(false);
  expect(a.visible).toBe(true);
});
