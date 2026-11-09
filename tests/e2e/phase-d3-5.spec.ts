import { test, expect, type Page } from "@playwright/test";
import { initial, type Save } from "../../src/domain";
import { mkdirSync, writeFileSync } from "node:fs";
import { blocked } from "../../src/domain";
import {
  plan,
  routeSegments,
  facadeBounds,
  overlaps,
} from "../../src/art/village34";
const out = "docs/screenshots/phase-d3-5/apres";
async function start(page: Page, position = { x: 960, y: 790 }, clock = 45000) {
  await page.goto("/");
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
      stage: 4 as const,
      stars: [1, 3, 18],
      position,
      clock,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}
test("D35 intégration artistique, matières, clôtures et végétation intérieure", async ({
  page,
}, info) => {
  test.setTimeout(180000);
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
      await start(page, { x: 960, y: 790 }, clock);
      await page.screenshot({ path: `${out}/village-complet-${name}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1200 });
  }
  for (const q of plan.quarters) {
    await start(page, { x: q.court.center[0], y: q.court.center[1] });
    await page.screenshot({ path: `${out}/${info.project.name}-${q.id}.png` });
  }
  const audit = await page.locator("canvas").evaluate((c) => ({
    assets: JSON.parse(c.dataset.assets35!),
    ground: JSON.parse(c.dataset.ground35!),
    fences: JSON.parse(c.dataset.fences35!),
    seats: JSON.parse(c.dataset.seats35!),
    scenery: JSON.parse(c.dataset.scenery34!),
  }));
  writeFileSync(
    `${out}/audit-${info.project.name}.json`,
    JSON.stringify(audit, null, 2),
  );
  console.log(
    "D35 inventaire",
    JSON.stringify({
      assets: audit.assets.length,
      ground: audit.ground,
      benches: audit.seats.length,
      plants: audit.scenery.placed
        .filter(
          (p: { key: string; quarter: string }) =>
            p.quarter.startsWith("Q") &&
            (p.key.includes("pine") ||
              p.key.startsWith("fir_") ||
              p.key === "prop-bare-tree"),
        )
        .map((p: { key: string; quarter: string }) => [p.key, p.quarter]),
      props: audit.scenery.placed.length,
    }),
  );
  expect(errors).toEqual([]);
  for (const key of [
    "prop-table",
    "prop-basket",
    "prop-sled",
    "wood-medium",
    "gift-display",
  ])
    expect(
      audit.scenery.placed.some((p: { key: string }) => p.key === key),
      key,
    ).toBe(true);
  expect(audit.assets).toHaveLength(47);
  expect(audit.ground.materials).toBe(4);
  expect(audit.ground.irregularEdge).toBeGreaterThan(1000);
  expect(audit.fences.gates).toHaveLength(5);
  expect(new Set(audit.fences.styles).size).toBe(4);
  expect(audit.seats.length).toBeGreaterThanOrEqual(4);
  expect(
    new Set(audit.seats.map((s: { texture: string }) => s.texture)).size,
  ).toBe(4);
  expect(
    audit.seats.some(
      (s: { x: number; y: number }) =>
        s.x > 700 && s.x < 1320 && s.y > 640 && s.y < 970,
    ),
  ).toBe(true);
  const inner = audit.scenery.placed.filter(
    (p: { key: string; quarter: string }) =>
      p.quarter.startsWith("Q") &&
      (p.key.startsWith("fir_") ||
        p.key.includes("pine") ||
        p.key === "prop-bare-tree"),
  );
  expect(inner.length).toBeGreaterThanOrEqual(20);
  for (const seat of audit.seats) expect(seat.positions).toHaveLength(2);
});

test("D35 circulation réelle, performances et réduction des effets", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await start(page, { x: 1012, y: 1020 });
  const audit = await page.locator("canvas").evaluate((c) => ({
    rects: JSON.parse(c.dataset.collisions!),
    scenery: JSON.parse(c.dataset.scenery34!),
    ground: JSON.parse(c.dataset.ground35!),
  }));
  for (const s of routeSegments) {
    const n = Math.max(
      1,
      Math.ceil(Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y) / 8),
    );
    for (let i = 0; i <= n; i++) {
      const p = {
        x: s.a.x + ((s.b.x - s.a.x) * i) / n,
        y: s.a.y + ((s.b.y - s.a.y) * i) / n,
      };
      expect(blocked(p, audit.rects, 1920, 1408), JSON.stringify(p)).toBe(
        false,
      );
    }
  }
  for (const p of audit.scenery.placed)
    expect(
      facadeBounds.some((r) => overlaps(p.box, r)),
      p.key,
    ).toBe(false);
  const cdp = await page.context().newCDPSession(page);
  if (info.project.name === "mobile")
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const samples = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const values: number[] = [];
        let prev = performance.now();
        const frame = (now: number) => {
          values.push(now - prev);
          prev = now;
          if (values.length === 190) resolve(values.slice(10));
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const sorted = [...samples].sort((a, b) => a - b),
    p95 = sorted[Math.floor(sorted.length * 0.95)];
  expect(p95).toBeLessThan(100);
  expect(audit.ground.milliseconds).toBeLessThan(2000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-ambience"))!,
        ).quality,
    )
    .toBe("none");
  const reduced = JSON.parse(
    (await page.locator("canvas").getAttribute("data-ambience"))!,
  );
  expect(reduced.visibleSnow).toBe(0);
  expect(reduced.visibleSmoke).toBe(0);
  await expect(page.locator(".quest")).toContainText("3 / 24");
  writeFileSync(
    out + "/performance-" + info.project.name + ".json",
    JSON.stringify(
      {
        p95,
        mean: samples.reduce((a, b) => a + b, 0) / samples.length,
        frames: samples.length,
        cpu: info.project.name === "mobile" ? 4 : 1,
        ground: audit.ground,
        reduced,
        note: "Chrome local : mobile émulé avec CPU x4 pour cette mesure, pas un téléphone physique ; échantillons RAF, pas une garantie de FPS.",
      },
      null,
      2,
    ),
  );
});
