import { chromium, type Page } from "@playwright/test";
import { initial, type Save } from "../src/domain";
import { writeFileSync } from "node:fs";
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
  for (const [name, x, y, mobile] of [
    ["livres", 420, 430, false],
    ["veillees", 1480, 430, false],
    ["artisans", 1600, 985, false],
    ["veillees-mobile", 1480, 430, true],
  ] as const) {
    const context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1280, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
      }),
      page = await context.newPage();
    await page.addInitScript("window.__name=(f)=>f");
    await seed(page, 5182, x, y, 45000);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: mobile ? 4 : 1 });
    const samples = await page.evaluate(
      () =>
        new Promise<number[]>((ok) => {
          const a: number[] = [];
          let previous = performance.now();
          const frame = (now: number) => {
            a.push(now - previous);
            previous = now;
            if (a.length === 190) ok(a.slice(10));
            else requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }),
    );
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () =>
        JSON.parse(document.querySelector("canvas")!.dataset.ambience!)
          .quality === "none",
    );
    const effects = await page
        .locator("canvas")
        .evaluate((c) => JSON.parse(c.dataset.ambience!)),
      sort = [...samples].sort((a, b) => a - b),
      p95 = sort[Math.floor(sort.length * 0.95)];
    if (p95 >= 100 || effects.visibleSnow || effects.visibleSmoke)
      throw Error("Performance or reduction failure " + name);
    results.push({
      name,
      cpu: mobile ? 4 : 1,
      p95,
      mean: samples.reduce((a, b) => a + b, 0) / samples.length,
      samples: samples.length,
      reducedEffects: effects,
      note: "Chrome local, mobile émulé, mesure RAF sans garantie de performances sur appareil physique.",
    });
    await context.close();
  }
  writeFileSync(
    "docs/graphismes/d351-b/PERFORMANCES.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results.map((r) => ({ name: r.name, p95: r.p95, mean: r.mean })));
} finally {
  await browser.close();
}
