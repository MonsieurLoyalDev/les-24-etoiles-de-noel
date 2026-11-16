import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

// Reviewed runtime families, never an automatic copy of public/ or private media.
export const publicAssetFamilies = [
  "characters",
  "ground",
  "props",
  "references",
  "validated",
  "refinements-d21",
  "refinements-d22",
  "ambience-d3",
  "interiors-d31",
  "life-d32",
  "village-d33",
  "environment-d35",
  "activities-d42",
  "narrative-polish",
  "production",
];
const families = publicAssetFamilies;
const digest = (b) => createHash("sha256").update(b).digest("hex");
function walk(dir) {
  if (lstatSync(dir).isSymbolicLink())
    throw Error("Linked public directory: " + dir);
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const file = join(dir, item.name);
    if (lstatSync(file).isSymbolicLink())
      throw Error("Linked public resource: " + file);
    return item.isDirectory() ? walk(file) : [file];
  });
}
function urls(value, found) {
  if (typeof value === "string" && /^\/assets\/.+\.(png|ttf)$/.test(value))
    found.add("public" + value);
  else if (value && typeof value === "object")
    for (const child of Object.values(value)) urls(child, found);
}
export function requiredPublicAssets(root) {
  const found = new Set();
  // Includes atlas images, CSS calendar/portraits, and legacy manifest paths.
  for (const file of ["assets-manifest.json", "src/art/catalog.json"])
    urls(JSON.parse(readFileSync(join(root, file), "utf8")), found);
  // Procedural loaders expand keys in these reviewed families at runtime.
  for (const family of families) {
    const dir = join(root, "public/assets", family);
    if (!existsSync(dir)) throw Error("Missing runtime family: " + family);
    for (const file of walk(dir))
      if (/\.(png|ttf)$/.test(file))
        found.add(relative(root, file).replaceAll("\\", "/"));
  }
  // Pose metadata remains required even if someone deletes the corresponding PNG.
  for (const file of readdirSync(join(root, "src/world")))
    if (/^pose-[a-z]+\.json$/.test(file))
      found.add("public/assets/activities-d42/" + file.slice(5, -5) + ".png");
  // Also catch literal paths in new loaders/CSS, including typos to absent files.
  for (const file of walk(join(root, "src"))) {
    if (!/\.(ts|tsx|css|json)$/.test(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(
      /["'`](\/assets\/[a-zA-Z0-9_./-]+\.(?:png|ttf))["'`]/g,
    ))
      found.add("public" + match[1]);
  }
  return [...found].sort();
}
export function assertAssetBytes(path, bytes) {
  if (path.endsWith(".png")) {
    if (
      bytes.length < 33 ||
      !bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) ||
      bytes.toString("ascii", 12, 16) !== "IHDR" ||
      !bytes.readUInt32BE(16) ||
      !bytes.readUInt32BE(20)
    )
      throw Error("Invalid PNG bytes (HTML or corrupt image): " + path);
  } else if (
    path.endsWith(".ttf") &&
    !["00010000", "4f54544f"].includes(bytes.subarray(0, 4).toString("hex"))
  )
    throw Error("Invalid font bytes: " + path);
}
export function assertPublicAssets(root, assets) {
  if (!Array.isArray(assets) || new Set(assets).size !== assets.length)
    throw Error("Invalid or duplicate public allowlist");
  for (const asset of assets) {
    if (
      typeof asset !== "string" ||
      asset.includes("..") ||
      (!/^public\/assets\/[a-zA-Z0-9_./-]+\.png$/.test(asset) &&
        !/^public\/assets\/validated\/fonts\/(Marcellus-Regular|Nunito-Regular|Nunito-Bold)\.ttf$/.test(
          asset,
        ))
    )
      throw Error("Invalid public allowlist path");
    if (!families.includes(asset.split("/")[2]))
      throw Error("Unreviewed asset family: " + asset);
    if (!existsSync(join(root, asset)))
      throw Error("Missing source resource: " + asset);
    if (lstatSync(join(root, asset)).isSymbolicLink())
      throw Error("Linked source resource: " + asset);
    assertAssetBytes(asset, readFileSync(join(root, asset)));
  }
  const missing = requiredPublicAssets(root).filter(
    (file) => !assets.includes(file),
  );
  if (missing.length)
    throw Error(
      "Required resources absent from private allowlist: " + missing.join(", "),
    );
  return assets;
}
export function checkPrivateBuild(root, output = join(root, "dist")) {
  const assets = assertPublicAssets(
    root,
    JSON.parse(readFileSync(join(root, "ops/public-assets.json"), "utf8")),
  );
  const approved = new Set(assets.map((p) => p.slice(7)));
  const files = walk(output);
  for (const file of files) {
    const name = relative(output, file).replaceAll("\\", "/");
    if (
      !approved.has(name) &&
      !["index.html", "build-info.json"].includes(name) &&
      !/^assets\/[a-zA-Z0-9_-]+\.(js|css)$/.test(name)
    )
      throw Error("Unexpected private build file: " + name);
    if (/\.js$/.test(name)) {
      const code = readFileSync(file, "utf8");
      if (
        /demoApi/.test(name) ||
        code.includes("Ce voyage de démonstration nous attend")
      )
        throw Error("Demo surprise content in private build");
    }
    if (/\.(js|css)$/.test(name))
      for (const match of readFileSync(file, "utf8").matchAll(
        /["'(](\/assets\/[a-zA-Z0-9_./-]+\.(?:png|ttf))["')]/g,
      ))
        if (!approved.has(match[1].slice(1)))
          throw Error("Unapproved bundled resource: " + match[1]);
  }
  for (const source of assets) {
    const dest = join(output, source.slice(7));
    if (!existsSync(dest)) throw Error("Missing built resource: " + source);
    const bytes = readFileSync(dest);
    assertAssetBytes(dest, bytes);
    if (digest(bytes) !== digest(readFileSync(join(root, source))))
      throw Error("Built resource differs from approved source: " + source);
  }
  const entry = join(output, "index.html");
  if (!existsSync(entry)) throw Error("Missing private entry: index.html");
  const html = readFileSync(entry, "utf8");
  if (!/<script\b[^>]*\bsrc=["']\/assets\/[a-zA-Z0-9_-]+\.js["']/.test(html))
    throw Error("Missing private JavaScript entry");
  for (const match of html.matchAll(
    /(?:src|href)=["'](\/assets\/[a-zA-Z0-9_-]+\.(?:js|css))["']/g,
  ))
    if (!existsSync(join(output, match[1].slice(1))))
      throw Error("Missing compiled dependency: " + match[1]);
  const info = JSON.parse(
    readFileSync(join(output, "build-info.json"), "utf8"),
  );
  if (info.mode !== "supabase") throw Error("Private build required");
  return {
    assets: assets.length,
    files: files.length,
    configured: info.configured && info.captcha,
  };
}
