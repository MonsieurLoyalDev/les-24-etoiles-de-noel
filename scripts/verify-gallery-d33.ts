import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const root = "docs/screenshots/phase-d3-3",
  browser = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  }),
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  for (const name of [
    "village-complet-jour",
    ...["house", "library", "workshop", "inn"].map(
      (r) => "desktop-" + r + "-jour",
    ),
    ...["house", "library", "workshop", "inn"].map(
      (r) => "mobile-" + r + "-jour",
    ),
  ]) {
    const images = ["avant", "apres"].map(
      (phase) =>
        "data:image/png;base64," +
        readFileSync(`${root}/${phase}/${name}.png`).toString("base64"),
    );
    const result = await page.evaluate(
      async ({ images, name }) => {
        const c = document.createElement("canvas");
        c.width = 1800;
        c.height = 1100;
        const x = c.getContext("2d")!;
        x.fillStyle = "#192733";
        x.fillRect(0, 0, c.width, c.height);
        x.font = "24px sans-serif";
        x.fillStyle = "#f4d7a3";
        x.fillText("Étoilebois — " + name, 30, 35);
        for (let i = 0; i < images.length; i++) {
          const im = new Image();
          im.src = images[i];
          await im.decode();
          const s = Math.min(860 / im.width, 980 / im.height),
            w = im.width * s,
            h = im.height * s;
          x.imageSmoothingEnabled = true;
          x.drawImage(
            im,
            20 + i * 900 + (860 - w) / 2,
            80 + (980 - h) / 2,
            w,
            h,
          );
          x.font = "22px sans-serif";
          x.fillStyle = "#f3e9d3";
          x.fillText(i ? "D.3.3 — 0.7.3" : "D.3.2 — 0.7.2", 30 + i * 900, 67);
        }
        return c.toDataURL().split(",")[1];
      },
      { images, name },
    );
    writeFileSync(
      `${root}/comparatif-${name}.png`,
      Buffer.from(result, "base64"),
    );
  }
  const results = [];
  for (const file of ["comparatif-d33.html", "ressources-d33.html"]) {
    await page.goto(pathToFileURL(resolve("docs/graphismes/" + file)).href);
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.forEach((im) => ((im as HTMLImageElement).loading = "eager")),
      );
    await page.waitForFunction(() =>
      Array.from(document.images).every(
        (im) => im.complete && im.naturalWidth > 0,
      ),
    );
    const count = await page.locator("img").count();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("video")).every(
        (v) => v.readyState >= 1 && v.duration > 0,
      ),
    );
    const videos = await page
      .locator("video")
      .evaluateAll((vs) =>
        vs.map((v) => ({
          seconds: (v as HTMLVideoElement).duration,
          ready: (v as HTMLVideoElement).readyState,
        })),
      );
    results.push({ file, images: count, broken: 0, videos });
    if (file.startsWith("ressources"))
      await page.screenshot({
        path: `${root}/apres/ressources-clair-sombre.png`,
        fullPage: true,
      });
  }
  writeFileSync(
    "docs/graphismes/d33/GALERIES-VERIFICATION.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(results);
} finally {
  await browser.close();
}
