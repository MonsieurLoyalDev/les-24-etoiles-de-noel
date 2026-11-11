import { test, expect, type Page } from "@playwright/test";
import { initial, type Save } from "../../src/domain";
import { plan } from "../../src/art/village34";
import { quarterItems351b } from "../../src/art/quarters351b";
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

test("D351 B compositions effectives, échelles et trois jardins", async ({
  page,
}) => {
  await start(page);
  const a = await page
    .locator("canvas")
    .evaluate((c) => JSON.parse(c.dataset.quarters351b!));
  expect(a.rejected).toEqual([]);
  expect(a.accepted).toHaveLength(quarterItems351b.length);
  expect(a.groups).toHaveLength(19);
  for (const p of a.ground) expect(p.w / p.h).toBeCloseTo(p.ratio, 6);
  for (const q of ["Q1", "Q2", "Q4"])
    expect(
      a.accepted.filter((p: { quarter: string }) => p.quarter === q).length,
    ).toBeGreaterThan(15);
  expect(
    a.accepted.find((p: { key: string }) => p.key === "d31-workshop-bench")
      .texture,
  ).toBe("d31-workshop-bench");
});
test("D351 B promenade réelle aux douze habitations et aux trois portillons", async ({
  page,
}) => {
  test.setTimeout(600000);
  await start(page);
  for (const q of ["Q1", "Q2", "Q4"]) {
    for (const h of plan.houses.filter((h) => h.quarter === q))
      await navigateTo(page, h.door);
    const g = plan.gardens.find(
      (g) => g.id === { Q1: "J1", Q2: "J2", Q4: "J4" }[q],
    )!;
    await navigateTo(page, { x: g.gate[0], y: g.gate[1] });
  }
  await expect(page.locator(".quest")).toContainText("3 / 24");
});
