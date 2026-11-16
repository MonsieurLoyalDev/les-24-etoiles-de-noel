import { test, expect } from "@playwright/test";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { technicalEpisode } from "../fixtures/narrative";
import { installPrivateFixture, loginFixture, authorization } from "./fixtures";
import { navigateTo } from "../e2e/pathfinding";

test("narration du build privé : RPC réelles isolées, choix et reprise", async ({
  page,
}) => {
  test.setTimeout(180000);
  const fixture = await installPrivateFixture(page),
    pg = new PGlite();
  const id = "00000000-0000-4000-8000-000000000002",
    admin = "00000000-0000-4000-8000-000000000011",
    content = technicalEpisode();
  try {
    await pg.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated,anon;grant select,insert,update,delete on storage.objects to authenticated;insert into auth.users values('${admin}'),('${id}');`,
    );
    for (const file of [
      "202611030001_advent.sql",
      "202611160001_narrative.sql",
    ])
      await pg.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    await pg.exec(
      `insert into public.app_members values('${admin}','admin'),('${id}','player');create or replace function private.server_now() returns timestamptz language sql stable set search_path='' as $$select '2026-12-01T01:00:00Z'::timestamptz$$;`,
    );
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [
      admin,
    ]);
    await pg.query("select public.episode_admin_put($1::jsonb)", [
      JSON.stringify(content),
    ]);
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await pg.exec("set role authenticated");
    const calls: string[] = [];
    await page.route("**/rest/v1/rpc/episode_*", async (route) => {
      const request = route.request(),
        name = new URL(request.url()).pathname.split("/").pop()!;
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
      };
      if (request.method() === "OPTIONS")
        return route.fulfill({ status: 200, headers, body: "" });
      expect(request.method()).toBe("POST");
      expect(request.headers().authorization).toBe(authorization.Authorization);
      expect(request.headers().apikey).toBe(authorization.apikey);
      const body = request.postDataJSON();
      const contracts: Record<
        string,
        { keys: string[]; query: string; args: unknown[] }
      > = {
        episode_status: {
          keys: ["p_preview"],
          query: "select public.episode_status($1) as value",
          args: [body.p_preview],
        },
        episode_load: {
          keys: ["p_day", "p_preview", "p_replay", "p_restart"],
          query: "select public.episode_load($1,$2,$3,$4) as value",
          args: [body.p_day, body.p_preview, body.p_replay, body.p_restart],
        },
        episode_save: {
          keys: ["p_day", "p_preview", "p_run", "p_expected", "p_progress"],
          query:
            "select public.episode_save($1,$2,$3::uuid,$4,$5::jsonb) as value",
          args: [
            body.p_day,
            body.p_preview,
            body.p_run,
            body.p_expected,
            JSON.stringify(body.p_progress),
          ],
        },
      };
      const contract = contracts[name];
      expect(contract).toBeTruthy();
      expect(Object.keys(body).sort()).toEqual(contract.keys.sort());
      calls.push(name);
      try {
        const result = await pg.query<{ value: unknown }>(
          contract.query,
          contract.args,
        );
        await route.fulfill({
          status: 200,
          headers,
          contentType: "application/json",
          body: JSON.stringify(result.rows[0].value),
        });
      } catch (e) {
        await route.fulfill({
          status: 409,
          headers,
          contentType: "application/json",
          body: JSON.stringify({ message: String(e) }),
        });
      }
    });
    await page.addInitScript("window.__name=f=>f");
    await page.goto("/");
    await page.getByRole("button", { name: /Entrer dans le village/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    await loginFixture(page);
    await page
      .getByRole("button", { name: "Aventure narrative", exact: true })
      .click();
    await expect(page.getByLabel("Importer un cahier narratif")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Commencer l’épisode 2", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Commencer l’épisode 1", exact: true })
      .click();
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
    await expect(page.locator(".dialogue-content p")).toHaveText(
      content.scenes[0].dialogues.welcome[0].text,
    );
    await page
      .getByRole("button", {
        name: content.scenes[0].choices[0].options[1].label,
        exact: true,
      })
      .click();
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
    expect(calls).toContain("episode_save");
    await fixture.verify();
  } finally {
    await pg.close();
  }
});
