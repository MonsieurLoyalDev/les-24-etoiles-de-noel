import { blocked } from "../../src/domain";
import { test, expect, type Page } from "@playwright/test";
import { initial, type Save } from "../../src/domain";
import { roomPlans, allFurniture } from "../../src/art/rooms33";
import { homes } from "../../src/art/village33";
import { mkdirSync, writeFileSync } from "node:fs";
import { walkTo } from "./navigation";
const out = "docs/screenshots/phase-d3-3/apres";
async function start(
  page: Page,
  room: Save["room"],
  position = { x: 240, y: 250 },
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
  await page.waitForTimeout(600);
}
async function measure(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ p95: number; mean: number; frames: number }>((resolve) => {
        const values: number[] = [];
        let previous = performance.now();
        function frame(t: number) {
          values.push(t - previous);
          previous = t;
          if (values.length === 180) {
            const a = values.slice(10).sort((a, b) => a - b);
            resolve({
              p95: a[Math.floor(a.length * 0.95)],
              mean: a.reduce((x, y) => x + y, 0) / a.length,
              frames: a.length,
            });
          } else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }),
  );
}
test("D33 carte, quartiers et seize façades lisibles", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  mkdirSync(out, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (info.project.name === "desktop") {
    await page.setViewportSize({ width: 3840, height: 2940 });
    for (const [name, clock] of [
      ["jour", 45000],
      ["crepuscule", 90000],
      ["nuit", 135000],
    ] as const) {
      await start(page, "village", { x: 960, y: 720 }, clock);
      await page.screenshot({ path: `${out}/village-complet-${name}.png` });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  for (const [name, x, y] of [
    ["centre", 512, 450],
    ["residentiel", 1530, 755],
    ["artisans", 1450, 1108],
    ["calme", 490, 1110],
  ] as const) {
    await start(page, "village", { x, y });
    await page.screenshot({
      path: `${out}/${info.project.name}-quartier-${name}.png`,
    });
  }
  for (const h of homes) {
    await start(page, "village", { x: h.x, y: h.y + 14 }, 90000);
    await page.screenshot({ path: `${out}/${info.project.name}-${h.key}.png` });
  }
  expect(errors).toEqual([]);
});
test("D33 plans, annexes accessibles et mobilier jour/nuit", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  mkdirSync(out, { recursive: true });
  for (const room of ["house", "library", "workshop", "inn"] as const) {
    if (info.project.name === "desktop") {
      const plan = roomPlans[room];
      await page.setViewportSize({
        width: plan.width * 2 + 32,
        height: plan.height * 2 + 160,
      });
    }
    for (const [name, clock] of [
      ["jour", 45000],
      ["nuit", 135000],
    ] as const) {
      await start(page, room, { x: 240, y: 250 }, clock);
      const audit = JSON.parse(
        (await page.locator("canvas").getAttribute("data-interior"))!,
      );
      expect(audit.furniture).toHaveLength(allFurniture(room).length);
      await page.screenshot({
        path: `${out}/${info.project.name}-${room}-${name}.png`,
      });
    }
    await walkTo(page, "x", 500);
    const detour =
      room === "house"
        ? 820
        : room === "library"
          ? 840
          : room === "inn"
            ? 890
            : 700;
    if (room === "inn") {
      await walkTo(page, "x", 790);
      await walkTo(page, "y", 385);
    }
    await walkTo(page, "x", detour);
    if (room === "house") {
      await walkTo(page, "y", 500);
      await walkTo(page, "x", 720);
    } else if (room === "library") {
      await walkTo(page, "y", 515);
      await walkTo(page, "x", 744);
    } else if (room === "inn") {
      await walkTo(page, "y", 490);
      await walkTo(page, "x", 790);
    }
    await page.screenshot({
      path: `${out}/${info.project.name}-${room}-annexe.png`,
    });
    const position = await page.locator("canvas").evaluate((c) => ({
      x: Number(c.getAttribute("data-player-x")),
      y: Number(c.getAttribute("data-player-y")),
    }));
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise((resolve) => {
              const r = indexedDB.open("etoilebois", 1);
              r.onsuccess = () => {
                const q = r.result
                  .transaction("saves")
                  .objectStore("saves")
                  .get("phase-b");
                q.onsuccess = () => {
                  r.result.close();
                  resolve(q.result.position);
                };
              };
            }),
        ),
      )
      .toEqual(position);
    await page.reload();
    await page.getByRole("button", { name: /Entrer dans le village/ }).click();
    await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-player-x",
      String(position.x),
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-player-y",
      String(position.y),
    );
    await walkTo(page, "x", detour);
    if (room === "inn") {
      await walkTo(page, "y", 385);
      await walkTo(page, "x", 790);
    }
    await walkTo(page, "y", 250);
    await walkTo(page, "x", 240);
    await walkTo(page, "y", 307);
    await page.getByRole("button", { name: /Sortir/ }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      "village",
    );
  }
});
test("D33 performances en quartier habité et effets réduits", async ({
  page,
}, info) => {
  mkdirSync(out, { recursive: true });
  await start(page, "village", { x: 1530, y: 755 }, 135000);
  const normal = await measure(page),
    data = JSON.parse(
      (await page.locator("canvas").getAttribute("data-neighbourhood"))!,
    );
  expect(data.houses).toBe(16);
  expect(data.smoke).toBeGreaterThan(0);
  expect(data.smoke).toBeLessThanOrEqual(data.budget);
  expect(normal.p95).toBeLessThan(250);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-neighbourhood"))!,
        ).smoke,
    )
    .toBe(0);
  writeFileSync(
    `${out}/performance-${info.project.name}.json`,
    JSON.stringify(
      {
        normal,
        data,
        note: "Chrome local, format et toucher émulés ; RAF, pas une mesure sur téléphone physique.",
      },
      null,
      2,
    ),
  );
});
test("D33 ancienne position désormais occupée : progression préservée", async ({
  page,
}) => {
  const h = homes[4];
  await start(page, "village", { x: h.x, y: h.y - 20 });
  const rescued = await page
    .locator("canvas")
    .evaluate((el) => ({
      x: Number(el.dataset.playerX),
      y: Number(el.dataset.playerY),
      rects: JSON.parse(el.dataset.collisions!),
    }));
  expect(blocked(rescued, rescued.rects, 1920, 1408)).toBe(false);
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-player-x",
    String(rescued.x),
  );
  await expect(page.locator(".quest")).toContainText("3 / 24");
});
