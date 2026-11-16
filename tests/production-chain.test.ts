import { it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { technicalProductionEpisode } from "./fixtures/production";
import { technicalEpisode } from "./fixtures/narrative";
import { completedEpisodeSnapshots } from "./fixtures/complete-episode";
import { validateScript } from "../src/narrative/script";
it("enchaîne six épisodes par les vrais RPC, transporte le Livre et conserve le verrou du suivant", async () => {
  const source = process.env.ETB_PRODUCTION_SOURCE_DIR;
  if (source && process.env.CI)
    throw Error("Scénarios privés interdits dans la CI publique");
  const pg = new PGlite(),
    admin = "00000000-0000-4000-8000-000000000011",
    player = "00000000-0000-4000-8000-000000000012";
  try {
    await pg.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;insert into auth.users values('${admin}'),('${player}');`,
    );
    for (const file of [
      "202611030001_advent.sql",
      "202611160001_narrative.sql",
      "202611160002_episode_calendar_contract.sql",
      "202611160003_production_activities.sql",
    ])
      await pg.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    await pg.query(
      "insert into public.app_members values($1,'admin'),($2,'player')",
      [admin, player],
    );
    await pg.exec(
      "create or replace function private.server_now() returns timestamptz language sql stable set search_path='' as $$select '2026-12-06T10:00:00Z'::timestamptz$$;",
    );
    const finished: number[] = [];
    for (let day = 1; day <= 6; day++) {
      const c = source
        ? validateScript(
            JSON.parse(
              readFileSync(
                day === 1
                  ? join(source, "../episode-01-e2.json")
                  : join(
                      source,
                      `episode-${String(day).padStart(2, "0")}.json`,
                    ),
                "utf8",
              ),
            ),
          )
        : day === 1
          ? technicalEpisode()
          : technicalProductionEpisode(day);
      await pg.exec("reset role");
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [
        admin,
      ]);
      await pg.query("select public.episode_admin_put($1::jsonb)", [
        JSON.stringify(c),
      ]);
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [
        player,
      ]);
      await pg.exec("set role authenticated");
      const session = (
        await pg.query<{
          s: { runId: string; context: { pages: { day: number }[] } };
        }>("select public.episode_load($1,false,false,false) as s", [day])
      ).rows[0].s;
      expect([...new Set(session.context.pages.map((p) => p.day))]).toEqual(
        finished,
      );
      let revision = -1;
      for (const p of completedEpisodeSnapshots(c, finished)) {
        const receipt = (
          await pg.query<{
            s: {
              revision: number;
              restored: boolean;
              completedAt: string | null;
            };
          }>(
            "select public.episode_save($1,false,$2::uuid,$3,$4::jsonb) as s",
            [day, session.runId, revision, JSON.stringify(p)],
          )
        ).rows[0].s;
        revision = receipt.revision;
      }
      const status = (
        await pg.query<{
          s: { day: number; restored: boolean; complete: boolean }[];
        }>("select public.episode_status(false) as s")
      ).rows[0].s;
      expect(status.find((s) => s.day === day)).toMatchObject({
        restored: true,
        complete: true,
      });
      finished.push(day);
    }
    const status = (
      await pg.query<{
        s: { day: number; restored: boolean; unlocked: boolean }[];
      }>("select public.advent_status(false) as s")
    ).rows[0].s;
    expect(status.filter((s) => s.restored)).toHaveLength(6);
    expect(status.find((s) => s.day === 7)?.unlocked).toBe(false);
    await expect(
      pg.query("select public.episode_load(7,false,false,false)"),
    ).rejects.toThrow();
  } finally {
    await pg.close();
  }
}, 30000);
