import { blocked } from "../../src/domain";
import { test, expect, type Page } from "@playwright/test";
import { initial, type Save } from "../../src/domain";
import { mkdirSync, writeFileSync } from "node:fs";
const out =
  process.env.ETB_LEGACY_CAPTURE_DIR ?? "docs/screenshots/phase-d3-2/apres";
async function install(page: Page, save: Save) {
  await page.goto("/");
  await page.evaluate(async (save) => {
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
  }, save);
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", save.room, {
    timeout: 20000,
  });
}
async function read(page: Page) {
  return page.evaluate(
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
            r.result.close();
            resolve(q.result);
          };
        };
      }),
  );
}
test("D32 anciennes positions sous un décor et performance dans un quartier visible", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  mkdirSync(out, { recursive: true });
  for (const room of ["village", "house"] as const) {
    const save: Save = {
      ...structuredClone(initial),
      stage: 4,
      room,
      clock: 135000,
      position: room === "village" ? { x: 296, y: 575 } : { x: 60, y: 310 },
      stars: [1, 3, 18],
      quests: {
        "first-light": { step: 4, done: true },
        "library-shelf": { step: 2, done: false },
      },
      inventory: ["letter", "bookmark"],
      flags: ["lecture-offerte"],
      scores: { photo: 17, memory: 12, wrap: 9 },
      dialogueHistory: ["mira:greeting"],
    };
    await install(page, save);
    const observed = await page.locator("canvas").evaluate((el) => ({
      x: Number(el.dataset.playerX),
      y: Number(el.dataset.playerY),
      rects: JSON.parse(el.dataset.collisions!),
    }));
    expect(
      blocked(
        observed,
        observed.rects,
        room === "village" ? 1920 : 864,
        room === "village" ? 1408 : 560,
      ),
    ).toBe(false);
    const safe =
      room === "village"
        ? { x: observed.x, y: observed.y }
        : { x: 240, y: 280 };
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-player-x",
      String(safe.x),
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-player-y",
      String(safe.y),
    );
    await expect
      .poll(async () => (await read(page)).position, { timeout: 10000 })
      .toEqual(safe);
    const resumed = await read(page);
    for (const field of [
      "stage",
      "room",
      "version",
      "stars",
      "quests",
      "inventory",
      "flags",
      "scores",
      "dialogueHistory",
      "conversation",
    ] as const)
      expect(resumed[field]).toEqual(save[field]);
    await page.reload();
    await page.getByRole("button", { name: /Entrer dans le village/ }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-player-x",
      String(safe.x),
    );
    expect((await read(page)).stars).toEqual(save.stars);
  }
  await install(page, {
    ...structuredClone(initial),
    stage: 4,
    stars: [1],
    room: "village",
    clock: 135000,
    position: { x: 1530, y: 755 },
  });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-neighbourhood",
    /.+/,
  );
  await page.waitForTimeout(1500);
  const neighbourhood = JSON.parse(
    (await page.locator("canvas").getAttribute("data-neighbourhood"))!,
  );
  expect(neighbourhood.smoke).toBeGreaterThan(0);
  expect(neighbourhood.budget).toBe(info.project.name === "mobile" ? 4 : 8);
  expect(neighbourhood.smoke).toBeLessThanOrEqual(neighbourhood.budget);
  const samples = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const values: number[] = [];
        let previous = performance.now();
        function frame(now: number) {
          values.push(now - previous);
          previous = now;
          if (values.length === 180) resolve(values);
          else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }),
  );
  const sorted = samples.slice(10).sort((a, b) => a - b),
    p95 = sorted[Math.floor(sorted.length * 0.95)],
    ambience = JSON.parse(
      (await page.locator("canvas").getAttribute("data-ambience"))!,
    );
  expect(p95).toBeLessThan(250);
  writeFileSync(
    `${out}/performance-quartier-${info.project.name}.json`,
    JSON.stringify(
      {
        project: info.project.name,
        position: { x: 1530, y: 755 },
        frames: sorted.length,
        p95,
        mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
        neighbourhood,
        ambience,
        note: "Chrome local, quartier avec nouvelles maisons et fumées visibles. RAF non plafonné ; engineFps décrit Phaser. Téléphone émulé, aucun GPU mobile physique.",
      },
      null,
      2,
    ),
  );
  await page.screenshot({
    path: `${out}/${info.project.name}-quartier-anime.png`,
  });
});
