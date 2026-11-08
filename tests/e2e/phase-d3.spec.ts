import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { initial } from "../../src/domain";
const output = "docs/screenshots/phase-d3/apres";
async function start(
  page: Page,
  clock = 90000,
  position = { x: 512, y: 400 },
  quality = "auto",
) {
  mkdirSync(output, { recursive: true });
  await page.goto("/");
  await page.evaluate(
    async ({ save, quality }) => {
      localStorage.setItem("etoilebois-graphics-v1", quality);
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
    { save: { ...initial, stage: 4, stars: [1], clock, position }, quality },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village", {
    timeout: 30000,
  });
  await expect
    .poll(() => page.locator("canvas").getAttribute("data-ambience"))
    .not.toBeNull();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}
async function audit(page: Page) {
  return JSON.parse(
    (await page.locator("canvas").getAttribute("data-ambience"))!,
  );
}
test("D.3 : terrains, jour, crépuscule, nuit et façades", async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [name, clock] of [
    ["jour", 45000],
    ["crepuscule", 90000],
    ["nuit", 135000],
  ] as const) {
    await start(page, clock);
    await page.screenshot({
      path: `${output}/${info.project.name}-${name}.png`,
    });
    const terrain = JSON.parse(
      (await page.locator("canvas").getAttribute("data-terrain"))!,
    );
    expect(terrain.earthFraction).toBeGreaterThan(0.035);
    expect(terrain.snowFraction).toBeGreaterThan(0.45);
    expect(terrain.opaqueFraction).toBe(1);
    const assets = JSON.parse(
      (await page.locator("canvas").getAttribute("data-terrain-assets"))!,
    );
    expect(assets).toHaveLength(10);
    expect(
      assets.every((a: { transparent: boolean }) => a.transparent),
    ).toBeTruthy();
    writeFileSync(
      `docs/graphismes/D3-TERRAIN-${info.project.name}.json`,
      JSON.stringify(terrain, null, 2),
    );
  }
  if (info.project.name === "desktop")
    await page.setViewportSize({ width: 1280, height: 1000 });
  for (const [name, x, y] of [
    ["bibliotheque", 208, 342],
    ["atelier", 784, 294],
    ["auberge", 464, 235],
    ["maison", 800, 655],
  ] as const) {
    await start(page, 135000, { x, y });
    await page.screenshot({
      path: `${output}/${info.project.name}-${name}.png`,
    });
  }
  expect(errors).toEqual([]);
});
test("D.3 : vue globale du terrain", async ({ page }, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Une seule vue globale par ambiance suffit.",
  );
  for (const [name, clock] of [
    ["jour", 45000],
    ["crepuscule", 90000],
    ["nuit", 135000],
  ] as const) {
    await page.setViewportSize({ width: 2048, height: 1634 });
    await start(page, clock);
    await page.screenshot({ path: `${output}/village-complet-${name}.png` });
  }
});
test("D.3 : qualité, réduction des mouvements et reprise", async ({
  page,
}, info) => {
  await start(page, 135000, { x: 784, y: 294 });
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  await page.getByLabel("Effets du village").selectOption("soft");
  await page.getByRole("button", { name: "Fermer ×", exact: true }).click();
  await expect.poll(async () => (await audit(page)).quality).toBe("soft");
  await page.waitForTimeout(3500);
  const soft = await audit(page);
  expect(
    soft.visibleSnow + soft.visibleSmoke + soft.visibleWind + soft.visibleStars,
  ).toBeLessThanOrEqual(28);
  expect(soft.cpuP95).toBeLessThan(10);
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  await page.getByLabel("Effets du village").selectOption("full");
  await page.getByRole("button", { name: "Fermer ×", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => (await audit(page)).quality).toBe("none");
  const reduced = await audit(page);
  expect(
    reduced.visibleSnow +
      reduced.visibleSmoke +
      reduced.visibleWind +
      reduced.visibleStars +
      reduced.swaying,
  ).toBe(0);
  await page.screenshot({
    path: `${output}/${info.project.name}-effets-reduits.png`,
  });
  writeFileSync(
    `docs/graphismes/D3-PERFORMANCE-${info.project.name}.json`,
    JSON.stringify(
      {
        note: "Chrome headless local, téléphone simulé ; coût CPU du contrôleur, pas temps GPU.",
        soft,
        reduced,
      },
      null,
      2,
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator(".quest")).toContainText("1 / 24");
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  await expect(page.getByLabel("Effets du village")).toHaveValue("full");
});
test("D.3 : démonstration réelle des effets animés", async ({
  browser,
}, info) => {
  test.setTimeout(60000);
  const size =
    info.project.name === "mobile"
      ? { width: 390, height: 844 }
      : { width: 1280, height: 1000 };
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
    viewport: size,
    recordVideo: { dir: `test-results/d3-video-${info.project.name}`, size },
    hasTouch: info.project.name === "mobile",
    isMobile: info.project.name === "mobile",
  });
  const page = await context.newPage();
  await start(
    page,
    135000,
    { x: 784, y: 294 },
    info.project.name === "mobile" ? "soft" : "full",
  );
  await page.waitForTimeout(14000);
  const stats = await audit(page);
  expect(stats.visibleSnow).toBeGreaterThan(0);
  expect(stats.visibleSmoke).toBeGreaterThan(0);
  await page.screenshot({
    path: `${output}/${info.project.name}-animation.png`,
  });
  writeFileSync(
    `docs/graphismes/D3-ANIMATION-${info.project.name}.json`,
    JSON.stringify(stats, null, 2),
  );
  const video = page.video()!;
  await page.close();
  await video.saveAs(`${output}/${info.project.name}-animation.webm`);
  await context.close();
});
