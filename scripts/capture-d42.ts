import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  startActivityGame,
  waitClip,
  activity,
} from "../tests/e2e/activity-support";
import { recordCanvas, recordDOM } from "./record-d42";
import { navigateTo } from "../tests/e2e/pathfinding";
import type { Save } from "../src/domain";
const out = "docs/screenshots/phase-d4-2";
mkdirSync(out, { recursive: true });
const cases: {
  name: string;
  actor: string;
  clip: string;
  room: Save["room"];
  clock: number;
  position: { x: number; y: number };
  ms: number;
}[] = [
  {
    name: "lecture",
    actor: "mira",
    clip: "read",
    room: "library",
    clock: 45000,
    position: { x: 830, y: 340 },
    ms: 8600,
  },
  {
    name: "rangement",
    actor: "mira",
    clip: "sort",
    room: "library",
    clock: 0,
    position: { x: 650, y: 250 },
    ms: 7000,
  },
  {
    name: "fauteuil",
    actor: "mira",
    clip: "seatRead",
    room: "library",
    clock: 90000,
    position: { x: 830, y: 370 },
    ms: 10000,
  },
  {
    name: "distribution",
    actor: "emile",
    clip: "delivery",
    room: "village",
    clock: 45000,
    position: { x: 1430, y: 670 },
    ms: 7200,
  },
  {
    name: "allumage",
    actor: "noe",
    clip: "light",
    room: "village",
    clock: 90000,
    position: { x: 1120, y: 900 },
    ms: 6800,
  },
  {
    name: "extinction",
    actor: "noe",
    clip: "extinguish",
    room: "village",
    clock: 0,
    position: { x: 920, y: 800 },
    ms: 6000,
  },
  {
    name: "rechauffer",
    actor: "noe",
    clip: "warm",
    room: "village",
    clock: 135000,
    position: { x: 1120, y: 900 },
    ms: 4500,
  },
];
const only = process.argv
  .find((a) => a.startsWith("--only="))
  ?.slice(7)
  .split(",");
const browser = await chromium.launch({ channel: "chrome" }),
  errors: string[] = [];
try {
  for (const c of cases.filter((c) => !only || only.includes(c.name))) {
    const context = await browser.newContext({
        baseURL: "http://127.0.0.1:5185",
        viewport: { width: 1280, height: 900 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await startActivityGame(page, c.room, c.clock, c.position);
    await waitClip(page, c.actor, c.clip);
    const movie = recordCanvas(page, out + "/" + c.name + ".webm", c.ms);
    await page.waitForTimeout(2700);
    await page.screenshot({ path: out + "/" + c.name + ".png" });
    await movie;
    console.log(c.name, "capturé");
    await context.close();
  }
  if (!only || only.includes("dialogue")) {
    const context = await browser.newContext({
        baseURL: "http://127.0.0.1:5185",
        viewport: { width: 1280, height: 900 },
      }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await startActivityGame(page, "library", 45000, { x: 830, y: 340 });
    await waitClip(page, "mira", "read");
    await page.waitForTimeout(1200);
    const frames = await recordDOM(
      page,
      out + "/dialogue-reprise.webm",
      7500,
      async () => {
        await page.waitForTimeout(600);
        await navigateTo(page, { x: 760, y: 324 });
        await page.getByRole("button", { name: /Parler à Célestine/ }).click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: out + "/dialogue.png" });
        await page.waitForTimeout(600);
        await page
          .getByRole("button", { name: "À bientôt", exact: true })
          .click();
        await navigateTo(page, { x: 830, y: 340 });
        console.log("reprise", await activity(page, "mira"));
      },
    );
    writeFileSync(
      out + "/dialogue-video.json",
      JSON.stringify({
        frames,
        source:
          "Captures successives du vrai jeu et de son dialogue React, encodées en WebM.",
      }),
    );
    await context.close();
  }
  if (!only || only.includes("exterieur")) {
    const context = await browser.newContext({
        baseURL: "http://127.0.0.1:5185",
        viewport: { width: 1280, height: 900 },
      }),
      page = await context.newPage();
    await startActivityGame(page, "village", 45000, { x: 970, y: 800 });
    await recordCanvas(page, out + "/habitants-exterieur.webm", 7000);
    await page.screenshot({ path: out + "/habitants-exterieur.png" });
    await context.close();
  }
  if (errors.length) throw Error(errors.join("\n"));
  writeFileSync(out + "/erreurs.json", JSON.stringify(errors));
} finally {
  await browser.close();
}
