import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { technicalEpisode } from "../fixtures/narrative";
import { navigateTo as navigateOnce } from "../e2e/pathfinding";
import type { Page } from "@playwright/test";
import type { Point } from "../../src/domain";
async function navigateTo(page: Page, target: Point) {
  try {
    await navigateOnce(page, target);
  } catch (error) {
    if (!String(error).includes("Navigation bloquée")) throw error;
    // Recompute from the measured fractional position after a corner approach.
    // This still uses actual keys/colliders and never moves the player directly.
    await navigateOnce(page, target);
  }
}
import { plan, anchors } from "../../src/art/village34";

test("atelier : sept scènes, choix, indices, étoile unique et reprise", async ({
  page,
}, info) => {
  async function capture(name: string) {
    if (!process.env.ETB_NARRATIVE_CAPTURE_DIR) return;
    await page.evaluate(async () => {
      await Promise.all(
        document.getAnimations().map((a) => a.finished.catch(() => undefined)),
      );
    });
    mkdirSync(process.env.ETB_NARRATIVE_CAPTURE_DIR, { recursive: true });
    await page.screenshot({
      path: join(
        process.env.ETB_NARRATIVE_CAPTURE_DIR,
        `${info.project.name}-${name}.png`,
      ),
    });
  }
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript("window.__name=f=>f");
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.getByRole("button", { name: "✦ Avent 2026", exact: true }).click();
  await page
    .getByRole("button", { name: "Aventure narrative", exact: true })
    .click();
  const raw = process.env.ETB_EPISODE_SOURCE
    ? readFileSync(process.env.ETB_EPISODE_SOURCE)
    : Buffer.from(JSON.stringify(technicalEpisode()));
  await page.getByLabel("Importer un cahier narratif").setInputFiles({
    name: "episode-source.json",
    mimeType: "application/json",
    buffer: raw,
  });
  await expect(
    page.getByRole("button", { name: "Commencer l’épisode 1", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Commencer l’épisode 1", exact: true })
    .click();
  const state = () =>
    page
      .locator("canvas")
      .evaluate((c) => JSON.parse(c.dataset.narrative ?? "null"));
  await expect
    .poll(async () => (await state())?.sceneIndex, { timeout: 10000 })
    .toBe(0);
  await navigateTo(page, (await state()).actors.entry);
  await expect
    .poll(
      async () =>
        (await state()).targets.some(
          (t: { id: string }) => t.id === "narrative:welcome",
        ),
      { timeout: 40000 },
    )
    .toBe(true);
  const target = (await state()).targets.find(
    (t: { id: string }) => t.id === "narrative:welcome",
  );
  await navigateTo(page, target);
  await page.keyboard.press("e");
  await expect(
    page.getByRole("dialog", { name: "Dialogue", exact: true }),
  ).toBeVisible();
  const script = JSON.parse(raw.toString("utf8"));
  const welcome = script.scenes[0].dialogues.welcome;
  for (const beat of welcome) {
    await expect(page.locator(".dialogue-content p")).toHaveText(beat.text);
    if (beat.choiceId)
      await page
        .getByRole("button", {
          name: script.scenes[0].choices[0].options[1].label,
          exact: true,
        })
        .click();
    else await page.getByRole("button", { name: /Continuer/ }).click();
  }
  await expect.poll(async () => (await state()).sceneIndex).toBe(1);
  await expect.poll(async () => (await state()).saving).toBe(false);
  const before = await state();
  expect(Object.values(before.choices)).toContain(
    script.scenes[0].choices[0].options[1].id,
  );
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect
    .poll(async () => (await state())?.sceneIndex, { timeout: 30000 })
    .toBe(1);
  expect((await state()).choices).toEqual(before.choices);
  async function dialogue(block: string) {
    console.log("Séquence testée : " + block);
    const s = await state();
    const beats = script.scenes[s.sceneIndex].dialogues[block];
    for (const [index, beat] of beats.entries()) {
      await expect(page.locator(".dialogue-content p")).toHaveText(beat.text);
      await expect(page.locator(".narrative-tracker")).toBeHidden();
      if (index === 0) await capture(block);
      if (beat.choiceId) {
        const choice = script.scenes[s.sceneIndex].choices.find(
          (c: { id: string }) => c.id === beat.choiceId,
        );
        await page
          .getByRole("button", { name: choice.options[0].label, exact: true })
          .click();
      } else await page.getByRole("button", { name: /Continuer/ }).click();
    }
    await expect(
      page.getByRole("dialog", { name: "Dialogue", exact: true }),
    ).toHaveCount(0);
  }
  async function resident(id: string) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const p = await page
        .locator("canvas")
        .evaluate(
          (c, id) =>
            JSON.parse(c.dataset.npcs!).find(
              (n: { id: string }) => n.id === id,
            ),
          id,
        );
      expect(p).toBeTruthy();
      await navigateTo(page, { x: p.x, y: p.y + 24 });
      const d = await page.locator("canvas").evaluate((c, id) => {
        const n = JSON.parse(c.dataset.npcs!).find(
          (n: { id: string }) => n.id === id,
        );
        return Math.hypot(
          n.x - Number(c.dataset.playerX),
          n.y - Number(c.dataset.playerY),
        );
      }, id);
      if (d < 39) break;
    }
    await page.keyboard.press("e");
    await expect
      .poll(async () => (await state()).runtime.dialogue?.block)
      .toBe(id);
    await dialogue(id);
  }
  await resident("emile");
  await resident("noe");
  const library = plan.buildings.find((b) => b.id === "library")!;
  await navigateTo(page, library.returnPoint);
  await page.keyboard.press("e");
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "library");
  await resident("mira");
  await navigateTo(page, { x: 240, y: 316 });
  await page.keyboard.press("e");
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village");
  await navigateTo(page, anchors.advent);
  await expect.poll(async () => (await state()).sceneIndex).toBe(2);
  await page.keyboard.press("e");
  await dialogue("tree");
  await expect
    .poll(async () => (await state()).runtime.dialogue?.block, {
      timeout: 60000,
    })
    .toBe("scatter");
  await dialogue("scatter");
  await expect.poll(async () => (await state()).sceneIndex).toBe(4);
  for (let i = 1; i <= 3; i++) {
    const p = (await state()).targets.find(
      (t: { id: string }) => t.id === "narrative:clue",
    );
    await navigateTo(page, p);
    await page.keyboard.press("e");
    await dialogue(`clue-${i}`);
  }
  await expect.poll(async () => (await state()).sceneIndex).toBe(5);
  await navigateTo(
    page,
    (await state()).targets.find(
      (t: { id: string }) => t.id === "narrative:star",
    ),
  );
  await page.keyboard.press("e");
  await dialogue("star");
  await expect
    .poll(async () => (await state()).sceneIndex, { timeout: 20000 })
    .toBe(6);
  await navigateTo(
    page,
    plan.buildings.find((b) => b.id === "loyal_house")!.returnPoint,
  );
  await page.keyboard.press("e");
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "house");
  await expect
    .poll(async () =>
      (await state()).targets.some(
        (t: { id: string }) => t.id === "narrative:home",
      ),
    )
    .toBe(true);
  await page.keyboard.press("e");
  await dialogue("home");
  await page
    .getByRole("button", { name: "Livre des Étoiles", exact: true })
    .click();
  await expect(page.locator(".journal")).toContainText(script.book.title);
  await capture("journal-final");
  await page.getByRole("button", { name: "Fermer ×", exact: true }).click();
  await expect.poll(async () => (await state()).complete).toBe(true);
  expect((await state()).restored).toBe(1);
  expect(errors).toEqual([]);
});
