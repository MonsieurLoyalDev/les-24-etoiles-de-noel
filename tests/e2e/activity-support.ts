import { expect, type Page } from "@playwright/test";
import { initial, type Save } from "../../src/domain";
export type ActivityView = {
  actor: string;
  clip: string | null;
  phase: string;
  frame: number | null;
  age: number;
  object: string | null;
  interrupted: boolean;
  seatProgress: number;
  drawn: null | { texture: string; frame: string; x: number; y: number };
};
export async function startActivityGame(
  page: Page,
  room: Save["room"],
  clock: number,
  position: { x: number; y: number },
) {
  await page.addInitScript("window.__name=f=>f");
  await page.clock.setFixedTime(new Date("2026-11-01T12:00:00+01:00"));
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
      flags: ["ancienne-partie-conservee"],
      room,
      clock,
      position,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", room, {
    timeout: 20000,
  });
  await page.evaluate(() => document.fonts.ready);
}
export const activity = (page: Page, id: string) =>
  page
    .locator("canvas")
    .evaluate(
      (c, id) =>
        (JSON.parse(c.dataset.activities ?? "[]") as ActivityView[]).find(
          (a) => a.actor === id,
        ),
      id,
    );
export async function waitClip(page: Page, id: string, clip: string) {
  await expect
    .poll(
      async () => {
        const a = await activity(page, id);
        return a?.clip === clip && a.frame !== null && !a.interrupted;
      },
      { timeout: 55000, intervals: [100] },
    )
    .toBe(true);
}
export async function traceActivity(page: Page, id: string, ms: number) {
  const out: ActivityView[] = [];
  for (let t = 0; t < ms; t += 200) {
    const a = await activity(page, id);
    if (a) out.push(a);
    await page.waitForTimeout(200);
  }
  return out;
}
