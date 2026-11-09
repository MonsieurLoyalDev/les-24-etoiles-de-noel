import { chromium, type Page } from "@playwright/test";
import { initial, type Save } from "../src/domain";
import metadata from "../src/art/environment-d35.json";
import { mkdirSync, writeFileSync } from "node:fs";
const dir = "docs/screenshots/phase-d3-5";
const browser = await chromium.launch({ channel: "chrome" });
const errors: string[] = [];
async function seed(
  page: Page,
  url: string,
  x: number,
  y: number,
  clock = 45000,
) {
  await page.goto(url);
  await page.evaluate(
    async (save: Save) => {
      await new Promise<void>((resolve, reject) => {
        const r = indexedDB.open("etoilebois", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("saves");
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
          const t = r.result.transaction("saves", "readwrite");
          t.objectStore("saves").put(save, "phase-b");
          t.oncomplete = () => {
            r.result.close();
            resolve();
          };
        };
      });
    },
    {
      ...structuredClone(initial),
      stage: 4 as const,
      stars: [1, 3, 18],
      position: { x, y },
      clock,
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.locator('canvas[data-room="village"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(850);
}
try {
  for (const [stage, port] of [
    ["avant", 5181],
    ["apres", 5182],
  ] as const) {
    if (process.argv.includes("--after") && stage === "avant") continue;
    mkdirSync(dir + "/" + stage, { recursive: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(stage + ":" + e.message));
    const shots: [string, number, number][] = [
      ["chemin-principal", 980, 1130],
      ["carrefour", 1080, 860],
      ["place-centrale", 960, 790],
      ["cloture-J1", 310, 660],
      ["cloture-J2", 1755, 427.5],
      ["cloture-J3", 442.5, 1135],
      ["cloture-J4", 1845, 957.5],
      ["cloture-JL", 605, 725],
      ["bancs-cour", 420, 420],
      ["cadeaux-bois", 1340, 1000],
      ["coin-bibliotheque", 800, 710],
      ["coin-auberge", 1210, 640],
    ];
    for (const [name, x, y] of shots) {
      const selected = process.argv
        .find((a) => a.startsWith("--name="))
        ?.slice(7);
      if (selected && name !== selected) continue;
      if (process.argv.includes("--auberge") && name !== "coin-auberge")
        continue;
      await seed(page, "http://127.0.0.1:" + port + "/", x, y);
      await page.screenshot({ path: dir + "/" + stage + "/" + name + ".png" });
      console.log(stage, name);
    }
    await context.close();
  }
  const p = await browser.newPage();
  await p.addInitScript("window.__name=(fn)=>fn");
  await p.goto("http://127.0.0.1:5182/");
  const contacts = await p.evaluate(async (meta) => {
    const image = new Image();
    image.src = "/assets/environment-d35/sprites.png";
    await image.decode();
    const materials = new Image();
    materials.src = "/assets/environment-d35/path-materials.png";
    await materials.decode();
    const groups = [
      ["bancs", "Bancs deux places", "bench-", 4],
      ["cadeaux", "Cadeaux de Noël", "gift-", 3],
      ["bois", "Stocks de bois", "wood-", 3],
      ["accessoires", "Objets de vie quotidienne", "prop-", 3],
      ["clotures", "Quatre familles de clôtures", "fence-", 4],
    ] as const;
    const result: Record<string, string> = {};
    for (const [file, title, prefix, cols] of groups) {
      const rows = meta.frames.filter((f) => f.name.startsWith(prefix)),
        c = document.createElement("canvas");
      c.width = cols * 256;
      c.height = Math.ceil(rows.length / cols) * 180 + 76;
      const x = c.getContext("2d")!;
      x.imageSmoothingEnabled = false;
      x.fillStyle = "#e3eaf0";
      x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = "#263c46";
      x.font = "bold 23px sans-serif";
      x.fillText(title, 18, 30);
      x.font = "14px sans-serif";
      x.fillText(
        "Rendu à l’échelle du jeu (zoom ×2) · pas de nouvelle interaction",
        18,
        54,
      );
      for (const [i, f] of rows.entries()) {
        let width = f.name.startsWith("bench-")
          ? 80
          : f.name === "prop-bare-tree"
            ? 55
            : f.name === "prop-table"
              ? 34
              : f.name.includes("lantern")
                ? 18
                : f.name.startsWith("gift-")
                  ? 32
                  : f.name.startsWith("wood-")
                    ? 34
                    : 30;
        let height = (width * f.frame.h) / f.frame.w;
        if (f.name.startsWith("fence-")) {
          if (f.name.endsWith("post")) {
            height = 25;
            width = (height * f.frame.w) / f.frame.h;
          } else if (f.name.endsWith("side")) {
            height = 40;
            width = (height * f.frame.w) / f.frame.h;
          } else if (f.name.endsWith("gate")) {
            height = 23;
            width = (height * f.frame.w) / f.frame.h;
          } else {
            width = 36;
            height = (width * f.frame.h) / f.frame.w;
          }
        }
        const col = i % cols,
          row = Math.floor(i / cols),
          cx = col * 256,
          cy = row * 180 + 76;
        x.fillStyle = (col + row) % 2 ? "#d9e3e9" : "#edf1f4";
        x.fillRect(cx + 5, cy + 3, 246, 170);
        x.drawImage(
          image,
          f.frame.x,
          f.frame.y,
          f.frame.w,
          f.frame.h,
          cx + (256 - width * 2) / 2,
          cy + 128 - height * 2,
          width * 2,
          height * 2,
        );
        x.fillStyle = "#31454e";
        x.font = "14px sans-serif";
        x.fillText(f.name, cx + 12, cy + 155);
        if (f.name.startsWith("bench-")) {
          x.font = "12px sans-serif";
          x.fillText("80 px · 2 emplacements prévus", cx + 12, cy + 171);
        }
      }
      result[file] = c.toDataURL().split(",")[1];
    }
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 335;
    const x = c.getContext("2d")!;
    x.imageSmoothingEnabled = false;
    x.fillStyle = "#e3eaf0";
    x.fillRect(0, 0, 1024, 335);
    x.fillStyle = "#263c46";
    x.font = "bold 23px sans-serif";
    x.fillText("Matières des chemins — échelle du jeu ×2", 18, 32);
    for (const [i, t] of meta.materials.entries()) {
      x.drawImage(
        materials,
        t.x,
        t.y,
        t.size,
        t.size,
        i * 256 + 16,
        62,
        t.size * 2,
        t.size * 2,
      );
      x.font = "14px sans-serif";
      x.fillText(
        [
          "Pavés anciens",
          "Terre tassée",
          "Dalles et traces",
          "Pierres de cour",
        ][i],
        i * 256 + 16,
        315,
      );
    }
    result.sols = c.toDataURL().split(",")[1];
    return result;
  }, metadata);
  for (const [name, data] of Object.entries(contacts))
    writeFileSync(
      dir + "/apres/atlas-" + name + ".png",
      Buffer.from(data, "base64"),
    );
  if (errors.length) throw Error(errors.join("\n"));
  writeFileSync(
    "docs/graphismes/d35/CAPTURES.json",
    JSON.stringify(
      {
        before:
          "D.3.4 SOURCE-LIGHT vérifié, servi localement sans modification",
        after: "D.3.5 / 0.7.5",
        sameSeed: true,
        clock: 45000,
        viewport: [1280, 900],
        errors,
        contactSheets: Object.keys(contacts),
      },
      null,
      2,
    ),
  );
  console.log("Comparatifs et galeries prêts");
} finally {
  await browser.close();
}
