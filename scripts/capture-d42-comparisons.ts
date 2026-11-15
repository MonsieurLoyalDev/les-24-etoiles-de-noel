import { chromium } from "@playwright/test";
import { startActivityGame, waitClip } from "../tests/e2e/activity-support";
import { recordCanvas } from "./record-d42";
const out = "docs/screenshots/phase-d4-2",
  browser = await chromium.launch({ channel: "chrome" });
try {
  for (const c of [
    {
      name: "lecture",
      room: "library" as const,
      id: "mira",
      point: "library-reading",
      position: { x: 830, y: 340 },
    },
    {
      name: "distribution",
      room: "village" as const,
      id: "emile",
      point: "mail-families",
      position: { x: 1430, y: 670 },
    },
  ]) {
    const ctx = await browser.newContext({
        baseURL: "http://127.0.0.1:5184",
        viewport: { width: 1280, height: 900 },
      }),
      p = await ctx.newPage();
    await startActivityGame(p, c.room, 45000, c.position);
    await p.waitForFunction(
      (c) => {
        const a = JSON.parse(
          document.querySelector("canvas")!.dataset.livingWorld!,
        ).actors.find((a: { id: string }) => a.id === c.id);
        return a?.point === c.point && a?.state === "OBSERVING";
      },
      c,
      { timeout: 55000 },
    );
    await p.waitForTimeout(2700);
    await p.screenshot({ path: out + "/avant-" + c.name + ".png" });
    await ctx.close();
  }
  for (const c of [
    {
      name: "lecture",
      room: "library" as const,
      id: "mira",
      clip: "read",
      position: { x: 800, y: 360 },
    },
    {
      name: "distribution",
      room: "village" as const,
      id: "emile",
      clip: "delivery",
      position: { x: 1380, y: 630 },
    },
  ]) {
    const ctx = await browser.newContext({
        baseURL: "http://127.0.0.1:5185",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      }),
      p = await ctx.newPage();
    await startActivityGame(p, c.room, 45000, c.position);
    await waitClip(p, c.id, c.clip);
    const movie = recordCanvas(p, out + "/mobile-" + c.name + ".webm", 6200);
    await p.waitForTimeout(2700);
    await p.screenshot({ path: out + "/mobile-" + c.name + ".png" });
    await movie;
    await ctx.close();
  }
} finally {
  await browser.close();
}
