import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { initial, type Save } from "../../src/domain";
import { decorativeObjects, decorationKey } from "../../src/decor/model";
import { walkTo } from "./navigation";
import { homes } from "../../src/art/village33";
const out = "docs/screenshots/phase-d3-2/apres";
test("D32 effets des quartiers, culling et performance extérieure", async ({
  page,
}, info) => {
  mkdirSync(out, { recursive: true });
  await start(page, "village", { x: 650, y: 750 }, 135000);
  const samples = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        let previous = performance.now();
        const values: number[] = [];
        function frame(now: number) {
          values.push(now - previous);
          previous = now;
          if (values.length >= 180) resolve(values);
          else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }),
  );
  const sorted = samples.slice(10).sort((a, b) => a - b),
    p95 = sorted[Math.floor(sorted.length * 0.95)];
  const neighbourhood = JSON.parse(
    (await page.locator("canvas").getAttribute("data-neighbourhood"))!,
  );
  expect(neighbourhood.houses).toBe(16);
  expect(neighbourhood.smoke).toBeLessThanOrEqual(
    info.project.name === "mobile" ? 8 : 16,
  );
  expect(p95).toBeLessThan(250);
  writeFileSync(
    `${out}/performance-village-${info.project.name}.json`,
    JSON.stringify(
      {
        project: info.project.name,
        frames: sorted.length,
        p95,
        mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
        neighbourhood,
        note: "Chrome local, émulation de format ; RAF non plafonné, pas une mesure sur appareil physique",
      },
      null,
      2,
    ),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-neighbourhood"))!,
        ).smoke,
    )
    .toBe(0);
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-neighbourhood"))!,
        ).quality,
    )
    .toBe("none");
});
test("D32 habitations, collisions et carte du village", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  mkdirSync(out, { recursive: true });
  if (info.project.name === "desktop") {
    await page.setViewportSize({ width: 2048, height: 1634 });
    for (const [name, clock] of [
      ["jour", 45000],
      ["crepuscule", 90000],
      ["nuit", 135000],
    ] as const) {
      await start(page, "village", { x: 512, y: 450 }, clock);
      await page.screenshot({ path: `${out}/village-complet-${name}.png` });
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
  }
  for (const h of homes) {
    await start(page, "village", { x: h.x, y: h.y + 17 }, 90000);
    await page.screenshot({ path: `${out}/${info.project.name}-${h.key}.png` });
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(700);
    await page.keyboard.up("ArrowUp");
    expect(
      Number(await page.locator("canvas").getAttribute("data-player-y")),
    ).toBeGreaterThanOrEqual(h.footprint.y + h.footprint.h + 3);
  }
});
test("D32 démonstration enregistrée des interactions et animations", async ({
  browser,
}, info) => {
  test.setTimeout(90000);
  mkdirSync(out, { recursive: true });
  const mobile = info.project.name === "mobile",
    size = mobile ? { width: 390, height: 844 } : { width: 1280, height: 1000 };
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
    viewport: size,
    hasTouch: mobile,
    isMobile: mobile,
    recordVideo: { dir: `test-results/d32-video-${info.project.name}`, size },
  });
  const page = await context.newPage();
  await start(page, "house", { x: 423, y: 208 });
  await page.getByRole("button", { name: /Caresser le chat/ }).click();
  await expect.poll(async () => (await audit(page)).petting).toBe(true);
  await page.waitForTimeout(2600);
  await page.getByRole("button", { name: /Continuer/ }).click();
  await start(page, "house", { x: 300, y: 148 });
  await page.getByRole("button", { name: /Allumer la bougie/ }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Éteindre la bougie/ }).click();
  await page.waitForTimeout(700);
  await start(page, "workshop", { x: 423, y: 247 });
  await page.getByRole("button", { name: /Remonter le petit train/ }).click();
  await expect.poll(async () => (await audit(page)).mechanism).toBe(true);
  await page.waitForTimeout(2500);
  const video = page.video()!;
  await page.close();
  await video.saveAs(`${out}/${info.project.name}-interactions.webm`);
  await context.close();
});
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
    { ...initial, stage: 4, stars: [1], room, position, clock },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("canvas")).toHaveAttribute(
    room === "village" ? "data-neighbourhood" : "data-decorative",
    /.+/,
  );
  await page.waitForTimeout(450); // Wait for the existing entrance fade before visual comparison.
}
async function audit(page: Page) {
  return JSON.parse(
    (await page.locator("canvas").getAttribute("data-decorative"))!,
  );
}
test("D32 chaque objet décoratif fonctionne au clavier et au toucher", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  mkdirSync(out, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const item of decorativeObjects) {
    await start(page, item.room, { x: item.x, y: item.y + 9 });
    // Actual short approach exercises movement; fixtures only establish the room.
    await walkTo(page, "y", item.y);
    const button = page.getByRole("button", {
      name: new RegExp(
        item.action === "toggle"
          ? item.description
          : item.description.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ),
    });
    await expect(button).toBeVisible();
    const before = await audit(page);
    if (info.project.name === "mobile") await button.tap();
    else await page.keyboard.press("e");
    if (item.action === "toggle") {
      const previous = before.objects.find(
        (x: { id: string }) => x.id === item.id,
      ).on;
      await expect
        .poll(
          async () =>
            (await audit(page)).objects.find(
              (x: { id: string }) => x.id === item.id,
            ).on,
        )
        .toBe(!previous);
      await page.screenshot({
        path: `${out}/${info.project.name}-${item.id}-${!previous ? "allume" : "eteint"}.png`,
      });
      if (info.project.name === "mobile") await button.tap();
      else await page.keyboard.press("e");
      await expect
        .poll(
          async () =>
            (await audit(page)).objects.find(
              (x: { id: string }) => x.id === item.id,
            ).on,
        )
        .toBe(previous);
      await page.screenshot({
        path: `${out}/${info.project.name}-${item.id}-${previous ? "allume" : "eteint"}.png`,
      });
    } else {
      await expect(
        page.getByRole("dialog", { name: "Dialogue" }),
      ).toContainText(item.text!.split(" — ")[1]);
      await page.screenshot({
        path: `${out}/${info.project.name}-${item.id}.png`,
      });
      await page.getByRole("button", { name: /Continuer/ }).click();
      await expect(page.locator(".dialogue")).toHaveCount(0);
    }
  }
  expect(errors).toEqual([]);
});
test("D32 sauvegarde décorative séparée et réduction des mouvements", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page, "house", { x: 300, y: 155 });
  await page.getByRole("button", { name: /Allumer la bougie/ }).click();
  await expect
    .poll(
      async () =>
        (await audit(page)).objects.find(
          (x: { id: string }) => x.id === "house-candle",
        ).on,
    )
    .toBe(true);
  await expect.poll(async () => (await audit(page)).quality).toBe("none");
  expect((await audit(page)).steam).toBe(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      decorationKey,
    ),
  ).toEqual({ version: 1, switches: { "house-candle": true } });
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(
    page.getByRole("button", { name: /Éteindre la bougie/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Éteindre la bougie/ }).click();
  await expect
    .poll(
      async () =>
        (await audit(page)).objects.find(
          (x: { id: string }) => x.id === "house-candle",
        ).on,
    )
    .toBe(false);
  const save = await page.evaluate(
    () =>
      new Promise<Save>((resolve, reject) => {
        const r = indexedDB.open("etoilebois", 1);
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
          const q = r.result
            .transaction("saves")
            .objectStore("saves")
            .get("phase-b");
          q.onsuccess = () => {
            resolve(q.result);
            r.result.close();
          };
        };
      }),
  );
  expect(save.stars).toEqual([1]);
  expect(save.quests).toEqual(initial.quests);
  expect(save.stage).toBe(4);
  await page.screenshot({
    path: `${out}/${info.project.name}-reduction-mouvements.png`,
  });
  await start(page, "house", { x: 423, y: 208 });
  await page.getByRole("button", { name: /Caresser le chat/ }).click();
  await expect.poll(async () => (await audit(page)).petting).toBe(true);
  expect((await audit(page)).cat).toBe("life-cat-sleep");
  await start(page, "workshop", { x: 423, y: 247 });
  await page.getByRole("button", { name: /Remonter le petit train/ }).click();
  await expect.poll(async () => (await audit(page)).mechanism).toBe(true);
  expect((await audit(page)).trainX).toBe(425);
  expect((await audit(page)).steam).toBe(0);
});
test("D32 quatre intérieurs jour/nuit et circulation", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  mkdirSync(out, { recursive: true });
  if (info.project.name === "desktop")
    await page.setViewportSize({ width: 1280, height: 1000 });
  for (const room of ["house", "library", "workshop", "inn"] as const) {
    for (const [name, clock] of [
      ["jour", 45000],
      ["nuit", 135000],
    ] as const) {
      await start(page, room, undefined, clock);
      await page.screenshot({
        path: `${out}/${info.project.name}-${room}-${name}.png`,
      });
      if (info.project.name === "mobile" && name === "jour") {
        await walkTo(page, "x", 107);
        await walkTo(page, "y", 300);
        await page.screenshot({
          path: `${out}/mobile-${room}-nouveau-meuble.png`,
        });
        await walkTo(page, "y", 250);
        await walkTo(page, "x", 385);
        await walkTo(page, "y", 195);
        await page.screenshot({ path: `${out}/mobile-${room}-coin-droit.png` });
      }
    }
    await walkTo(page, "y", 280);
    await walkTo(page, "x", 240);
    await walkTo(page, "y", 307);
    await page.getByRole("button", { name: /Sortir/ }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      "village",
    );
  }
});
test("D32 performances intérieures mesurées", async ({ page }, info) => {
  await start(page, "house");
  const samples = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = [];
        let previous = performance.now();
        function frame(now: number) {
          samples.push(now - previous);
          previous = now;
          if (samples.length >= 180) resolve(samples);
          else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }),
  );
  const sorted = samples.slice(10).sort((a, b) => a - b),
    p95 = sorted[Math.floor(sorted.length * 0.95)];
  const result = {
    project: info.project.name,
    frames: sorted.length,
    p95,
    mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    decor: await audit(page),
    note: "Chrome local, émulation de taille et toucher ; pas une mesure de téléphone physique",
  };
  writeFileSync(
    `${out}/performance-${info.project.name}.json`,
    JSON.stringify(result, null, 2),
  );
  expect(p95).toBeLessThan(250);
  expect(result.decor.steam).toBeLessThanOrEqual(
    info.project.name === "mobile" ? 2 : 4,
  );
});
