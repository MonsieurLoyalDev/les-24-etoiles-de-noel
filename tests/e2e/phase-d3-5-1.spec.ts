import { test, expect, type Page } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { initial, blocked, type Save, type Rect } from "../../src/domain";
import { plan, routeSegments } from "../../src/art/village34";
import {
  witnessItems351,
  witnessRegion351,
} from "../../src/art/composition351";
import { navigateTo } from "./pathfinding";
const out = "docs/screenshots/phase-d3-5-1-c/controles";
async function start(page: Page, position = { x: 560, y: 960 }) {
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
      clock: 45000,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village");
}
test("D351 compositions complètes, A.2 conservée et 38 chemins libres", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const a = await page.locator("canvas").evaluate((c) => ({
    witness: JSON.parse(c.dataset.witness351!),
    scenery: JSON.parse(c.dataset.scenery34!),
    rects: JSON.parse(c.dataset.collisions!),
    fences: JSON.parse(c.dataset.fences35!),
  }));
  expect(a.witness.rejected).toEqual([]);
  for (const bank of a.witness.accumulations)
    expect(bank.w / bank.h).toBeCloseTo(bank.sourceRatio, 6);
  expect(a.witness.accepted).toHaveLength(witnessItems351.length);
  const benches = a.witness.accepted.filter(
    (p: { group: string; key: string }) =>
      p.group === "place-conviviale" && p.key.startsWith("bench-"),
  );
  expect(Math.abs(benches[0].y - benches[1].y)).toBeGreaterThanOrEqual(50);
  const before = JSON.parse(
    readFileSync("tests/fixtures/scenery-a2.json", "utf8"),
  );
  type P = { x: number; y: number; group?: string };
  expect(a.scenery.placed.filter((p: P) => witnessRegion351(p.x, p.y))).toEqual(
    before.scenery.placed.filter((p: P) => witnessRegion351(p.x, p.y)),
  );
  expect(
    a.witness.accepted.filter(
      (p: { key: string; group: string }) =>
        p.group === "place-conviviale" && p.key.startsWith("bench-"),
    ),
  ).toHaveLength(2);
  expect(a.fences.gates).toHaveLength(5);
  for (const s of routeSegments) {
    const n = Math.max(
      1,
      Math.ceil(Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y) / 6),
    );
    for (let i = 0; i <= n; i++)
      expect(
        blocked(
          {
            x: s.a.x + ((s.b.x - s.a.x) * i) / n,
            y: s.a.y + ((s.b.y - s.a.y) * i) / n,
          },
          a.rects,
          1920,
          1408,
        ),
      ).toBe(false);
  }
  expect(errors).toEqual([]);
});
test("D351 promenade réelle, portillons du Foyer et quatre entrées/sorties", async ({
  page,
}, info) => {
  test.setTimeout(300000);
  await start(page);
  for (const id of ["JL", "J3"]) {
    const g = plan.gardens.find((g) => g.id === id)!;
    await navigateTo(page, { x: g.gate[0], y: g.gate[1] });
  }
  for (const b of plan.buildings) {
    await navigateTo(page, b.returnPoint);
    const button = page.getByRole("button", {
      name: new RegExp(
        b.id === "loyal_house"
          ? "Maison de Loyal"
          : b.id === "library"
            ? "Bibliothèque"
            : b.id === "inn"
              ? "Auberge"
              : "Atelier",
      ),
    });
    if (info.project.name === "mobile") await button.tap();
    else await button.click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      b.id === "loyal_house" ? "house" : b.id,
    );
    await navigateTo(page, { x: 240, y: 305 });
    const exit = page.getByRole("button", { name: /E Sortir/ });
    if (info.project.name === "mobile") await exit.tap();
    else await exit.click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-room",
      "village",
    );
  }
});
test("D351 ancienne position sous un nouveau décor récupérée sans perdre les étoiles", async ({
  page,
}) => {
  const tree = witnessItems351.find((p) => p.group === "loyal-bosquet")!;
  await start(page, { x: tree.x, y: tree.y });
  const pos = await page.locator("canvas").evaluate((c) => ({
    x: Number(c.dataset.playerX),
    y: Number(c.dataset.playerY),
    rects: JSON.parse(c.dataset.collisions!) as Rect[],
  }));
  expect(blocked(pos, pos.rects, 1920, 1408)).toBe(false);
  expect(Math.hypot(pos.x - tree.x, pos.y - tree.y)).toBeGreaterThan(5);
  await page.waitForTimeout(4600);
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-player-x",
    String(pos.x),
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-player-y",
    String(pos.y),
  );
  await expect(page.locator(".quest")).toContainText("3 / 24");
});
test("D351 performances et réduction des mouvements PC/mobile", async ({
  page,
}, info) => {
  await start(page);
  const cdp = await page.context().newCDPSession(page),
    cpu = info.project.name === "mobile" ? 4 : 1;
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  const samples = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const a: number[] = [];
        let prev = performance.now();
        const frame = (now: number) => {
          a.push(now - prev);
          prev = now;
          if (a.length === 190) resolve(a.slice(10));
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const sorted = [...samples].sort((a, b) => a - b),
    p95 = sorted[Math.floor(sorted.length * 0.95)];
  expect(p95).toBeLessThan(100);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-ambience"))!,
        ).quality,
    )
    .toBe("none");
  const effects = JSON.parse(
    (await page.locator("canvas").getAttribute("data-ambience"))!,
  );
  expect(effects.visibleSnow).toBe(0);
  expect(effects.visibleSmoke).toBe(0);
  mkdirSync(out, { recursive: true });
  writeFileSync(
    `${out}/performance-${info.project.name}.json`,
    JSON.stringify(
      {
        cpu,
        p95,
        mean: samples.reduce((a, b) => a + b, 0) / samples.length,
        samples: samples.length,
        effects,
        note: "Chrome local, mobile émulé, pas un téléphone physique.",
      },
      null,
      2,
    ),
  );
});
