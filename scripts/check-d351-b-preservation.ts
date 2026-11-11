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
      const canvas = document.querySelector("canvas")!;
      const data = (window as unknown as { __terrain: Uint8Array }).__terrain;
      const bytes = [];
      for (let y = 0; y < 1408; y++)
        for (let x = 0; x < 1920; x++)
          if (
            (x >= 170 && x <= 860 && y >= 690 && y <= 1280) ||
            (x >= 715 && x <= 1160 && y >= 635 && y <= 945) ||
            (x >= 1080 && x <= 1160 && y >= 945 && y <= 1050)
          ) {
            const i = (y * 1920 + x) * 4;
            bytes.push(data[i], data[i + 1], data[i + 2], data[i + 3]);
          }
      return {
        protectedTerrainHash: [
          ...new Uint8Array(
            await crypto.subtle.digest("SHA-256", new Uint8Array(bytes)),
          ),
        ]
          .map((v) => v.toString(16).padStart(2, "0"))
          .join(""),
        witness: JSON.parse(canvas.dataset.witness351!),
        scenery: JSON.parse(canvas.dataset.scenery34!),
      };
    });
    results.push({ port, ...a });
    await page.close();
  }
  writeFileSync(
    "docs/graphismes/d351-b/PRESERVATION.json",
    JSON.stringify(
      results.map((r) => ({
        port: r.port,
        protectedTerrainHash: r.protectedTerrainHash,
        witness: r.witness,
      })),
      null,
      2,
    ),
  );
  writeFileSync(
    "tests/fixtures/scenery-a2.json",
    JSON.stringify({ scenery: results[0].scenery }, null, 2),
  );
  if (
    results[0].protectedTerrainHash !== results[1].protectedTerrainHash ||
    JSON.stringify(results[0].witness) !== JSON.stringify(results[1].witness)
  )
    throw Error("A2 preservation failed");
  console.log(
    "A2 terrain pixels and witness data identical",
    results[0].protectedTerrainHash,
  );
} finally {
  await browser.close();
}
