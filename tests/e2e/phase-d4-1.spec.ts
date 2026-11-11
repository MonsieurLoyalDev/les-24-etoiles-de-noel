import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { initial, blocked, type Save, type Rect } from "../../src/domain";
import { facadeBounds } from "../../src/art/village34";
import { navigateTo } from "./pathfinding";
const environments = JSON.parse(
  readFileSync("tests/fixtures/world-d41-environments.json", "utf8"),
) as { room: string; rects: Rect[] }[];
const out = "docs/d41";
type Actor = {
  id: string;
  x: number;
  y: number;
  room: string;
  state: string;
  point: string;
  activity: string;
  period: number;
};
async function start(
  page: Page,
  room: Save["room"] = "village",
  clock = 45000,
  position = { x: 1100, y: 820 },
) {
  await page.addInitScript("window.__name=f=>f");
  await page.goto("/");
  await page.evaluate(
    async (s: Save) => {
      await new Promise<void>((ok, fail) => {
        const r = indexedDB.open("etoilebois", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("saves");
        r.onerror = () => fail(r.error);
        r.onsuccess = () => {
          const t = r.result.transaction("saves", "readwrite");
          t.objectStore("saves").put(s, "phase-b");
          t.oncomplete = () => {
            r.result.close();
            ok();
          };
        };
      });
    },
    {
      ...structuredClone(initial),
      stage: 4 as const,
      stars: [1, 3, 18],
      room,
      clock,
      position: room === "village" ? position : { x: 240, y: 280 },
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-living-world",
    /.+/,
  );
}
const snapshot = (page: Page) =>
  page.locator("canvas").evaluate(
    (c) =>
      JSON.parse(c.dataset.livingWorld!) as {
        clock: number;
        actors: Actor[];
        points: { id: string; room: string; valid: boolean | null }[];
        navigation: {
          searches: number;
          cachedRoutes: number;
          cells: number;
        }[];
      },
  );
test("D41 tous les anciens habitants présents et géométrie inchangée dans les cinq pièces", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [room, id] of [
    ["village", "noe"],
    ["library", "mira"],
    ["workshop", "oscar"],
    ["inn", "alma"],
    ["house", null],
  ] as const) {
    await start(page, room);
    const a = await page.locator("canvas").evaluate((c) => ({
      people: JSON.parse(c.dataset.npcs!),
      names: JSON.parse(c.dataset.nameTags!),
      rects: JSON.parse(c.dataset.collisions!),
    }));
    expect(a.rects).toEqual(environments.find((r) => r.room === room)!.rects);
    if (id)
      expect(a.people.some((p: { id: string }) => p.id === id)).toBe(true);
    if (room === "village") {
      expect(a.people.map((p: { id: string }) => p.id).sort()).toEqual([
        "emile",
        "noe",
      ]);
      expect(a.names.map((n: { name: string }) => n.name)).toEqual(
        expect.arrayContaining([
          "Debby",
          "Loyal",
          "Augustin",
          "Émile",
          "Flocon",
        ]),
      );
      const s = await snapshot(page);
      expect(
        s.points.filter((p) => p.room === "village").every((p) => p.valid),
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
test("D41 marche réelle sans obstacle ni saut, dialogue suspendu puis repris", async ({
  page,
}) => {
  test.setTimeout(120000);
  await start(page);
  const rects = [
    ...((await page
      .locator("canvas")
      .evaluate((c) => JSON.parse(c.dataset.collisions!))) as Rect[]),
    ...facadeBounds,
  ];
  let previous = await snapshot(page),
    travel = 0;
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(350);
    const s = await snapshot(page);
    for (const a of s.actors.filter((a) => a.room === "village")) {
      expect(blocked({ x: a.x, y: a.y }, rects, 1920, 1408), a.id).toBe(false);
      const b = previous.actors.find((b) => b.id === a.id)!;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      expect(distance).toBeLessThan(
        ((a.id === "noe" ? 32 : 42) *
          (((s.clock - previous.clock + 180000) % 180000) + 250)) /
          1000 +
          1,
      );
      travel += distance;
    }
    previous = s;
  }
  expect(travel).toBeGreaterThan(60);
  for (
    let i = 0;
    i < 4 &&
    !(await page
      .getByRole("button", { name: /Parler à Augustin/ })
      .isVisible());
    i++
  ) {
    const n = (await snapshot(page)).actors.find((a) => a.id === "noe")!;
    await navigateTo(page, { x: n.x, y: n.y });
  }
  await page.getByRole("button", { name: /Parler à Augustin/ }).click();
  await expect(page.locator(".dialogue")).toContainText(
    "Visite la maison de Loyal",
  );
  await expect
    .poll(
      async () =>
        (await snapshot(page)).actors.find((a) => a.id === "noe")!.state,
    )
    .toBe("TALKING_TO_PLAYER");
  const paused = await snapshot(page);
  await page.waitForTimeout(800);
  const after = await snapshot(page);
  expect(after.clock).toBe(paused.clock);
  expect(after.actors.find((a) => a.id === "noe")).toEqual(
    paused.actors.find((a) => a.id === "noe"),
  );
  await page.getByRole("button", { name: "À bientôt", exact: true }).click();
  await navigateTo(page, { x: 1100, y: 820 });
  await expect
    .poll(async () => (await snapshot(page)).clock)
    .not.toBe(paused.clock);
  expect(
    (await snapshot(page)).actors.find((a) => a.id === "noe")!.state,
  ).not.toBe("TALKING_TO_PLAYER");
});
test("D41 horaires, nouvelle conversation Émile et rencontre sauvegardée sans étoile ajoutée", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const [clock, point] of [
    [0, "mail-books"],
    [45000, "mail-families"],
    [90000, "post-start"],
    [135000, "post-start"],
  ] as const) {
    await start(page, "village", clock, { x: 780, y: 735 });
    const s = await snapshot(page);
    expect(s.actors.find((a) => a.id === "emile")!.point).toBe(point);
    expect(s.actors.find((a) => a.id === "emile")!.period).toBe(
      Math.floor(clock / 45000),
    );
  }
  await start(page, "village", 90000, { x: 780, y: 735 });
  await navigateTo(page, { x: 750, y: 700 });
  await page.getByRole("button", { name: /Parler à Émile/ }).click();
  await expect(page.locator(".dialogue")).toContainText(
    "La tournée est terminée",
  );
  await page.getByRole("button", { name: "À bientôt", exact: true }).click();
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        return await new Promise<string[]>((ok) => {
          const r = indexedDB.open("etoilebois", 1);
          r.onsuccess = () => {
            const t = r.result
              .transaction("saves")
              .objectStore("saves")
              .get("phase-b");
            t.onsuccess = () => {
              const value = t.result;
              r.result.close();
              ok(value?.flags ?? []);
            };
          };
        });
      }),
    )
    .toContain("world:met:emile");
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator(".quest")).toContainText("3 / 24");
});
test("D41 budget de navigation, fluidité et réduction des mouvements", async ({
  page,
}, info) => {
  await start(page);
  const cdp = await page.context().newCDPSession(page),
    cpu = info.project.name === "mobile" ? 4 : 1;
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  const samples = await page.evaluate(
    () =>
      new Promise<number[]>((ok) => {
        const a: number[] = [];
        let last = performance.now();
        const f = (now: number) => {
          a.push(now - last);
          last = now;
          if (a.length === 190) ok(a.slice(10));
          else requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }),
  );
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const p95 = [...samples].sort((a, b) => a - b)[171];
  expect(p95).toBeLessThan(100);
  const s = await snapshot(page);
  expect(
    s.navigation.every((n) => n.searches < 12 && n.cachedRoutes <= 64),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(async () =>
      page
        .locator("canvas")
        .evaluate((c) => JSON.parse(c.dataset.ambience!).quality),
    )
    .toBe("none");
  const effects = await page
    .locator("canvas")
    .evaluate((c) => JSON.parse(c.dataset.ambience!));
  expect(effects.visibleSnow).toBe(0);
  expect(effects.visibleSmoke).toBe(0);
  mkdirSync(out, { recursive: true });
  writeFileSync(
    `${out}/performance-${info.project.name}.json`,
    JSON.stringify(
      {
        p95,
        mean: samples.reduce((a, b) => a + b, 0) / samples.length,
        samples: samples.length,
        cpu,
        world: s,
        effects,
        note: "Chrome local ; mobile émulé, pas un téléphone physique.",
      },
      null,
      2,
    ),
  );
});
