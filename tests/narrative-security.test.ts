import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { technicalEpisode } from "./fixtures/narrative";
import { initial } from "../src/domain";
import {
  startEpisode,
  receiveEvent,
  selectNarrativeChoice,
  finishScene,
} from "../src/narrative/engine";
import { initialRuntime, type EpisodeProgress } from "../src/narrative/script";
import { presentation } from "../src/narrative/orchestration";
const admin = "00000000-0000-4000-8000-000000000011",
  player = "00000000-0000-4000-8000-000000000012",
  outsider = "00000000-0000-4000-8000-000000000013";
let pg: PGlite;
let legacyRecord: unknown;
const content = technicalEpisode();
async function user(id: string, role = "authenticated") {
  await pg.exec("reset role");
  await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await pg.exec(`set role ${role}`);
}
async function now(iso: string) {
  await pg.exec("reset role");
  await pg.exec(
    `create or replace function private.server_now() returns timestamptz language sql stable set search_path='' as $$select '${iso}'::timestamptz$$;`,
  );
}
async function rpc<T = unknown>(call: string, args: unknown[] = []) {
  return (await pg.query<{ value: T }>(`select ${call} as value`, args)).rows[0]
    .value;
}
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated,anon;grant select,insert,update,delete on storage.objects to authenticated;insert into auth.users values('${admin}'),('${player}'),('${outsider}');`,
  );
  for (const file of [
    "202611030001_advent.sql",
    "202611160001_narrative.sql",
    "202611160002_episode_calendar_contract.sql",
  ]) {
    if (file === "202611160002_episode_calendar_contract.sql") {
      await pg.query(
        "insert into public.advent_days(day,content) values(1,$1::jsonb)",
        [JSON.stringify({ title: "Archive technique" })],
      );
      await pg.query(
        "insert into public.advent_progress(user_id,day,mode,content_version,checked,answers,memory,completed_at) values($1,1,'live',1,'[\"archive\"]','{\"archive\":true}','{\"souvenir\":\"fixture\"}','2026-12-01T00:00:00Z')",
        [player],
      );
      legacyRecord = (await pg.query("select * from public.advent_progress"))
        .rows[0];
    }
    await pg.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  await pg.query(
    "insert into public.app_members values($1,'admin'),($2,'player')",
    [admin, player],
  );
}, 30000);
afterAll(async () => {
  await pg?.close();
});
it("rejette les checkpoints avec curseurs ou positions forgés", async () => {
  await now("2026-12-01T01:00:00Z");
  await user(admin);
  await rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(content)]);
  const session = await rpc<{ runId: string }>(
    "public.episode_load(1,true,true,true)",
  );
  const p = {
    ...startEpisode(
      content,
      { day: 1, unlocked: true },
      { world: initial, completedDays: [] },
    ),
    runtime: initialRuntime(),
  };
  const badPresentation = {
    ...presentation(structuredClone(p)),
    location: {
      room: "unknown",
      position: { x: 0, y: 0 },
      loyal: { x: 0, y: 0 },
      flocon: null,
    },
  };
  for (const runtime of [
    { ...p.runtime, presentation: badPresentation },
    { ...p.runtime, dialogue: { block: "missing", beat: 0, actor: null } },
    { ...p.runtime, dialogue: { block: "welcome", beat: 99, actor: null } },
    { ...p.runtime, visited: ["unknown"] },
    { ...p.runtime, origin: { x: -20, y: 10 } },
    { ...p.runtime, cinematic: { kind: "restore", elapsed: 999999 } },
    {
      ...p.runtime,
      escort: { room: "village", phase: "out", position: { x: 99999, y: 1 } },
    },
  ])
    await expect(
      rpc("public.episode_save(1,true,$1::uuid,-1,$2::jsonb)", [
        session.runId,
        JSON.stringify({ ...p, runtime }),
      ]),
    ).rejects.toThrow("Checkpoint");
});
it("protège le contenu privé, les rôles et minuit Europe/Paris", async () => {
  await now("2026-11-30T22:59:59Z");
  await user(admin);
  await rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(content)]);
  await user("", "anon");
  await expect(rpc("public.episode_status(false)")).rejects.toThrow();
  await user(outsider);
  await expect(
    rpc("public.episode_load(1,false,false,false)"),
  ).rejects.toThrow();
  await user(player);
  await expect(
    rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(content)]),
  ).rejects.toThrow("Administrateur");
  await expect(rpc("public.episode_load(1,false,false,false)")).rejects.toThrow(
    "verrouillée",
  );
  await expect(rpc("public.episode_load(1,true,false,false)")).rejects.toThrow(
    "administrateur",
  );
  const locked = await rpc<{ title: string | null; available: boolean }[]>(
    "public.episode_status(false)",
  );
  expect(locked).toHaveLength(24);
  expect(locked[0].title).toBeNull();
  expect(locked[0].available).toBe(true);
  await expect(
    pg.query("select * from private.episode_content"),
  ).rejects.toThrow();
  await now("2026-11-30T23:00:00Z");
  await user(player);
  const opened = await rpc<{ content: unknown; runId: string }>(
    "public.episode_load(1,false,false,false)",
  );
  expect(opened.content).toEqual(content);
  const repeated = await rpc<{ runId: string }>(
    "public.episode_load(1,false,false,false)",
  );
  expect(repeated.runId).toBe(opened.runId);
  await expect(
    rpc("public.episode_load(25,false,false,false)"),
  ).rejects.toThrow();
  await expect(rpc("public.episode_load(1,false,false,true)")).rejects.toThrow(
    "canonique",
  );
});
it("sauvegarde sept scènes, déduplique la récompense et isole la relecture", async () => {
  await now("2026-12-01T01:00:00Z");
  await user(player);
  const session = await rpc<{ runId: string; revision: number }>(
    "public.episode_load(1,false,false,false)",
  );
  let p: EpisodeProgress = {
    ...startEpisode(
      content,
      { day: 1, unlocked: true },
      { world: initial, completedDays: [] },
    ),
    runtime: initialRuntime(),
  };
  let revision = -1;
  async function save() {
    await rpc("public.episode_save(1,false,$1::uuid,$2,$3::jsonb)", [
      session.runId,
      revision,
      JSON.stringify(p),
    ]);
    revision = p.revision;
  }
  await save();
  for (const scene of content.scenes) {
    for (const objective of scene.objectives)
      p = receiveEvent(content, p, objective.event) as EpisodeProgress;
    for (const choice of scene.choices)
      p = selectNarrativeChoice(content, p, choice.id, choice.options[0].id, {
        world: initial,
        completedDays: [],
      }) as EpisodeProgress;
    if (scene.kind === "scatter") {
      p.runtime.dispersalStarted = true;
      p.runtime.dispersed = true;
    }
    if (scene.kind === "trail") p.runtime.clueIndex = 3;
    if (scene.kind === "restore") p.runtime.restored = true;
    if (scene.kind === "home") p.runtime.bookOpened = true;
    p = finishScene(content, p, {
      world: initial,
      completedDays: [],
    }) as EpisodeProgress;
    await save();
  }
  const complete = await rpc<{ complete: boolean; restored: boolean }[]>(
    "public.episode_status(false)",
  );
  expect(complete[0]).toMatchObject({ complete: true, restored: true });
  await rpc("public.episode_save(1,false,$1::uuid,$2,$3::jsonb)", [
    session.runId,
    -1,
    JSON.stringify(p),
  ]);
  const changed = structuredClone(p);
  changed.revision++;
  changed.choices["scene-1/fixture-choice"] = "two";
  await expect(
    rpc("public.episode_save(1,false,$1::uuid,$2,$3::jsonb)", [
      session.runId,
      revision,
      JSON.stringify(changed),
    ]),
  ).rejects.toThrow("historiques");
  const replay = await rpc<{ runId: string; progress: null }>(
    "public.episode_load(1,false,true,true)",
  );
  expect(replay.runId).not.toBe(session.runId);
  expect(replay.progress).toBeNull();
  const resumed = await rpc<{ progress: EpisodeProgress }>(
    "public.episode_load(1,false,false,false)",
  );
  expect(resumed.progress).toEqual(p);
  expect(
    (await rpc<{ restored: boolean }[]>("public.episode_status(false)")).filter(
      (x) => x.restored,
    ),
  ).toHaveLength(1);
  await user(outsider);
  await expect(
    rpc("public.episode_save(1,false,$1::uuid,$2,$3::jsonb)", [
      session.runId,
      revision,
      JSON.stringify(p),
    ]),
  ).rejects.toThrow();
});
it("conserve la version active, refuse une version réécrite et protège l'aperçu", async () => {
  await user(admin);
  await expect(
    rpc("public.episode_admin_put($1::jsonb)", [
      JSON.stringify({ ...content, title: "Modification incompatible" }),
    ]),
  ).rejects.toThrow("immuable");
  const v2 = { ...content, version: 2, title: "Fixture version 2" };
  await rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(v2)]);
  await user(player);
  expect(
    (
      await rpc<{ content: { version: number } }>(
        "public.episode_load(1,false,false,false)",
      )
    ).content.version,
  ).toBe(1);
  await user(admin);
  const preview = await rpc<{ revision: number; runId: string }>(
    "public.episode_load(1,true,false,false)",
  );
  expect(preview.revision).toBe(-1);
  await expect(
    rpc("public.episode_save(1,false,$1::uuid,-1,$2::jsonb)", [
      preview.runId,
      "{}",
    ]),
  ).rejects.toThrow("Session");
  await expect(
    rpc("public.episode_admin_put($1::jsonb)", [
      JSON.stringify({ schema: 1, title: "Sans schéma" }),
    ]),
  ).rejects.toThrow("invalide");
});
it("raccorde l'étoile au calendrier avant la fin, sans seconde récompense", async () => {
  await user(admin);
  const session = await rpc<{
    runId: string;
    content: ReturnType<typeof technicalEpisode>;
  }>("public.episode_load(1,true,false,false)");
  const d = session.content;
  let p: EpisodeProgress = {
    ...startEpisode(
      d,
      { day: 1, unlocked: true },
      { world: initial, completedDays: [] },
    ),
    runtime: initialRuntime(),
  };
  for (const scene of d.scenes.slice(0, 6)) {
    for (const goal of scene.objectives)
      p = receiveEvent(d, p, goal.event) as EpisodeProgress;
    for (const choice of scene.choices)
      p = selectNarrativeChoice(d, p, choice.id, choice.options[0].id, {
        world: initial,
        completedDays: [],
      }) as EpisodeProgress;
    if (scene.kind === "scatter") {
      p.runtime.dispersalStarted = true;
      p.runtime.dispersed = true;
    }
    if (scene.kind === "trail") p.runtime.clueIndex = 3;
    if (scene.kind === "restore") {
      p.runtime.restored = true;
      break;
    }
    p = finishScene(d, p, {
      world: initial,
      completedDays: [],
    }) as EpisodeProgress;
  }
  const receipt = await rpc<{ restored: boolean; completedAt: string | null }>(
    "public.episode_save(1,true,$1::uuid,-1,$2::jsonb)",
    [session.runId, JSON.stringify(p)],
  );
  expect(receipt).toMatchObject({ restored: true, completedAt: null });
  const status = await rpc<
    { source: string; restored: boolean; complete: boolean }[]
  >("public.advent_status(true)");
  expect(status[0]).toMatchObject({
    source: "narrative",
    restored: true,
    complete: false,
  });
  const revision = p.revision;
  p = finishScene(d, p, {
    world: initial,
    completedDays: [],
  }) as EpisodeProgress;
  for (const goal of d.scenes[6].objectives)
    p = receiveEvent(d, p, goal.event) as EpisodeProgress;
  p.runtime.bookOpened = true;
  p = finishScene(d, p, {
    world: initial,
    completedDays: [],
  }) as EpisodeProgress;
  const done = await rpc<{ restored: boolean; completedAt: string }>(
    "public.episode_save(1,true,$1::uuid,$2,$3::jsonb)",
    [session.runId, revision, JSON.stringify(p)],
  );
  expect(done.restored).toBe(true);
  expect(Date.parse(done.completedAt)).toBe(Date.parse("2026-12-01T01:00:00Z"));
  expect(
    await rpc("public.episode_save(1,true,$1::uuid,$2,$3::jsonb)", [
      session.runId,
      revision,
      JSON.stringify(p),
    ]),
  ).toEqual(done);
  await expect(
    rpc("private.episode_save_v1(1,true,$1::uuid,-1,$2::jsonb)", [
      session.runId,
      JSON.stringify(p),
    ]),
  ).rejects.toThrow();
  const live = await rpc<{ complete: boolean }[]>(
    "public.advent_status(false)",
  );
  expect(live[0].complete).toBe(false);
  const reloaded = await rpc<{ completedAt: string }>(
    "public.episode_load(1,true,false,false)",
  );
  expect(reloaded.completedAt).toBe(done.completedAt);
  await user(player);
  expect(
    (await pg.query("select * from public.advent_progress")).rows[0],
  ).toEqual(legacyRecord);
});
