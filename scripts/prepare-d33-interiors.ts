import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const sizes: Record<string, [number, number]> = {
  "oak-floor": [256, 256],
  "rough-floor": [256, 256],
  "wall-panel": [384, 128],
  "winter-window": [160, 120],
  "hearth-salon": [340, 270],
  "reading-corner": [330, 290],
  "artisan-station": [340, 250],
  "tea-banquette": [340, 230],
};
const b = await chromium.launch({ channel: "chrome" }),
  p = await b.newPage(),
  assets = [];
try {
  for (const [key, size] of Object.entries(sizes)) {
    const path = `docs/artwork-d33/originals/${key}.png`;
    if (!existsSync(path)) continue;
    const source = readFileSync(path),
      r = await p.evaluate(
        async ({ data, size, floor }) => {
          const im = new Image();
          im.src = data;
          await im.decode();
          const raw = document.createElement("canvas");
          raw.width = im.width;
          raw.height = im.height;
          const ctx = raw.getContext("2d")!;
          ctx.drawImage(im, 0, 0);
          const a = ctx.getImageData(0, 0, raw.width, raw.height).data;
          let l = raw.width,
            t = raw.height,
            r = 0,
            b = 0,
            zero = 0;
          for (let y = 0; y < raw.height; y++)
            for (let x = 0; x < raw.width; x++) {
              const v = a[(y * raw.width + x) * 4 + 3];
              if (v === 0) zero++;
              if (v >= 96) {
                l = Math.min(l, x);
                r = Math.max(r, x);
                t = Math.min(t, y);
                b = Math.max(b, y);
              }
            }
          const corners = [
            a[3],
            a[(raw.width - 1) * 4 + 3],
            a[(raw.height - 1) * raw.width * 4 + 3],
            a[a.length - 1],
          ];
          if (
            !floor &&
            (corners.some((x) => x > 1) ||
              zero / (raw.width * raw.height) < 0.05)
          )
            throw Error("Opaque cutout");
          if (floor) {
            l = 0;
            t = 0;
            r = raw.width - 1;
            b = raw.height - 1;
          }
          const w = r - l + 1,
            h = b - t + 1,
            scale = Math.min(size[0] / w, size[1] / h),
            out = document.createElement("canvas");
          out.width = Math.round(w * scale) + (floor ? 0 : 4);
          out.height = Math.round(h * scale) + (floor ? 0 : 4);
          const c = out.getContext("2d")!;
          c.imageSmoothingEnabled = false;
          const pad = floor ? 0 : 2;
          c.drawImage(
            raw,
            l,
            t,
            w,
            h,
            pad,
            pad,
            out.width - pad * 2,
            out.height - pad * 2,
          );
          return {
            png: out.toDataURL().split(",")[1],
            width: out.width,
            height: out.height,
            bounds: { l, t, r, b },
            corners,
            transparentFraction: zero / (raw.width * raw.height),
          };
        },
        {
          data: "data:image/png;base64," + source.toString("base64"),
          size,
          floor: key.includes("floor"),
        },
      );
    const { png, ...audit } = r,
      native = Buffer.from(png, "base64"),
      out = `public/assets/village-d33/${key}.png`;
    writeFileSync(out, native);
    assets.push({
      key,
      ...audit,
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
    });
    console.log(key, r.width, r.height);
  }
} finally {
  await b.close();
}
writeFileSync(
  "docs/graphismes/d33/ASSETS-INTERIEURS.json",
  JSON.stringify(assets, null, 2) + "\n",
);
const list = JSON.parse(readFileSync("ops/public-assets.json", "utf8"));
const homes = JSON.parse(readFileSync("src/art/homes-d33.json", "utf8"));
writeFileSync(
  "ops/public-assets.json",
  JSON.stringify(
    [
      ...new Set([
        ...list,
        ...assets.map((a) => a.public.path),
        ...homes.map((a: { public: { path: string } }) => a.public.path),
      ]),
    ],
    null,
    2,
  ) + "\n",
);
