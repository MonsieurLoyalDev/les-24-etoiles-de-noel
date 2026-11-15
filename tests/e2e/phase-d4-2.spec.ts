import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  startActivityGame,
  activity,
  waitClip,
  traceActivity,
} from "./activity-support";
import { navigateTo } from "./pathfinding";
import { blocked, type Rect } from "../../src/domain";
import { facadeBounds } from "../../src/art/village34";
const out = "docs/d42";
mkdirSync(out, { recursive: true });
test("D42 Célestine lit, range et utilise le fauteuil sur la géométrie conservée", async ({
  page,
}, info) => {
  test.setTimeout(210000);
  const cases = [];
  for (const [clock, clip] of [
    [45000, "read"],
    [0, "sort"],
    [90000, "seatRead"],
  ] as const) {
    await startActivityGame(
      page,
      "library",
      clock,
      clip === "sort"
        ? { x: 650, y: 250 }
        : clip === "seatRead"
          ? { x: 830, y: 370 }
          : { x: 830, y: 340 },
    );
    await waitClip(page, "mira", clip);
    const trace = await traceActivity(page, "mira", 6000);
    expect(
      new Set(trace.map((s) => s.drawn?.frame).filter(Boolean)).size,
    ).toBeGreaterThan(2);
    expect(trace.some((s) => s.object === "book")).toBe(true);
    const sample = trace.find((s) => s.phase === "acting" && s.drawn)!;
    expect(sample.drawn!.texture).toBe("activity-celestine");
    if (clip === "seatRead") {
      expect(sample.frame).toBeGreaterThanOrEqual(13);
      expect(sample.frame).toBeLessThanOrEqual(14);
      expect(sample.drawn!.y).toBeLessThan(300);
      expect(sample.seatProgress).toBe(1);
    }
    const physical = await page.locator("canvas").evaluate((c) => ({
      world: JSON.parse(c.dataset.livingWorld!),
      rects: JSON.parse(c.dataset.collisions!),
    }));
    const m = physical.world.actors.find(
      (a: { id: string }) => a.id === "mira",
    );
    expect(
      blocked({ x: m.x, y: m.y }, physical.rects as Rect[], 960, 560),
    ).toBe(false);
    cases.push({ clock, clip, trace });
  }
  writeFileSync(
    out + "/celestine-" + info.project.name + ".json",
    JSON.stringify(cases, null, 2),
  );
});
test("D42 Émile ouvre la sacoche, dépose une lettre et la fait disparaître", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await startActivityGame(page, "village", 45000, { x: 1430, y: 670 });
  await waitClip(page, "emile", "delivery");
  const trace = await traceActivity(page, "emile", 6500);
  expect(
    trace.some((s) => s.object === "letter" && [2, 3, 4].includes(s.frame!)),
  ).toBe(true);
  const deposited = trace.findIndex((s) => s.frame === 5);
  expect(deposited).toBeGreaterThan(0);
  expect(trace.slice(deposited).every((s) => s.object !== "letter")).toBe(true);
  expect(trace.some((s) => s.frame === 7)).toBe(true);
  writeFileSync(
    out + "/courrier-" + info.project.name + ".json",
    JSON.stringify(trace, null, 2),
  );
});
test("D42 Augustin synchronise sa lanterne sans doubler les sources lumineuses", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await startActivityGame(page, "village", 90000, { x: 1120, y: 900 });
  await waitClip(page, "noe", "light");
  const before = await page.locator("canvas").evaluate((c) => ({
    lamps: JSON.parse(c.dataset.activityLanterns!),
    lights: JSON.parse(c.dataset.ambience!).visibleLights,
    rendering: JSON.parse(c.dataset.activityLightRendering!),
  }));
  expect(
    before.lamps.find((s: { id: string }) => s.id === "plaza-evening-lantern")
      .on,
  ).toBe(false);
  const trace = await traceActivity(page, "noe", 5000);
  const after = await page.locator("canvas").evaluate((c) => ({
    lamps: JSON.parse(c.dataset.activityLanterns!),
    lights: JSON.parse(c.dataset.ambience!).visibleLights,
    rendering: JSON.parse(c.dataset.activityLightRendering!),
  }));
  const lamp = after.lamps.find(
    (s: { id: string }) => s.id === "plaza-evening-lantern",
  );
  expect(lamp.on).toBe(true);
  expect(lamp.level).toBe(1);
  expect(lamp.commits).toBe(1);
  expect(after.lights).toBe(before.lights);
  expect(
    before.rendering.find(
      (s: { id: string }) => s.id === "plaza-evening-lantern",
    ).alpha,
  ).toBe(0);
  expect(
    after.rendering.find(
      (s: { id: string }) => s.id === "plaza-evening-lantern",
    ).alpha,
  ).toBeGreaterThan(0);
  expect(trace.some((s) => s.frame === 4)).toBe(true);
  const geometry = await page.locator("canvas").evaluate((c) => ({
    world: JSON.parse(c.dataset.livingWorld!),
    rects: JSON.parse(c.dataset.collisions!),
  }));
  for (const a of geometry.world.actors.filter(
    (a: { room: string }) => a.room === "village",
  ))
    expect(blocked(a, [...geometry.rects, ...facadeBounds], 1920, 1408)).toBe(
      false,
    );
  writeFileSync(
    out + "/lanternes-" + info.project.name + ".json",
    JSON.stringify({ before, after, trace }, null, 2),
  );
});
test("D42 dialogue, reprise, sauvegarde et réduction des mouvements", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await startActivityGame(page, "library", 45000, { x: 830, y: 340 });
  await waitClip(page, "mira", "read");
  await page.waitForTimeout(1700);
  await navigateTo(page, { x: 760, y: 324 });
  await page.getByRole("button", { name: /Parler à Célestine/ }).click();
  await expect
    .poll(async () => (await activity(page, "mira"))?.phase)
    .toBe("interrupted");
  expect((await activity(page, "mira"))?.object).toBeNull();
  await expect
    .poll(async () =>
      page
        .locator("canvas")
        .evaluate(
          (c) =>
            JSON.parse(c.dataset.livingWorld!).actors.find(
              (a: { id: string }) => a.id === "mira",
            ).state,
        ),
    )
    .toBe("TALKING_TO_PLAYER");
  const paused = await page.locator("canvas").getAttribute("data-living-world");
  await page.waitForTimeout(700);
  expect(await page.locator("canvas").getAttribute("data-living-world")).toBe(
    paused,
  );
  await page.getByRole("button", { name: "À bientôt", exact: true }).click();
  await navigateTo(page, { x: 830, y: 340 });
  await expect
    .poll(async () => {
      const a = await activity(page, "mira");
      return a?.clip === "read" && !a.interrupted;
    })
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(async () => (await activity(page, "mira"))?.drawn?.frame)
    .toBe("pose-2");
  const reduced = await traceActivity(page, "mira", 600);
  expect(new Set(reduced.map((s) => s.drawn?.frame).filter(Boolean)).size).toBe(
    1,
  );
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator(".quest")).toContainText("3 / 24");
  await expect
    .poll(async () =>
      page.evaluate(
        async () =>
          await new Promise<string[]>((ok) => {
            const r = indexedDB.open("etoilebois", 1);
            r.onsuccess = () => {
              const q = r.result
                .transaction("saves")
                .objectStore("saves")
                .get("phase-b");
              q.onsuccess = () => {
                r.result.close();
                ok(q.result?.flags ?? []);
              };
            };
          }),
      ),
    )
    .toContain("ancienne-partie-conservee");
  writeFileSync(
    out + "/dialogue-" + info.project.name + ".json",
    JSON.stringify(
      { paused: true, resumed: true, reducedFrames: reduced },
      null,
      2,
    ),
  );
});
test("D42 inspection et extinction suivent les états réels des lanternes", async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const results = [];
  for (const c of [
    {
      clock: 45000,
      clip: "inspect",
      position: { x: 870, y: 830 },
      point: "plaza-market-lantern",
    },
    {
      clock: 0,
      clip: "extinguish",
      position: { x: 870, y: 740 },
      point: "plaza-gifts-lantern",
    },
  ]) {
    await startActivityGame(page, "village", c.clock, c.position);
    await waitClip(page, "noe", c.clip);
    const before = await page
      .locator("canvas")
      .evaluate((c) => JSON.parse(c.dataset.activityLanterns!));
    await page.waitForTimeout(3600);
    const after = await page
      .locator("canvas")
      .evaluate((c) => ({
        state: JSON.parse(c.dataset.activityLanterns!),
        render: JSON.parse(c.dataset.activityLightRendering!),
      }));
    const b = before.find((l: { id: string }) => l.id === c.point),
      a = after.state.find((l: { id: string }) => l.id === c.point);
    if (c.clip === "inspect") {
      expect(a.on).toBe(b.on);
      expect(a.commits).toBe(b.commits);
    } else {
      expect(b.on).toBe(true);
      expect(a.on).toBe(false);
      expect(a.commits).toBe(b.commits + 1);
      expect(
        after.render.find((l: { id: string }) => l.id === c.point).alpha,
      ).toBe(0);
    }
    results.push({ clip: c.clip, before, after });
  }
  writeFileSync(
    out + "/inspection-extinction-" + info.project.name + ".json",
    JSON.stringify(results, null, 2),
  );
});
test("D42 le fauteuil conserve son assise et sa réservation pendant un dialogue", async ({
  page,
}, info) => {
  test.setTimeout(100000);
  await startActivityGame(page, "library", 90000, { x: 830, y: 370 });
  await waitClip(page, "mira", "seatRead");
  await page.waitForTimeout(1600);
  await navigateTo(page, { x: 910, y: 326 });
  const button = page.getByRole("button", { name: /Parler à Célestine/ });
  if (info.project.name === "mobile") await button.tap();
  else await button.click();
  await expect
    .poll(async () =>
      page
        .locator("canvas")
        .evaluate(
          (c) =>
            JSON.parse(c.dataset.livingWorld!).actors.find(
              (a: { id: string }) => a.id === "mira",
            ).state,
        ),
    )
    .toBe("TALKING_TO_PLAYER");
  const view = await activity(page, "mira");
  expect(view?.frame).toBe(15);
  expect(view?.drawn?.y).toBeLessThan(300);
  expect(view?.object).toBe("book-closed");
  const reservations = await page
    .locator("canvas")
    .evaluate((c) => JSON.parse(c.dataset.livingWorld!).reservations);
  expect(
    reservations.find((r: { id: string }) => r.id === "library-armchair")
      .owners,
  ).toHaveLength(1);
  await page.waitForTimeout(500);
  const close = page.getByRole("button", { name: "À bientôt", exact: true });
  if (info.project.name === "mobile") await close.tap();
  else await close.click();
  await navigateTo(page, { x: 830, y: 370 });
  await expect
    .poll(async () => {
      const a = await activity(page, "mira");
      return a?.clip === "seatRead" && !a.interrupted;
    })
    .toBe(true);
  writeFileSync(
    out + "/fauteuil-dialogue-" + info.project.name + ".json",
    JSON.stringify(
      {
        touch: info.project.name === "mobile",
        view,
        reservations,
        resumed: true,
      },
      null,
      2,
    ),
  );
});
