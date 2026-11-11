import { chromium, type Page } from "@playwright/test";
import { initial, type Save } from "../src/domain";
import { mkdirSync, writeFileSync } from "node:fs";
const out = "docs/screenshots/phase-d3-5-1-b";
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
      ["livres", 420, 430, 45000],
      ["veillees", 1480, 430, 45000],
      ["artisans", 1600, 985, 45000],
      ["jardin-livres", 324, 688, 45000],
      ["jardin-veillees", 1700, 400, 45000],
      ["jardin-artisans", 1780, 940, 45000],
      ["chemin-livres", 560, 455, 45000],
      ["chemin-veillees", 1420, 540, 45000],
      ["chemin-artisans", 1460, 1010, 45000],
      ["accessoires-artisans", 1600, 1000, 45000],
      ["livres-nuit", 420, 430, 145000],
      ["veillees-nuit", 1480, 430, 145000],
      ["artisans-nuit", 1600, 985, 145000],
    ];
    for (const [name, x, y, clock] of process.argv.includes("--audit")
      ? shots.slice(0, 3)
      : shots) {
      if (process.argv.includes("--gardens") && !name.startsWith("jardin-"))
        continue;
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
        ...(name.startsWith("chemin-")
          ? { clip: { x: 420, y: 370, width: 600, height: 390 } }
          : name === "accessoires-artisans"
            ? { clip: { x: 400, y: 370, width: 700, height: 440 } }
            : name.startsWith("jardin-")
              ? {
                  clip:
                    name === "jardin-livres"
                      ? { x: 360, y: 220, width: 430, height: 480 }
                      : name === "jardin-veillees"
                        ? { x: 980, y: 580, width: 440, height: 490 }
                        : { x: 1080, y: 530, width: 350, height: 500 },
                }
              : {}),
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
    if (
      !process.argv.includes("--audit") &&
      !process.argv.includes("--gardens")
    ) {
      const whole = await browser.newContext({
          viewport: { width: 3840, height: 2940 },
        }),
        p = await whole.newPage();
      await p.addInitScript("window.__name=(fn)=>fn");
      await seed(p, port, 960, 720, 45000);
      await p.screenshot({ path: `${out}/${stage}/village.png` });
      await whole.close();
      const mobile = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        }),
        m = await mobile.newPage();
      await m.addInitScript("window.__name=(fn)=>fn");
      await seed(m, port, 1480, 430, 45000);
      await m.screenshot({ path: `${out}/${stage}/mobile-veillees.png` });
      await mobile.close();
    }
  }
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await browser.close();
}
