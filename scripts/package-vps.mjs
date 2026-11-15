import {
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import {
  hash,
  walk,
  allowedPublic,
  inspectArtifact,
} from "../ops/lib/artifact.mjs";
import { checkPrivateBuild } from "../ops/lib/private-assets.mjs";
const destination = process.argv[2] ?? "artifacts/etoilebois-private";
if (existsSync(destination))
  throw Error("Output exists; choose a new artifact directory");
const info = JSON.parse(readFileSync("dist/build-info.json", "utf8"));
if (info.mode !== "supabase" || !info.configured || !info.captcha)
  throw Error("Configured private build with CAPTCHA required");
checkPrivateBuild(process.cwd());
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const files = {};
mkdirSync(join(destination, "site"), { recursive: true });
for (const p of walk("dist")) {
  if (!allowedPublic(p)) throw Error(`Unexpected build file: ${p}`);
  const dest = join(destination, "site", p);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join("dist", p), dest);
  files[p] = hash(readFileSync(dest));
}
writeFileSync(
  join(destination, "release-manifest.json"),
  JSON.stringify(
    { format: 1, mode: "supabase", commit, version, files },
    null,
    2,
  ),
);
inspectArtifact(destination);
console.log(`Private static artifact: ${destination} (${commit})`);
