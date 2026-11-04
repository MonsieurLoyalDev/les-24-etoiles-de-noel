import { inspectArtifact, hash } from "./lib/artifact.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const [url, artifact] = process.argv.slice(2);
const origin = new URL(url);
if (
  origin.protocol !== "https:" ||
  origin.pathname !== "/" ||
  origin.username ||
  origin.password
)
  throw Error("Exact HTTPS origin required");
const m = inspectArtifact(artifact);
const buildInfo = JSON.parse(
  readFileSync(join(artifact, "site/build-info.json"), "utf8"),
);
async function check(path, code) {
  const r = await fetch(new URL(path, origin), {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });
  if (r.status !== code)
    throw Error(`Unexpected HTTP status for ${path}: ${r.status}`);
  return r;
}
const index = await check("/", 200);
if (hash(Buffer.from(await index.arrayBuffer())) !== m.files["index.html"])
  throw Error("Hosted index differs from approved artifact");
if (
  !index.headers.get("content-security-policy")?.includes("object-src 'none'")
)
  throw Error("CSP missing");
if (
  !index.headers
    .get("content-security-policy")
    ?.includes(buildInfo.backendOrigin)
)
  throw Error("Nginx backend origin differs from approved build");
if (index.headers.get("x-content-type-options") !== "nosniff")
  throw Error("Security headers missing");
if (
  (await (await check("/healthz", 200)).text()).trim() !== "etoilebois-static"
)
  throw Error("Wrong virtual host");
for (const p of [
  "/.env",
  "/.git/config",
  "/supabase/migrations/private.sql",
  "/surprises/24/final.json",
  "/media/24/private.mp4",
  "/demo/surprise.webm",
  "/build-info.json",
])
  await check(p, 404);
for (const p of Object.keys(m.files).filter(
  (p) => p.endsWith(".js") || p.endsWith(".css"),
)) {
  const r = await check("/" + p, 200);
  if (
    hash(Buffer.from(await r.arrayBuffer())) !==
    hash(readFileSync(join(artifact, "site", p)))
  )
    throw Error("Hosted asset differs from approved artifact");
}
const redirect = await fetch(`http://${origin.host}/`, {
  redirect: "manual",
  signal: AbortSignal.timeout(10000),
});
if (
  ![301, 308].includes(redirect.status) ||
  new URL(redirect.headers.get("location")).origin !== origin.origin
)
  throw Error("HTTP must redirect to exact HTTPS origin");
console.log(
  JSON.stringify({
    https: true,
    artifactCommit: m.commit,
    staticFiles: true,
    privatePathsBlocked: true,
    note: "Auth, private media and gameplay still require backend/browser verification.",
  }),
);
