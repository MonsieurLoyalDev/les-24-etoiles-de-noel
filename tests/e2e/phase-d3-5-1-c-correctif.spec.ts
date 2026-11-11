import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { initial, type Save } from "../../src/domain";
import { navigateTo } from "./pathfinding";
async function start(page: Page, position = { x: 560, y: 960 }) {
  await page.goto("/");
  await page.evaluate(
    async (save: Save) => {
      await new Promise<void>((resolve, reject) => {
        const r = indexedDB.open("etoilebois", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("saves");
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
          const t = r.result.transaction("saves", "readwrite");
          t.objectStore("saves").put(save, "phase-b");
          t.oncomplete = () => {
            r.result.close();
            resolve();
          };
        };
      });
    },
    {
      ...structuredClone(initial),
      stage: 4 as const,
      stars: [1, 3, 18],
      position,
      clock: 45000,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village");
}

test("D351 correctif : deux zones seulement, huit bancs deux places et calque des chemins conservé", async ({
  page,
}) => {
  await start(page, { x: 1700, y: 400 });
  const a = await page
      .locator("canvas")
      .evaluate((c) => ({
        scenery: JSON.parse(c.dataset.scenery34!),
        quarters: JSON.parse(c.dataset.quarters351b!),
        witness: JSON.parse(c.dataset.witness351!),
        ground: JSON.parse(c.dataset.ground35!),
        seats: JSON.parse(c.dataset.seats35!),
        fences: JSON.parse(c.dataset.fences35!),
      })),
    b = JSON.parse(readFileSync("tests/fixtures/scenery-c.json", "utf8"));
  type P = {
    quarter: string;
    group?: string;
    key: string;
    x: number;
    y: number;
    width: number;
  };
  const corrected = (p: P) =>
    p.quarter === "Q2" &&
    ((p.group === "veillees-voisinage" && p.key === "prop-basket") ||
      (p.group === "veillees-jardin-famille" &&
        ["bench-garden", "prop-lantern", "prop-planter"].includes(p.key)));
  expect(a.scenery.placed.filter((p: P) => !corrected(p))).toEqual(
    b.scenery.placed.filter((p: P) => !corrected(p)),
  );
  expect(a.scenery.placed).toHaveLength(b.scenery.placed.length);
  expect(a.witness).toEqual(b.witness);
  expect(a.quarters.rejected).toEqual([]);
  expect(a.quarters.accepted).toHaveLength(77);
  expect(
    a.quarters.ground.filter(
      (p: { x: number; y: number }) => !(p.x === 1660 && p.y === 439),
    ),
  ).toEqual(
    b.quarters.ground.filter(
      (p: { x: number; y: number }) => !(p.x === 1668 && p.y === 449),
    ),
  );
  for (const prop of [
    "covered",
    "irregularEdge",
    "snowIslands",
    "routes",
    "courts",
  ])
    expect(a.ground[prop]).toBe(b.ground[prop]);
  const benches = a.scenery.placed.filter((p: P) => p.key.startsWith("bench-"));
  expect(benches).toHaveLength(8);
  for (const bench of benches) expect(bench.width).toBeGreaterThanOrEqual(80);
  expect(a.seats).toHaveLength(8);
  for (const seat of a.seats) {
    expect(seat.positions).toHaveLength(2);
    expect(seat.positions[1][0] - seat.positions[0][0]).toBe(40);
  }
  expect(a.fences.gates).toHaveLength(5);
});
test("D351 correctif : accès réel au repos, au portillon et aux seuils voisins", async ({
  page,
}) => {
  test.setTimeout(120000);
  await start(page, { x: 1700, y: 400 });
  for (const p of [
    { x: 1592, y: 420 },
    { x: 1655, y: 436 },
    { x: 1700, y: 400 },
    { x: 1755, y: 427.5 },
    { x: 1760, y: 461 },
    { x: 1755, y: 427.5 },
    { x: 1602, y: 380 },
    { x: 1380, y: 335 },
    { x: 1420, y: 430 },
  ])
    await navigateTo(page, p);
  await expect(page.locator(".quest")).toContainText("3 / 24");
});
