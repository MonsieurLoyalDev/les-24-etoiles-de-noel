// Runs only in CI against a container created by this script. No host DB used.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { Blob } from "node:buffer";
import assert from "node:assert/strict";
import { pipeline } from "node:stream/promises";
import { setTimeout as pause } from "node:timers/promises";
import { backupData, verifyBackup, restoreData } from "./backup.mjs";
if (!process.env.CI) throw Error("CI-only isolated PostgreSQL test");
const name = `etoilebois-test-${process.pid}`,
  uuid = "00000000-0000-4000-8000-000000000001";
let created = false;
const sql = (db, text) =>
  execFileSync(
    "docker",
    [
      "exec",
      name,
      "psql",
      "-U",
      "postgres",
      "-d",
      db,
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-c",
      text,
    ],
    { encoding: "utf8" },
  );
function run(command, args, stdin = false) {
  const p = spawn(command, args, {
    stdio: [stdin ? "pipe" : "ignore", "pipe", "inherit"],
  });
  const done = new Promise((res, rej) => {
    p.on("error", rej);
    p.on("exit", (code) =>
      code === 0 ? res() : rej(Error("PostgreSQL fixture command failed")),
    );
  });
  done.catch(() => {});
  return { p, done };
}
try {
  execFileSync(
    "docker",
    [
      "run",
      "--detach",
      "--name",
      name,
      "--env",
      "POSTGRES_PASSWORD=fixture-only",
      "postgres:17",
    ],
    { stdio: "inherit" },
  );
  created = true;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      execFileSync(
        "docker",
        ["exec", name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"],
        {
          stdio: "ignore",
        },
      );
      ready = true;
      break;
    } catch {
      /* Only wait for the disposable container started above. */
    }
    await pause(500);
  }
  assert.ok(ready);
  sql("postgres", "create role anon; create role authenticated;");
  sql("postgres", "create database etb_source");
  sql("postgres", "create database etb_target");
  const bootstrap = `create schema auth; create table auth.users(id uuid primary key); insert into auth.users values('${uuid}'); create function auth.uid() returns uuid language sql stable as $$select '${uuid}'::uuid$$; grant usage on schema auth,public to authenticated,anon; grant execute on function auth.uid() to authenticated,anon; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated,anon;grant select,insert,update,delete on storage.objects to authenticated;`;
  for (const db of ["etb_source", "etb_target"]) {
    sql(db, bootstrap);
    sql(
      db,
      readFileSync("supabase/migrations/202611030001_advent.sql", "utf8"),
    );
  }
  sql(
    "etb_source",
    `insert into public.app_members values('${uuid}','player');insert into public.advent_days(day,content) values(1,'{"day":1,"title":"fixture"}');insert into private.advent_rules values(1,'{}');insert into public.advent_progress(user_id,day,mode,content_version,memory,completed_at) values('${uuid}',1,'live',1,'{"text":"private saved letter"}',now());`,
  );
  const dump = run("docker", [
    "exec",
    name,
    "pg_dump",
    "-U",
    "postgres",
    "-d",
    "etb_source",
    "--format=custom",
    "--data-only",
    "--no-owner",
    "--no-acl",
    ...[
      "public.app_members",
      "public.advent_days",
      "private.advent_rules",
      "public.advent_progress",
    ].flatMap((t) => ["--table", t]),
  ]);
  const key = randomBytes(32),
    directory = join(
      mkdtempSync(join(tmpdir(), "etoilebois-pg-")),
      "encrypted",
    );
  const sourceBucket = {
    list: async (prefix) => ({
      error: null,
      data: prefix
        ? [
            {
              id: "fixture",
              name: "photo.png",
              metadata: { mimetype: "image/png" },
            },
          ]
        : [{ id: null, name: "1" }],
    }),
    download: async () => ({ error: null, data: new Blob(["PRIVATE_MEDIA"]) }),
  };
  await backupData({
    directory,
    key,
    client: { storage: { from: () => sourceBucket } },
    projectOrigin: "https://fixture.supabase.co",
    dump: { stream: dump.p.stdout, done: dump.done },
  });
  const verified = await verifyBackup(directory, key);
  let media;
  const targetBucket = {
    download: async () => ({ error: { status: 400, statusCode: "404" } }),
    upload: async (_path, stream) => {
      const chunks = [];
      for await (const c of stream) chunks.push(c);
      media = Buffer.concat(chunks).toString();
      return { error: null };
    },
  };
  await restoreData({
    verified,
    client: { storage: { from: () => targetBucket } },
    restoreDatabase: async (file) => {
      const restore = run(
        "docker",
        [
          "exec",
          "--interactive",
          name,
          "pg_restore",
          "-U",
          "postgres",
          "-d",
          "etb_target",
          "--single-transaction",
          "--exit-on-error",
          "--data-only",
          "--no-owner",
          "--no-acl",
        ],
        true,
      );
      await pipeline(createReadStream(file), restore.p.stdin);
      await restore.done;
    },
  });
  assert.equal(
    sql(
      "etb_target",
      "select memory->>'text' from public.advent_progress",
    ).trim(),
    "private saved letter",
  );
  assert.equal(media, "PRIVATE_MEDIA");
  console.log(
    "PostgreSQL 17 pg_dump/pg_restore + encrypted media round-trip passed (isolated fixture; Auth/Storage API mocked).",
  );
} finally {
  if (created)
    execFileSync("docker", ["rm", "--force", name], { stdio: "ignore" });
}
