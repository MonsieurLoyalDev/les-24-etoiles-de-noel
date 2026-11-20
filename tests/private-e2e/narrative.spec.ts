import { test, expect } from "@playwright/test";
import { technicalEpisode } from "../fixtures/narrative";
import { loginFixture } from "./fixtures";
import { navigateTo } from "../e2e/pathfinding";
import { installNarrativeFixture } from "./narrative-fixture";
test("narration du build privé : calendrier, quatre choix lisibles et reprise", async ({
  page,
}) => {
  test.setTimeout(180000);
  const content = technicalEpisode();
  const welcome = content.scenes[0];
  welcome.dialogues.welcome[0].text =
    "Cette réplique de contrôle doit rester lisible et défiler au clavier. "
      .repeat(24)
      .trimEnd();
  welcome.choices[0].options.push(
    { id: "three", label: "Option technique C" },
    {
      id: "four",
      label: "Une quatrième option pour exercer le retour à la ligne sur un petit écran",
    },
  );
  const fixture = await installNarrativeFixture(page, content);
  try {
    await page.addInitScript("window.__name=f=>f");
    await page.goto("/");
    await page.getByRole("button", { name: /Entrer dans le village/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    await loginFixture(page);
    await expect(
      page.getByRole("button", { name: "Ouvrir le jour 2", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Ouvrir le jour 1", exact: true })
      .click();
    await expect(page.getByLabel("Importer un cahier narratif")).toHaveCount(0);
    const state = () =>
      page
        .locator("canvas")
        .evaluate((c) => JSON.parse(c.dataset.narrative ?? "null"));
    await expect.poll(async () => (await state())?.sceneIndex).toBe(0);
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
    await page.keyboard.press("e");
    const text = page.locator(".dialogue-content p");
    await expect(text).toHaveText(welcome.dialogues.welcome[0].text);
    const choices = page.locator(".dialogue-choices");
    await expect(choices.getByRole("button")).toHaveCount(4);
    expect(await choices.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await text.focus();
    await expect(text).toBeFocused();
    await page.keyboard.press("PageDown");
    await expect
      .poll(() => text.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    await page
      .getByRole("button", {
        name: content.scenes[0].choices[0].options[1].label,
        exact: true,
      })
      .click();
    const entry = (await state()).actors.entry;
    await navigateTo(page, { x: entry.x + 24, y: entry.y });
    await expect.poll(async () => (await state()).sceneIndex).toBe(1);
    await expect.poll(async () => (await state()).saving).toBe(false);
    expect((await state()).error).toBe("");
    await page.reload();
    await page.getByRole("button", { name: /Entrer dans le village/ }).click();
    await expect
      .poll(async () => (await state())?.sceneIndex, { timeout: 20000 })
      .toBe(1);
    expect(Object.values((await state()).choices)).toContain(
      content.scenes[0].choices[0].options[1].id,
    );
    expect(fixture.calls).toContain("episode_save");
    await fixture.verify();
  } finally {
    await fixture.close();
  }
});
