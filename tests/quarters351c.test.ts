import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { quarterItems351b, quarterDrifts351b } from "../src/art/quarters351b";
it("C : aucune recomposition des Livres ou Artisans, végétaux des Veillées conservés", () => {
  const before = JSON.parse(
    readFileSync("tests/fixtures/scenery-b.json", "utf8"),
  ).quarters.accepted;
  for (const p of before.filter(
    (p: { quarter: string; key: string }) =>
      (p.quarter !== "Q2" && p.key !== "prop-watering") ||
      /^(fir_|bush_)/.test(p.key),
  )) {
    const item = quarterItems351b.find(
      (i) =>
        i.quarter === p.quarter &&
        i.group === p.group &&
        i.key === p.key &&
        i.x === p.x &&
        i.y === p.y,
    );
    expect(item, p.group + ":" + p.key).toBeDefined();
    expect(item!.width).toBe(p.width);
  }
  const unchanged = quarterDrifts351b.filter((d) => d.quarter !== "Q2");
  expect(unchanged).toHaveLength(8);
});
