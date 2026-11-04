import { test, expect } from "@playwright/test";
test("jeu privé sous HTTPS/CSP, reprise A/B et connexion protégée", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    (r) =>
      r.fulfill({
        contentType: "application/javascript",
        body: `window.turnstile={render:(el,o)=>{const b=document.createElement('button');b.type='button';b.textContent='Valider le CAPTCHA de test';b.onclick=()=>o.callback('fixture-one-use-token');el.append(b);return 'fixture';},remove:()=>{}};`,
      }),
  );
  await page.route(
    "https://example.supabase.co/auth/v1/token?grant_type=password",
    (r) => {
      const body = r.request().postDataJSON();
      expect(body.gotrue_meta_security.captcha_token).toBe(
        "fixture-one-use-token",
      );
      return r.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          code: "over_request_rate_limit",
          msg: "rate limit fixture",
        }),
      });
    },
  );
  await page.goto("/");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open("etoilebois", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("saves");
      r.onerror = () => reject(r.error);
      r.onsuccess = () => {
        const t = r.result.transaction("saves", "readwrite");
        t.objectStore("saves").put(
          { version: 1, stage: 4, room: "house", position: { x: 300, y: 270 } },
          "phase-a",
        );
        t.oncomplete = () => {
          r.result.close();
          resolve();
        };
      };
    });
  });
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "house", {
    timeout: 20000,
  });
  await expect
    .poll(
      async () => {
        await page.keyboard.down("ArrowRight");
        await page.waitForTimeout(200);
        await page.keyboard.up("ArrowRight");
        return Number(
          await page.locator("canvas").getAttribute("data-player-x"),
        );
      },
      { timeout: 10000 },
    )
    .toBeGreaterThan(300);
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            new Promise<number>((resolve, reject) => {
              const r = indexedDB.open("etoilebois", 1);
              r.onerror = () => reject(r.error);
              r.onsuccess = () => {
                const db = r.result,
                  q = db
                    .transaction("saves")
                    .objectStore("saves")
                    .get("phase-b");
                q.onsuccess = () => {
                  db.close();
                  resolve(q.result?.position?.x ?? 0);
                };
                q.onerror = () => reject(q.error);
              };
            }),
        ),
      { timeout: 10000 },
    )
    .toBeGreaterThan(300);
  await page.reload();
  await page.getByRole("button", { name: /Entrer dans le village/ }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "house", {
    timeout: 20000,
  });
  expect(
    Number(await page.locator("canvas").getAttribute("data-player-x")),
  ).toBeGreaterThan(300);
  await page.getByRole("button", { name: "✦ Avent 2026" }).click();
  await expect(
    page.getByRole("button", { name: "Se connecter", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Adresse e-mail").fill("fixture@example.invalid");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("fixture-password");
  await page
    .getByRole("button", { name: "Valider le CAPTCHA de test" })
    .click();
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Trop de tentatives");
  await expect(
    page.getByRole("button", { name: "Se connecter", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
