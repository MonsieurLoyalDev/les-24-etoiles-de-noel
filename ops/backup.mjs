import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  createReadStream,
  mkdtempSync,
  lstatSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { encrypt, decrypt, loadBackupKey, fileHash } from "./lib/crypto.mjs";
const aad = (n) => `etoilebois-backup-v1:${n}`;
const tables = [
  "public.app_members",
  "public.advent_days",
  "private.advent_rules",
  "public.advent_progress",
];
const safeObject = (n) =>
  typeof n === "string" &&
  /^([1-9]|1[0-9]|2[0-4])\//.test(n) &&
  n.length < 500 &&
  !n.includes("\\") &&
  !n.includes("\0") &&
  n.split("/").every((p) => p && p !== "." && p !== "..");
async function* objects(bucket, prefix = "") {
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await bucket.list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw Error("Private media listing failed");
    for (const item of data) {
      const name = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id) yield* objects(bucket, name);
      else {
        if (!safeObject(name)) throw Error("Invalid private media path");
        yield {
          name,
          contentType: item.metadata?.mimetype ?? "application/octet-stream",
        };
      }
    }
    if (data.length < 100) break;
  }
}
export async function backupData({
  directory,
  key,
  client,
  projectOrigin,
  dump,
}) {
  directory = resolve(directory);
  if (directory.replaceAll("\\", "/").includes("/var/www/"))
    throw Error("Backups must remain outside web roots");
  mkdirSync(directory, { mode: 0o700 });
  const manifest = {
    format: 1,
    scope: "application-data-and-media; Auth users excluded",
    projectOrigin,
    createdAt: new Date().toISOString(),
    media: [],
  };
  await encrypt(
    dump.stream,
    join(directory, "database.enc"),
    key,
    aad("database.enc"),
  );
  await dump.done;
  const bucket = client.storage.from("advent-media");
  let index = 0;
  for await (const item of objects(bucket)) {
    const { data, error } = await bucket.download(item.name);
    if (error || !data) throw Error("Private media download failed");
    const file = `media-${String(++index).padStart(6, "0")}.enc`;
    await encrypt(
      Readable.fromWeb(data.stream()),
      join(directory, file),
      key,
      aad(file),
    );
    manifest.media.push({ ...item, file });
  }
  await encrypt(
    Readable.from([JSON.stringify(manifest)]),
    join(directory, "manifest.enc"),
    key,
    aad("manifest.enc"),
  );
  writeFileSync(join(directory, "COMPLETE"), "etoilebois-backup-v1\n", {
    flag: "wx",
    mode: 0o600,
  });
  return { media: index, scope: manifest.scope };
}
export async function verifyBackup(directory, key) {
  directory = resolve(directory);
  if (
    lstatSync(directory).isSymbolicLink() ||
    readFileSync(join(directory, "COMPLETE"), "utf8") !==
      "etoilebois-backup-v1\n"
  )
    throw Error("Incomplete backup");
  const temp = mkdtempSync(join(tmpdir(), "etoilebois-restore-")); // private 0700, never served
  const manifestPath = join(temp, "manifest.json");
  await decrypt(
    join(directory, "manifest.enc"),
    manifestPath,
    key,
    aad("manifest.enc"),
  );
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (
    m.format !== 1 ||
    !Array.isArray(m.media) ||
    m.media.length > 100000 ||
    new URL(m.projectOrigin).protocol !== "https:"
  )
    throw Error("Invalid backup manifest");
  const seen = new Set();
  for (const item of m.media) {
    if (
      !safeObject(item.name) ||
      !/^media-[0-9]{6}\.enc$/.test(item.file) ||
      seen.has(item.file)
    )
      throw Error("Invalid backup object");
    seen.add(item.file);
    await decrypt(
      join(directory, item.file),
      join(temp, item.file + ".plain"),
      key,
      aad(item.file),
    );
  }
  await decrypt(
    join(directory, "database.enc"),
    join(temp, "database.dump"),
    key,
    aad("database.enc"),
  );
  return { temp, manifest: m };
}
export async function restoreData({ verified, client, restoreDatabase }) {
  const bucket = client.storage.from("advent-media");
  for (const item of verified.manifest.media) {
    const file = join(verified.temp, item.file + ".plain");
    const existing = await bucket.download(item.name);
    if (!existing.error && existing.data) {
      const other = join(verified.temp, item.file + ".existing");
      writeFileSync(other, Buffer.from(await existing.data.arrayBuffer()), {
        flag: "wx",
        mode: 0o600,
      });
      if ((await fileHash(file)) !== (await fileHash(other)))
        throw Error("Existing private media differs; no overwrite");
      continue;
    }
    if (
      existing.error &&
      Number(existing.error.status) !== 404 &&
      Number(existing.error.statusCode) !== 404
    )
      throw Error("Cannot verify target media; restore refused");
    const { error } = await bucket.upload(item.name, createReadStream(file), {
      upsert: false,
      contentType: item.contentType,
      duplex: "half",
    });
    if (error) throw Error("Private media restore failed");
  }
  await restoreDatabase(join(verified.temp, "database.dump"));
  return { restored: true, media: verified.manifest.media.length };
}
function child(command, args, options = {}) {
  const p = spawn(command, args, {
    stdio: ["ignore", "pipe", "ignore"],
    ...options,
  });
  const done = new Promise((res, rej) => {
    p.once("error", () => rej(Error(`${command} unavailable`)));
    p.once("exit", (code) =>
      code === 0
        ? res()
        : rej(
            Error(
              `${command} failed; check private PostgreSQL connection/client version`,
            ),
          ),
    );
  });
  done.catch(() => {});
  return { process: p, done };
}
async function main() {
  const [action, directory, confirmation] = process.argv.slice(2);
  const key = loadBackupKey(process.env.ETB_BACKUP_KEY_FILE ?? "");
  if (action === "verify") {
    const checked = await verifyBackup(directory, key);
    console.log(
      JSON.stringify({
        verified: true,
        media: checked.manifest.media.length,
        privateTemporaryDirectory: checked.temp,
      }),
    );
    return;
  }
  const origin = new URL(process.env.SUPABASE_URL ?? "");
  if (
    origin.protocol !== "https:" ||
    origin.pathname !== "/" ||
    origin.username ||
    origin.password
  )
    throw Error("HTTPS Supabase origin required");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw Error("Server-only backup credential required");
  const client = createClient(
    origin.origin,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  if (action === "backup") {
    if (
      !process.env.PGSERVICE ||
      !process.env.PGSERVICEFILE ||
      !process.env.PGPASSFILE
    )
      throw Error("Private libpq service/password files required");
    const dump = child("pg_dump", [
      "--format=custom",
      "--data-only",
      "--no-owner",
      "--no-acl",
      ...tables.flatMap((t) => ["--table", t]),
    ]);
    try {
      console.log(
        JSON.stringify(
          await backupData({
            directory,
            key,
            client,
            projectOrigin: origin.origin,
            dump: { stream: dump.process.stdout, done: dump.done },
          }),
        ),
      );
    } finally {
      if (dump.process.exitCode === null) dump.process.kill("SIGTERM");
    }
  } else if (action === "restore") {
    if (confirmation !== `--apply-to=${origin.hostname}`)
      throw Error(
        "Restore requires explicit --apply-to=PROJECT_HOST after review",
      );
    if (
      !process.env.PGSERVICE ||
      !process.env.PGSERVICEFILE ||
      !process.env.PGPASSFILE
    )
      throw Error("Private target libpq files required");
    const verified = await verifyBackup(directory, key);
    if (verified.manifest.projectOrigin !== origin.origin)
      throw Error(
        "Cross-project restore requires a separately reviewed migration; refused",
      );
    console.log(
      JSON.stringify(
        await restoreData({
          verified,
          client,
          restoreDatabase: async (file) => {
            const p = child("pg_restore", [
              "--data-only",
              "--no-owner",
              "--no-acl",
              "--single-transaction",
              "--exit-on-error",
              "--dbname",
              `service=${process.env.PGSERVICE}`,
              file,
            ]);
            await p.done;
          },
        }),
      ),
    );
  } else
    throw Error(
      "Usage: backup.mjs backup|verify|restore ENCRYPTED_DIRECTORY [--apply-to=PROJECT_HOST]",
    );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
