import { chromium } from "@playwright/test";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import {
  furnitureByRoom,
  furnitureSlots,
  interiorDecorSizes,
} from "../src/art/interior-layout";
const folder = "public/assets/interiors-d31",
  originals = "docs/artwork-d31/originals";
mkdirSync(originals, { recursive: true });
const sizes: Record<string, { width: number; maxHeight: number }> = {
  ...interiorDecorSizes,
};
for (const names of Object.values(furnitureByRoom))
  names.forEach((name, i) => {
    sizes[name] = furnitureSlots[i];
  });
const keys = [
  "snow-powder",
  "snow-soft",
  ...["house", "library", "workshop", "inn"].map((r) => r + "-shell"),
  ...Object.keys(sizes),
];
const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const dimensions = (bytes: Buffer) => ({
  width: bytes.readUInt32BE(16),
  height: bytes.readUInt32BE(20),
});
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
const assets = [];
try {
  const page = await browser.newPage();
  for (const key of keys) {
    const originalPath = `${originals}/${key}.png`,
      publicPath = `${folder}/${key}.png`;
    if (!existsSync(originalPath)) copyFileSync(publicPath, originalPath);
    const bytes = readFileSync(originalPath),
      mode = key.startsWith("snow-")
        ? "snow"
        : key.endsWith("-shell")
          ? "architecture"
          : "cutout";
    const result = await page.evaluate(
      async ({ data, mode, size }) => {
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
        let zero = 0,
          left = raw.width,
          right = -1,
          top = raw.height,
          bottom = -1;
        for (let y = 0; y < raw.height; y++)
          for (let x = 0; x < raw.width; x++) {
            const a = pixels[(y * raw.width + x) * 4 + 3];
            if (a === 0) zero++;
            if (a >= 96) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
          }
        const canvas = document.createElement("canvas");
        if (mode === "cutout") {
          if (
            corners.some((a) => a > 1) ||
            zero / (raw.width * raw.height) < 0.05
          )
            throw Error("Transparent cutout required");
          const width = right - left + 1,
            height = bottom - top + 1,
            scale = Math.min(size!.width / width, size!.maxHeight / height) * 2;
          canvas.width = Math.ceil(width * scale) + 4;
          canvas.height = Math.ceil(height * scale) + 4;
          const ctx = canvas.getContext("2d")!;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            raw,
            left,
            top,
            width,
            height,
            2,
            2,
            canvas.width - 4,
            canvas.height - 4,
          );
        } else {
          canvas.width = mode === "snow" ? 512 : 480;
          canvas.height = mode === "snow" ? 512 : 352;
          const ctx = canvas.getContext("2d")!;
          ctx.imageSmoothingEnabled = false;
          const scale = Math.max(
            canvas.width / raw.width,
            canvas.height / raw.height,
          );
          ctx.drawImage(
            raw,
            (canvas.width - raw.width * scale) / 2,
            (canvas.height - raw.height * scale) / 2,
            raw.width * scale,
            raw.height * scale,
          );
        }
        const ctx = canvas.getContext("2d")!,
          w = canvas.width,
          h = canvas.height;
        const renderCorners = [
          [0, 0],
          [w - 1, 0],
          [0, h - 1],
          [w - 1, h - 1],
        ].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3]);
        return {
          png: canvas.toDataURL("image/png").split(",")[1],
          rawCorners: corners,
          rawTransparentFraction: zero / (raw.width * raw.height),
          renderCorners,
          contentBounds: { left, top, right, bottom },
        };
      },
      {
        data: "data:image/png;base64," + bytes.toString("base64"),
        mode,
        size: sizes[key],
      },
    );
    const native = Buffer.from(result.png, "base64");
    writeFileSync(publicPath, native);
    const { png: _, ...alpha } = result;
    void _;
    assets.push({
      key,
      mode,
      original: {
        path: originalPath,
        bytes: bytes.length,
        sha256: hash(bytes),
        ...dimensions(bytes),
      },
      public: {
        path: publicPath,
        bytes: native.length,
        sha256: hash(native),
        ...dimensions(native),
      },
      ...alpha,
    });
  }
} finally {
  await browser.close();
}
const originalBytes = assets.reduce((n, a) => n + a.original.bytes, 0),
  publicBytes = assets.reduce((n, a) => n + a.public.bytes, 0);
writeFileSync(
  "docs/graphismes/INVENTAIRE-D31.json",
  JSON.stringify(
    {
      version: "0.7.1",
      base: "186367cfb396aa52bf30d2e15bcbc40ff8751c47",
      method:
        "Original image_gen PNGs unchanged; nearest-neighbour native texture export, alpha crop and transparent 2 px padding. No new drawing in the export.",
      originalBytes,
      publicBytes,
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    assets: assets.length,
    originalBytes,
    publicBytes,
    reductionPercent: Math.round((1 - publicBytes / originalBytes) * 1000) / 10,
  }),
);
