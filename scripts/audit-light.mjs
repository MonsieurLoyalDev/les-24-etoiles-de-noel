import { execFileSync } from "node:child_process";
import { statSync, writeFileSync, mkdirSync } from "node:fs";
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .map((path) => ({ path, bytes: statSync(path).size }))
  .sort((a, b) => b.bytes - a.bytes);
const folders = {};
for (const f of files) {
  const p = f.path.split("/").slice(0, 2).join("/");
  folders[p] = (folders[p] || 0) + f.bytes;
}
mkdirSync("../livraison-d33-optimisee", { recursive: true });
const audit = {
  total: files.reduce((s, f) => s + f.bytes, 0),
  files: files.length,
  top30: files.slice(0, 30),
  folders: Object.entries(folders).sort((a, b) => b[1] - a[1]),
  publicBytes: files
    .filter((f) => f.path.startsWith("public/"))
    .reduce((s, f) => s + f.bytes, 0),
};
writeFileSync(
  "../livraison-d33-optimisee/AUDIT-POIDS.json",
  JSON.stringify(audit, null, 2),
);
console.log(JSON.stringify(audit, null, 2));

