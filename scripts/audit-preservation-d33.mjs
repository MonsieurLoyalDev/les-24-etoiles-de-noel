import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const base = "a7827c8e9df7595888cdb9b44c91db7714e0a48e";
const files = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", base, "public/assets"],
  { encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const changes = execFileSync(
  "git",
  [
    "diff",
    base,
    "--name-only",
    "--diff-filter=MD",
    "--",
    "public/assets",
    "src/advent",
    "src/domain.ts",
    "src/ui",
    "src/rpg/quests.ts",
    "supabase",
  ],
  { encoding: "utf8" },
).trim();
const preserved = files.map((path) => ({
  path,
  sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
}));
writeFileSync(
  "docs/graphismes/d33/PRESERVATION.json",
  JSON.stringify(
    { base, protectedDiff: changes || "aucun", assets: preserved },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    protectedAssets: files.length,
    protectedDiff: changes || "aucun",
  }),
);
