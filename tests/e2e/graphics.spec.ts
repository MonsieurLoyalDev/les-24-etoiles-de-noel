import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("village graphique, dialogue et affichage responsive", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.getByRole("dialog", {name:"Dialogue",exact:true})).toBeVisible({timeout:30000});
  mkdirSync("docs/screenshots/graphismes",{recursive:true});
  await page.screenshot({path:`docs/screenshots/graphismes/${info.project.name}-dialogue.png`});
  await page.getByRole("button",{name:/Continuer/}).click();
  await expect(page.getByRole("dialog", {name:"Dialogue",exact:true})).toHaveCount(0);
  await page.screenshot({path:`docs/screenshots/graphismes/${info.project.name}-village.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});
