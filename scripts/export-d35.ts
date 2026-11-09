/* eslint-disable @typescript-eslint/no-explicit-any -- Authoring-only texture manager adapter for pixel-exact atlas export. */
import { chromium } from "@playwright/test";
import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const browser = await chromium.launch({ channel: "chrome" }),
  page = await browser.newPage();
try {
  await page.addInitScript("window.__name=(fn)=>fn");
  await page.goto("http://127.0.0.1:5180/");
  const result = await page.evaluate(async () => {
    const mod = await import("/scripts/prepare-atlas-d35.ts");
    const textures = new Map<string, any>();
    for (const file of [
      "benches",
      "gifts",
      "firewood",
      "accessories",
      "fences",
      "paths",
    ]) {
      const im = new Image();
      im.src = "/docs/graphismes/d35/native/" + file + ".png";
      await im.decode();
      textures.set("source-d35-" + file, { getSourceImage: () => im });
    }
    const dataset: Record<string, string> = {};
    const scene: any = {
      game: { canvas: { dataset } },
      textures: {
        exists: (k: string) => textures.has(k),
        get: (k: string) => textures.get(k),
        createCanvas: (k: string, w: number, h: number) => {
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const t = {
            width: w,
            height: h,
            context: canvas.getContext("2d")!,
            getSourceImage: () => canvas,
            refresh: () => {},
          };
          textures.set(k, t);
          return t;
        },
      },
    };
    mod.prepareEnvironment35(scene);
    const audit = JSON.parse(dataset.assets35);
    const atlas = document.createElement("canvas");
    atlas.width = atlas.height = 1820;
    const ac = atlas.getContext("2d")!;
    ac.imageSmoothingEnabled = false;
    const frames: any[] = [];
    for (const [i, row] of audit.entries()) {
      const t = textures.get("d35-" + row.name);
      const x = (i % 7) * 260,
        y = Math.floor(i / 7) * 260;
      ac.drawImage(t.getSourceImage(), x, y);
      const rgba = t.context.getImageData(0, 0, t.width, t.height).data;
      const hash = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", rgba)),
      ]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("");
      frames.push({
        ...row,
        frame: { x, y, w: t.width, h: t.height },
        pixelSha256: hash,
      });
    }
    const tiles = document.createElement("canvas");
    tiles.width = tiles.height = 224;
    const tc = tiles.getContext("2d")!;
    tc.imageSmoothingEnabled = false;
    const source = textures.get("source-d35-paths").getSourceImage();
    const materials = [];
    for (const [i, size] of [96, 112, 100, 112].entries()) {
      const x = (i % 2) * 112,
        y = Math.floor(i / 2) * 112;
      tc.drawImage(
        source,
        ((i % 2) * source.width) / 2,
        (Math.floor(i / 2) * source.height) / 2,
        source.width / 2,
        source.height / 2,
        x,
        y,
        size,
        size,
      );
      materials.push({ x, y, size });
    }
    return {
      sprite: atlas.toDataURL().split(",")[1],
      paths: tiles.toDataURL().split(",")[1],
      frames,
      materials,
    };
  });
  writeFileSync(
    "public/assets/environment-d35/sprites.png",
    Buffer.from(result.sprite, "base64"),
  );
  writeFileSync(
    "public/assets/environment-d35/path-materials.png",
    Buffer.from(result.paths, "base64"),
  );
  const originals = Object.fromEntries(
    ["benches", "gifts", "firewood", "accessories", "fences", "paths"].map(
      (name) => {
        const b = readFileSync("docs/graphismes/d35/native/" + name + ".png");
        return [
          name,
          {
            bytes: b.length,
            sha256: createHash("sha256").update(b).digest("hex"),
          },
        ];
      },
    ),
  );
  writeFileSync(
    "src/art/environment-d35.json",
    JSON.stringify(
      {
        version: "D.3.5",
        frames: result.frames,
        materials: result.materials,
        originals,
        note: "Pixels exportés à l’identique du préparateur de textures du jeu ; aucune quantification de couleur ni recompression avec perte.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(result.frames.filter((f: any) => f.name.startsWith("bench")));
  console.log("Atlas:", result.frames.length);
} finally {
  await browser.close();
}
