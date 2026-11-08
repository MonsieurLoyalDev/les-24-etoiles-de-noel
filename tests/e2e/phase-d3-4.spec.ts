import { navigateTo } from "./pathfinding";
import { blocked, type Rect } from "../../src/domain";
import { test, expect, type Page } from "@playwright/test";
import { initial, type Save } from "../../src/domain";
import { anchors, plan } from "../../src/art/village34";
import { mkdirSync, writeFileSync } from "node:fs";
const out = "docs/screenshots/phase-d3-4/apres";
export async function start34(
  page: Page,
  room: Save["room"] = "village",
  position = anchors.spawn,
  clock = 45000,
) {
  await page.goto("/");
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
    {
      ...structuredClone(initial),
      stage: 4,
      stars: [1, 3, 18],
      room,
      position,
      clock,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}
test("D34 intégration réelle, quartiers et transparences", async ({
  page,
}, info) => {
  test.setTimeout(150000);
  mkdirSync(out, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  if (info.project.name === "desktop") {
    await page.setViewportSize({ width: 3840, height: 2940 });
    for (const [name, clock] of [
      ["jour", 45000],
      ["crepuscule", 90000],
      ["nuit", 135000],
    ] as const) {
      await start34(page, "village", { x: 960, y: 720 }, clock);
      await page.screenshot({ path: `${out}/village-complet-${name}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1200 });
  }
  for (const q of plan.quarters) {
    console.log("Quartier D34", q.id);
    await start34(page, "village", {
      x: q.court.center[0],
      y: q.court.center[1],
    });
    await page.screenshot({ path: `${out}/${info.project.name}-${q.id}.png` });
  }
  expect(errors).toEqual([]);
  const audit = JSON.parse(
    (await page.locator("canvas").getAttribute("data-scenery34"))!,
  );
  expect(audit.placed.length).toBeGreaterThan(30);
  expect(
    new Set(
      audit.placed
        .filter((p: { key: string }) => p.key === "vegetation_pine_large")
        .map((p: { texture: string }) => p.texture),
    ).size,
  ).toBe(5);
  writeFileSync(
    out + "/inventaire-" + info.project.name + ".json",
    JSON.stringify(audit, null, 2),
  );
});

test("D34 toutes les portes, les portillons et les sorties restent praticables", async ({
  page,
}, info) => {
  test.setTimeout(600000);
  await start34(page);
  const rects = JSON.parse(
    (await page.locator("canvas").getAttribute("data-collisions"))!,
  ) as Rect[];
  for (const q of plan.quarters) {
    console.log("Quartier D34", q.id);
    for (const h of plan.houses.filter((h) => h.quarter === q.id)) {
      await navigateTo(page, h.door);
    }
    const h = plan.houses.find((h) => h.quarter === q.id)!;
    await navigateTo(page, h.door);
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(750);
    await page.keyboard.up("ArrowUp");
    const p = await page.locator("canvas").evaluate((el) => ({
      x: Number(el.dataset.playerX),
      y: Number(el.dataset.playerY),
    }));
    expect(blocked(p, rects, 1920, 1408)).toBe(false);
    expect(p.y).toBeGreaterThan(h.y - 9);
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(250);
    await page.keyboard.up("ArrowDown");
  }
  for (const g of plan.gardens)
    await navigateTo(page, { x: g.gate[0], y: g.gate[1] });
  for (const b of plan.buildings) {
    await navigateTo(page, b.returnPoint);
    await page
      .getByRole("button", {
        name: new RegExp(
          b.id === "loyal_house"
            ? "Maison de Loyal"
            : b.id === "library"
              ? "Bibliothèque"
              : b.id === "inn"
                ? "Auberge"
                : "Atelier",
        ),
      })
      .click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      b.id === "loyal_house" ? "house" : b.id,
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room-plan",
      /.+/,
    );
    await page.screenshot({
      path: out + "/" + info.project.name + "-interieur-" + b.id + ".png",
    });
    await navigateTo(page, { x: 240, y: 305 });
    await page.getByRole("button", { name: /E Sortir/ }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      "village",
    );
  }
});
test("D34 sauvegarde ancienne, progression et position libre préservées", async ({
  page,
}) => {
  const h = plan.houses[0];
  await start34(page, "village", { x: h.x, y: h.y - 25 });
  const p = await page.locator("canvas").evaluate((el) => ({
    x: Number(el.dataset.playerX),
    y: Number(el.dataset.playerY),
    rects: JSON.parse(el.dataset.collisions!),
  }));
  expect(blocked(p, p.rects, 1920, 1408)).toBe(false);
  expect(Math.hypot(p.x - h.x, p.y - h.y)).toBeGreaterThan(20);
  await page.waitForTimeout(4500);
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-player-x",
    String(p.x),
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-player-y",
    String(p.y),
  );
  await expect(page.locator(".quest")).toContainText("3 / 24");
});
