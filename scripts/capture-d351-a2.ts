import { chromium, type Page } from "@playwright/test";
import { initial, type Save } from "../src/domain";
import { mkdirSync, writeFileSync } from "node:fs";
const out = "docs/screenshots/phase-d3-5-1-a2";
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
  errors: string[] = [];
try {
  const auditOnly = process.argv.includes("--audit");
  for (const [stage, port] of [
    ["avant", 5181],
    ["apres", 5182],
  ] as const) {
    if ((auditOnly || process.argv.includes("--after")) && stage === "avant")
      continue;
    mkdirSync(`${out}/${stage}`, { recursive: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      }),
      page = await context.newPage();
    await page.addInitScript("window.__name=(fn)=>fn");
    page.on("pageerror", (e) => errors.push(e.message));
    const shots: [string, number, number, number][] = [
      ["foyer", 560, 960, 45000],
      ["place", 960, 790, 45000],
      ["maison-loyal", 850, 975, 45000],
      ["chemin-foyer", 540, 921, 45000],
      ["coin-convivial", 1090, 930, 45000],
      ["jardin-loyal", 885, 970, 45000],
      ["marche", 835, 760, 45000],
      ["portillon-loyal", 560, 745, 45000],
      ["foyer-nuit", 560, 960, 145000],
      ["place-nuit", 960, 790, 145000],
    ];
    for (const [name, x, y, clock] of auditOnly ? shots.slice(0, 2) : shots) {
      if (
        process.argv.includes("--framing") &&
        !["maison-loyal", "coin-convivial", "jardin-loyal"].includes(name)
      )
        continue;
      if (
        process.argv.includes("--details") &&
        !["chemin-foyer", "portillon-loyal"].includes(name)
      )
        continue;
      await seed(page, port, x, y, clock);
      const audit = await page.locator("canvas").evaluate((c) => ({
        scenery: JSON.parse(c.dataset.scenery34!),
        rects: JSON.parse(c.dataset.collisions!),
        ground: JSON.parse(c.dataset.ground35!),
        witness: c.dataset.witness351 ? JSON.parse(c.dataset.witness351) : null,
        tree: JSON.parse(c.dataset.treeArt!),
        ambience: JSON.parse(c.dataset.ambience!),
      }));
      writeFileSync(
        `${out}/${stage}/audit-${name}.json`,
        JSON.stringify(audit, null, 2),
      );
      await page.screenshot({
        path: `${out}/${stage}/${name}.png`,
        ...(name === "coin-convivial"
          ? { clip: { x: 180, y: 100, width: 650, height: 440 } }
          : name === "jardin-loyal"
            ? { clip: { x: 30, y: 70, width: 960, height: 680 } }
            : name === "portillon-loyal"
              ? { clip: { x: 500, y: 310, width: 500, height: 340 } }
              : name === "chemin-foyer"
                ? { clip: { x: 390, y: 270, width: 600, height: 390 } }
                : {}),
      });
      console.log(
        stage,
        name,
        audit.witness
          ? {
              accepted: audit.witness.accepted.length,
              rejected: audit.witness.rejected.length,
            }
          : "D35",
      );
    }
    await context.close();
    if (
      !auditOnly &&
      !process.argv.includes("--details") &&
      !process.argv.includes("--framing")
    ) {
      const mobile = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        }),
        p = await mobile.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.addInitScript("window.__name=(fn)=>fn");
      for (const [name, x, y] of [
        ["mobile-loyal", 720, 935],
        ["mobile-place", 960, 790],
      ] as const) {
        await seed(p, port, x, y, 45000);
        await p.screenshot({ path: `${out}/${stage}/${name}.png` });
      }
      await mobile.close();
    }
  }
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await browser.close();
}
