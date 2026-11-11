import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({ channel: "chrome" }),
  results = [];
try {
  for (const port of [5181, 5182]) {
    const page = await browser.newPage();
    await page.addInitScript(
      `window.__name=(f)=>f;const original=CanvasRenderingContext2D.prototype.putImageData;CanvasRenderingContext2D.prototype.putImageData=function(data,...args){if(data.width===1920&&data.height===1408)window.__terrain=new Uint8Array(data.data);return original.call(this,data,...args)}`,
    );
    await page.goto(`http://127.0.0.1:${port}`);
    await page.getByRole("button", { name: /Entrer dans le village/ }).click();
    await page.locator('canvas[data-room="village"]').waitFor();
    const a = await page.evaluate(async () => {
      const canvas = document.querySelector("canvas")!,
        data = (window as unknown as { __terrain: Uint8Array }).__terrain,
        bytes = new Uint8Array(data.length);
      let n = 0;
      for (let y = 0; y < 1408; y++)
        for (let x = 0; x < 1920; x++)
          if (!(
            (x >= 1390 && x <= 1435 && y >= 500 && y <= 572) ||
            (x >= 1480 && x <= 1590 && y >= 378 && y <= 418)
          )) {
            const i = (y * 1920 + x) * 4;
            for (let c = 0; c < 4; c++) bytes[n++] = data[i + c];
          }
      return {
        protectedTerrainHash: [
          ...new Uint8Array(
            await crypto.subtle.digest("SHA-256", bytes.subarray(0, n)),
          ),
        ]
          .map((v) => v.toString(16).padStart(2, "0"))
          .join(""),
        protectedBytes: n,
        witness: JSON.parse(canvas.dataset.witness351!),
        scenery: JSON.parse(canvas.dataset.scenery34!),
        quarters: JSON.parse(canvas.dataset.quarters351b!),
      };
    });
    results.push({ port, ...a });
    await page.close();
  }
  const unchanged = (r: (typeof results)[number]) =>
    r.scenery.placed.filter((p: { quarter: string }) => p.quarter !== "Q2");
  if (
    results[0].protectedTerrainHash !== results[1].protectedTerrainHash ||
    JSON.stringify(unchanged(results[0])) !==
      JSON.stringify(unchanged(results[1])) ||
    JSON.stringify(results[0].witness) !== JSON.stringify(results[1].witness)
  )
    throw Error("Protected B region changed");
  writeFileSync(
    "tests/fixtures/scenery-b.json",
    JSON.stringify(
      { scenery: results[0].scenery, quarters: results[0].quarters },
      null,
      2,
    ),
  );
  writeFileSync(
    "docs/graphismes/d351-c/PRESERVATION.json",
    JSON.stringify(
      {
        baseline: "B de9b507",
        protectedTerrainHash: results[0].protectedTerrainHash,
        protectedBytes: results[0].protectedBytes,
        unchangedOutsideQ2: unchanged(results[0]).length,
        witnessUnchanged: true,
        before: results[0].quarters.accepted,
        after: results[1].quarters.accepted,
      },
      null,
      2,
    ),
  );
  console.log(
    "B protected terrain and all non-Q2 placements identical",
    results[0].protectedTerrainHash,
  );
} finally {
  await browser.close();
}
