import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { initial, type Save } from "../../src/domain";
import { navigateTo } from "./pathfinding";
import { anchors } from "../../src/art/village34";
async function start(
  page: Page,
  position?: { x: number; y: number },
  room: Save["room"] = "village",
) {
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
      { ...initial, room, stage: 4, stars: [1], position },
    );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", room, {
    timeout: 30000,
  });
  if (!position) await page.getByRole("button", { name: /Continuer/ }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(240);
  mkdirSync("docs/screenshots/phase-d2-1/apres", { recursive: true });
}
test("D.2.1 : promenade et place centrale", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.screenshot({
    path: `docs/screenshots/phase-d2-1/apres/${info.project.name}-village.png`,
  });
  await start(page, { x: 512, y: 400 });
  await page.screenshot({
    path: `docs/screenshots/phase-d2-1/apres/${info.project.name}-place.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
type Tag = {
  name: string;
  visible: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};
async function tags(page: Page): Promise<Tag[]> {
  return JSON.parse(
    (await page.locator("canvas").getAttribute("data-name-tags")) ?? "[]",
  );
}
test("D.2.1 : étiquettes masquées en dialogue, stables et contenues", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Dialogue", exact: true }),
  ).toBeVisible();
  await expect.poll(async () => (await tags(page)).length).toBeGreaterThan(0);
  expect((await tags(page)).every((t) => !t.visible)).toBeTruthy();
  await page.screenshot({
    path: `docs/screenshots/phase-d2-1/apres/${info.project.name}-dialogue.png`,
  });
  await page.getByRole("button", { name: /Continuer/ }).click();
  await navigateTo(page, { x: anchors.spawn.x + 40, y: anchors.spawn.y });
  const first = (await tags(page)).find((t) => t.name === "Debby")!;
  await page.waitForTimeout(200);
  const next = (await tags(page)).find((t) => t.name === "Debby")!;
  expect(Math.abs(first.x - next.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(first.y - next.y)).toBeLessThanOrEqual(2);
  for (const x of [16, 1904]) {
    await start(page, { x, y: 1360 });
    const viewport = await page.locator("canvas").boundingBox();
    for (const t of (await tags(page)).filter((t) => t.visible)) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
      expect(t.x + t.w).toBeLessThanOrEqual(viewport!.width + 2);
      expect(t.y + t.h).toBeLessThanOrEqual(viewport!.height + 2);
    }
  }
  if (info.project.name === "desktop") {
    await start(page, { x: anchors.flocon.x, y: anchors.flocon.y + 135 });
    // Flocon's head reaches the upper edge here: hide the plaque rather than cover his face.
    expect(
      (await tags(page)).find((t) => t.name === "Flocon")!.visible,
    ).toBeFalsy();
  }
  const audit = JSON.parse(
    (await page.locator("canvas").getAttribute("data-vegetation-audit"))!,
  );
  expect(audit).toHaveLength(3);
  expect(
    audit.every((a: { transparent: boolean }) => a.transparent),
  ).toBeTruthy();
});
test("D.2.1 : les huit noms conservent leur identité dans les pièces", async ({
  page,
}, info) => {
  const names = new Set<string>();
  for (const room of ["village", "library", "workshop", "inn"] as const) {
    await start(
      page,
      { x: room === "village" ? 512 : 240, y: room === "village" ? 608 : 280 },
      room,
    );
    (await tags(page)).forEach((t) => names.add(t.name));
    if (room !== "village")
      await page.screenshot({
        path: `docs/screenshots/phase-d2-1/apres/${info.project.name}-etiquettes-${room}.png`,
      });
  }
  expect([...names].sort()).toEqual(
    [
      "Debby",
      "Loyal",
      "Augustin",
      "Madeleine",
      "Émile",
      "Célestine",
      "Basile",
      "Flocon",
    ].sort(),
  );
});
test("D.2.1 : cadrage des quatre façades sur PC et mobile", async ({
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
      path: `docs/screenshots/phase-d2-1/apres/${info.project.name}-${name}.png`,
    });
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      "village",
    );
  }
});
test("D.2.1 : vue globale et abords des quatre bâtiments", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Une seule vue globale suffit.");
  await page.setViewportSize({ width: 2048, height: 1634 });
  await start(page);
  await page.screenshot({
    path: "docs/screenshots/phase-d2-1/apres/village-complet.png",
  });
});
