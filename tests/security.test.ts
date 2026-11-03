import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { demoDays } from "../src/advent/demo";
const admin = "00000000-0000-4000-8000-000000000001",
  player = "00000000-0000-4000-8000-000000000002",
  other = "00000000-0000-4000-8000-000000000003";
let pg: PGlite;
async function as(user: string, role = "authenticated") {
  await pg.exec("reset role");
  await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await pg.exec(`set role ${role}`);
}
async function clock(iso: string) {
  await pg.exec("reset role");
  await pg.exec(
    `create or replace function private.server_now() returns timestamptz language sql stable set search_path='' as $$select '${iso}'::timestamptz$$;`,
  );
}
async function rpc<T = unknown>(sql: string, args: unknown[] = []) {
  const result = await pg.query<{ value: T }>(`select ${sql} as value`, args);
  return result.rows[0].value;
}
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated,anon;grant select,insert,update,delete on storage.objects to authenticated;insert into auth.users values('${admin}'),('${player}'),('${other}');`,
  );
  await pg.exec(
    readFileSync("supabase/migrations/202611030001_advent.sql", "utf8"),
  );
  await pg.query("insert into public.app_members values($1,$2),($3,$4)", [
    admin,
    "admin",
    player,
    "player",
  ]);
  for (const d of demoDays) {
    await pg.query(
      "insert into public.advent_days(day,content) values($1,$2)",
      [d.content.day, JSON.stringify(d.content)],
    );
    await pg.query(
      "insert into private.advent_rules(day,rules) values($1,$2)",
      [d.content.day, JSON.stringify(d.rules)],
    );
  }
  await pg.exec(
    "insert into storage.objects(bucket_id,name) values('advent-media','1/open.png'),('advent-media','24/future.mp4');",
  );
}, 30000);
beforeEach(async () => {
  await pg.exec("reset role");
  await clock("2026-12-01T00:00:00Z");
  await as(player);
});
afterAll(async () => {
  await pg?.close();
});
it("refuse les visiteurs anonymes et les comptes non invités", async () => {
  await as("", "anon");
  await expect(rpc("public.advent_status(false)")).rejects.toThrow();
  await as(other);
  await expect(rpc("public.advent_status(false)")).rejects.toThrow(
    "Accès privé",
  );
  expect(
    (await pg.query("select * from public.advent_days")).rows,
  ).toHaveLength(0);
});
it("ouvre exactement à minuit Europe/Paris les jours 1 et 24", async () => {
  await clock("2026-11-30T22:59:59Z");
  await as(player);
  await expect(rpc("public.advent_day(1,false)")).rejects.toThrow(
    "verrouillée",
  );
  await clock("2026-11-30T23:00:00Z");
  await as(player);
  expect(await rpc("public.advent_day(1,false)")).toHaveProperty("day", 1);
  await clock("2026-12-23T22:59:59Z");
  await as(player);
  await expect(rpc("public.advent_day(24,false)")).rejects.toThrow(
    "verrouillée",
  );
  await clock("2026-12-23T23:00:00Z");
  await as(player);
  expect(await rpc("public.advent_day(24,false)")).toHaveProperty("day", 24);
});
it("empêche de lire les contenus et médias futurs via des requêtes directes", async () => {
  expect(
    (await pg.query("select day from public.advent_days order by day")).rows,
  ).toEqual([{ day: 1 }]);
  expect((await pg.query("select name from storage.objects")).rows).toEqual([
    { name: "1/open.png" },
  ]);
  await expect(rpc("public.advent_day(24,false)")).rejects.toThrow();
  await expect(rpc("public.advent_start(24,false,false)")).rejects.toThrow();
  await expect(
    pg.query("select * from private.advent_rules"),
  ).rejects.toThrow();
  await expect(rpc("private.unlocked_at(24,'2099-01-01')")).rejects.toThrow();
});
it("ne livre aucune métadonnée secrète des jours verrouillés", async () => {
  const statuses = await rpc<{ day: number; unlocked: boolean; run: null }[]>(
    "public.advent_status(false)",
  );
  expect(statuses).toHaveLength(24);
  expect(statuses[23]).toEqual({
    day: 24,
    unlocked: false,
    complete: false,
    run: null,
  });
  expect(JSON.stringify(statuses)).not.toContain(demoDays[23].content.intro);
});
it("refuse le mode développeur et l’éditeur à un joueur", async () => {
  await expect(rpc("public.advent_day(24,true)")).rejects.toThrow(
    "administrateur",
  );
  await expect(rpc("public.advent_admin_get(24)")).rejects.toThrow(
    "Administrateur",
  );
  await expect(
    rpc("public.advent_admin_save($1,$2)", [
      demoDays[0].content,
      demoDays[0].rules,
    ]),
  ).rejects.toThrow();
  await expect(
    pg.query("update public.app_members set role=$1 where user_id=$2", [
      "admin",
      player,
    ]),
  ).rejects.toThrow();
  await expect(
    pg.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
      "advent-media",
      "24/forged.png",
    ]),
  ).rejects.toThrow();
});
it("valide les objectifs côté serveur et conserve les étoiles lors des relectures", async () => {
  const start = await rpc<{ runId: string }>(
    "public.advent_start(1,false,true)",
  );
  await expect(
    pg.query(
      "insert into public.advent_progress(user_id,day,mode,content_version,completed_at) values($1,24,$2,1,now())",
      [player, "live"],
    ),
  ).rejects.toThrow();
  let result = await rpc<{
    accepted: boolean;
    run: { complete: boolean; checked: string[] };
  }>("public.advent_check_step(1,$1,$2,$3,false)", [
    start.runId,
    "reponse",
    '"1"',
  ]);
  expect(result.accepted).toBe(false);
  result = await rpc("public.advent_check_step(1,$1,$2,$3,false)", [
    start.runId,
    "lettre",
    '["1","2","3"]',
  ]);
  expect(result.accepted).toBe(true);
  result = await rpc("public.advent_check_step(1,$1,$2,$3,false)", [
    start.runId,
    "reponse",
    '"1"',
  ]);
  expect(result.run.complete).toBe(true);
  const replay = await rpc<{ complete: boolean; checked: string[] }>(
    "public.advent_start(1,false,true)",
  );
  expect(replay.complete).toBe(true);
  expect(replay.checked).toEqual([]);
});
it("isole l’aperçu administrateur des étoiles réelles et des autres joueurs", async () => {
  await as(admin);
  const run = await rpc<{ runId: string }>("public.advent_start(24,true,true)");
  await rpc("public.advent_check_step(24,$1,$2,$3,true)", [
    run.runId,
    "final",
    "4",
  ]);
  await expect(rpc("public.advent_day(24,false)")).rejects.toThrow(
    "verrouillée",
  );
  const live = await rpc<{ day: number; complete: boolean }[]>(
    "public.advent_status(false)",
  );
  expect(live[23].complete).toBe(false);
  await as(player);
  expect(
    (
      await pg.query("select * from public.advent_progress where user_id=$1", [
        admin,
      ])
    ).rows,
  ).toEqual([]);
});
it("ne perd pas une récompense lors d’une mise à jour du contenu", async () => {
  const original = await rpc<{ runId: string }>(
    "public.advent_start(1,false,true)",
  );
  await rpc("public.advent_check_step(1,$1,$2,$3,false)", [
    original.runId,
    "lettre",
    '["1","2","3"]',
  ]);
  await rpc("public.advent_check_step(1,$1,$2,$3,false)", [
    original.runId,
    "reponse",
    '"1"',
  ]);
  await as(admin);
  const editable = await rpc<{
    content: (typeof demoDays)[number]["content"];
    rules: (typeof demoDays)[number]["rules"];
  }>("public.advent_admin_get(1)");
  editable.content.title = "Lettre personnalisée";
  await rpc("public.advent_admin_save($1,$2)", [
    editable.content,
    editable.rules,
  ]);
  await as(player);
  const statuses = await rpc<{ complete: boolean }[]>(
    "public.advent_status(false)",
  );
  expect(statuses[0].complete).toBe(true);
});
it.each(demoDays)(
  "valide les preuves du jour $content.day dans PostgreSQL et refuse SQL NULL",
  async (d) => {
    await clock("2026-12-24T00:00:00Z");
    await as(player);
    const run = await rpc<{ runId: string }>(
      "public.advent_start($1,false,true)",
      [d.content.day],
    );
    const invalid = await rpc<{ accepted: boolean }>(
      "public.advent_check_step($1,$2,$3,null,false)",
      [d.content.day, run.runId, d.content.steps[0].id],
    );
    expect(invalid.accepted).toBe(false);
    for (const s of d.content.steps) {
      const value =
        d.rules[s.id].expected ??
        (s.kind === "scene"
          ? 4
          : s.kind === "media"
            ? true
            : s.kind === "voucher"
              ? { recipient: "Debby", date: "2026-12-24", option: "1" }
              : s.kind === "story"
                ? ["start:foret", "foret:retour"]
                : s.kind === "write"
                  ? "Écrivons notre futur ensemble avec de longues promenades sous les étoiles."
                  : s.kind === "choice"
                    ? "1"
                    : s.items!.map((i) => i.id));
      const result = await rpc<{
        accepted: boolean;
        run: { complete: boolean };
      }>("public.advent_check_step($1,$2,$3,$4,false)", [
        d.content.day,
        run.runId,
        s.id,
        JSON.stringify(value),
      ]);
      expect(result.accepted).toBe(true);
      if (s === d.content.steps.at(-1)) expect(result.run.complete).toBe(true);
    }
  },
);
it("refuse une édition incomplète et le remplacement concurrent", async () => {
  await as(admin);
  await expect(
    rpc("public.advent_admin_save($1,$2)", [
      { day: 2, title: "Incomplet" },
      {},
    ]),
  ).rejects.toThrow();
  const d = await rpc<(typeof demoDays)[number]>("public.advent_admin_get(2)");
  await rpc("public.advent_admin_save($1,$2)", [d.content, d.rules]);
  await expect(
    rpc("public.advent_admin_save($1,$2)", [d.content, d.rules]),
  ).rejects.toThrow("Version modifiée");
});
