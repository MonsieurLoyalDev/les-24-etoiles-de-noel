import { it, expect } from "vitest";
import {
  witnessItems351,
  witnessRegion351,
  pathWeathering351,
  snowDrifts352,
  loyalThreshold351,
  driftRelief351,
  driftShadow351,
} from "../src/art/composition351";
it("D351 étape A : les compositions sont limitées aux deux secteurs témoins", () => {
  for (const p of witnessItems351) {
    expect(witnessRegion351(p.x, p.y), p.group).toBe(true);
    expect(p.width).toBeGreaterThan(10);
    expect(p.width).toBeLessThanOrEqual(80);
  }
  for (const p of [
    [420, 420],
    [1420, 430],
    [1530, 970],
    [1390, 635],
  ])
    expect(witnessRegion351(...(p as [number, number]))).toBe(false);
  expect(
    new Set(
      witnessItems351
        .filter((p) => p.key.startsWith("bench-"))
        .map((p) => p.group),
    ).size,
  ).toBe(2);
  expect(
    witnessItems351.filter(
      (p) => p.group === "place-conviviale" && p.key.startsWith("bench-"),
    ),
  ).toHaveLength(2);
  const benches = witnessItems351.filter(
    (p) => p.group === "place-conviviale" && p.key.startsWith("bench-"),
  );
  expect(Math.abs(benches[0].y - benches[1].y)).toBeGreaterThanOrEqual(50);
});
it("D351 la neige additionnelle reste sur les chemins des secteurs témoins", () => {
  let changed = 0;
  let maximum = 0;
  for (let y = 0; y < 1408; y += 7)
    for (let x = 0; x < 1920; x += 7) {
      const value = pathWeathering351(x, y, -4);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0.9);
      if (!witnessRegion351(x, y)) expect(value).toBe(0);
      if (value > 0) changed++;
      maximum = Math.max(maximum, value);
      expect(pathWeathering351(x, y, 4)).toBe(0);
    }
  expect(changed).toBeGreaterThan(100);
  expect(maximum).toBeGreaterThan(0.8);
  expect(snowDrifts352.every((d) => d.points.length >= 7)).toBe(true);
});
it("A2 contact limité au pied du chalet et jamais devant sa porte ou ses fenêtres", () => {
  const item = {
    key: "wood-rack",
    x: 660,
    y: 909,
    width: 32,
    group: "loyal-accueil",
    contact: true,
  };
  const box = { x: 644, y: 884.75, w: 32, h: 24.25 },
    base = { x: 647.2, y: 903, w: 25.6, h: 7 };
  expect(loyalThreshold351(item, box, base)).toBe(true);
  expect(
    loyalThreshold351({ ...item, x: 720 }, box, { ...base, x: 707.2 }),
  ).toBe(false);
  expect(loyalThreshold351(item, { ...box, y: 860 }, base)).toBe(false);
  expect(loyalThreshold351({ ...item, key: "gift-stack" }, box, base)).toBe(
    false,
  );
  expect(loyalThreshold351({ ...item, contact: false }, box, base)).toBe(false);
});
it("A2 relief des pavés sans bruit aléatoire et ombre confinée aux témoins", () => {
  expect(driftRelief351(0.5, 200)).toBeLessThan(driftRelief351(0.5, 100));
  expect(driftRelief351(0, 200)).toBe(0);
  expect(driftShadow351(0.8, 0.2, 940, 860)).toBeGreaterThan(0);
  expect(driftShadow351(0.8, 0.2, 1420, 430)).toBe(0);
});
