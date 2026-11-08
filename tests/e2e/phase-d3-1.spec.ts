import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { walkTo } from "./navigation";
import { allFurniture } from "../../src/art/rooms33";
import { initial } from "../../src/domain";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const output = "docs/screenshots/phase-d3-1/apres";
async function start(
  page: Page,
  room: typeof initial.room,
  clock = 45000,
  stars = [1],
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
      ...initial,
      stage: 4,
      room,
      clock,
      stars,
      position: room === "village" ? { x: 512, y: 450 } : { x: 240, y: 250 },
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}
test("D.3.1 : intérieurs, neige et sapin avant/après", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  mkdirSync(output, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (info.project.name === "desktop")
    await page.setViewportSize({ width: 1280, height: 1000 });
  for (const room of ["house", "library", "workshop", "inn"] as const) {
    for (const [name, clock] of [
      ["jour", 45000],
      ["nuit", 135000],
    ] as const) {
      await start(page, room, clock);
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-interior-light",
        /.+/,
      );
      const interior = JSON.parse(
        (await page.locator("canvas").getAttribute("data-interior"))!,
      );
      expect(interior.room).toBe(room);
      expect(interior.furniture).toHaveLength(allFurniture(room).length);
      for (const [i, p] of interior.furniture.entries()) {
        expect(p.footprint).toEqual(allFurniture(room)[i].footprint);
        expect(p.width).toBeLessThanOrEqual(220);
        expect(p.height).toBeLessThanOrEqual(220);
      }
      await page.screenshot({
        path: `${output}/${info.project.name}-${room}-${name}.png`,
      });
      if (info.project.name === "mobile" && name === "jour") {
        await walkTo(page, "x", 100);
        await walkTo(page, "y", 170);
        await page.screenshot({
          path: `${output}/mobile-${room}-coin-gauche.png`,
        });
        await walkTo(page, "x", 385);
        await page.screenshot({
          path: `${output}/mobile-${room}-coin-droit.png`,
        });
      }
    }
  }
  for (const count of [1, 24]) {
    await start(
      page,
      "village",
      45000,
      Array.from({ length: count }, (_, i) => i + 1),
    );
    await page.screenshot({
      path: `${output}/${info.project.name}-sapin-${count}.png`,
    });
    const tree = JSON.parse(
      (await page.locator("canvas").getAttribute("data-tree-art"))!,
    );
    expect(tree).toEqual({
      texture: "art-tree",
      frame: "sapin_" + String(count).padStart(2, "0"),
      overlay: false,
    });
  }
  expect(errors).toEqual([]);
});
test("D.3.1 : collisions du mobilier et sorties des quatre pièces", async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const room of ["house", "library", "workshop", "inn"] as const) {
    await start(page, room);
    await walkTo(page, "y", 157);
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(650);
    await page.keyboard.up("ArrowUp");
    const y = Number(
      await page.locator("canvas").getAttribute("data-player-y"),
    );
    expect(y).toBeGreaterThanOrEqual(153.9);
    expect(y).toBeLessThan(158);
    await walkTo(page, "y", 185);
    await walkTo(page, "x", 95);
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(600);
    await page.keyboard.up("ArrowUp");
    expect(
      Number(await page.locator("canvas").getAttribute("data-player-y")),
    ).toBeGreaterThanOrEqual(158.9);
    expect(
      Number(await page.locator("canvas").getAttribute("data-player-y")),
    ).toBeLessThan(163);
    await walkTo(page, "y", 185);
    await walkTo(page, "x", 385);
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(900);
    await page.keyboard.up("ArrowUp");
    const right = Number(
      await page.locator("canvas").getAttribute("data-player-y"),
    );
    expect(right).toBeGreaterThanOrEqual(163.9);
    expect(right).toBeLessThan(168);
    await walkTo(page, "y", 280);
    await walkTo(page, "x", 240);
    await walkTo(page, "y", 305);
    await page.getByRole("button", { name: /Sortir/ }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      "village",
    );
  }
});
test("D.3.1 : lumière intérieure, performances et réduction des mouvements", async ({
  page,
}, info) => {
  await start(page, "library", 135000);
  await page.waitForTimeout(8000);
  const stats = JSON.parse(
    (await page.locator("canvas").getAttribute("data-interior-light"))!,
  );
  expect(stats.motion).toBe(true);
  expect(stats.lightPool).toBeLessThanOrEqual(6);
  expect(stats.cpuP95).toBeLessThan(5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-interior-light"))!,
        ).motion,
    )
    .toBe(false);
  const reduced = JSON.parse(
    (await page.locator("canvas").getAttribute("data-interior-light"))!,
  );
  expect(reduced.quality).toBe("none");
  await page.screenshot({
    path: `${output}/${info.project.name}-lumiere-reduite.png`,
  });
  writeFileSync(
    `docs/graphismes/D31-PERFORMANCE-${info.project.name}.json`,
    JSON.stringify(
      {
        note: "Chrome local, écran mobile simulé ; CPU du contrôleur intérieur uniquement, pas temps GPU.",
        normal: stats,
        reduced,
      },
      null,
      2,
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "library");
  await expect(page.locator(".quest")).toContainText("1 / 24");
});
test("D.3.1 : petit ordinateur et tablette", async ({ page }, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Formats complémentaires capturés une seule fois",
  );
  for (const [name, width, height] of [
    ["petit-pc", 1024, 768],
    ["tablette", 768, 1024],
  ] as const) {
    await page.setViewportSize({ width, height });
    for (const room of ["house", "library", "workshop", "inn"] as const) {
      await start(page, room);
      await page.screenshot({ path: `${output}/${name}-${room}.png` });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
test("D.3.1 : contrôle des ressources sur fonds clair et sombre", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Présentation des ressources capturée une seule fois",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    pathToFileURL(resolve("docs/graphismes/ressources-d31.html")).href,
  );
  await expect(page.locator("img")).toHaveCount(48);
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: `${output}/ressources-clair-sombre.png`,
    fullPage: true,
  });
  await page.goto(
    pathToFileURL(
      resolve(
        existsSync("delivery-manifest.json")
          ? "docs/graphismes/sapin-light.html"
          : "docs/graphismes/sapin-d31.html",
      ),
    ).href,
  );
  await expect(page.locator(".frame")).toHaveCount(3);
  await page.locator("img").evaluateAll((images) =>
    images.forEach((image) => {
      (image as HTMLImageElement).loading = "eager";
    }),
  );
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: `${output}/sapin-atlas-controle.png`,
    fullPage: true,
  });
});
test("D.3.1 : terrain blanc et conservation des matières D.3", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Vue globale destinée au PC");
  mkdirSync(output, { recursive: true });
  await page.setViewportSize({ width: 2048, height: 1634 });
  for (const [name, clock] of [
    ["jour", 45000],
    ["crepuscule", 90000],
    ["nuit", 135000],
  ] as const) {
    await start(page, "village", clock);
    await page.screenshot({ path: `${output}/village-complet-${name}.png` });
    const audit = JSON.parse(
      (await page.locator("canvas").getAttribute("data-terrain"))!,
    );
    expect(audit.regions).toBe(24);
    expect(audit.details).toBe(14);
    expect([audit.width, audit.height]).toEqual([1920, 1408]);
    expect(audit.earthPixels).toBeGreaterThan(0.09 * 1024 * 768);
    expect(audit.opaqueFraction).toBe(1);
  }
});
