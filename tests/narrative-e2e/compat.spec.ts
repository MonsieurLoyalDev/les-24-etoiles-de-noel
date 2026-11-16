import { test, expect } from "@playwright/test";
import { technicalEpisode } from "../fixtures/narrative";
test("alternance aventure et ancienne activité sans perdre les checkpoints", async ({
  page,
}) => {
  await page.addInitScript("window.__name=f=>f");
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  const state = () =>
    page
      .locator("canvas")
      .evaluate((c) => JSON.parse(c.dataset.narrative ?? "null"));
  const calendar = () =>
    page.getByRole("button", { name: "✦ Avent 2026", exact: true }).click();
  const content = technicalEpisode();
  await calendar();
  await page
    .getByRole("button", { name: "Aventure narrative", exact: true })
    .click();
  await page
    .getByLabel("Importer un cahier narratif")
    .setInputFiles({
      name: "fixture.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(content)),
    });
  await page
    .getByRole("button", { name: "Commencer l’épisode 1", exact: true })
    .click();
  await expect
    .poll(async () =>
      (await state())?.targets.some(
        (t: { id: string }) => t.id === "narrative:welcome",
      ),
    )
    .toBe(true);
  await page.keyboard.press("e");
  await page
    .getByRole("button", {
      name: content.scenes[0].choices[0].options[0].label,
      exact: true,
    })
    .click();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowRight");
  await expect.poll(async () => (await state()).sceneIndex).toBe(1);
  const choices = (await state()).choices;
  await calendar();
  await page.getByRole("button", { name: /Mode développeur/ }).click();
  await page
    .getByRole("button", { name: "Ouvrir le jour 2", exact: true })
    .click();
  await expect.poll(state).toBeNull();
  await page
    .getByRole("button", { name: "Retour au village ×", exact: true })
    .click();
  await calendar();
  await page
    .getByRole("button", { name: "Aventure narrative", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Commencer l’épisode 1", exact: true })
    .click();
  await expect.poll(async () => (await state())?.sceneIndex).toBe(1);
  expect((await state()).choices).toEqual(choices);
  const archived = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("etoilebois", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const result = await new Promise<unknown>((resolve, reject) => {
      const r = db
        .transaction("saves")
        .objectStore("saves")
        .get("advent-c:runs:developer");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    db.close();
    return result;
  });
  expect(archived).toBeTruthy();
});
