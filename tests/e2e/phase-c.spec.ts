import { test, expect, type Page } from "@playwright/test";
import { initial } from "../../src/domain";
import { demoDays } from "../../src/advent/demo";
import { walkTo } from "./navigation";
import { mkdirSync } from "node:fs";
async function startAt(page: Page, room: string) {
  // Date de simulation déterministe, sans modifier les horloges Phaser.
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00+01:00"));
  await page.goto("/");
  // Fixture d'une partie déjà arrivée dans la pièce. Aucun objectif ni étoile
  // de l'Avent n'est modifié : les 24 activités sont jouées dans leur interface.
  await page.evaluate(
    async (save) => {
      await new Promise<void>((res, rej) => {
        const r = indexedDB.open("etoilebois", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("saves");
        r.onerror = () => rej(r.error);
        r.onsuccess = () => {
          const db = r.result,
            t = db.transaction("saves", "readwrite");
          t.objectStore("saves").put(save, "phase-b");
          t.oncomplete = () => {
            db.close();
            res();
          };
        };
      });
    },
    {
      ...initial,
      stage: 4,
      room,
      position: room === "village" ? { x: 512, y: 430 } : { x: 300, y: 270 },
      stars: [1],
    },
  );
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", room, {
    timeout: 20000,
  });
  await page.getByRole("button", { name: "✦ Avent 2026" }).click();
  await page.getByRole("button", { name: /Mode développeur : tester/ }).click();
  await expect(
    page.getByRole("button", { name: "Ouvrir le jour 24", exact: true }),
  ).toBeEnabled();
}
async function validate(page: Page) {
  await page
    .getByRole("button", { name: "Valider cette étape", exact: true })
    .click();
}
test("les 24 journées : activités, reprise, récompenses et scène finale", async ({
  page,
}, info) => {
  test.setTimeout(600000);
  mkdirSync("docs/screenshots", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const d of demoDays) {
    await test.step(`Jour ${d.content.day} : ${d.content.title}`, async () => {
      await startAt(page, d.content.room);
      await page
        .getByRole("button", {
          name: `Ouvrir le jour ${d.content.day}`,
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Suivre la quête dans le village" })
        .click();
      await page
        .getByRole("button", {
          name: `E Surprise du jour ${d.content.day}`,
          exact: true,
        })
        .click();
      for (const step of d.content.steps) {
        await expect(
          page.getByRole("heading", {
            name: `Objectif : ${step.prompt}`,
            exact: true,
          }),
        ).toBeVisible();
        switch (step.kind) {
          case "read":
          case "collect":
          case "decorate":
            for (const item of step.items!)
              await page
                .getByRole("button", {
                  name: `Découvrir ${item.id}`,
                  exact: true,
                })
                .click();
            await validate(page);
            break;
          case "choice": {
            const expected = d.rules[step.id].expected ?? "1";
            await page
              .getByRole("button", {
                name: step.options!.find((i) => i.id === expected)!.label,
                exact: true,
              })
              .click();
            break;
          }
          case "input":
            await page
              .getByRole("textbox", { name: "Votre réponse" })
              .fill(String(d.rules[step.id].expected));
            await validate(page);
            break;
          case "write":
            if (d.content.day === 17) {
              await page
                .getByRole("textbox", { name: "Votre texte" })
                .fill("Brouillon de notre futur");
              await page
                .getByRole("button", { name: "Retour au village ×" })
                .click();
              await startAt(page, "house");
              await page
                .getByRole("button", { name: "Ouvrir le jour 17", exact: true })
                .click();
              await page
                .getByRole("button", {
                  name: "Suivre la quête dans le village",
                })
                .click();
              await page
                .getByRole("button", {
                  name: "E Surprise du jour 17",
                  exact: true,
                })
                .click();
              await expect(
                page.getByRole("textbox", { name: "Votre texte" }),
              ).toHaveValue("Brouillon de notre futur");
            }
            await page
              .getByRole("textbox", { name: "Votre texte" })
              .fill(
                "Une lettre pour notre futur ensemble : inventons des promenades et de beaux souvenirs.",
              );
            await validate(page);
            break;
          case "sequence":
          case "connect":
          case "melody":
            for (const id of d.rules[step.id].expected as string[])
              await page
                .getByRole("button", {
                  name: `Ajouter ${step.items!.find((i) => i.id === id)!.label}`,
                  exact: true,
                })
                .click();
            await validate(page);
            break;
          case "photo": {
            for (let i = 0; i < 9; i++) {
              const buttons = page.locator(".photo-board button");
              const labels = await buttons.evaluateAll((bs) =>
                bs.map((b) => b.getAttribute("aria-label")!),
              );
              const values = labels.map(
                (s) => Number(s.split("fragment ")[1]) - 1,
              );
              if (values[i] !== i) {
                await buttons.nth(i).click();
                await buttons.nth(values.indexOf(i)).click();
              }
            }
            await page
              .getByRole("button", {
                name: "Recevoir le souvenir",
                exact: true,
              })
              .click();
            break;
          }
          case "wrap":
            for (const [paper, ribbon] of [
              ["Rouge", "Or"],
              ["Bleu", "Argent"],
              ["Vert", "Or"],
            ]) {
              await page
                .getByRole("button", { name: paper, exact: true })
                .click();
              await page
                .getByRole("button", { name: ribbon, exact: true })
                .click();
              await page
                .getByRole("button", { name: "Emballer", exact: true })
                .click();
            }
            await page
              .getByRole("button", {
                name: "Recevoir le souvenir",
                exact: true,
              })
              .click();
            break;
          case "media":
            await expect(page.locator("video")).toHaveAttribute(
              "src",
              "/demo/surprise.webm",
            );
            await page
              .locator("video")
              .evaluate((v: HTMLVideoElement) => v.play());
            await expect(
              page.getByRole("button", { name: "J’ai découvert le film" }),
            ).toBeEnabled({ timeout: 15000 });
            await page
              .getByRole("button", { name: "J’ai découvert le film" })
              .click();
            break;
          case "voucher":
            await page
              .getByLabel("Une soirée jeux à deux", { exact: true })
              .check();
            await page
              .getByRole("button", { name: "Créer mon bon cadeau" })
              .click();
            break;
          case "story":
            await page
              .getByRole("button", { name: "Vers la forêt", exact: true })
              .click();
            await page
              .getByRole("button", {
                name: "Partager ce silence puis rentrer",
                exact: true,
              })
              .click();
            await validate(page);
            break;
          case "hunt":
            await page
              .getByRole("button", {
                name: "Commencer la recherche",
                exact: true,
              })
              .click();
            for (const [x, y] of [
              [560, 500],
              [440, 460],
              [700, 500],
            ]) {
              await walkTo(page, "y", 520);
              await walkTo(page, "x", x);
              await walkTo(page, "y", y);
              await page
                .getByRole("button", {
                  name:
                    step.style === "loyal"
                      ? "E Trouver Loyal"
                      : "E Recueillir le petit bonheur",
                  exact: true,
                })
                .click();
            }
            await validate(page);
            break;
          case "memory": {
            const known = new Map<number, string>();
            for (let i = 0; i < 8; i++) {
              const b = page.locator(".memory-board button").nth(i);
              if (await b.isDisabled()) continue;
              await b.click();
              known.set(i, (await b.innerText()).trim());
              if (i % 2 === 1) await page.waitForTimeout(800);
            }
            const pairs = new Map<string, number[]>();
            for (const [i, s] of known)
              pairs.set(s, [...(pairs.get(s) ?? []), i]);
            for (const pair of pairs.values())
              for (const i of pair) {
                const b = page.locator(".memory-board button").nth(i);
                if ((await b.count()) && (await b.isEnabled())) await b.click();
              }
            await page
              .getByRole("button", {
                name: "Recevoir le souvenir",
                exact: true,
              })
              .click();
            break;
          }
          case "scene":
            await page
              .getByRole("button", { name: "Vivre la scène du 24" })
              .click();
            await expect(page.locator("canvas")).toHaveAttribute(
              "data-room",
              "village",
            );
            for (let i = 0; i < 4; i++) {
              await expect(page.locator(".dialogue")).toBeVisible();
              if (i === 3)
                await page.screenshot({
                  path: `docs/screenshots/phase-c-${info.project.name}-final.png`,
                });
              await page.getByRole("button", { name: /Continuer/ }).click();
            }
            break;
        }
      }
      await expect(
        page.getByRole("heading", { name: "Souvenir gagné !", exact: true }),
      ).toBeVisible();
      if (d.content.day === 1) {
        await page
          .getByRole("button", { name: "Rejouer cette journée" })
          .click();
        await expect(page.locator(".advent-progress")).toContainText("0/2");
      }
    });
  }
  await page
    .getByRole("button", { name: "Ouvrir le journal des souvenirs" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Journal des souvenirs · 24/24" }),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/screenshots/phase-c-${info.project.name}-calendrier.png`,
  });
  expect(errors).toEqual([]);
});
test("calendrier daté fermé en novembre et éditeur fictif persistant", async ({
  page,
}) => {
  await startAt(page, "house");
  await page
    .getByRole("button", { name: "Revenir au calendrier daté" })
    .click();
  await expect(
    page.getByRole("button", { name: "Ouvrir le jour 24", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Éditeur fictif", exact: true })
    .click();
  await page
    .getByLabel("Titre", { exact: true })
    .fill("Notre lettre personnalisée");
  await page.getByRole("button", { name: "Enregistrer la surprise" }).click();
  await expect(page.locator(".advent-modal").getByRole("status")).toContainText(
    "Personnalisation enregistrée",
  );
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await page.getByRole("button", { name: "✦ Avent 2026" }).click();
  await page
    .getByRole("button", { name: "Éditeur fictif", exact: true })
    .click();
  await expect(page.getByLabel("Titre", { exact: true })).toHaveValue(
    "Notre lettre personnalisée",
  );
});
