import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";
export const hash = (b) => createHash("sha256").update(b).digest("hex");
export function safeName(name) {
  return (
    typeof name === "string" &&
    name.length < 240 &&
    !name.includes("\\") &&
    !name.includes("\0") &&
    !isAbsolute(name) &&
    name
      .split("/")
      .every((p) => p !== "." && p !== ".." && /^[A-Za-z0-9_.-]+$/.test(p))
  );
}
export function walk(root) {
  const out = [];
  function visit(dir) {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (lstatSync(p).isSymbolicLink())
        throw Error("Symbolic link in artifact");
      if (f.isDirectory()) visit(p);
      else if (f.isFile()) out.push(relative(root, p).replaceAll("\\", "/"));
      else throw Error("Special file in artifact");
    }
  }
  visit(root);
  return out.sort();
}
export function allowedPublic(name) {
  return (
    name === "index.html" ||
    name === "build-info.json" ||
    (/^assets\/[A-Za-z0-9_./-]+\.(js|css|png|webp|jpg|jpeg|woff2?|ttf)$/.test(
      name,
    ) &&
      safeName(name))
  );
}
export function inspectArtifact(dir) {
  dir = resolve(dir);
  if (lstatSync(dir).isSymbolicLink())
    throw Error("Artifact directory is a link");
  if (
    lstatSync(join(dir, "site")).isSymbolicLink() ||
    lstatSync(join(dir, "release-manifest.json")).isSymbolicLink()
  )
    throw Error("Artifact entry is a link");
  const m = JSON.parse(
    readFileSync(join(dir, "release-manifest.json"), "utf8"),
  );
  if (
    m.format !== 1 ||
    m.mode !== "supabase" ||
    !/^\d+\.\d+\.\d+$/.test(m.version) ||
    !/^[a-f0-9]{40}$/.test(m.commit) ||
    !m.files ||
    typeof m.files !== "object" ||
    Array.isArray(m.files)
  )
    throw Error("Invalid release manifest");
  const actual = walk(join(dir, "site"));
  const declared = Object.keys(m.files).sort();
  if (
    JSON.stringify(actual) !== JSON.stringify(declared) ||
    !actual.includes("index.html")
  )
    throw Error("Unexpected or missing public files");
  for (const p of actual) {
    if (
      !safeName(p) ||
      !allowedPublic(p) ||
      !/^[a-f0-9]{64}$/.test(m.files[p]) ||
      hash(readFileSync(join(dir, "site", p))) !== m.files[p]
    )
      throw Error(`Invalid public file: ${p}`);
  }
  const info = JSON.parse(
    readFileSync(join(dir, "site/build-info.json"), "utf8"),
  );
  if (
    info.mode !== "supabase" ||
    !info.configured ||
    !info.captcha ||
    new URL(info.backendOrigin).protocol !== "https:"
  )
    throw Error("Private backend/CAPTCHA build configuration required");
  return m;
}
