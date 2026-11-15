import { chromium } from "@playwright/test";
import {
  startActivityGame,
  waitClip,
  activity,
} from "../tests/e2e/activity-support";
import { recordDOM } from "./record-d42";
import { navigateTo } from "../tests/e2e/pathfinding";
const b = await chromium.launch({ channel: "chrome" }),
  ctx = await b.newContext({
    baseURL: "http://127.0.0.1:5185",
    viewport: { width: 1280, height: 900 },
  }),
  p = await ctx.newPage();
try {
  await startActivityGame(p, "library", 90000, { x: 830, y: 370 });
  await waitClip(p, "mira", "seatRead");
  await p.waitForTimeout(1600);
  await recordDOM(
    p,
    "docs/screenshots/phase-d4-2/fauteuil-dialogue.webm",
    6500,
    async () => {
      await p.waitForTimeout(400);
      await navigateTo(p, { x: 886, y: 326 });
      await p.getByRole("button", { name: /Parler à Célestine/ }).click();
      await p.waitForTimeout(400);
      await p.screenshot({
        path: "docs/screenshots/phase-d4-2/fauteuil-dialogue.png",
      });
      await p.waitForTimeout(500);
      await p.getByRole("button", { name: "À bientôt", exact: true }).click();
      await navigateTo(p, { x: 830, y: 370 });
      console.log(await activity(p, "mira"));
    },
  );
} finally {
  await b.close();
}
