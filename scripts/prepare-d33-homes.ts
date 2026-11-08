import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { residentialPlots, humanDoorHeight } from "../src/art/urban-plan";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const assets = [];
try {
  for (const p of residentialPlots) {
    const path = `docs/artwork-${p.key.startsWith("home-") ? "d32" : "d33"}/originals/${p.key}.png`;
    const source = readFileSync(path);
    const r = await page.evaluate(
      async ({ data, door }) => {
        const im = new Image();
        im.src = data;
        await im.decode();
        const c = document.createElement("canvas");
        c.width = im.width;
        c.height = im.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(im, 0, 0);
        const a = ctx.getImageData(0, 0, c.width, c.height).data;
        let l = c.width,
          t = c.height,
          r = 0,
          b = 0,
          z = 0;
        for (let y = 0; y < c.height; y++)
          for (let x = 0; x < c.width; x++) {
            const v = a[(y * c.width + x) * 4 + 3];
            if (!v) z++;
            if (v >= 96) {
              l = Math.min(l, x);
              r = Math.max(r, x);
              t = Math.min(t, y);
              b = Math.max(b, y);
            }
          }
        const corners = [
          a[3],
          a[(c.width - 1) * 4 + 3],
          a[(c.height - 1) * c.width * 4 + 3],
          a[a.length - 1],
        ];
        if (corners.some((x) => x > 1) || z / (c.width * c.height) < 0.05)
          return { invalid: true, corners, zero: z / (c.width * c.height) };
        const w = r - l + 1,
          h = b - t + 1,
          worldHeight = 44 / (door[3] - door[1]),
          out = document.createElement("canvas");
        out.width = Math.round((w / h) * worldHeight * 2) + 4;
        out.height = Math.round(worldHeight * 2) + 4;
        const paint = out.getContext("2d")!;
        paint.imageSmoothingEnabled = false;
        paint.drawImage(c, l, t, w, h, 2, 2, out.width - 4, out.height - 4);
        return {
          png: out.toDataURL().split(",")[1],
          width: out.width,
          height: out.height,
          bounds: { l, t, r, b },
          corners,
          zero: z / (c.width * c.height),
        };
      },
      {
        data: "data:image/png;base64," + source.toString("base64"),
        door: p.door,
      },
    );
    if (!r.png) {
      console.log(p.key, r);
      continue;
    }
    const { png, ...audit } = r;
    const native = Buffer.from(png, "base64"),
      out = `public/assets/village-d33/${p.key}.png`;
    writeFileSync(out, native);
    assets.push({
      key: p.key,
      ...audit,
      doorHeight: humanDoorHeight,
      original: {
        path,
        sha256: createHash("sha256").update(source).digest("hex"),
      },
      public: {
        path: out,
        bytes: native.length,
        sha256: createHash("sha256").update(native).digest("hex"),
      },
    });
    console.log(p.key, r.width, r.height);
  }
} finally {
  await browser.close();
}
writeFileSync("src/art/homes-d33.json", JSON.stringify(assets, null, 2) + "\n");
writeFileSync(
  "docs/graphismes/d33/ASSETS-MAISONS.json",
  JSON.stringify(assets, null, 2) + "\n",
);
