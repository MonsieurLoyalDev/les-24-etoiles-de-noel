import { expect, type Page } from "@playwright/test";
// Press actual keyboard controls. Release in the same browser frame as the
// waypoint, avoiding RPC/CPU latency that can otherwise hold a key too long.
// Only public read-only diagnostics are observed; game state is never changed.
export async function walkTo(page: Page, axis: "x" | "y", target: number) {
  await expect(page.locator(".dialogue")).toHaveCount(0);
  const start = Number(
    await page.locator("canvas").getAttribute(`data-player-${axis}`),
  );
  if (Math.abs(start - target) <= 14) return;
  const direction = target > start ? 1 : -1;
  const key =
    axis === "x"
      ? direction > 0
        ? "ArrowRight"
        : "ArrowLeft"
      : direction > 0
        ? "ArrowDown"
        : "ArrowUp";
  const keyCode = { ArrowRight: 39, ArrowLeft: 37, ArrowDown: 40, ArrowUp: 38 }[
    key
  ];
  await page.evaluate(
    ({ axis, target, direction, key, keyCode }) => {
      const root = window as Window & {
        __rpgWalk?: { done: boolean; cancel: boolean };
      };
      const marker = { done: false, cancel: false };
      root.__rpgWalk = marker;
      function observe() {
        if (marker.cancel) return;
        const canvas = document.querySelector("canvas")!;
        const value = Number(canvas.getAttribute(`data-player-${axis}`));
        if (direction * (value - target) >= -8) {
          window.dispatchEvent(
            new KeyboardEvent("keyup", {
              key,
              code: key,
              keyCode,
              bubbles: true,
            }),
          );
          marker.done = true;
          return;
        }
        requestAnimationFrame(observe);
      }
      requestAnimationFrame(observe);
    },
    { axis, target, direction, key, keyCode },
  );
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      () =>
        Boolean(
          (window as Window & { __rpgWalk?: { done: boolean } }).__rpgWalk
            ?.done,
        ),
      {},
      { timeout: 30000, polling: "raf" },
    );
  } finally {
    await page.keyboard.up(key);
    await page.evaluate(() => {
      const marker = (window as Window & { __rpgWalk?: { cancel: boolean } })
        .__rpgWalk;
      if (marker) marker.cancel = true;
    });
  }
}
