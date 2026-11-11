import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { initial, type Save } from "../../src/domain";
import { plan } from "../../src/art/village34";
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

test("D351 C préservation B, trois scènes et portillons libres", async ({
  page,
}) => {
  await start(page);
  const a = await page
    .locator("canvas")
    .evaluate((c) => ({
      scenery: JSON.parse(c.dataset.scenery34!),
      quarters: JSON.parse(c.dataset.quarters351b!),
      fences: JSON.parse(c.dataset.fences35!),
    }));
  const b = JSON.parse(readFileSync("tests/fixtures/scenery-b.json", "utf8"));
  type P = {
    quarter: string;
    x: number;
    y: number;
    key: string;
    box: { x: number; y: number; w: number; h: number };
  };
  expect(a.quarters.rejected).toEqual([]);
  expect(a.scenery.placed.filter((p: P) => p.quarter !== "Q2")).toEqual(
    b.scenery.placed.filter((p: P) => p.quarter !== "Q2"),
  );
  expect(a.fences.gates).toHaveLength(5);
  const rest = a.quarters.accepted.find(
    (p: P) => p.key === "bench-garden" && p.quarter === "Q2",
  );
  expect(rest.x).toBe(1668);
  expect(rest.width).toBe(80);
  for (const g of [
    "veillees-voisinage",
    "veillees-bois-maison",
    "veillees-jardin-famille",
  ])
    expect(
      a.quarters.accepted.filter((p: { group: string }) => p.group === g)
        .length,
    ).toBeGreaterThan(4);
});
test("D351 C parcours continu des quatre quartiers, place, jardin et quatre seuils", async ({
  page,
}) => {
  test.setTimeout(600000);
  await start(page);
  for (const p of [
    { x: 420, y: 420 },
    { x: 1420, y: 430 },
    { x: 960, y: 790 },
    { x: 1600, y: 980 },
    { x: 560, y: 960 },
  ])
    await navigateTo(page, p);
  for (const h of plan.houses.filter((h) => h.quarter === "Q2"))
    await navigateTo(page, h.door);
  const g = plan.gardens.find((g) => g.id === "J2")!;
  await navigateTo(page, { x: g.gate[0], y: g.gate[1] });
  await navigateTo(page, { x: 1760, y: 461 });
  await navigateTo(page, { x: g.gate[0], y: g.gate[1] });
  await expect(page.locator(".quest")).toContainText("3 / 24");
});
