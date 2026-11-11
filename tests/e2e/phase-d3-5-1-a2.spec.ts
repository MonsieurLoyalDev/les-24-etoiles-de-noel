import { test, expect } from "@playwright/test";
import { initial, blocked, type Save } from "../../src/domain";
import { navigateTo } from "./pathfinding";
test("D351 A2 tour réel du sapin et des deux bancs sans obstacle", async ({
  page,
}) => {
  test.setTimeout(120000);
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
      position: { x: 960, y: 790 },
      clock: 45000,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village");
  const rects = JSON.parse(
    (await page.locator("canvas").getAttribute("data-collisions"))!,
  );
  for (const p of [
    { x: 990, y: 762 },
    { x: 1070, y: 810 },
    { x: 1002, y: 882 },
    { x: 900, y: 915 },
    { x: 960, y: 812 },
  ]) {
    expect(blocked(p, rects, 1920, 1408)).toBe(false);
    await navigateTo(page, p);
  }
  await expect(page.locator(".quest")).toContainText("3 / 24");
});
