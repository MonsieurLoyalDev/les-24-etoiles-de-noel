import { navigateTo } from "./pathfinding";
import { anchors, plan } from "../../src/art/village34";
import { walkTo } from "./navigation";
import { test, expect, type Page } from "@playwright/test";
const walk = walkTo;
async function interact(page: Page, name: RegExp) {
  const button = page.getByRole("button", { name });
  await expect(button).toBeEnabled({ timeout: 10000 });
  await button.click();
}
async function dismiss(page: Page) {
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.locator(".dialogue")).toHaveCount(0);
}
async function startMigrated(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open("etoilebois", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("saves");
      r.onerror = () => reject(r.error);
      r.onsuccess = () => {
        const db = r.result,
          tx = db.transaction("saves", "readwrite");
        tx.objectStore("saves").put(
          {
            version: 1,
            stage: 4,
            room: "village",
            position: { x: 512, y: 608 },
          },
          "phase-a",
        );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    });
  });
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village", {
    timeout: 20000,
  });
  await expect(page.locator(".quest")).toContainText("1 / 24");
}
async function approachNPC(page: Page, id: string, name: string) {
  const button = page.getByRole("button", {
    name: new RegExp("Parler à " + name),
  });
  for (let attempt = 0; attempt < 6; attempt++) {
    if (await button.isVisible()) {
      await button.click();
      return;
    }
    const people = JSON.parse(
      (await page.locator("canvas").getAttribute("data-npcs")) ?? "[]",
    ) as { id: string; x: number; y: number }[];
    const person = people.find((n) => n.id === id)!;
    await navigateTo(page, { x: person.x, y: person.y });
  }
  await interact(page, new RegExp("Parler à " + name));
}
async function resident(page: Page, name: string, accept = false) {
  await approachNPC(
    page,
    (
      { Célestine: "mira", Basile: "oscar", Madeleine: "alma" } as Record<
        string,
        string
      >
    )[name],
    name,
  );
  if (accept) {
    await page
      .getByRole("button", { name: "Avec plaisir, je m’en occupe" })
      .click();
    if (name === "Célestine") {
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              new Promise((resolve) => {
                const r = indexedDB.open("etoilebois", 1);
                r.onsuccess = () => {
                  const db = r.result,
                    q = db
                      .transaction("saves")
                      .objectStore("saves")
                      .get("phase-b");
                  q.onsuccess = () => {
                    resolve(q.result?.conversation?.node ?? "");
                    db.close();
                  };
                };
              }),
          ),
        )
        .toBe("accepted");
      await page.reload();
      await page
        .getByRole("button", { name: /Entrer dans le village/ })
        .click();
      await expect(page.locator(".dialogue")).toContainText("Merci Debby");
    }
    await page.getByRole("button", { name: "C’est parti !" }).click();
  } else
    await page.getByRole("button", { name: "À bientôt", exact: true }).click();
  await expect(page.locator(".dialogue")).toHaveCount(0);
}
async function exit(page: Page) {
  await navigateTo(page, { x: 240, y: 305 });
  await interact(page, /Sortir/);
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "village");
}
async function enter(page: Page, name: RegExp, room: string) {
  await interact(page, name);
  await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
}
test("Phase B : village vivant, quatre maisons, quêtes et trois mini-jeux", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startMigrated(page);
  // Follow the current scheduled position using the independent collision-aware test navigator.
  await navigateTo(page, anchors.augustin[0]);
  await approachNPC(page, "noe", "Augustin");
  await page
    .getByRole("button", { name: "Avec plaisir, je m’en occupe" })
    .click();
  await page.getByRole("button", { name: "C’est parti !" }).click();
  await navigateTo(page, { x: 960, y: 900 });
  const npcBefore = await page.locator("canvas").getAttribute("data-npcs");
  await expect
    .poll(() => page.locator("canvas").getAttribute("data-npcs"))
    .not.toBe(npcBefore);
  await navigateTo(
    page,
    plan.buildings.find((b) => b.id === "loyal_house")!.returnPoint,
  );
  await enter(page, /Maison de Loyal/, "house");
  await exit(page);
  // Travel along the southern route, then north to the library door.
  await navigateTo(
    page,
    plan.buildings.find((b) => b.id === "library")!.returnPoint,
  );
  await enter(page, /Bibliothèque/, "library");
  await resident(page, "Célestine", true);
  await navigateTo(page, { x: 385, y: 185 });
  await interact(page, /marque-page/);
  await dismiss(page);
  await walk(page, "y", 185);
  await walk(page, "x", 240);
  await interact(page, /livre des devinettes/);
  await page.getByRole("button", { name: "Un flocon", exact: true }).click();
  await expect(page.locator(".dialogue")).toContainText("Presque");
  await page.getByRole("button", { name: "Réessayer" }).click();
  await page.getByRole("button", { name: "Une ombre" }).click();
  await page.getByRole("button", { name: "Refermer le livre" }).click();
  await walk(page, "y", 255);
  await walk(page, "x", 370);
  await interact(page, /Reconstituer la photographie/);
  const photo = page.getByRole("dialog", { name: "Puzzle de photographie" });
  await expect(photo).toBeVisible();
  await page.screenshot({
    path: `docs/screenshots/phase-b-${info.project.name}-photo.png`,
  });
  await photo.getByRole("button", { name: /Quitter le jeu/ }).click();
  await expect(page.locator(".quest")).toContainText(
    "Reconstituer la photographie",
  );
  await interact(page, /Reconstituer la photographie/);
  await expect(photo).toBeVisible();
  for (let i = 1; i <= 9; i++) {
    const tile = photo.getByRole("button", {
      name: new RegExp(`^Case ${i}, fragment`),
    });
    const label = await tile.getAttribute("aria-label");
    if (label === `Case ${i}, fragment ${i}`) continue;
    await tile.click();
    await photo
      .getByRole("button", { name: new RegExp(`fragment ${i}$`) })
      .click();
  }
  await photo.getByRole("button", { name: "Recevoir le souvenir" }).click();
  await dismiss(page);
  await resident(page, "Célestine");
  await expect(page.locator(".quest")).toContainText("2 / 24");
  await exit(page);
  await navigateTo(
    page,
    plan.buildings.find((b) => b.id === "workshop")!.returnPoint,
  );
  await enter(page, /Atelier des Cadeaux/, "workshop");
  await resident(page, "Basile", true);
  await walk(page, "y", 170);
  await walk(page, "x", 385);
  await walk(page, "y", 185);
  await interact(page, /Prendre le ruban/);
  await dismiss(page);
  await walk(page, "y", 185);
  await walk(page, "x", 240);
  await interact(page, /Établi/);
  const wrap = page.getByRole("dialog", { name: "Emballage de cadeaux" });
  await expect(wrap).toBeVisible();
  await wrap.getByRole("button", { name: "Rouge", exact: true }).click();
  await wrap.getByRole("button", { name: "Argent", exact: true }).click();
  await wrap.getByRole("button", { name: "Emballer", exact: true }).click();
  await expect(wrap).toContainText("Réessayez");
  await page.screenshot({
    path: `docs/screenshots/phase-b-${info.project.name}-wrap.png`,
  });
  for (const [paper, ribbon] of [
    ["Rouge", "Or"],
    ["Bleu", "Argent"],
    ["Vert", "Or"],
  ]) {
    await wrap.getByRole("button", { name: paper, exact: true }).click();
    await wrap.getByRole("button", { name: ribbon, exact: true }).click();
    await wrap.getByRole("button", { name: "Emballer", exact: true }).click();
  }
  await wrap.getByRole("button", { name: "Recevoir le souvenir" }).click();
  await dismiss(page);
  await resident(page, "Basile");
  await expect(page.locator(".quest")).toContainText("3 / 24");
  await exit(page);
  await navigateTo(
    page,
    plan.buildings.find((b) => b.id === "inn")!.returnPoint,
  );
  await enter(page, /Auberge des Étoiles/, "inn");
  await resident(page, "Madeleine", true);
  await walk(page, "y", 255);
  await walk(page, "x", 370);
  await interact(page, /Jouer aux cartes/);

  const memory = page.getByRole("dialog", { name: "Mémoire des souvenirs" });
  const observed = new Map<string, number[]>();
  for (let i = 1; i <= 8; i += 2) {
    const a = memory.getByRole("button", {
      name: new RegExp("^Carte " + i + "(,|$)"),
    });
    const b = memory.getByRole("button", {
      name: new RegExp("^Carte " + (i + 1) + "(,|$)"),
    });
    await a.click();
    const first = (await a.innerText()).trim();
    observed.set(first, [...(observed.get(first) ?? []), i]);
    await b.click();
    const second = (await b.innerText()).trim();
    observed.set(second, [...(observed.get(second) ?? []), i + 1]);
    if (first !== second) await expect.poll(() => a.innerText()).toBe("?");
  }
  for (const indices of observed.values()) {
    const a = memory.getByRole("button", {
      name: new RegExp("^Carte " + indices[0] + "(,|$)"),
    });
    if (await a.isDisabled()) continue;
    await a.click();
    await memory
      .getByRole("button", { name: "Carte " + indices[1], exact: true })
      .click();
  }
  await page.screenshot({
    path: `docs/screenshots/phase-b-${info.project.name}-memory.png`,
  });
  await memory.getByRole("button", { name: "Recevoir le souvenir" }).click();
  await dismiss(page);
  await resident(page, "Madeleine");
  await expect(page.locator(".quest")).toContainText("4 / 24");
  await exit(page);
  await navigateTo(page, anchors.augustin[0]);
  await approachNPC(page, "noe", "Augustin");
  await page.getByRole("button", { name: "À bientôt", exact: true }).click();
  await expect(page.locator(".quest")).toContainText("5 / 24");
  await page.getByRole("button", { name: /Journal/ }).click();
  await page.getByRole("button", { name: "Quêtes", exact: true }).click();
  await expect(page.locator(".quest-list")).toContainText("Souvenir gagné");
  await page.screenshot({
    path: `docs/screenshots/phase-b-${info.project.name}-quests.png`,
  });
  await page.getByRole("button", { name: "Calendrier", exact: true }).click();
  await page.getByRole("button", { name: "Jour 24", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Journal des étoiles" }),
  ).toContainText("Aucune surprise future");
  await page.getByRole("button", { name: /Fermer/ }).click();
  await expect(page.getByRole("status")).toContainText("enregistrée");
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator(".quest")).toContainText("5 / 24");
  await page.screenshot({
    path: `docs/screenshots/phase-b-${info.project.name}-village.png`,
  });
  expect(errors).toEqual([]);
});
