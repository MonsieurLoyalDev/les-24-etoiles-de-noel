import { it, expect } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  symlinkSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import { Blob } from "node:buffer";
import { initialize, stage, activate, rollback } from "../ops/release.mjs";
import { hash, inspectArtifact } from "../ops/lib/artifact.mjs";
import { publicConfig } from "../ops/lib/public-config.mjs";
import { nginxConfig } from "../ops/nginx.mjs";
import { backupData, verifyBackup, restoreData } from "../ops/backup.mjs";
const temp = () => mkdtempSync(join(tmpdir(), "etoilebois-test-"));
function artifact(commit = "a".repeat(40), text = "one") {
  const dir = temp();
  mkdirSync(join(dir, "site"));
  mkdirSync(join(dir, "site/assets"));
  const content = {
    "index.html": `<html>${text}</html>`,
    "build-info.json": JSON.stringify({
      mode: "supabase",
      configured: true,
      captcha: true,
      backendOrigin: "https://example.supabase.co",
    }),
    [`assets/index-${hash(text).slice(0, 8)}.js`]: text,
  };
  for (const [p, v] of Object.entries(content))
    writeFileSync(join(dir, "site", p), v);
  const manifest = {
    format: 1,
    mode: "supabase",
    commit,
    version: "0.4.0",
    files: Object.fromEntries(
      Object.entries(content).map(([p, v]) => [p, hash(v)]),
    ),
  };
  writeFileSync(join(dir, "release-manifest.json"), JSON.stringify(manifest));
  return dir;
}
// No recursive cleanup runs against user paths. Fixtures live only under tmp.
it("refuse les fichiers publics supplémentaires et les modifications du paquet", () => {
  const dir = artifact();
  writeFileSync(join(dir, "site/future.json"), "secret");
  expect(() => inspectArtifact(dir)).toThrow("Unexpected");
  const other = artifact();
  writeFileSync(join(other, "site/index.html"), "changed");
  expect(() => inspectArtifact(other)).toThrow("Invalid public");
});
it("refuse les secrets Vite, y compris JWT base64url et variables inattendues", () => {
  expect(() =>
    publicConfig({ VITE_SUPABASE_ANON_KEY: "sb_secret_fake" }),
  ).toThrow("Server key");
  expect(() =>
    publicConfig({
      VITE_SUPABASE_ANON_KEY: `x.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.x`,
    }),
  ).toThrow("Only anon");
  expect(() => publicConfig({ VITE_SURPRISE: "future" })).toThrow("Unexpected");
  expect(() =>
    publicConfig({ VITE_SUPABASE_URL: "http://remote.test" }),
  ).toThrow("HTTPS");
});
it("ne rend pas déployable un build sans Auth/CAPTCHA configurés", () => {
  expect(publicConfig({}).configured).toBe(false);
  const dir = artifact();
  const m = JSON.parse(readFileSync(join(dir, "release-manifest.json")));
  const info = JSON.stringify({
    mode: "supabase",
    configured: true,
    captcha: false,
    backendOrigin: "https://example.supabase.co",
  });
  writeFileSync(join(dir, "site/build-info.json"), info);
  m.files["build-info.json"] = hash(info);
  writeFileSync(join(dir, "release-manifest.json"), JSON.stringify(m));
  expect(() => inspectArtifact(dir)).toThrow("CAPTCHA");
});
it("prépare des versions isolées sans activation implicite ni écrasement", () => {
  const root = join(temp(), "etoilebois");
  initialize(root);
  stage(root, artifact(), "a".repeat(40));
  expect(existsSync(join(root, "current"))).toBe(false);
  expect(() => stage(root, artifact(), "a".repeat(40))).toThrow(
    "already exists",
  );
  expect(() => initialize(root)).toThrow("nonempty");
  expect(() => stage(root, artifact(), "../outside")).toThrow("Release ID");
});
it.skipIf(process.platform === "win32")(
  "activation et restauration atomiques, anciens assets conservés",
  () => {
    const root = join(temp(), "etoilebois");
    initialize(root);
    stage(root, artifact(), "a".repeat(40));
    activate(root, "a".repeat(40));
    stage(root, artifact("b".repeat(40), "two"), "b".repeat(40));
    activate(root, "b".repeat(40));
    expect(
      readFileSync(join(root, "current/site/index.html"), "utf8"),
    ).toContain("two");
    rollback(root);
    expect(
      readFileSync(join(root, "current/site/index.html"), "utf8"),
    ).toContain("one");
    expect(
      existsSync(
        join(root, `historic/assets/index-${hash("two").slice(0, 8)}.js`),
      ),
    ).toBe(true);
  },
);
it.skipIf(process.platform === "win32")(
  "refuse les symlinks et la sortie du dossier dédié",
  () => {
    const dir = artifact();
    symlinkSync(join(dir, "site/index.html"), join(dir, "site/leak.png"));
    expect(() => inspectArtifact(dir)).toThrow("link");
    const parent = temp();
    symlinkSync(temp(), join(parent, "etoilebois"));
    expect(() => initialize(join(parent, "etoilebois"))).toThrow("linked");
  },
);
it("génère seulement un vhost dédié, HTTPS et refus des fichiers privés", () => {
  const c = nginxConfig("jeu.example.com", "https://project.supabase.co");
  expect(c).toContain("ssl_protocols TLSv1.2 TLSv1.3");
  expect(c).toContain("surprises|demo");
  expect(c).toContain("etoilebois/current/site");
  expect(c).not.toContain("default_server");
  expect(c).not.toContain("includeSubDomains");
  expect(() =>
    nginxConfig("bad; include /etc/secrets", "https://project.supabase.co"),
  ).toThrow("domain");
  expect(() => nginxConfig("jeu.example.com", "https://bad.test/path")).toThrow(
    "origin",
  );
});
function storage(initial = {}) {
  const files = new Map(Object.entries(initial));
  const bucket = {
    list: async (prefix) => ({
      error: null,
      data:
        prefix === ""
          ? [{ name: "1", id: null }]
          : [...files.keys()]
              .filter((n) => n.startsWith(prefix + "/"))
              .map((n) => ({
                name: n.slice(prefix.length + 1),
                id: "file",
                metadata: { mimetype: "image/png" },
              })),
    }),
    download: async (name) =>
      files.has(name)
        ? { data: new Blob([files.get(name)]), error: null }
        : { data: null, error: { status: 400, statusCode: "404" } },
    upload: async (name, stream, options) => {
      expect(options.upsert).toBe(false);
      const chunks = [];
      for await (const c of stream) chunks.push(c);
      files.set(name, Buffer.concat(chunks).toString());
      return { error: null };
    },
  };
  return { client: { storage: { from: () => bucket } }, files };
}
it("sauvegarde et restaure données et médias sans révéler le contenu", async () => {
  const key = randomBytes(32),
    dir = join(temp(), "backup"),
    s = storage({ "1/photo.png": "PRIVATE_MEDIA" });
  await backupData({
    directory: dir,
    key,
    client: s.client,
    projectOrigin: "https://example.supabase.co",
    dump: {
      stream: Readable.from(["PRIVATE_DATABASE"]),
      done: Promise.resolve(),
    },
  });
  expect(
    readFileSync(join(dir, "database.enc")).includes("PRIVATE_DATABASE"),
  ).toBe(false);
  const verified = await verifyBackup(dir, key);
  expect(readFileSync(join(verified.temp, "database.dump"), "utf8")).toBe(
    "PRIVATE_DATABASE",
  );
  const target = storage();
  let db = false;
  await restoreData({
    verified,
    client: target.client,
    restoreDatabase: async (file) => {
      expect(readFileSync(file, "utf8")).toBe("PRIVATE_DATABASE");
      db = true;
    },
  });
  expect(db).toBe(true);
  expect(target.files.get("1/photo.png")).toBe("PRIVATE_MEDIA");
});
it("refuse mauvaise clé, altération et sauvegarde incomplète", async () => {
  const key = randomBytes(32),
    dir = join(temp(), "backup");
  await backupData({
    directory: dir,
    key,
    client: storage().client,
    projectOrigin: "https://example.supabase.co",
    dump: { stream: Readable.from(["data"]), done: Promise.resolve() },
  });
  await expect(verifyBackup(dir, randomBytes(32))).rejects.toThrow();
  const bytes = readFileSync(join(dir, "database.enc"));
  bytes[20] ^= 1;
  writeFileSync(join(dir, "database.enc"), bytes);
  await expect(verifyBackup(dir, key)).rejects.toThrow();
  await expect(verifyBackup(temp(), key)).rejects.toThrow();
});
it("ne remplace pas un média existant différent et ne restaure pas la DB ensuite", async () => {
  const key = randomBytes(32),
    dir = join(temp(), "backup");
  await backupData({
    directory: dir,
    key,
    client: storage({ "1/photo.png": "original" }).client,
    projectOrigin: "https://example.supabase.co",
    dump: { stream: Readable.from(["data"]), done: Promise.resolve() },
  });
  const verified = await verifyBackup(dir, key);
  await expect(
    restoreData({
      verified,
      client: storage({ "1/photo.png": "different" }).client,
      restoreDatabase: async () => {
        throw Error("must not run");
      },
    }),
  ).rejects.toThrow("no overwrite");
});
it("refuse de mélanger les fichiers valides de deux sauvegardes ayant la même clé", async () => {
  const key = randomBytes(32),
    first = join(temp(), "backup"),
    second = join(temp(), "backup");
  for (const [directory, text] of [
    [first, "first"],
    [second, "second"],
  ])
    await backupData({
      directory,
      key,
      client: storage().client,
      projectOrigin: "https://example.supabase.co",
      dump: { stream: Readable.from([text]), done: Promise.resolve() },
    });
  copyFileSync(join(first, "database.enc"), join(second, "database.enc"));
  await expect(verifyBackup(second, key)).rejects.toThrow();
});
