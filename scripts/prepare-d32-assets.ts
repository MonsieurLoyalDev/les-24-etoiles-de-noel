import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { lifeAssetSizes } from "../src/decor/model";
const originalFolder = "docs/artwork-d32/originals",
  publicFolder = "public/assets/life-d32";
mkdirSync(publicFolder, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
const inventory = [];
try {
  const page = await browser.newPage();
  for (const [key, size] of Object.entries(lifeAssetSizes)) {
    if (process.argv[2] && key !== process.argv[2]) continue;
    const path = `${originalFolder}/${key}.png`;
    if (!existsSync(path)) {
      console.log("Missing", key);
      continue;
    }
    const source = readFileSync(path);
    console.log("Exporting", key);
    const result = await page.evaluate(
      async ({ data, size }) => {
        const image = new Image();
        image.src = data;
        await image.decode();
        const raw = document.createElement("canvas");
        raw.width = image.width;
        raw.height = image.height;
        const context = raw.getContext("2d", { willReadFrequently: true })!;
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, raw.width, raw.height).data;
        const corners = [
          pixels[3],
          pixels[(raw.width - 1) * 4 + 3],
          pixels[(raw.height - 1) * raw.width * 4 + 3],
          pixels[pixels.length - 1],
        ];
        let left = raw.width,
          right = 0,
          top = raw.height,
          bottom = 0,
          zero = 0;
        for (let y = 0; y < raw.height; y++)
          for (let x = 0; x < raw.width; x++) {
            const alpha = pixels[(y * raw.width + x) * 4 + 3];
            if (alpha === 0) zero++;
            if (alpha >= 96) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
          }
        if (
          corners.some((a) => a > 1) ||
          zero / (raw.width * raw.height) < 0.05
        )
          throw Error("Invalid transparent cutout");
        const w = right - left + 1,
          h = bottom - top + 1,
          scale = Math.min(size.width / w, size.maxHeight / h) * 2;
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(w * scale) + 4;
        canvas.height = Math.ceil(h * scale) + 4;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          raw,
          left,
          top,
          w,
          h,
          2,
          2,
          canvas.width - 4,
          canvas.height - 4,
        );
        return {
          png: canvas.toDataURL("image/png").split(",")[1],
          width: canvas.width,
          height: canvas.height,
          rawCorners: corners,
          transparentFraction: zero / (raw.width * raw.height),
          bounds: { left, top, right, bottom },
        };
      },
      { data: "data:image/png;base64," + source.toString("base64"), size },
    );
    const { png, ...audit } = result,
      native = Buffer.from(png, "base64"),
      out = `${publicFolder}/${key}.png`;
    writeFileSync(out, native);
    inventory.push({
      key,
      original: {
        path,
        bytes: source.length,
        sha256: createHash("sha256").update(source).digest("hex"),
      },
      public: {
        path: out,
        bytes: native.length,
        sha256: createHash("sha256").update(native).digest("hex"),
      },
      ...audit,
    });
  }
} finally {
  await browser.close();
}
writeFileSync(
  "docs/graphismes/INVENTAIRE-D32.json",
  JSON.stringify(
    {
      version: "0.7.2",
      method:
        "image_gen originals preserved; alpha bounding crop and nearest-neighbour native export, 2px transparent padding",
      assets: inventory,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    assets: inventory.length,
    bytes: inventory.reduce((n, x) => n + x.public.bytes, 0),
  }),
);
if (
  !process.argv[2] &&
  inventory.length === Object.keys(lifeAssetSizes).length
) {
  const path = "ops/public-assets.json",
    list = JSON.parse(readFileSync(path, "utf8")) as string[];
  writeFileSync(
    path,
    JSON.stringify(
      [
        ...new Set([
          ...list.filter((p) => !p.startsWith("public/assets/life-d32/")),
          ...inventory.map((x) => x.public.path),
        ]),
      ],
      null,
      2,
    ) + "\n",
  );
}
