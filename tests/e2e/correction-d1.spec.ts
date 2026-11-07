import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
test("D.1 : dialogue compact et monde lisible", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.setFixedTime(new Date("2026-11-07T12:00:00+01:00"));
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  const dialog = page.getByRole("dialog", { name: "Dialogue", exact: true });
  await expect(dialog).toBeVisible({ timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(220);
  const d = (await dialog.boundingBox())!,
    world = (await page.locator(".game").boundingBox())!,
    portrait = (await page.locator(".portrait").boundingBox())!,
    header = (await page.locator("header").boundingBox())!;
  expect(d.height / world.height).toBeLessThan(
    info.project.name === "mobile" ? 0.4 : 0.3,
  );
  expect(portrait.height).toBeLessThanOrEqual(104);
  expect(header.height).toBeLessThanOrEqual(76);
  for (const button of await page.locator(".header-actions button").all()) {
    const rect = (await button.boundingBox())!;
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);
  }
  writeFileSync(
    `docs/graphismes/D1-MESURES-${info.project.name}.json`,
    JSON.stringify(
      {
        viewport: page.viewportSize(),
        dialogue: d,
        monde: world,
        portrait,
        header,
        occupationDialogue: d.height / world.height,
      },
      null,
      2,
    ) + "\n",
  );
  expect(
    await page
      .locator(".dialogue-frame")
      .evaluate((e) => getComputedStyle(e).backgroundImage),
  ).not.toContain("dialogue_narratif");
  mkdirSync("docs/screenshots/phase-d1/apres", { recursive: true });
  await page.screenshot({
    path: `docs/screenshots/phase-d1/apres/${info.project.name}-dialogue.png`,
  });
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(dialog).toHaveCount(0);
  await page.screenshot({
    path: `docs/screenshots/phase-d1/apres/${info.project.name}-village.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("D.1 : petit téléphone 320 px", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Format téléphone uniquement.");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Dialogue", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.screenshot({
    path: "docs/screenshots/phase-d1/apres/mobile-320.png",
  });
});
test("D.1 : vue d'ensemble des façades et décors", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Vue d'ensemble unique.");
  await page.setViewportSize({ width: 2048, height: 1634 });
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: "docs/screenshots/phase-d1/apres/village-complet.png",
  });
});
