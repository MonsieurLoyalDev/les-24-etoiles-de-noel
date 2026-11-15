import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  startActivityGame,
  waitClip,
  traceActivity,
  activity,
} from "../e2e/activity-support";
import { navigateTo } from "../e2e/pathfinding";
import {
  installPrivateFixture,
  loginFixture,
  assertPNG,
  backend,
  authorization,
  recordActivity,
  capturePrivatePage,
} from "./fixtures";
const out = "docs/phase-e/e1-captures";
const hash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
test.beforeAll(() => mkdirSync(out, { recursive: true }));
test.afterEach(async ({ page }) => {
  if (
    (process.env.CI || process.env.ETB_PRIVATE_CANVAS) &&
    (await page.locator("canvas").count())
  ) {
    expect(
      await page
        .locator("canvas")
        .evaluate((c) => (c as HTMLCanvasElement).getContext("2d") !== null),
    ).toBe(true);
  }
});
test("E1 véritable build privé : chaque image et fonte existe, MIME et octets exacts", async ({
  page,
}) => {
  const info = await (await page.request.get("/build-info.json")).json();
  expect(info).toMatchObject({
    mode: "supabase",
    configured: true,
    captcha: true,
  });
  const assets = JSON.parse(
    readFileSync("ops/public-assets.json", "utf8"),
  ) as string[];
  for (const path of assets) {
    const r = await page.request.get("/" + path.slice(7));
    if (path.endsWith(".png")) await assertPNG(r);
    else {
      expect(r.status()).toBe(200);
      expect(r.headers()["content-type"]).toContain("font/ttf");
    }
    expect(hash(await r.body()), path).toBe(hash(readFileSync(path)));
  }
  const missing = await page.request.get(
    "/assets/e1-intentionally-missing.png",
  );
  // Vite preview can return HTML with status 200. It must fail our image check.
  await expect(assertPNG(missing)).rejects.toThrow();
  expect(
    (await page.request.get("/demo/surprise.webm")).headers()["content-type"],
  ).not.toContain("video/");
});
test("E1 Célestine privée : vraies poses, réduction et fauteuil", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  const fixture = await installPrivateFixture(page);
  for (const [clock, clip] of [
    [45000, "read"],
    [0, "sort"],
    [90000, "seatRead"],
  ] as const) {
    await startActivityGame(
      page,
      "library",
      clock,
      clip === "sort" ? { x: 650, y: 250 } : { x: 830, y: 370 },
    );
    await loginFixture(page);
    await expect(
      page.getByRole("button", { name: /Mode développeur/ }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Retour au village ×" }).click();
    await waitClip(page, "mira", clip);
    const trace = await recordActivity(page, "mira", 2200);
    expect(trace.some((s) => s.drawn?.texture === "activity-celestine")).toBe(
      true,
    );
    expect(
      new Set(trace.map((s) => s.drawn?.frame).filter(Boolean)).size,
    ).toBeGreaterThan(1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const restingFrame = {
      read: "pose-2",
      sort: "pose-10",
      seatRead: "pose-13",
    }[clip];
    await expect
      .poll(async () => (await activity(page, "mira"))?.drawn?.frame)
      .toBe(restingFrame);
    const reduced = await recordActivity(page, "mira", 600);
    expect(
      reduced.every(
        (s) =>
          s.drawn?.texture === "activity-celestine" &&
          s.drawn.frame === restingFrame,
      ),
    ).toBe(true);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await capturePrivatePage(
      page,
      `${out}/${info.project.name}-celestine-${clip}.png`,
    );
  }
  await fixture.verify();
});
test("E1 Célestine privée : interruption immédiate, clavier/tactile et reprise", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const fixture = await installPrivateFixture(page);
  // 50px from the reading point: outside the 43px approach pause, a short
  // walk away from interaction. Interrupt the nine-second activity first.
  await startActivityGame(page, "library", 45000, { x: 790, y: 324 });
  await loginFixture(page);
  await page.getByRole("button", { name: "Retour au village ×" }).click();
  await waitClip(page, "mira", "read");
  expect((await activity(page, "mira"))?.drawn?.texture).toBe(
    "activity-celestine",
  );
  await navigateTo(page, { x: 770, y: 324 });
  const talk = page.getByRole("button", { name: /Parler à Célestine/ });
  await expect(talk).toBeVisible();
  await expect(talk).toBeEnabled();
  if (info.project.name === "mobile") {
    const box = (await talk.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  } else await page.keyboard.press("e");
  const goodbye = page.getByRole("button", { name: "À bientôt", exact: true });
  await expect(goodbye).toBeVisible();
  await expect
    .poll(async () => (await activity(page, "mira"))?.phase)
    .toBe("interrupted");
  expect((await activity(page, "mira"))?.object).toBeNull();
  const actor = () =>
    page
      .locator("canvas")
      .evaluate((c) =>
        JSON.parse(c.dataset.livingWorld!).actors.find(
          (a: { id: string }) => a.id === "mira",
        ),
      );
  await expect
    .poll(async () => (await actor())?.state)
    .toBe("TALKING_TO_PLAYER");
  const paused = await actor();
  await page.waitForTimeout(500);
  expect(await actor()).toEqual(paused);
  await capturePrivatePage(page, `${out}/${info.project.name}-dialogue.png`);
  if (info.project.name === "mobile") {
    const box = (await goodbye.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await goodbye.focus();
    await page.keyboard.press("Enter");
  }
  await expect(goodbye).toHaveCount(0);
  await navigateTo(page, { x: 830, y: 370 });
  await expect
    .poll(async () => {
      const a = await activity(page, "mira"),
        resident = await actor();
      return (
        !!a &&
        !a.interrupted &&
        a.phase !== "interrupted" &&
        !!resident &&
        resident.state !== "TALKING_TO_PLAYER" &&
        !resident.nearPlayer
      );
    })
    .toBe(true);
  await fixture.verify();
});

test("E1 Émile privé : vraie lettre déposée, aucune texture de secours", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const fixture = await installPrivateFixture(page);
  // Observe the morning stop, leaving enough time for a full delivery before
  // the next scheduled period. Do not alter the resident's existing routine.
  await startActivityGame(page, "village", 0, { x: 260, y: 500 });
  await loginFixture(page);
  await page.getByRole("button", { name: "Retour au village ×" }).click();
  await waitClip(page, "emile", "delivery");
  const recording = recordActivity(page, "emile", 8000);
  await expect
    .poll(async () => {
      const a = await activity(page, "emile");
      return a?.object === "letter" && a.drawn?.texture === "activity-emile";
    })
    .toBe(true);
  await capturePrivatePage(page, `${out}/${info.project.name}-emile.png`);
  const trace = await recording;
  await info.attach("emile-cycle", {
    body: Buffer.from(JSON.stringify(trace)),
    contentType: "application/json",
  });
  expect(
    trace.some(
      (s) => s.object === "letter" && s.drawn?.texture === "activity-emile",
    ),
  ).toBe(true);
  const deposited = trace.findIndex((s) => s.frame === 5);
  expect(deposited).toBeGreaterThan(0);
  const finished = trace.findIndex((s, i) => i > deposited && s.frame === 7);
  expect(finished).toBeGreaterThan(deposited);
  // Bound the assertion to this delivery, not a subsequent routine cycle.
  expect(
    trace.slice(deposited, finished + 1).every((s) => s.object !== "letter"),
  ).toBe(true);
  await fixture.verify();
});
test("E1 Augustin privé : vraies poses et lumière existante synchronisée", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const fixture = await installPrivateFixture(page);
  await startActivityGame(page, "village", 90000, { x: 1120, y: 900 });
  await loginFixture(page);
  await page.getByRole("button", { name: "Retour au village ×" }).click();
  await waitClip(page, "noe", "light");
  const trace = await traceActivity(page, "noe", 5000);
  expect(
    trace.some(
      (s) => s.drawn?.texture === "activity-augustin" && s.frame === 4,
    ),
  ).toBe(true);
  const lamp = await page
    .locator("canvas")
    .evaluate((c) =>
      JSON.parse(c.dataset.activityLanterns!).find(
        (l: { id: string }) => l.id === "plaza-evening-lantern",
      ),
    );
  expect(lamp).toMatchObject({ on: true, level: 1, commits: 1 });
  await capturePrivatePage(page, `${out}/${info.project.name}-augustin.png`);
  await fixture.verify();
});
test("E1 joueur privé : calendrier daté, aucun aperçu/admin ni média futur accessible", async ({
  page,
}) => {
  const fixture = await installPrivateFixture(page);
  await startActivityGame(page, "house", 45000, { x: 300, y: 270 });
  await loginFixture(page);
  await expect(
    page.getByRole("button", { name: "Ouvrir le jour 1", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Ouvrir le jour 24", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", {
      name: /Mode développeur|Administration des surprises/,
    }),
  ).toHaveCount(0);
  const denied = await page.evaluate(
    async ({ backend, headers }) => {
      const checks: [string, unknown][] = [
        ["/rest/v1/rpc/advent_day", { p_day: 24, p_preview: false }],
        ["/rest/v1/rpc/advent_day", { p_day: 24, p_preview: true }],
        ["/rest/v1/rpc/advent_status", { p_preview: true }],
        ["/rest/v1/rpc/advent_admin_get", { p_day: 1 }],
        [
          "/storage/v1/object/sign/advent-media/24/future.png",
          { expiresIn: 300 },
        ],
      ];
      return Promise.all(
        checks.map(async ([path, body]) => {
          const r = await fetch(backend + path, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          return r.status;
        }),
      );
    },
    { backend, headers: authorization },
  );
  expect(denied).toEqual([403, 403, 403, 403, 403]);
  const media = await page.evaluate(
    async ({ backend, headers }) => {
      const signed = await (
        await fetch(
          backend + "/storage/v1/object/sign/advent-media/1/open.png",
          {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ expiresIn: 300 }),
          },
        )
      ).json();
      const r = await fetch(backend + "/storage/v1" + signed.signedURL);
      return { status: r.status, type: r.headers.get("content-type") };
    },
    { backend, headers: authorization },
  );
  expect(media).toEqual({ status: 200, type: "image/png" });
  await fixture.verify();
});
test("E1 administrateur : aperçu autorisé et progression live distincte", async ({
  page,
}) => {
  const fixture = await installPrivateFixture(page, "admin");
  await startActivityGame(page, "house", 45000, { x: 300, y: 270 });
  await loginFixture(page);
  await page.getByRole("button", { name: /Mode développeur : tester/ }).click();
  await expect(
    page.getByRole("button", { name: "Ouvrir le jour 24", exact: true }),
  ).toBeEnabled();
  const previewDay = await page.evaluate(
    async ({ backend, headers }) =>
      (
        await fetch(backend + "/rest/v1/rpc/advent_day", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ p_day: 24, p_preview: true }),
        })
      ).json(),
    { backend, headers: authorization },
  );
  expect(previewDay.title).toBe("FUTURE_FIXTURE_ADMIN_ONLY");
  const live = await page.evaluate(
    async ({ backend, headers }) => {
      const rpc = async (name: string, args: unknown) =>
        (
          await fetch(backend + "/rest/v1/rpc/" + name, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(args),
          })
        ).json();
      const r = await rpc("advent_start", { p_day: 1, p_preview: true });
      await rpc("advent_check_step", {
        p_day: 1,
        p_preview: true,
        p_run: r.runId,
        p_step: "note",
        p_value: ["1"],
      });
      return rpc("advent_status", { p_preview: false });
    },
    { backend, headers: authorization },
  );
  expect(live[0].complete).toBe(false);
  expect(fixture.runs.get("true:1")?.complete).toBe(true);
  await fixture.verify();
});
test("E1 anonyme et compte non invité restent refusés", async ({ page }) => {
  const fixture = await installPrivateFixture(page, "outsider");
  await startActivityGame(page, "house", 45000, { x: 300, y: 270 });
  const anonymous = await page.evaluate(
    async (backend) =>
      (
        await fetch(backend + "/rest/v1/rpc/advent_day", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ p_day: 1, p_preview: false }),
        })
      ).status,
    backend,
  );
  expect(anonymous).toBe(403);
  await page.getByRole("button", { name: "✦ Avent 2026", exact: true }).click();
  await page.getByLabel("Adresse e-mail").fill("player@example.invalid");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("fixture-password-not-real");
  await page.getByRole("button", { name: "CAPTCHA fictif E1" }).click();
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("pas invité");
  await expect(
    page.getByRole("button", { name: "Ouvrir le jour 1", exact: true }),
  ).toHaveCount(0);
  await fixture.verify();
});
