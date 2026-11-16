import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { technicalEpisode } from "../fixtures/narrative";
import { navigateTo as navigateOnce } from "../e2e/pathfinding";
import type { Page } from "@playwright/test";
import type { Point } from "../../src/domain";
import { installNarrativeFixture } from "../private-e2e/narrative-fixture";
import { loginFixture } from "../private-e2e/fixtures";
import { validateScript } from "../../src/narrative/script";
let backend: Awaited<ReturnType<typeof installNarrativeFixture>> | null = null;
test.afterEach(async () => {
  await backend?.close();
  backend = null;
});
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
  const raw = process.env.ETB_EPISODE_SOURCE
    ? readFileSync(process.env.ETB_EPISODE_SOURCE)
    : Buffer.from(JSON.stringify(technicalEpisode()));
  const script = validateScript(JSON.parse(raw.toString("utf8")));
  const privateMode = process.env.ETB_EPISODE_PRIVATE === "1";
  if (privateMode) backend = await installNarrativeFixture(page, script);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript("window.__name=f=>f");
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: /Continuer/ }).click();
  if (privateMode) {
    await loginFixture(page);
    await expect(
      page.getByRole("button", { name: "Ouvrir le jour 2", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Ouvrir le jour 1", exact: true })
      .click();
  } else {
    await page
      .getByRole("button", { name: "✦ Avent 2026", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Aventure narrative", exact: true })
      .click();
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
  }
  const state = () =>
    page
      .locator("canvas")
      .evaluate((c) => JSON.parse(c.dataset.narrative ?? "null"));
  async function gesture(name: string, label: string) {
    if (
      !(await page
        .getByRole("button", { name: label, exact: true })
        .isVisible())
    )
      await page.getByText("Moments à partager", { exact: true }).click();
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect.poll(async () => (await state()).polish.gesture).toBe(name);
    expect((await state()).identity.pairOverlays).toBe(0);
    await expect(page.locator(".narrative-tracker")).toBeHidden();
    if (process.env.ETB_NARRATIVE_CAPTURE_DIR) {
      const b = (await state()).polish.bounds,
        canvas = (await page.locator("canvas").boundingBox())!,
        viewport = page.viewportSize()!;
      const x = Math.max(0, Math.floor(canvas.x + b.x)),
        y = Math.max(0, Math.floor(canvas.y + b.y));
      const clip = {
        x,
        y,
        width: Math.min(viewport.width - x, Math.ceil(b.width)),
        height: Math.min(viewport.height - y, Math.ceil(b.height)),
      };
      for (let i = 0; i < 12; i++) {
        await page.screenshot({
          path: join(
            process.env.ETB_NARRATIVE_CAPTURE_DIR,
            `${info.project.name}-seq-${name}-${String(i).padStart(2, "0")}.png`,
          ),
          clip,
        });
        await page.waitForTimeout(120);
      }
    }
    await expect
      .poll(async () => (await state()).polish.gesture, { timeout: 10000 })
      .toBeNull();
    expect((await state()).identity).toEqual({
      debbyVisible: true,
      loyalVisible: true,
      pairOverlays: 0,
    });
  }
  async function resume(sceneIndex: number) {
    await expect.poll(async () => (await state()).saving).toBe(false);
    await page.reload();
    await page.getByRole("button", { name: /Entrer dans le village/ }).click();
    await expect
      .poll(async () => (await state())?.sceneIndex, { timeout: 30000 })
      .toBe(sceneIndex);
  }
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
  const welcome = script.scenes[0].dialogues.welcome;
  for (const [index, beat] of welcome.entries()) {
    await expect(page.locator(".dialogue-content p")).toHaveText(beat.text);
    if (beat.choiceId)
      await page
        .getByRole("button", {
          name: script.scenes[0].choices[0].options[1].label,
          exact: true,
        })
        .click();
    else await page.getByRole("button", { name: /Continuer/ }).click();
    if (index === 1 && welcome.length > 2) {
      await expect
        .poll(async () => (await state()).runtime.dialogue.beat)
        .toBe(2);
      await resume(0);
      expect((await state()).runtime.dialogue.beat).toBe(2);
    }
  }
  await navigateTo(page, { x: target.x + 24, y: target.y });
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
        if (!choice) throw Error("Choix absent du cahier de recette");
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
  const restTarget = (await state()).targets.find(
    (t: { id: string }) => t.id === "narrative:optional:bench",
  );
  await navigateTo(page, restTarget);
  await gesture("sit", "Faire une pause avec Loyal");
  const library = plan.buildings.find((b) => b.id === "library")!;
  const order =
    info.project.name === "mobile"
      ? ["mira", "noe", "emile"]
      : ["emile", "noe", "mira"];
  for (const id of order) {
    if (id === "mira") {
      await navigateTo(page, library.returnPoint);
      await page.keyboard.press("e");
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-room",
        "library",
      );
    }
    await resident(id);
    if (id === "mira") {
      await navigateTo(page, { x: 240, y: 316 });
      await page.keyboard.press("e");
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-room",
        "village",
      );
    }
  }
  expect((await state()).runtime.firstMetVillager).toBe(
    info.project.name === "mobile" ? "celestine" : "emile",
  );
  await navigateTo(page, anchors.advent);
  await expect.poll(async () => (await state()).sceneIndex).toBe(2);
  await page.keyboard.press("e");
  await dialogue("tree");
  await gesture("hands", "Prendre la main de Loyal");
  if (
    !(await page
      .getByRole("button", { name: "Prendre la main de Loyal", exact: true })
      .isVisible())
  )
    await page.getByText("Moments à partager", { exact: true }).click();
  await page
    .getByRole("button", { name: "Prendre la main de Loyal", exact: true })
    .click();
  await expect.poll(async () => (await state()).polish.gesture).toBe("hands");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(160);
  await page.keyboard.up("ArrowRight");
  await expect.poll(async () => (await state()).polish.gesture).toBeNull();
  expect((await state()).identity.debbyVisible).toBe(true);
  await gesture("hug", "Faire un câlin à Loyal");
  if (info.project.name === "mobile")
    await page.emulateMedia({ reducedMotion: "reduce" });
  await gesture("glasses", "Ajuster nos lunettes");
  if (info.project.name === "mobile")
    await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(async () => (await state()).identity)
    .toEqual({ debbyVisible: true, loyalVisible: true, pairOverlays: 0 });
  expect((await state()).sceneIndex).toBe(2);
  expect((await state()).treeFrame).toBe("sapin_24");
  await capture("moment-sapin");
  await page
    .getByRole("button", { name: "Poursuivre l’aventure", exact: true })
    .click();
  if (info.project.name === "mobile") {
    await expect
      .poll(async () => (await state()).runtime.cinematic?.kind)
      .toBe("scatter");
    await resume(3);
    await expect.poll(async () => (await state()).runtime.dispersed).toBe(true);
    expect((await state()).runtime.cinematic).toBeNull();
  } else {
    await page.waitForTimeout(8000);
    await capture("dispersion-cascade");
  }
  await expect
    .poll(async () => (await state()).runtime.dialogue?.block, {
      timeout: 60000,
    })
    .toBe("scatter");
  await dialogue("scatter");
  await expect.poll(async () => (await state()).sceneIndex).toBe(4);
  await expect
    .poll(async () => (await state()).hintLevel, { timeout: 40000 })
    .toBe(1);
  const timerBefore = (await state()).runtime.hintMs;
  await page.getByRole("button", { name: "✧ Journal", exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Fermer ×", exact: true }).click();
  expect((await state()).runtime.hintMs - timerBefore).toBeLessThan(500);
  await expect(
    page.getByRole("dialog", { name: "Dialogue", exact: true }),
  ).toBeVisible({ timeout: 40000 });
  const hintPaused = (await state()).runtime.hintMs;
  await page.waitForTimeout(1000);
  expect((await state()).runtime.hintMs).toBe(hintPaused);
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect
    .poll(async () => (await state()).hintLevel, { timeout: 40000 })
    .toBe(3);
  await capture("aide-progressive");
  for (let i = 1; i <= 3; i++) {
    const p = (await state()).targets.find(
      (t: { id: string }) => t.id === "narrative:clue",
    );
    await navigateTo(page, p);
    await capture(`indice-${i}-visible`);
    await page.keyboard.press("e");
    await dialogue(`clue-${i}`);
    if (i === 1) {
      await resume(4);
      expect((await state()).runtime.clueIndex).toBe(1);
    }
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
  if (info.project.name === "mobile") {
    await expect
      .poll(async () => (await state()).runtime.cinematic?.kind)
      .toBe("restore");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await resume(6);
  } else {
    await expect(
      page.getByRole("button", { name: "Continuer à explorer", exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await page
      .getByRole("button", { name: "Continuer à explorer", exact: true })
      .click();
  }
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
  await resume(7);
  expect((await state()).restored).toBe(1);
  expect((await state()).completedAt).toBeTruthy();
  // Observe the companion settle at the existing hearth cushion, without moving him directly.
  const hearth = (await state()).targets.find(
    (t: { id: string }) => t.id === "narrative:optional:fire",
  );
  await navigateTo(page, hearth);
  // Stand beside the hearth instead of in the follower's line over the fox cushion.
  await navigateTo(page, { x: hearth.x + 45, y: hearth.y + 18 });
  await expect
    .poll(async () => (await state()).polish.foxTexture, { timeout: 30000 })
    .toBe("e21-fox");
  await capture("flocon-repos");
  const perf = await page.evaluate(async () => {
    const times: number[] = [];
    let last = performance.now();
    for (let i = 0; i < 120; i++)
      await new Promise<void>((r) =>
        requestAnimationFrame((t) => {
          times.push(t - last);
          last = t;
          r();
        }),
      );
    times.sort((a, b) => a - b);
    return {
      samples: times.length,
      p95: times[Math.floor(times.length * 0.95)],
      mean: times.reduce((a, b) => a + b, 0) / times.length,
    };
  });
  if (process.env.ETB_NARRATIVE_CAPTURE_DIR)
    writeFileSync(
      join(
        process.env.ETB_NARRATIVE_CAPTURE_DIR,
        `${info.project.name}-performance.json`,
      ),
      JSON.stringify(perf, null, 2),
    );
  await expect
    .poll(async () => (await state()).runtime.escort, { timeout: 60000 })
    .toBeNull();
  if (privateMode && backend) {
    const canonical = await backend.canonical();
    await page
      .getByRole("button", { name: "✦ Avent 2026", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Garder une copie", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Rejouer le jour 1", exact: true })
      .click();
    await expect.poll(async () => (await state())?.replay).toBe(true);
    expect((await state()).complete).toBe(false);
    expect((await state()).restored).toBe(1);
    expect(await backend.canonical()).toEqual(canonical);
  }
  expect(errors).toEqual([]);
  await backend?.verify();
});
