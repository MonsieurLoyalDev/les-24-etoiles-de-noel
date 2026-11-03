import { test, expect, type Page } from "@playwright/test";
async function start(page: Page) {
  page.on("pageerror", (e) => console.log("BROWSER ERROR", e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Dialogue" })).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Parler à Loyal/ }),
  ).toBeVisible();
}
async function coordinate(page: Page, axis: "x" | "y") {
  return Number(
    await page.locator("canvas").getAttribute(`data-player-${axis}`),
  );
}
async function walk(page: Page, key: string, axis: "x" | "y", target: number) {
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const direction = ["ArrowDown", "ArrowRight"].includes(key) ? 1 : -1;
  await page.keyboard.down(key);
  try {
    await expect
      .poll(async () => direction * ((await coordinate(page, axis)) - target), {
        timeout: 15000,
        intervals: [25],
      })
      .toBeGreaterThanOrEqual(0);
  } finally {
    await page.keyboard.up(key);
  }
}
test("parcours complet, sauvegarde et journal", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("chaque étoile");
  await page.getByRole("button", { name: /Continuer/ }).click();
  // From (512,608): avoid pine at (800,624), approach doorway from below.
  await walk(page, "ArrowDown", "y", 646);
  await walk(page, "ArrowRight", "x", 800);
  await expect(
    page.getByRole("button", { name: /Maison de Loyal/ }),
  ).toBeEnabled();
  await page.keyboard.press("e");
  await expect(page.locator(".location")).toContainText("Maison de Loyal");
  await walk(page, "ArrowUp", "y", 158);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("tu rends même");
  await page.getByRole("button", { name: /Continuer/ }).click();
  await walk(page, "ArrowDown", "y", 305);
  await page.keyboard.press("e");
  await expect(page.locator(".location")).toContainText("Place des Lanternes");
  await walk(page, "ArrowLeft", "x", 512);
  await walk(page, "ArrowUp", "y", 410);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText(
    "Notre premier souvenir",
  );
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.locator(".quest")).toContainText("1 / 24");
  await page.waitForTimeout(4500);
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator(".quest")).toContainText("1 / 24");
  await page.getByRole("button", { name: /Journal/ }).click();
  await expect(page.locator(".days > div")).toHaveCount(24);
  await page.getByRole("button", { name: /Fermer/ }).click();
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-quest.png`,
  });
  expect(errors).toEqual([]);
});
test("joystick tactile et absence de débordement", async ({ page }) => {
  await start(page);
  const before = await coordinate(page, "x");
  const stick = page.getByLabel("Joystick de déplacement");
  const r = (await stick.boundingBox())!;
  await page.mouse.move(r.x + 52, r.y + 52);
  await page.mouse.down();
  await page.mouse.move(r.x + 85, r.y + 52);
  await expect.poll(() => coordinate(page, "x")).toBeGreaterThan(before + 30);
  await page.mouse.up();
  expect(await coordinate(page, "x")).toBeGreaterThan(before + 30);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
