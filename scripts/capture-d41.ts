import { chromium, type Page } from "@playwright/test";
import { initial, type Save } from "../src/domain";
import { mkdirSync, writeFileSync } from "node:fs";
import { navigateTo } from "../tests/e2e/pathfinding";
const out = "docs/screenshots/phase-d4-1";
mkdirSync(out, { recursive: true });
async function start(
  page: Page,
  port: number,
  position: { x: number; y: number },
  clock: number,
  room: Save["room"] = "village",
) {
  await page.goto(`http://127.0.0.1:${port}`);
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
      stage: 4,
      stars: [1, 3, 18],
      position,
      clock,
      room,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.locator("canvas[data-room]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}
async function movie(page: Page, path: string, ms = 7500) {
  const data = await page.locator("canvas").evaluate(async (canvas, ms) => {
    const c = canvas as HTMLCanvasElement,
      stream = c.captureStream(12),
      type = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
      rec = new MediaRecorder(stream, {
        mimeType: type,
        videoBitsPerSecond: 1200000,
      }),
      chunks: BlobPart[] = [];
    await new Promise<void>((ok) => {
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => ok();
      rec.start();
      setTimeout(() => rec.stop(), ms);
    });
    stream.getTracks().forEach((t) => t.stop());
    const buffer = new Uint8Array(
      await new Blob(chunks, { type }).arrayBuffer(),
    );
    let s = "";
    for (let i = 0; i < buffer.length; i += 8192)
      s += String.fromCharCode(...buffer.subarray(i, i + 8192));
    return btoa(s);
  }, ms);
  writeFileSync(path, Buffer.from(data, "base64"));
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
    await page.addInitScript("window.__name=f=>f");
    page.on("pageerror", (e) => errors.push(e.message));
    await start(page, port, { x: 1100, y: 820 }, 0);
    if (stage === "apres") {
      await movie(page, `${out}/ronde-augustin.webm`);
      await page.waitForFunction(
        () =>
          JSON.parse(
            document.querySelector("canvas")!.dataset.livingWorld!,
          ).actors.find((a: { id: string }) => a.id === "noe")?.state ===
          "OBSERVING",
        null,
        { timeout: 20000 },
      );
    } else await page.waitForTimeout(11000);
    await page.screenshot({ path: `${out}/${stage}/place-aurore.png` });
    if (stage === "apres") {
      const a = await page
        .locator("canvas")
        .evaluate((c) => JSON.parse(c.dataset.livingWorld!));
      writeFileSync(`${out}/audit-place.json`, JSON.stringify(a, null, 2));
      console.log("place", a.actors);
    }
    await start(page, port, { x: 1430, y: 670 }, 45000);
    if (stage === "apres")
      await page.waitForFunction(
        () => {
          const a = JSON.parse(
            document.querySelector("canvas")!.dataset.livingWorld ?? "{}",
          ).actors?.find((a: { id: string }) => a.id === "emile");
          return a?.state === "OBSERVING" && a?.point === "mail-families";
        },
        null,
        { timeout: 40000 },
      );
    else await page.waitForTimeout(22000);
    await page.screenshot({ path: `${out}/${stage}/courrier-veillees.png` });
    if (stage === "apres") {
      await navigateTo(page, { x: 1320, y: 615 });
      await page.getByRole("button", { name: /Parler à Émile/ }).click();
      await page.screenshot({ path: `${out}/conversation-emile.png` });
      await page
        .getByRole("button", { name: "À bientôt", exact: true })
        .click();
    }
    await start(page, port, { x: 830, y: 340 }, 45000, "library");
    if (stage === "apres")
      await page.waitForFunction(
        () => {
          const a = JSON.parse(
            document.querySelector("canvas")!.dataset.livingWorld ?? "{}",
          ).actors?.find((a: { id: string }) => a.id === "mira");
          return a?.state === "OBSERVING" && a?.point === "library-reading";
        },
        null,
        { timeout: 45000 },
      );
    else await page.waitForTimeout(34000);
    await page.screenshot({ path: `${out}/${stage}/bibliotheque.png` });
    if (stage === "apres") {
      const a = await page
        .locator("canvas")
        .evaluate((c) => JSON.parse(c.dataset.livingWorld!));
      writeFileSync(
        `${out}/audit-bibliotheque.json`,
        JSON.stringify(a, null, 2),
      );
      await movie(page, `${out}/lecture-celestine.webm`, 5000);
    }
    await start(page, port, { x: 1040, y: 930 }, 135000);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${out}/${stage}/place-nuit.png` });
    await context.close();
  }
  const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    p = await mobile.newPage();
  await p.addInitScript("window.__name=f=>f");
  p.on("pageerror", (e) => errors.push(e.message));
  await start(p, 5182, { x: 1430, y: 670 }, 45000);
  await p.waitForTimeout(18000);
  await p.screenshot({ path: `${out}/mobile-veillees.png` });
  await mobile.close();
  if (errors.length) throw Error(errors.join("\n"));
  writeFileSync(`${out}/erreurs.json`, JSON.stringify(errors));
} finally {
  await browser.close();
}
