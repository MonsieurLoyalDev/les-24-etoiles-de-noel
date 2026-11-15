import { expect, type Page, type APIResponse } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { ActivityView } from "../e2e/activity-support";

// Sample in the browser while screenshots/driver calls run. A short pose must
// not disappear just because the test process is busy encoding a screenshot.
export function recordActivity(page: Page, id: string, ms: number) {
  return page.evaluate(
    ({ id, ms }) =>
      new Promise<ActivityView[]>((resolve) => {
        const trace: ActivityView[] = [],
          start = performance.now();
        const sample = () => {
          const canvas = document.querySelector("canvas");
          const state = (
            JSON.parse(canvas?.dataset.activities ?? "[]") as ActivityView[]
          ).find((s) => s.actor === id);
          if (state) trace.push(state);
          if (performance.now() - start >= ms) resolve(trace);
          else setTimeout(sample, 50);
        };
        sample();
      }),
    { id, ms },
  );
}
export const backend = "https://example.supabase.co";
const id = "00000000-0000-4000-8000-000000000002";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  Buffer.from(
    JSON.stringify({
      sub: id,
      role: "authenticated",
      aud: "authenticated",
      exp: 4102444800,
    }),
  ).toString("base64url") +
  ".fixture-signature-not-a-real-token";
export const authorization = {
  apikey: "sb_publishable_fixture_not_real",
  Authorization: "Bearer " + token,
};
export const fixtureDay = {
  day: 1,
  title: "Journée de recette — fictive",
  intro: "Donnée fictive E.1, sans souvenir personnel.",
  room: "house",
  reward: "Étoile fictive de recette",
  version: 1,
  steps: [
    {
      id: "note",
      kind: "read",
      prompt: "Ouvrir la carte de recette",
      items: [{ id: "1", label: "Bienvenue dans la recette privée fictive." }],
    },
  ],
};
export async function installPrivateFixture(
  page: Page,
  role: "player" | "admin" | "outsider" = "player",
) {
  const violations: string[] = [],
    errors: string[] = [],
    images: Promise<void>[] = [];
  let loggedIn = false;
  const runs = new Map<
    string,
    {
      day: number;
      runId: string;
      contentVersion: number;
      checked: string[];
      complete: boolean;
      completedAt: string | null;
      values: Record<string, unknown>;
      memory: Record<string, unknown>;
    }
  >();
  const user = {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: "player@example.invalid",
    created_at: "2026-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
  };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      /Failed to process file|File failed:|Texture.*not found/i.test(m.text())
    )
      errors.push(m.text());
  });
  page.on("response", (r) => {
    if (
      new URL(r.url()).origin === "http://127.0.0.1:5191" &&
      /\.(png|ttf)$/.test(new URL(r.url()).pathname)
    )
      images.push(
        (async () => {
          const contentType = r.headers()["content-type"];
          if (
            r.status() !== 200 ||
            !contentType?.includes(
              r.url().endsWith(".png") ? "image/png" : "font/ttf",
            )
          )
            errors.push("Bad resource response: " + new URL(r.url()).pathname);
        })(),
      );
  });
  await page.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.origin === "http://127.0.0.1:5191") return route.continue();
    if (
      url.origin === "https://challenges.cloudflare.com" &&
      url.pathname === "/turnstile/v0/api.js"
    )
      return route.fulfill({
        contentType: "application/javascript",
        body: `window.turnstile={render:(el,o)=>{const b=document.createElement('button');b.type='button';b.textContent='CAPTCHA fictif E1';b.onclick=()=>o.callback('fixture-token-not-real');el.append(b);return 'fixture';},remove:()=>{}};`,
      });
    if (url.origin !== backend) {
      violations.push("Unexpected external origin: " + url.origin);
      return route.abort();
    }
    const cors = {
      "access-control-allow-origin": "http://127.0.0.1:5191",
      "access-control-allow-headers":
        "authorization,apikey,content-type,x-client-info,x-supabase-api-version",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    };
    const reply = (status: number, value: unknown) =>
      route.fulfill({
        status,
        headers: cors,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers: cors });
    if (
      req.method() === "GET" &&
      url.pathname === "/storage/v1/object/sign/advent-media/1/open.png" &&
      url.searchParams.get("token") === "fixture-media-not-real"
    )
      return route.fulfill({
        status: 200,
        headers: cors,
        contentType: "image/png",
        body: readFileSync("public/assets/ground/ground.png"),
      });
    if (url.pathname === "/auth/v1/token" && req.method() === "POST") {
      const body = req.postDataJSON();
      if (
        url.searchParams.get("grant_type") !== "password" ||
        body.email !== user.email ||
        body.password !== "fixture-password-not-real" ||
        body.gotrue_meta_security?.captcha_token !== "fixture-token-not-real"
      )
        return reply(400, { message: "Invalid fixture credentials/CAPTCHA" });
      loggedIn = true;
      return reply(200, {
        access_token: token,
        refresh_token: "fixture-refresh-not-real",
        token_type: "bearer",
        expires_in: 3600,
        user,
      });
    }
    const authenticated =
      loggedIn && req.headers().authorization === "Bearer " + token;
    if (url.pathname === "/auth/v1/user")
      return reply(
        authenticated ? 200 : 401,
        authenticated ? user : { message: "Fixture authentication required" },
      );
    if (!authenticated || role === "outsider")
      return reply(403, { message: "Fixture member required" });
    if (
      url.pathname === "/rest/v1/app_members" &&
      req.method() === "GET" &&
      url.searchParams.get("user_id") === "eq." + id
    )
      return reply(200, { role });
    if (url.pathname === "/rest/v1/app_members")
      return reply(403, { message: "Fixture membership writes forbidden" });
    if (
      url.pathname === "/storage/v1/object/sign/advent-media/1/open.png" &&
      req.method() === "POST"
    )
      return reply(200, {
        signedURL:
          "/object/sign/advent-media/1/open.png?token=fixture-media-not-real",
      });
    if (url.pathname.startsWith("/storage/v1/object/"))
      return reply(403, {
        message: "Fixture media denied; no signed URL issued",
      });
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(advent_[a-z_]+)$/)?.[1];
    if (!rpc || req.method() !== "POST") {
      violations.push(
        "Unexpected fixture endpoint: " + req.method() + " " + url.pathname,
      );
      return reply(404, { message: "Unimplemented fixture endpoint" });
    }
    const body = req.postDataJSON(),
      preview = body.p_preview ?? false;
    const rpcArgs: Record<string, string[]> = {
      advent_status: ["p_preview"],
      advent_day: ["p_day", "p_preview"],
      advent_start: ["p_day", "p_preview", "p_replay"],
      advent_check_step: ["p_day", "p_run", "p_step", "p_value", "p_preview"],
      advent_admin_get: ["p_day"],
      advent_admin_save: ["p_content", "p_rules"],
    };
    if (
      !rpcArgs[rpc] ||
      Object.keys(body).some((key) => !rpcArgs[rpc].includes(key))
    ) {
      violations.push("Unexpected fixture RPC arguments: " + rpc);
      return reply(400, { message: "Fixture RPC contract mismatch" });
    }
    if (typeof preview !== "boolean" || (preview && role !== "admin"))
      return reply(403, { message: "Fixture admin preview required" });
    if (rpc.startsWith("advent_admin_")) {
      if (role !== "admin")
        return reply(403, { message: "Fixture admin required" });
      if (rpc === "advent_admin_get" && body.p_day === 1)
        return reply(200, {
          content: fixtureDay,
          rules: { note: { minimum: 1 } },
        });
      return reply(400, {
        message: "Fixture does not allow edits or future admin content",
      });
    }
    if (rpc === "advent_status")
      return reply(
        200,
        Array.from({ length: 24 }, (_, i) => ({
          day: i + 1,
          unlocked: preview || i === 0,
          complete: runs.get(`${preview}:${i + 1}`)?.complete ?? false,
          run: runs.get(`${preview}:${i + 1}`) ?? null,
        })),
      );
    if (
      rpc === "advent_day" &&
      body.p_day === 24 &&
      preview &&
      role === "admin"
    )
      return reply(200, {
        ...fixtureDay,
        day: 24,
        title: "FUTURE_FIXTURE_ADMIN_ONLY",
      });
    if (body.p_day !== 1)
      return reply(403, { message: "Fixture future day denied" });
    if (rpc === "advent_day") return reply(200, fixtureDay);
    const key = `${preview}:1`;
    if (rpc === "advent_start") {
      if (!runs.has(key) || body.p_replay)
        runs.set(key, {
          day: 1,
          runId: preview
            ? "00000000-0000-4000-8000-000000000004"
            : "00000000-0000-4000-8000-000000000005",
          contentVersion: 1,
          checked: [],
          complete: runs.get(key)?.complete ?? false,
          completedAt: runs.get(key)?.completedAt ?? null,
          values: {},
          memory: runs.get(key)?.memory ?? {},
        });
      return reply(200, runs.get(key));
    }
    if (rpc === "advent_check_step") {
      const run = runs.get(key);
      if (!run || body.p_run !== run.runId)
        return reply(409, { message: "Fixture run mismatch" });
      const accepted =
        body.p_step === "note" && JSON.stringify(body.p_value) === '["1"]';
      if (accepted)
        Object.assign(run, {
          checked: ["note"],
          complete: true,
          completedAt: "2026-12-01T00:00:00Z",
          values: { note: body.p_value },
          memory: { note: body.p_value },
        });
      return reply(200, { accepted, run });
    }
    violations.push("Unknown fixture RPC: " + rpc);
    return reply(404, { message: "Unknown fixture RPC" });
  });
  return {
    async verify() {
      await Promise.all(images);
      expect(violations).toEqual([]);
      expect(errors).toEqual([]);
    },
    runs,
  };
}
export async function loginFixture(page: Page) {
  await page.getByRole("button", { name: "✦ Avent 2026", exact: true }).click();
  const login = page.getByRole("button", { name: "Se connecter", exact: true });
  await expect(
    login.or(
      page.getByRole("heading", { name: "24 journées à vivre ensemble" }),
    ),
  ).toBeVisible({ timeout: 15000 });
  if (await login.isVisible()) {
    await page.getByLabel("Adresse e-mail").fill("player@example.invalid");
    await page
      .getByLabel("Mot de passe", { exact: true })
      .fill("fixture-password-not-real");
    await page.getByRole("button", { name: "CAPTCHA fictif E1" }).click();
    await login.click();
  }
  await expect(
    page.getByRole("heading", { name: "24 journées à vivre ensemble" }),
  ).toBeVisible();
}
export async function assertPNG(response: APIResponse) {
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  expect((await response.body()).subarray(0, 8).toString("hex")).toBe(
    "89504e470d0a1a0a",
  );
}
