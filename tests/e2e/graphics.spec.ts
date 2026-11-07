import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import catalog from "../../src/art/catalog.json" with { type: "json" };

test("village graphique, dialogue et affichage responsive", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Dialogue", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(200); // End of the 180 ms cosmetic scene fade before the capture.
  mkdirSync("docs/screenshots/graphismes", { recursive: true });
  await page.screenshot({
    path: `docs/screenshots/graphismes/${info.project.name}-dialogue.png`,
  });
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Dialogue", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: `docs/screenshots/graphismes/${info.project.name}-village.png`,
  });
  await page.getByRole("button", { name: "✦ Avent 2026", exact: true }).click();
  await expect(page.locator(".calendar-star")).toHaveCount(24);
  await expect(
    page.getByRole("button", { name: "Ouvrir le jour 24", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: `docs/screenshots/graphismes/${info.project.name}-calendrier.png`,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("paramètres séparés de la progression et absence de sons non autorisés", async ({
  page,
}) => {
  const audioRequests: string[] = [];
  page.on("request", (r) => {
    if (/\.(mp3|ogg|wav)(\?|$)/.test(r.url())) audioRequests.push(r.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  const before = await page.locator("canvas").getAttribute("data-player-x");
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  await page.getByRole("checkbox", { name: "Muet", exact: true }).uncheck();
  await page.getByRole("slider", { name: "Volume", exact: true }).fill("0.25");
  await page
    .getByRole("dialog", { name: "Paramètres", exact: true })
    .getByRole("button", { name: "Fermer ×" })
    .focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowRight");
  expect(await page.locator("canvas").getAttribute("data-player-x")).toBe(
    before,
  );
  await page
    .getByRole("dialog", { name: "Paramètres", exact: true })
    .getByRole("button", { name: "Fermer ×" })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Muet", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("slider", { name: "Volume", exact: true }),
  ).toHaveValue("0.25");
  expect(audioRequests).toEqual([]);
});

test("téléphone paysage et réduction des animations", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "mobile", "Format téléphone uniquement.");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight + 2,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "docs/screenshots/graphismes/mobile-paysage.png",
  });
});

test("contrôle des 32 portraits sur fonds clair et sombre", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Une seule planche de contrôle des PNG originaux suffit.",
  );
  await page.goto("/");
  const portraits = Object.entries(catalog.images).filter(([, url]) =>
    url.includes("/portraits/"),
  );
  await page.setContent(
    `<style>body{margin:0;background:#172532;font:14px sans-serif;color:white}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;padding:10px}figure{margin:0;background:linear-gradient(90deg,#ecdfc7 50%,#14252c 50%);text-align:center;border:1px solid #96723f}img{width:100%;height:180px;object-fit:contain;display:block}figcaption{background:#1b303b;padding:6px;font-size:11px}</style><div class="grid">${portraits.map(([name, url]) => `<figure><img src="${url}" alt="${name}"><figcaption>${name}</figcaption></figure>`).join("")}</div>`,
  );
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll(
          (images) =>
            images.filter(
              (i) =>
                i instanceof HTMLImageElement &&
                i.complete &&
                i.naturalWidth > 0,
            ).length,
        ),
    )
    .toBe(32);
  await page.screenshot({
    path: "docs/screenshots/graphismes/portraits-controle.png",
    fullPage: true,
  });
});

test("chaque étoile ouvre la journée sélectionnée", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.getByRole("button", { name: "✦ Avent 2026", exact: true }).click();
  await page.getByRole("button", { name: /Mode développeur : tester/ }).click();
  for (let day = 1; day <= 24; day++) {
    await page
      .getByRole("button", { name: `Ouvrir le jour ${day}`, exact: true })
      .click();
    await expect(page.locator(".advent-modal .eyebrow").last()).toContainText(
      `JOUR ${day} ·`,
    );
    await page
      .getByRole("button", { name: "Choisir une autre journée", exact: true })
      .click();
  }
});
