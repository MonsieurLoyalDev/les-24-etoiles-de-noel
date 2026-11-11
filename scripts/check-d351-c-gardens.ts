import { chromium, type Page } from "@playwright/test";
import { initial, type Save } from "../src/domain";
import { writeFileSync } from "node:fs";
import { navigateTo } from "../tests/e2e/pathfinding";
async function seed(
  page: Page,
  port: number,
  x: number,
  y: number,
  clock: number,
) {
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.evaluate(
    async (save: Save) => {
      await new Promise<void>((ok, fail) => {
        const r = indexedDB.open("etoilebois", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("saves");
        r.onerror = () => fail(r.error);
        r.onsuccess = () => {
          const t = r.result.transaction("saves", "readwrite");
          t.objectStore("saves").put(save, "phase-b");
          t.oncomplete = () => {
            r.result.close();
            ok();
          };
        };
      });
    },
    {
      ...structuredClone(initial),
      stage: 4,
      stars: [1, 3, 18],
      position: { x, y },
      clock,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.locator('canvas[data-room="village"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(850);
}
const browser = await chromium.launch({ channel: "chrome" }),
  results = [];
try {
  for (const profile of ["desktop", "mobile"]) {
    const mobile = profile === "mobile",
      context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1280, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
      }),
      page = await context.newPage();
    await page.addInitScript("window.__name=f=>f");
    await seed(page, 5182, 420, 420, 45000);
    for (const [id, gate, inside] of [
      ["J1", { x: 310, y: 660 }, { x: 310, y: 645 }],
      ["J4", { x: 1845, y: 957.5 }, { x: 1866, y: 979 }],
    ] as const) {
      await navigateTo(page, gate);
      await navigateTo(page, inside);
      await navigateTo(page, gate);
      results.push({
        profile,
        garden: id,
        entryAndExit: true,
        gate,
        inside,
        controls: "real keyboard movement, mobile viewport emulated",
      });
    }
    await context.close();
  }
  writeFileSync(
    "docs/graphismes/d351-c/JARDINS.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
