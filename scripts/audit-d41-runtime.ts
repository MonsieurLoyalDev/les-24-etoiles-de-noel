import { chromium } from "@playwright/test";
import { initial, blocked, type Save } from "../src/domain";
import { writeFileSync } from "node:fs";
import { facadeBounds } from "../src/art/village34";
const browser = await chromium.launch({ channel: "chrome" }),
  rows = [];
try {
  for (const room of [
    "village",
    "house",
    "library",
    "workshop",
    "inn",
  ] as const) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await p.addInitScript("window.__name=f=>f");
    await p.goto("http://127.0.0.1:5181");
    await p.evaluate(
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
        stage: 4,
        stars: [1, 3, 18],
        clock: 45000,
        room,
        position: room === "village" ? { x: 1040, y: 740 } : { x: 240, y: 280 },
      },
    );
    await p.getByRole("button", { name: /Entrer dans le village/ }).click();
    await p.locator("canvas[data-room]").waitFor();
    await p.waitForTimeout(600);
    const data = await p
      .locator("canvas")
      .evaluate((c) => ({
        room: c.dataset.room,
        npcs: JSON.parse(c.dataset.npcs!),
        rects: JSON.parse(c.dataset.collisions!),
        names: JSON.parse(c.dataset.nameTags!),
        scenery: c.dataset.scenery34 ? JSON.parse(c.dataset.scenery34) : null,
        seats: c.dataset.seats35 ? JSON.parse(c.dataset.seats35) : null,
        ground: c.dataset.ground35 ? JSON.parse(c.dataset.ground35) : null,
      }));
    const samples = await p.evaluate(
      () =>
        new Promise<number[]>((ok) => {
          const a: number[] = [];
          let last = performance.now();
          const tick = (now: number) => {
            a.push(now - last);
            last = now;
            if (a.length === 130) ok(a.slice(10));
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
    );
    rows.push({
      ...data,
      p95: [...samples].sort((a, b) => a - b)[114],
      samples: samples.length,
      blockedCitizens: data.npcs.filter((n: { x: number; y: number }) =>
        blocked(
          n,
          [...data.rects, ...(room === "village" ? facadeBounds : [])],
          room === "village" ? 1920 : 960,
          room === "village" ? 1408 : 560,
        ),
      ),
    });
    await p.close();
  }
  writeFileSync(
    "docs/d41/BASELINE-RUNTIME.json",
    JSON.stringify(rows, null, 2),
  );
  writeFileSync(
    "tests/fixtures/world-d41-environments.json",
    JSON.stringify(
      rows.map((r) => ({ room: r.room, rects: r.rects })),
      null,
      2,
    ),
  );
  console.log(
    rows.map((r) => ({
      room: r.room,
      npcs: r.npcs,
      blocked: r.blockedCitizens,
      p95: r.p95,
    })),
  );
} finally {
  await browser.close();
}
