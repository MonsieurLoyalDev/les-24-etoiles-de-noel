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
  await page.getByRole("button",{name:"✦ Avent 2026",exact:true}).click();
  await expect(page.locator(".calendar-star")).toHaveCount(24);
  await expect(page.getByRole("button",{name:"Ouvrir le jour 24",exact:true})).toBeDisabled();
  await page.screenshot({path:`docs/screenshots/graphismes/${info.project.name}-calendrier.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});

test("chaque étoile ouvre la journée sélectionnée",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/Entrer dans le village/}).click();
  await page.getByRole("button",{name:/Continuer/}).click();
  await page.getByRole("button",{name:"✦ Avent 2026",exact:true}).click();
  await page.getByRole("button",{name:/Mode développeur : tester/}).click();
  for(let day=1;day<=24;day++){
    await page.getByRole("button",{name:`Ouvrir le jour ${day}`,exact:true}).click();
    await expect(page.locator(".advent-modal .eyebrow").last()).toContainText(`JOUR ${day} ·`);
    await page.getByRole("button",{name:"Choisir une autre journée",exact:true}).click();
  }
});
