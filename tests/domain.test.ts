import { describe, it, expect } from "vitest";
import {
  advance,
  blocked,
  move,
  visible,
  decode,
  initial,
  movementDistance,
} from "../src/domain";
import map from "../src/game/maps/place-des-lanternes.json";
describe("progression", () => {
  it("exige les quatre étapes dans l’ordre", () => {
    expect(advance(0, "tree")).toBe(0);
    expect(advance(0, "letter")).toBe(0);
    let s = initial.stage;
    for (const e of ["loyal", "enter", "letter", "tree"]) s = advance(s, e);
    expect(s).toBe(4);
    expect(advance(s, "letter")).toBe(4);
  });
});
describe("collisions", () => {
  const walls = [{ x: 20, y: 20, w: 20, h: 20 }];
  it("bloque murs et limites", () => {
    expect(blocked({ x: 25, y: 25 }, walls, 100, 100)).toBe(true);
    expect(blocked({ x: 0, y: 10 }, walls, 100, 100)).toBe(true);
    expect(move({ x: 10, y: 30 }, 10, 3, walls, 100, 100)).toEqual({
      x: 12.5,
      y: 33,
    });
  });
  it("interdit les interactions à travers un mur", () => {
    expect(visible({ x: 10, y: 30 }, { x: 50, y: 30 }, walls)).toBe(false);
    expect(visible({ x: 10, y: 10 }, { x: 50, y: 10 }, walls)).toBe(true);
  });
  it("valide les 3072 cellules du pack", () => {
    expect(map.ground).toHaveLength(48);
    expect(
      map.ground.every(
        (r) => r.length === 64 && r.every((n) => n >= 0 && n < 32),
      ),
    ).toBe(true);
  });
});
describe("sauvegarde", () => {
  it("rejette versions et données invalides", () => {
    expect(decode({ ...initial, version: 99 })).toBeNull();
    expect(decode({ ...initial, stage: 24 })).toBeNull();
    expect(decode({ ...initial, position: { x: NaN, y: 1 } })).toBeNull();
    expect(decode(initial)).toEqual(initial);
  });
});
it("ne copie jamais les objets du moteur dans les coordonnées sauvegardées", () => {
  const actor = { x: 10, y: 10, scene: { callback: () => {} } };
  expect(move(actor, 1, 1, [], 100, 100)).toEqual({ x: 11, y: 11 });
  expect(() => structuredClone(move(actor, 1, 1, [], 100, 100))).not.toThrow();
});
it("ne traverse pas un mur lors d’une grande image de déplacement", () => {
  const walls = [{ x: 30, y: 0, w: 2, h: 100 }];
  const p = move({ x: 10, y: 50 }, 90, 0, walls, 200, 100);
  expect(p.x).toBeLessThanOrEqual(24);
  const reverse = move({ x: 90, y: 50 }, -80, 0, walls, 200, 100);
  expect(reverse.x).toBeGreaterThanOrEqual(38);
});
it("conserve la même distance par seconde à 5 et à 60 images par seconde", () => {
  function simulate(frames: number) {
    let p = { x: 10, y: 50 };
    for (let i = 0; i < frames; i++)
      p = move(p, movementDistance(1000 / frames), 0, [], 500, 100);
    return p.x;
  }
  expect(simulate(5)).toBeCloseTo(115, 8);
  expect(simulate(60)).toBeCloseTo(simulate(5), 8);
});
