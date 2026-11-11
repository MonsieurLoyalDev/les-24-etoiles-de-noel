import { chromium, type Page } from "@playwright/test";
import { initial, type Save } from "../src/domain";
import { mkdirSync, writeFileSync } from "node:fs";
const out = "docs/screenshots/phase-d3-5-1-c-correctif";
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
const clips: Record<
  string,
  { x: number; y: number; width: number; height: number }
> = {
  "jardin-artisans": { x: 1160, y: 450, width: 260, height: 380 },
  "jardin-veillees": { x: 800, y: 500, width: 480, height: 570 },
  voisins: { x: 650, y: 160, width: 500, height: 360 },
  "chalet-bois": { x: 820, y: 350, width: 360, height: 390 },
  "raccord-seuil": { x: 400, y: 530, width: 500, height: 250 },
  "raccord-passage": { x: 840, y: 500, width: 350, height: 350 },
};
const only = process.argv
  .find((a) => a.startsWith("--only="))
  ?.slice(7)
  .split(",");
const browser = await chromium.launch({ channel: "chrome" }),
  errors: string[] = [];
try {
  for (const [stage, port] of [
    ["avant", 5181],
    ["apres", 5182],
  ] as const) {
    if (process.argv.includes("--after") && stage === "avant") continue;
    mkdirSync(`${out}/${stage}`, { recursive: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1200 },
      }),
      page = await context.newPage();
    await page.addInitScript("window.__name=(fn)=>fn");
    page.on("pageerror", (e) => errors.push(e.message));
    const shots: [string, number, number, number][] = [
      ["jardin-veillees", 1900, 400, 45000],
      ["voisins", 1420, 540, 45000],
    ];
    for (const [name, x, y, clock] of process.argv.includes("--audit")
      ? shots.slice(0, 3)
      : shots) {
      if (process.argv.includes("--gardens") && !name.startsWith("jardin-"))
        continue;
      if (only && !only.includes(name)) continue;
      await seed(page, port, x, y, clock);
      const audit = await page.locator("canvas").evaluate((c) => ({
        scenery: JSON.parse(c.dataset.scenery34!),
        rects: JSON.parse(c.dataset.collisions!),
        ground: JSON.parse(c.dataset.ground35!),
        witness: JSON.parse(c.dataset.witness351!),
        quarters: c.dataset.quarters351b
          ? JSON.parse(c.dataset.quarters351b)
          : null,
      }));
      writeFileSync(
        `${out}/${stage}/audit-${name}.json`,
        JSON.stringify(audit, null, 2),
      );
      await page.screenshot({
        path: `${out}/${stage}/${name}.png`,
        ...(clips[name] ? { clip: clips[name] } : {}),
      });
      console.log(
        stage,
        name,
        audit.quarters
          ? {
              accepted: audit.quarters.accepted.length,
              rejected: audit.quarters.rejected,
            }
          : "A.2",
      );
    }
    await context.close();
  }
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await browser.close();
}
