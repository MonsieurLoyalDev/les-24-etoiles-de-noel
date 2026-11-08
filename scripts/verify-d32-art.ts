import { chromium, expect } from "@playwright/test";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const folder = "docs/screenshots/phase-d3-2/apres";
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  await page.goto(
    pathToFileURL(resolve("docs/graphismes/ressources-d32.html")).href,
  );
  await expect(page.locator("img")).toHaveCount(40);
  // Identical PNG bytes via data URLs allow alpha reads without file-origin canvas restrictions.
  const pngs = Object.fromEntries(
    JSON.parse(
      readFileSync("docs/graphismes/INVENTAIRE-D32.json", "utf8"),
    ).assets.map((a: { key: string; public: { path: string } }) => [
      a.key + ".png",
      "data:image/png;base64," + readFileSync(a.public.path).toString("base64"),
    ]),
  );
  await page.locator("img").evaluateAll(
    (images, pngs) =>
      images.forEach((node) => {
        const image = node as HTMLImageElement;
        image.src =
          pngs[
            decodeURIComponent(new URL(image.src).pathname).split("/").pop()!
          ];
      }),
    pngs,
  );
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (x) => {
        await (x as HTMLImageElement).decode();
      }),
    );
  });
  const alpha = await page.locator(".card .light img").evaluateAll((images) =>
    images.map((node) => {
      const image = node as HTMLImageElement,
        canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);
      const corners = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
      ].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3]);
      return {
        asset: image.alt,
        width: canvas.width,
        height: canvas.height,
        corners,
      };
    }),
  );
  for (const image of alpha) expect(image.corners).toEqual([0, 0, 0, 0]);
  await page.screenshot({
    path: `${folder}/ressources-planche-complete.png`,
    fullPage: true,
  });
  for (let i = 0; i < 20; i += 4) {
    const y = await page
      .locator(".card")
      .nth(i)
      .evaluate((x) => x.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => window.scrollTo(0, y - 12), y);
    await page.screenshot({ path: `${folder}/ressources-${i / 4 + 1}.png` });
  }
  const html = readFileSync("docs/graphismes/comparatif-d32.html", "utf8"),
    paths = [...html.matchAll(/src="([^"]+)"/g)].map((x) =>
      resolve("docs/graphismes", x[1]),
    );
  for (const path of paths)
    if (!existsSync(path)) throw Error("Missing comparison artifact: " + path);
  await page.goto(
    pathToFileURL(resolve("docs/graphismes/comparatif-d32.html")).href,
  );
  const videos = await page.locator("video").evaluateAll(async (nodes) =>
    Promise.all(
      nodes.map(
        (node) =>
          new Promise<{ duration: number; width: number; height: number }>(
            (resolve, reject) => {
              const v = node as HTMLVideoElement;
              if (v.readyState >= 1)
                resolve({
                  duration: v.duration,
                  width: v.videoWidth,
                  height: v.videoHeight,
                });
              else {
                v.addEventListener(
                  "loadedmetadata",
                  () =>
                    resolve({
                      duration: v.duration,
                      width: v.videoWidth,
                      height: v.videoHeight,
                    }),
                  { once: true },
                );
                v.addEventListener(
                  "error",
                  () => reject(Error("Video failed")),
                  { once: true },
                );
                v.load();
              }
            },
          ),
      ),
    ),
  );
  for (const video of videos) {
    expect(video.duration).toBeGreaterThan(5);
    expect(video.width).toBeGreaterThan(300);
  }
  writeFileSync(
    "docs/graphismes/D32-CONTROLE-RESSOURCES.json",
    JSON.stringify(
      {
        nativeSprites: alpha.length,
        transparentCornersVerified: true,
        comparisonFiles: paths.length,
        allComparisonFilesPresent: true,
        alpha,
        videos,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      sprites: alpha.length,
      comparisonFiles: paths.length,
      videos,
    }),
  );
} finally {
  await browser.close();
}
