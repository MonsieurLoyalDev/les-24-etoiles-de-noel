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
import { technicalProductionEpisode } from "./fixtures/production";
import { newFlowRuntime, newPuzzle, puzzleMove } from "../src/narrative/flow";
import { completedEpisodeSnapshots } from "./fixtures/complete-episode";
const admin = "00000000-0000-4000-8000-000000000011",
  player = "00000000-0000-4000-8000-000000000012",
  outsider = "00000000-0000-4000-8000-000000000013";
let pg: PGlite;
let legacyRecord: unknown;
const content = technicalEpisode();
it("Lot C : refuse un spectacle forgé et le corps d’une confidence privée", async () => {
  await pg.exec("reset role");
  const script = technicalProductionEpisode(13);
  script.flow!.portals = ["reserve", "glade", "keeper"];
  const action = script.scenes[0].flow!.actions[0];
  action.performance = { kind: "theatre", duration: 10000 };
  const valid = async (value: unknown) =>
    (
      await pg.query<{ v: boolean }>(
        "select private.episode_content_valid($1::jsonb) as v",
        [JSON.stringify(value)],
      )
    ).rows[0].v;
  expect(await valid(script)).toBe(true);
  script.flow!.confidences = [
    {
      id: "secret",
      author: "Fixture",
      status: "private",
      requires: "activity/check",
      text: "Contenu refusé",
    },
  ];
  expect(await valid(script)).toBe(false);
  delete script.flow!.confidences;
  const progress = completedEpisodeSnapshots(
    script,
    Array.from({ length: 12 }, (_, i) => i + 1),
  )[0];
  progress.runtime.flow!.performance = { action: "check", elapsed: 4000 };
  const accepts = async () =>
    (
      await pg.query<{ v: boolean }>(
        "select private.episode_progress_valid($1::jsonb,$2::jsonb) as v",
        [JSON.stringify(script), JSON.stringify(progress)],
      )
    ).rows[0].v;
  expect(await accepts()).toBe(true);
  progress.runtime.flow!.performance.elapsed = 10001;
  expect(await accepts()).toBe(false);
  progress.runtime.flow!.performance = { action: "unknown", elapsed: 0 };
  expect(await accepts()).toBe(false);
});
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
    "202611160003_production_activities.sql",
    "202611180001_production_lot_b.sql",
    "202611180002_production_lot_c.sql",
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
it("refuse un média futur ou externe même lors d'un import administrateur", async () => {
  await user(admin);
  for (const media of [
    { key: "private-fixture", day: 3, path: "3/fixture.png" },
    {
      key: "private-fixture",
      day: 2,
      path: "https://example.test/fixture.png",
    },
    { key: "private-fixture", day: 2, path: "2/../3/fixture.png" },
  ]) {
    const c = technicalProductionEpisode(2);
    c.version = 102;
    c.flow!.media = [media];
    await expect(
      rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(c)]),
    ).rejects.toThrow();
  }
});
it("refuse une position de compagnon forgée et accepte le checkpoint déclaré", async () => {
  await user(admin);
  const c = technicalProductionEpisode(2);
  c.version = 103;
  c.flow!.follower = {
    actor: "emile",
    from: 0,
    until: 0,
    requires: "activity/check",
    destination: { room: "village", anchor: "square" },
  };
  await rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(c)]);
  const session = await rpc<{ runId: string }>(
    "public.episode_load(2,true,false,false)",
  );
  const p = startEpisode(
    c,
    { day: 2, unlocked: true },
    { world: initial, completedDays: [1] },
  ) as EpisodeProgress;
  p.runtime = initialRuntime();
  p.runtime.flow = newFlowRuntime();
  for (const followers of [
    { stranger: { room: "village", x: 100, y: 100 } },
    { emile: { room: "village", y: 100 } },
    { emile: { room: "village", x: 100, y: 1500 } },
  ]) {
    await expect(
      rpc("public.episode_save(2,true,$1::uuid,-1,$2::jsonb)", [
        session.runId,
        JSON.stringify({
          ...p,
          runtime: { ...p.runtime, flow: { ...p.runtime.flow, followers } },
        }),
      ]),
    ).rejects.toThrow();
  }
  p.runtime.flow.followers = { emile: { room: "village", x: 100, y: 100 } };
  await expect(
    rpc("public.episode_save(2,true,$1::uuid,-1,$2::jsonb)", [
      session.runId,
      JSON.stringify(p),
    ]),
  ).resolves.toBeTruthy();
});
it("conserve une célébration déclarée sans accepter un marqueur arbitraire", async () => {
  const isolated = "00000000-0000-4000-8000-000000000088";
  await pg.exec("reset role");
  await pg.query("insert into auth.users values($1)", [isolated]);
  await pg.query("insert into public.app_members values($1,'admin')", [
    isolated,
  ]);
  await user(isolated);
  const c = technicalProductionEpisode(3);
  c.version = 104;
  c.scenes[2].flow!.actions[0].constellation = 12;
  await rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(c)]);
  const session = await rpc<{ runId: string }>(
    "public.episode_load(3,true,false,false)",
  );
  const p = completedEpisodeSnapshots(c, [1, 2]).at(-1)!;
  p.runtime.flow!.steps["extra/look"] = 1;
  const invalid = structuredClone(p);
  invalid.runtime.flow!.steps["extra/unknown"] = 1;
  await expect(
    rpc("public.episode_save(3,true,$1::uuid,-1,$2::jsonb)", [
      session.runId,
      JSON.stringify(invalid),
    ]),
  ).rejects.toThrow();
  await expect(
    rpc("public.episode_save(3,true,$1::uuid,-1,$2::jsonb)", [
      session.runId,
      JSON.stringify(p),
    ]),
  ).resolves.toBeTruthy();
});
it("reconstruit le Livre depuis les preuves canoniques du bon utilisateur et ne charge aucune page future", async () => {
  const id = "00000000-0000-4000-8000-000000000014";
  await pg.exec("reset role");
  await pg.query("insert into auth.users(id) values($1)", [id]);
  await pg.query("insert into public.app_members values($1,'player')", [id]);
  await now("2026-12-04T10:00:00Z");
  for (const day of [1, 2, 4]) {
    await user(admin);
    const c = technicalProductionEpisode(day);
    c.version = 99;
    if (day === 4) c.dependsOn = [2];
    await rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(c)]);
  }
  for (const day of [1, 2]) {
    const c = technicalProductionEpisode(day);
    c.version = 99;
    await user(id);
    const session = await rpc<{ runId: string }>(
      "public.episode_load($1,false,false,false)",
      [day],
    );
    let p: EpisodeProgress = {
      ...startEpisode(
        c,
        { day, unlocked: true },
        { world: initial, completedDays: day === 1 ? [] : [1] },
      ),
      runtime: { ...initialRuntime(), flow: newFlowRuntime() },
    };
    const puzzle = c.scenes[0].flow!.actions[0].puzzle!;
    let draft = newPuzzle(puzzle);
    draft = puzzleMove(puzzle, draft, { type: "toggle", id: "a" });
    draft = puzzleMove(puzzle, draft, { type: "check" });
    p.runtime.flow!.drafts["activity/check"] = draft;
    p = receiveEvent(c, p, {
      kind: "solve",
      target: "technical-puzzle",
    }) as EpisodeProgress;
    p = finishScene(c, p, {
      world: initial,
      completedDays: [],
    }) as EpisodeProgress;
    p.runtime.restored = true;
    p.runtime.bookOpened = true;
    p = receiveEvent(c, p, {
      kind: "interact",
      target: "restored-star",
    }) as EpisodeProgress;
    p = finishScene(c, p, {
      world: initial,
      completedDays: [],
    }) as EpisodeProgress;
    p = finishScene(c, p, {
      world: initial,
      completedDays: [],
    }) as EpisodeProgress;
    const receipt = await rpc<{ restored: boolean; completedAt: string }>(
      "public.episode_save($1,false,$2::uuid,-1,$3::jsonb)",
      [day, session.runId, JSON.stringify(p)],
    );
    expect(receipt.restored).toBe(true);
    expect(receipt.completedAt).toBeTruthy();
  }
  const result = await rpc<{ context: { pages: { day: number }[] } }>(
    "public.episode_load(4,false,false,false)",
  );
  expect(result.context.pages.map((p) => p.day)).toEqual([1, 2]);
  await user(admin);
  const preview = await rpc<{ context: { pages: unknown[] } }>(
    "public.episode_load(4,true,false,false)",
  );
  expect(preview.context.pages).toEqual([]);
  await user(outsider);
  await expect(
    rpc("public.episode_load(4,false,false,false)"),
  ).rejects.toThrow();
});
it("isole la recette indépendante de la partie canonique et vérifie réellement les réponses", async () => {
  const c = technicalProductionEpisode(3);
  await now("2026-12-03T01:00:00Z");
  await user(admin);
  await rpc("public.episode_admin_put($1::jsonb)", [JSON.stringify(c)]);
  await user(player);
  await expect(
    rpc("public.episode_load(3,true,false,false)"),
  ).rejects.toThrow();
  await expect(rpc("public.episode_load(3,false,false,false)")).rejects.toThrow(
    "précédent incomplet",
  );
  await user(admin);
  const session = await rpc<{ runId: string }>(
    "public.episode_load(3,true,false,false)",
  );
  let p: EpisodeProgress = {
    ...startEpisode(
      c,
      { day: 3, unlocked: true },
      { world: initial, completedDays: [2] },
    ),
    runtime: { ...initialRuntime(), flow: newFlowRuntime() },
  };
  const puzzle = c.scenes[0].flow!.actions[0].puzzle!;
  p.runtime.flow!.drafts["activity/check"] = {
    ...newPuzzle(puzzle),
    solved: true,
  };
  p = receiveEvent(c, p, {
    kind: "solve",
    target: "technical-puzzle",
  }) as EpisodeProgress;
  await expect(
    rpc("public.episode_save(3,true,$1::uuid,-1,$2::jsonb)", [
      session.runId,
      JSON.stringify(p),
    ]),
  ).rejects.toThrow("Checkpoint");
  let draft = newPuzzle(puzzle);
  draft = puzzleMove(puzzle, draft, { type: "toggle", id: "a" });
  draft = puzzleMove(puzzle, draft, { type: "check" });
  p.runtime.flow!.drafts["activity/check"] = draft;
  await rpc("public.episode_save(3,true,$1::uuid,-1,$2::jsonb)", [
    session.runId,
    JSON.stringify(p),
  ]);
  const status = await rpc<{ day: number; complete: boolean }[]>(
    "public.episode_status(false)",
  );
  expect(status.find((s) => s.day === 3)?.complete).toBe(false);
  p.revision++;
  p.runtime.visited = ["forest", "bakery"];
  presentation(p).location = {
    room: "forest",
    position: { x: 512, y: 688 },
    loyal: { x: 490, y: 688 },
    flocon: null,
  };
  await rpc("public.episode_save(3,true,$1::uuid,$2,$3::jsonb)", [
    session.runId,
    p.revision - 1,
    JSON.stringify(p),
  ]);
  p.revision++;
  p.runtime.visited.push("village" as never);
  p.runtime.flow!.drafts["unknown/check"] = draft;
  await expect(
    rpc("public.episode_save(3,true,$1::uuid,$2,$3::jsonb)", [
      session.runId,
      p.revision - 1,
      JSON.stringify(p),
    ]),
  ).rejects.toThrow("Checkpoint");
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
