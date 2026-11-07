import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { initial } from "../../src/domain";
async function start(page: Page, position?: { x: number; y: number }) {
  await page.clock.setFixedTime(new Date("2026-11-07T12:00:00+01:00"));
  await page.goto("/");
  if (position)
    await page.evaluate(
      async (save) => {
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
      { ...initial, stage: 4, stars: [1], position },
    );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village", {
    timeout: 30000,
  });
  if (!position) await page.getByRole("button", { name: /Continuer/ }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(240);
  mkdirSync("docs/screenshots/phase-d2/apres", { recursive: true });
}
test("D.2 : promenade et place centrale", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.screenshot({
    path: `docs/screenshots/phase-d2/apres/${info.project.name}-village.png`,
  });
  await start(page, { x: 512, y: 400 });
  await page.screenshot({
    path: `docs/screenshots/phase-d2/apres/${info.project.name}-place.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("D.2 : cadrage des quatre façades sur PC et mobile", async ({
  page,
}, info) => {
  if (info.project.name === "desktop")
    await page.setViewportSize({ width: 1280, height: 1000 });
  for (const [name, x, y] of [
    ["bibliotheque", 208, 342],
    ["atelier", 784, 294],
    ["auberge", 464, 235],
    ["maison", 800, 655],
  ] as const) {
    await start(page, { x, y });
    await page.screenshot({
      path: `docs/screenshots/phase-d2/apres/${info.project.name}-${name}.png`,
    });
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      "village",
    );
  }
});
test("D.2 : vue globale et abords des quatre bâtiments", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Une seule vue globale suffit.");
  await page.setViewportSize({ width: 2048, height: 1634 });
  await start(page);
  await page.screenshot({
    path: "docs/screenshots/phase-d2/apres/village-complet.png",
  });
});
