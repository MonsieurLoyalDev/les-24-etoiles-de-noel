import { chromium, type Page } from "@playwright/test";
import { initial } from "../src/domain";
import { mkdirSync, writeFileSync } from "node:fs";
import { navigateTo } from "../tests/e2e/pathfinding";
const out = "docs/screenshots/phase-d4-2";
mkdirSync(out, { recursive: true });
async function record(p: Page, name: string, ms: number) {
  const data = await p.locator("canvas").evaluate(async (el, ms) => {
    const canvas = el as HTMLCanvasElement,
      stream = canvas.captureStream(12),
      rec = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
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
    const b = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let s = "";
    for (const v of b) s += String.fromCharCode(v);
    return btoa(s);
  }, ms);
  writeFileSync(out + "/" + name + ".webm", Buffer.from(data, "base64"));
}
const b = await chromium.launch({ channel: "chrome" }),
  page = await b.newPage({ viewport: { width: 1440, height: 1100 } }),
  errors: string[] = [];
try {
  await page.addInitScript("window.__name=f=>f");
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5183");
  await page.evaluate(
    async (s) => {
      await new Promise<void>((ok) => {
        const r = indexedDB.open("etoilebois", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("saves");
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
      room: "library",
      position: { x: 830, y: 340 },
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.waitForFunction(
    () =>
      JSON.parse(
        document.querySelector("canvas")?.dataset.activities ?? "[]",
      ).some(
        (a: { actor: string; clip: string; phase: string }) =>
          a.actor === "mira" && a.clip === "read" && a.phase === "aligning",
      ),
    null,
    { timeout: 50000 },
  );
  await record(page, "prototype-lecture", 4800);
  await page.screenshot({ path: out + "/prototype-lecture.png" });
  await navigateTo(page, { x: 760, y: 324 });
  await page.getByRole("button", { name: /Parler à Célestine/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out + "/prototype-dialogue.png" });
  const stopped = await page
    .locator("canvas")
    .getAttribute("data-living-world");
  await page.waitForTimeout(700);
  if (
    stopped !== (await page.locator("canvas").getAttribute("data-living-world"))
  )
    throw Error("Routine non suspendue");
  await page.getByRole("button", { name: "À bientôt", exact: true }).click();
  await navigateTo(page, { x: 830, y: 340 });
  await record(page, "prototype-reprise", 3000);
  if (errors.length) throw Error(errors.join("\n"));
  writeFileSync(
    out + "/prototype-resultat.json",
    JSON.stringify(
      {
        errors,
        dialogueFrozen: true,
        resumed: JSON.parse(
          (await page.locator("canvas").getAttribute("data-activities")) ??
            "[]",
        ),
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
