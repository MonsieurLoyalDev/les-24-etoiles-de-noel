// CI-only isolated Nginx on ephemeral high ports, with a local test certificate.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import https from "node:https";
import http from "node:http";
import { checkServerIdentity } from "node:tls";
import { setTimeout as pause } from "node:timers/promises";
import assert from "node:assert/strict";
import { initialize, stage, activate, rollback } from "./release.mjs";
import { hash } from "./lib/artifact.mjs";
import { inspectArtifact } from "./lib/artifact.mjs";
import { nginxConfig } from "./nginx.mjs";
if (process.platform === "win32" || !process.env.CI)
  throw Error("Nginx integration runs in the Linux CI job");
const port = () =>
  new Promise((res, rej) => {
    const s = createServer();
    s.on("error", rej);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => res(p));
    });
  });
const temp = mkdtempSync(join(tmpdir(), "etoilebois-nginx-")),
  root = join(temp, "etoilebois"),
  domain = "etoilebois.test";
initialize(root);
function make(commit, text) {
  const dir = join(temp, commit);
  mkdirSync(join(dir, "site/assets"), { recursive: true });
  const files = {
    "index.html": `<html>${text}</html>`,
    "build-info.json": JSON.stringify({
      mode: "supabase",
      configured: true,
      captcha: true,
      backendOrigin: "https://example.supabase.co",
    }),
    [`assets/index-${hash(text).slice(0, 8)}.js`]: text,
  };
  for (const [p, v] of Object.entries(files))
    writeFileSync(join(dir, "site", p), v);
  writeFileSync(
    join(dir, "release-manifest.json"),
    JSON.stringify({
      format: 1,
      mode: "supabase",
      version: "0.4.0",
      commit,
      files: Object.fromEntries(
        Object.entries(files).map(([p, v]) => [p, hash(v)]),
      ),
    }),
  );
  stage(root, dir, commit);
}
make("a".repeat(40), "version-one");
activate(root, "a".repeat(40));
mkdirSync(join(temp, domain));
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-days",
    "1",
    "-subj",
    `/CN=${domain}`,
    "-addext",
    `subjectAltName=DNS:${domain}`,
    "-keyout",
    join(temp, domain, "privkey.pem"),
    "-out",
    join(temp, domain, "fullchain.pem"),
  ],
  { stdio: "ignore" },
);
const tlsPort = await port(),
  httpPort = await port();
const body = nginxConfig(domain, "https://example.supabase.co", {
  root,
  certDir: temp,
  port: tlsPort,
  httpPort,
})
  .replaceAll("/var/log/nginx/", temp + "/")
  .replace(`listen ${tlsPort} ssl;`, `listen 127.0.0.1:${tlsPort} ssl;`)
  .replace(`listen ${httpPort};`, `listen 127.0.0.1:${httpPort};`);
const config = join(temp, "nginx.conf");
writeFileSync(
  config,
  `pid ${temp}/nginx.pid;\nerror_log ${temp}/main-error.log;\nevents {}\nhttp { client_body_temp_path ${temp}/body; proxy_temp_path ${temp}/proxy; fastcgi_temp_path ${temp}/fastcgi; uwsgi_temp_path ${temp}/uwsgi; scgi_temp_path ${temp}/scgi; include /etc/nginx/mime.types; ${body} }\n`,
);
execFileSync("nginx", ["-t", "-p", temp, "-c", config], { stdio: "inherit" });
const ownedNginx = spawn(
  "nginx",
  ["-p", temp, "-c", config, "-g", "daemon off;"],
  { stdio: "ignore" },
);
const request = (path, tls = true) =>
  new Promise((res, rej) => {
    const client = tls ? https : http;
    const r = client.get(
      {
        hostname: "127.0.0.1",
        port: tls ? tlsPort : httpPort,
        path,
        headers: { Host: domain },
        ...(tls
          ? {
              servername: domain,
              ca: readFileSync(join(temp, domain, "fullchain.pem")),
              checkServerIdentity: (_name, cert) =>
                checkServerIdentity(domain, cert),
            }
          : {}),
      },
      (response) => {
        let body = "";
        response.on("data", (c) => (body += c));
        response.on("end", () =>
          res({ status: response.statusCode, headers: response.headers, body }),
        );
      },
    );
    r.setTimeout(3000, () => r.destroy(Error("HTTP timeout")));
    r.on("error", rej);
  });
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      ready = (await request("/healthz")).status === 200;
      if (ready) break;
    } catch {
      /* Retry only the server created by this test. */
    }
    await pause(100);
  }
  assert.ok(ready, "Nginx must start");
  const index = await request("/");
  assert.equal(index.status, 200);
  assert.match(index.body, /version-one/);
  assert.match(
    index.headers["content-security-policy"],
    /challenges.cloudflare.com/,
  );
  assert.equal(index.headers["x-content-type-options"], "nosniff");
  assert.match(
    (await request("/index.html")).headers["cache-control"],
    /no-cache/,
  );
  for (const p of [
    "/.env",
    "/.git/config",
    "/supabase/migrations/file.sql",
    "/backups/database.enc",
    "/surprises/24/final.json",
    "/media/24/private.mp4",
    "/demo/surprise.webm",
    "/build-info.json",
    "/assets/missing.js",
  ])
    assert.equal((await request(p)).status, 404, p);
  assert.equal((await request("/deep/link")).status, 200);
  mkdirSync(join(root, "acme/.well-known/acme-challenge"), { recursive: true });
  writeFileSync(join(root, "acme/.well-known/acme-challenge/test"), "acme-ok");
  assert.equal(
    (await request("/.well-known/acme-challenge/test", false)).body,
    "acme-ok",
  );
  assert.equal((await request("/", false)).status, 301);
  make("b".repeat(40), "version-two");
  activate(root, "b".repeat(40));
  assert.match((await request("/")).body, /version-two/);
  assert.equal(
    (await request(`/assets/index-${hash("version-one").slice(0, 8)}.js`)).body,
    "version-one",
  );
  rollback(root);
  assert.match((await request("/")).body, /version-one/);
  console.log(
    "Nginx HTTPS fixture: TLS, headers, SPA, private-file denial, ACME, activation and rollback passed.",
  );
  if (process.env.ETB_TEST_ARTIFACT) {
    const artifact = process.env.ETB_TEST_ARTIFACT,
      m = inspectArtifact(artifact);
    stage(root, artifact, m.commit);
    activate(root, m.commit);
    execFileSync(
      process.execPath,
      [
        "node_modules/@playwright/test/cli.js",
        "test",
        "--config",
        "playwright.vps.config.ts",
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          ETB_TEST_HTTPS_URL: `https://127.0.0.1:${tlsPort}`,
        },
      },
    );
  }
} finally {
  if (ownedNginx.exitCode === null && ownedNginx.signalCode === null) {
    const stopped = new Promise((res) => ownedNginx.once("exit", res));
    ownedNginx.kill("SIGTERM");
    await stopped;
  }
}
