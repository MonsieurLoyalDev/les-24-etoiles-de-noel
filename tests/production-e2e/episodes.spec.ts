import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { technicalProductionEpisode } from "../fixtures/production";
import { technicalEpisode } from "../fixtures/narrative";
import { installNarrativeFixture } from "../private-e2e/narrative-fixture";
import { loginFixture } from "../private-e2e/fixtures";
import { navigateTo } from "../e2e/pathfinding";
import { plan } from "../../src/art/village34";
import { areaPortals, isExtraRoom } from "../../src/narrative/areas";
import { validateScript, type EpisodeScript } from "../../src/narrative/script";
import type { Puzzle } from "../../src/narrative/flow";
import type { WorldRoom } from "../../src/domain";
const source = process.env.ETB_PRODUCTION_SOURCE_DIR;
if (source && process.env.CI)
  throw Error("Recette des scénarios privés réservée au poste local.");
const days = source ? [2, 3, 4, 5, 6] : [2];
for (const { day, canonical } of [
  ...days.map((day) => ({ day, canonical: false })),
  { day: 6, canonical: true },
])
  test(`épisode ${day} ${canonical ? "canonique" : "aperçu"} : parcours réel, activité et sauvegarde`, async ({
    page,
  }, info) => {
    const script: EpisodeScript = source
      ? validateScript(
          JSON.parse(
            readFileSync(
              join(source, `episode-${String(day).padStart(2, "0")}.json`),
              "utf8",
            ),
          ),
        )
      : technicalProductionEpisode(day);
    const previous = canonical
      ? Array.from({ length: day - 1 }, (_, i) =>
          source
            ? validateScript(
                JSON.parse(
                  readFileSync(
                    i === 0
                      ? join(source, "../episode-01-e2.json")
                      : join(
                          source,
                          `episode-${String(i + 1).padStart(2, "0")}.json`,
                        ),
                    "utf8",
                  ),
                ),
              )
            : i === 0
              ? technicalEpisode()
              : technicalProductionEpisode(i + 1),
        )
      : [];
    const backend = await installNarrativeFixture(page, script, {
      admin: !canonical,
      previous,
      date: "2026-12-06T10:00:00Z",
    });
    const state = () =>
      page
        .locator("canvas")
        .evaluate((c) => JSON.parse(c.dataset.narrative ?? "null"));
    const browserErrors: string[] = [];
    page.on("pageerror", (e) => browserErrors.push(e.message));
    const room = () => page.locator("canvas").getAttribute("data-room");
    let puzzleReloaded = false;
    async function interact() {
      if (info.project.name === "mobile")
        await page.locator("button.interaction").tap();
      else await page.keyboard.press("e");
    }
    async function resumeInPlace() {
      await expect
        .poll(async () => (await state()).saving, { timeout: 15000 })
        .toBe(false);
      const before = await state();
      await page.reload();
      await page
        .getByRole("button", { name: /Entrer dans le village/ })
        .click();
      await expect(page.locator("canvas")).toHaveAttribute("data-room", /./, {
        timeout: 30000,
      });
      if (!canonical) {
        if (
          await page
            .getByRole("dialog", { name: "Dialogue", exact: true })
            .isVisible()
        )
          await page.getByRole("button", { name: /Continuer/ }).click();
        await loginFixture(page);
        if (!canonical)
          await page
            .getByRole("button", {
              name: "Mode développeur : tester les 24 journées",
              exact: true,
            })
            .click();
        await page
          .getByRole("button", { name: `Ouvrir le jour ${day}`, exact: true })
          .click();
      }
      await expect
        .poll(async () => !!(await state()), { timeout: 30000 })
        .toBe(true);
      expect((await state()).runtime.flow.drafts).toEqual(
        before.runtime.flow.drafts,
      );
      expect((await state()).objectives).toEqual(before.objectives);
      expect((await state()).choices).toEqual(before.choices);
    }
    async function walk(p: { x: number; y: number }) {
      try {
        await navigateTo(page, p);
      } catch (e) {
        if (!String(e).includes("Navigation bloquée")) throw e;
        await navigateTo(page, p);
      }
    }
    async function moveRoom(target: WorldRoom) {
      if ((await room()) === target) return;
      if ((await room()) !== "village") {
        const current = await room();
        await walk(
          isExtraRoom(current!)
            ? areaPortals[current as "forest" | "bakery"].entry
            : { x: 240, y: 315 },
        );
        await page.keyboard.press("e");
        await expect(page.locator("canvas")).toHaveAttribute(
          "data-room",
          "village",
        );
      }
      if (target === "village") return;
      if (isExtraRoom(target)) {
        const t = (await state()).targets.find(
          (t: { id: string }) => t.id === `narrative:portal:${target}`,
        );
        if (!t) throw Error("Portail autorisé manquant");
        await walk(t);
      } else {
        const id = target === "house" ? "loyal_house" : target;
        await walk(plan.buildings.find((b) => b.id === id)!.returnPoint);
      }
      await page.keyboard.press("e");
      await expect(page.locator("canvas")).toHaveAttribute("data-room", target);
    }
    async function finishDialogue() {
      await expect(
        page.getByRole("dialog", { name: "Dialogue", exact: true }),
      ).toBeVisible();
      await expect
        .poll(async () => !!(await state()).runtime.dialogue)
        .toBe(true);
      for (
        let guard = 0;
        guard < 120 && (await state()).runtime.dialogue;
        guard++
      ) {
        if ((await state()).error)
          throw Error(
            "Dialogue interrompu par la sauvegarde : " + (await state()).error,
          );
        const before = JSON.stringify((await state()).runtime.dialogue);
        if (info.project.name === "mobile")
          await page.locator(".dialogue-choices button").first().tap();
        else await page.locator(".dialogue-choices button").first().click();
        await expect
          .poll(async () => JSON.stringify((await state()).runtime.dialogue))
          .not.toBe(before);
      }
      if ((await state()).runtime.dialogue)
        throw Error("Dialogue non terminable : " + browserErrors.join(" ; "));
    }
    async function solve(p: Puzzle) {
      const dialog = page.getByRole("dialog", {
        name: "Activité narrative",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      if (!puzzleReloaded) {
        const beforePartial = JSON.stringify(
          (await state()).runtime.flow.drafts,
        );
        if (p.kind === "circuit")
          await dialog
            .getByRole("button", { name: p.items[0].label, exact: true })
            .click();
        if (p.kind === "selection")
          await dialog
            .getByRole("checkbox", {
              name: p.items.find((i) => i.id === p.answer![0])!.label,
              exact: true,
            })
            .check();
        if (p.kind === "matching") {
          const [id, value] = Object.entries(p.matches!)[0];
          await dialog
            .getByRole("combobox", {
              name: p.items.find((i) => i.id === id)!.label,
              exact: true,
            })
            .selectOption(value);
        }
        if (p.kind === "order")
          await dialog
            .getByRole("button", {
              name: `Descendre ${p.items.find((i) => i.id === (p.initial ?? p.items.map((i) => i.id))[0])!.label}`,
              exact: true,
            })
            .click();
        if (p.kind === "sequence")
          await dialog
            .getByRole("button", {
              name: p.items.find((i) => i.id === p.answer![0])!.label,
              exact: true,
            })
            .click();
        if (p.kind === "cooking")
          await dialog
            .getByRole("button", {
              name: `Ajouter ${p.items[0].label}`,
              exact: true,
            })
            .click();
        await expect
          .poll(async () => JSON.stringify((await state()).runtime.flow.drafts))
          .not.toBe(beforePartial);
        await resumeInPlace();
        await expect(dialog).toBeVisible();
        puzzleReloaded = true;
      }
      await capture(`activity-${p.kind}`);
      const runtime = (await state()).runtime.flow;
      const draft = Object.entries(runtime.drafts).find(([key]) =>
        key.endsWith("/" + runtime.active),
      )![1] as {
        order: string[];
        rotations: number[];
        sequence: string[];
        values: Record<string, number>;
      };
      if (p.kind === "selection")
        for (const id of p.answer!)
          await dialog
            .getByRole("checkbox", {
              name: p.items.find((i) => i.id === id)!.label,
              exact: true,
            })
            .check();
      if (p.kind === "matching")
        for (const [id, value] of Object.entries(p.matches!))
          await dialog
            .getByRole("combobox", {
              name: p.items.find((i) => i.id === id)!.label,
              exact: true,
            })
            .selectOption(value);
      if (p.kind === "sequence")
        for (const id of p.answer!.slice(draft.sequence.length))
          await dialog
            .getByRole("button", {
              name: p.items.find((i) => i.id === id)!.label,
              exact: true,
            })
            .click();
      if (p.kind === "order") {
        const order = [...draft.order];
        for (let i = 0; i < p.answer!.length; i++) {
          const id = p.answer![i];
          while (order.indexOf(id) > i) {
            const j = order.indexOf(id);
            await dialog
              .getByRole("button", {
                name: `Monter ${p.items.find((v) => v.id === id)!.label}`,
                exact: true,
              })
              .click();
            [order[j - 1], order[j]] = [order[j], order[j - 1]];
          }
        }
      }
      if (p.kind === "circuit") {
        // A deterministic solution of this private fixture, not an event injected into the game.
        for (let i = 0; i < p.items.length; i++)
          for (let turn = 0; turn < (4 - draft.rotations[i]) % 4; turn++)
            await dialog
              .getByRole("button", { name: p.items[i].label, exact: true })
              .click();
      }
      if (p.kind === "cooking") {
        for (const [id, q] of Object.entries(p.quantities!))
          for (
            let i = 0;
            i < (q.target - (draft.values[id] ?? 0)) / q.step;
            i++
          )
            await dialog
              .getByRole("button", {
                name: `Ajouter ${p.items.find((v) => v.id === id)!.label}`,
                exact: true,
              })
              .click();
        for (let i = 0; i < (p.mix ?? 5); i++)
          await dialog
            .getByRole("button", { name: "Mélanger", exact: true })
            .click();
        for (let i = 0; i < Math.ceil((p.golden?.[0] ?? 60) / 10); i++)
          await dialog
            .getByRole("button", {
              name: "Encore un peu de cuisson",
              exact: true,
            })
            .click();
      }
      const confirm = dialog.getByRole("button", {
        name: p.kind === "cooking" ? "Sortir les biscuits" : "Vérifier",
        exact: true,
      });
      if (info.project.name === "mobile") await confirm.tap();
      else await confirm.click();
      await expect(dialog).toBeHidden();
    }
    async function capture(id: string) {
      expect(
        await page
          .locator("canvas")
          .evaluate((c) => JSON.parse(c.dataset.missingTextures ?? "[]")),
      ).toEqual([]);
      const dir = process.env.ETB_PRODUCTION_CAPTURE_DIR;
      if (!dir) return;
      mkdirSync(dir, { recursive: true });
      await page.evaluate(async () => {
        await Promise.all(
          document
            .getAnimations()
            .filter(
              (a) => a.effect?.getComputedTiming().iterations !== Infinity,
            )
            .map((a) => a.finished.catch(() => undefined)),
        );
      });
      await page.screenshot({
        path: join(
          dir,
          `${info.project.name}-${canonical ? "canonical-" : ""}day-${day}-${id}.png`,
        ),
      });
    }
    try {
      await page.addInitScript("window.__name=f=>f");
      await page.goto("/");
      await page
        .getByRole("button", { name: /Entrer dans le village/ })
        .click();
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-room",
        "village",
        { timeout: 30000 },
      );
      await page.getByRole("button", { name: /Continuer/ }).click();
      await loginFixture(page);
      if (!canonical)
        await page
          .getByRole("button", {
            name: "Mode développeur : tester les 24 journées",
            exact: true,
          })
          .click();
      await page
        .getByRole("button", { name: `Ouvrir le jour ${day}`, exact: true })
        .click();
      await expect
        .poll(async () => !!(await state()), { timeout: 30000 })
        .toBe(true);
      let reloaded = false;
      for (let index = 0; index < script.scenes.length; index++) {
        const s = script.scenes[index];
        if (s.flow?.optional) break;
        for (const a of s.flow!.actions) {
          if (!a.anyRoom) await moveRoom(a.point.room);
          await expect
            .poll(
              async () =>
                (await state()).targets?.some(
                  (t: { id: string }) => t.id === `narrative:flow:${a.id}`,
                ),
              { timeout: a.waitForGather ? 90000 : 15000 },
            )
            .toBe(true);
          if (a.waitForGather)
            await expect
              .poll(
                async () =>
                  (await state()).targets.some(
                    (t: { id: string }) => t.id === `narrative:flow:${a.id}`,
                  ),
                { timeout: 90000 },
              )
              .toBe(true);
          const t = (await state()).targets.find(
            (t: { id: string }) => t.id === `narrative:flow:${a.id}`,
          );
          if (!t) throw Error(`Objectif technique inaccessible ${index}`);
          await walk(t);
          // A resident may finish a step while the player approaches. Check the
          // actual visible interaction, then approach its freshly measured point.
          for (let retry = 0; retry < 3; retry++) {
            try {
              await expect(page.locator("button.interaction")).toContainText(
                a.label,
                { timeout: 2000 },
              );
              break;
            } catch (error) {
              if (retry === 2) throw error;
              const current = (await state()).targets.find(
                (v: { id: string }) => v.id === `narrative:flow:${a.id}`,
              );
              if (!current)
                throw Error("Interaction narrative momentanément inaccessible", { cause: error });
              await walk(current);
            }
          }
          await interact();
          if (a.gesture) await interact();
          if (a.puzzle) await solve(a.puzzle);
          if (a.dialogue) await finishDialogue();
          if (a.effect === "restore")
            await expect
              .poll(async () => (await state()).runtime.restored, {
                timeout: 10000,
              })
              .toBe(true);
          await expect
            .poll(async () => (await state()).saving, { timeout: 15000 })
            .toBe(false);
          if (!reloaded && index === 0) {
            await resumeInPlace();
            reloaded = true;
          }
        }
        await capture(`stage-${index}`);
        console.log(`Recette : jour ${day}, scène ${index + 1} parcourue.`);
      }
      await expect
        .poll(async () => (await state()).complete, { timeout: 10000 })
        .toBe(true);
      const restored = (await state()).restored;
      const optional = script.scenes.at(-1)!;
      if (optional.flow?.optional)
        for (const action of optional.flow.actions) {
          for (let repeat = 0; repeat < (action.replayable ? 2 : 1); repeat++) {
            if (!action.anyRoom) await moveRoom(action.point.room);
            const target = (await state()).targets.find(
              (t: { id: string }) => t.id === `narrative:flow:${action.id}`,
            );
            if (!target) throw Error("Activité facultative inaccessible");
            await walk(target);
            await interact();
            if (action.gesture) await interact();
            if (action.puzzle) await solve(action.puzzle);
            if (action.dialogue) await finishDialogue();
            await expect
              .poll(async () => (await state()).saving, { timeout: 15000 })
              .toBe(false);
            expect((await state()).complete).toBe(true);
            expect((await state()).restored).toBe(restored);
          }
        }
      await capture("optional");
      expect((await backend.canonical()).length).toBe(canonical ? day : 0);
      if (canonical) expect((await state()).restored).toBe(day);
      const performanceSample = await page.evaluate(
        () =>
          new Promise<{ frames: number; p50: number; p95: number }>(
            (resolve) => {
              const samples: number[] = [];
              let previous = performance.now();
              const tick = (now: number) => {
                samples.push(now - previous);
                previous = now;
                if (samples.length < 120) requestAnimationFrame(tick);
                else {
                  samples.sort((a, b) => a - b);
                  resolve({
                    frames: samples.length,
                    p50: samples[60],
                    p95: samples[114],
                  });
                }
              };
              requestAnimationFrame(tick);
            },
          ),
      );
      if (process.env.ETB_PRODUCTION_CAPTURE_DIR)
        writeFileSync(
          join(
            process.env.ETB_PRODUCTION_CAPTURE_DIR,
            `${info.project.name}-day-${day}-performance.json`,
          ),
          JSON.stringify(performanceSample),
        );
      await backend.verify();
    } finally {
      await backend.close();
    }
  });
