import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const hash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const base = "9e75b86";
const files = execFileSync("git", ["ls-tree", "-r", "--name-only", base], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(
    (p) =>
      p.startsWith("public/") ||
      /^src\/(advent\/|ui\/|rpg\/|decor\/|save\.ts|calendar\.ts|domain\.ts|main\.tsx|style|art\/(actors|tags|snow|terrain|landscape|room|interior|audio|reactions))/.test(
        p,
      ),
  );
for (const p of ["src/art/plan-d34.json", "src/art/village34.ts"])
  if (!files.includes(p)) files.push(p);
const rows = files.map((path) => ({
  path,
  sha256: hash(
    execFileSync("git", ["show", base + ":" + path], {
      maxBuffer: 16 * 1024 * 1024,
    }),
  ),
}));
writeFileSync(
  "docs/graphismes/d35/PRESERVATION.json",
  JSON.stringify({ baseline: "D.3.4 / " + base, files: rows }, null, 2) + "\n",
);
const f = "ops/public-assets.json";
const a = JSON.parse(readFileSync(f, "utf8"));
for (const p of [
  "public/assets/environment-d35/sprites.png",
  "public/assets/environment-d35/path-materials.png",
])
  if (!a.includes(p)) a.push(p);
writeFileSync(f, JSON.stringify(a, null, 2) + "\n");
console.log("Fichiers protégés", rows.length);
