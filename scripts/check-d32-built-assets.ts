import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
const mode = process.argv[2];
if (!["private", "production", "e2e"].includes(mode))
  throw Error("Expected a build mode label");
const references = new Set<string>();
for (const file of readdirSync("dist/assets").filter((x) => x.endsWith(".css")))
  for (const match of readFileSync("dist/assets/" + file, "utf8").matchAll(
    /url\(([^)]+)\)/g,
  )) {
    const url = match[1].replace(/^["']|["']$/g, "");
    if (url.startsWith("/assets/")) references.add(url.split(/[?#]/)[0]);
  }
const missing = [...references].filter((url) => !existsSync("dist" + url));
const native = readdirSync("dist/assets/life-d32").filter((x) =>
  x.endsWith(".png"),
);
if (missing.length || native.length !== 20)
  throw Error("Missing built assets: " + missing.join(","));
const result = {
  mode,
  cssAssetReferences: references.size,
  allPresent: true,
  nativeSprites: native.length,
  missing,
};
writeFileSync(
  `docs/graphismes/D32-ASSETS-${mode}.json`,
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result));
