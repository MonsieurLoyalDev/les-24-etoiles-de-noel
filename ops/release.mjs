import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  lstatSync,
  realpathSync,
  readdirSync,
  copyFileSync,
  symlinkSync,
  renameSync,
  readlinkSync,
  rmdirSync,
  unlinkSync,
  chmodSync,
} from "node:fs";
import { resolve, join, basename, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { inspectArtifact, hash, walk } from "./lib/artifact.mjs";
const marker = "etoilebois-static-v1\n";
function rootPath(root) {
  if (!isAbsolute(root)) throw Error("Absolute deployment path required");
  root = resolve(root);
  if (basename(root) !== "etoilebois" || root === dirname(root))
    throw Error("Dedicated absolute etoilebois directory required");
  return root;
}
function checkedRoot(root) {
  root = rootPath(root);
  if (
    lstatSync(root).isSymbolicLink() ||
    realpathSync(root) !== root ||
    readFileSync(join(root, ".etoilebois-root"), "utf8") !== marker
  )
    throw Error("Root marker/path mismatch");
  for (const p of ["releases", "historic", "historic/assets"])
    if (lstatSync(join(root, p)).isSymbolicLink())
      throw Error("Managed directory is a link");
  return root;
}
function idCheck(id) {
  if (!/^[a-f0-9]{40}(?:-[0-9]{1,20}){0,2}$/.test(id ?? ""))
    throw Error(
      "Release ID must be commit SHA, optionally followed by run/attempt numbers",
    );
}
function locked(root, fn) {
  const lock = join(root, ".deploy-lock");
  mkdirSync(lock);
  try {
    return fn();
  } finally {
    rmdirSync(lock);
  }
}
function link(root, name, target) {
  const temp = join(root, `.${name}-${randomUUID()}`);
  symlinkSync(target, temp, process.platform === "win32" ? "junction" : "dir");
  try {
    renameSync(temp, join(root, name));
  } catch (e) {
    unlinkSync(temp);
    throw e;
  }
}
function pointer(root, name) {
  const p = join(root, name);
  if (!existsSync(p)) return null;
  if (!lstatSync(p).isSymbolicLink()) throw Error(`${name} is not a symlink`);
  const dest = resolve(root, readlinkSync(p));
  if (dirname(dest) !== join(root, "releases"))
    throw Error("Pointer outside releases");
  idCheck(basename(dest));
  return dest;
}
export function initialize(root) {
  root = rootPath(root);
  if (
    existsSync(root) &&
    (lstatSync(root).isSymbolicLink() || readdirSync(root).length)
  )
    throw Error("Initialization refuses nonempty or linked directories");
  if (realpathSync(dirname(root)) !== dirname(root))
    throw Error("Deployment parent is a link");
  if (!existsSync(root)) mkdirSync(root, { mode: 0o755 });
  for (const p of ["releases", "historic", "historic/assets", "acme"])
    mkdirSync(join(root, p), { recursive: true, mode: 0o755 });
  writeFileSync(join(root, ".etoilebois-root"), marker, {
    flag: "wx",
    mode: 0o600,
  });
  return root;
}
export function stage(root, artifact, id) {
  root = checkedRoot(root);
  idCheck(id);
  const m = inspectArtifact(artifact);
  if (!id.startsWith(m.commit))
    throw Error("Release ID does not match artifact commit");
  return locked(root, () => {
    const dest = join(root, "releases", id);
    if (existsSync(dest)) throw Error("Release already exists; no overwrite");
    mkdirSync(dest, { mode: 0o755 });
    mkdirSync(join(dest, "site"), { mode: 0o755 });
    for (const p of walk(join(artifact, "site"))) {
      const to = join(dest, "site", p);
      mkdirSync(dirname(to), { recursive: true, mode: 0o755 });
      copyFileSync(join(artifact, "site", p), to);
      chmodSync(to, 0o644);
      if (
        /^assets\/[A-Za-z0-9_-]+-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|png|webp)$/.test(
          p,
        )
      ) {
        const historic = join(root, "historic", p);
        if (existsSync(historic)) {
          if (
            lstatSync(historic).isSymbolicLink() ||
            hash(readFileSync(historic)) !== m.files[p]
          )
            throw Error("Historic asset collision");
        } else {
          copyFileSync(to, historic);
          chmodSync(historic, 0o644);
        }
      }
    }
    writeFileSync(
      join(dest, "release-manifest.json"),
      JSON.stringify(m, null, 2),
      { flag: "wx", mode: 0o600 },
    );
    inspectArtifact(dest);
    return dest;
  });
}
export function activate(root, id) {
  root = checkedRoot(root);
  idCheck(id);
  return locked(root, () => {
    const dest = join(root, "releases", id);
    if (lstatSync(dest).isSymbolicLink() || realpathSync(dest) !== dest)
      throw Error("Release path is a link");
    inspectArtifact(dest);
    const old = pointer(root, "current");
    if (old === dest) return dest;
    if (old) link(root, "previous", old);
    link(root, "current", dest);
    return dest;
  });
}
export function rollback(root) {
  root = checkedRoot(root);
  const old = pointer(root, "previous");
  if (!old) throw Error("No previous release");
  return activate(root, basename(old));
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [command, root, arg, id] = process.argv.slice(2);
    if (!root)
      throw Error(
        "Usage: release.mjs init|stage|activate|rollback /var/www/etoilebois [artifact|id] [id]",
      );
    let result;
    if (command === "init") {
      if (arg !== "--confirm-init")
        throw Error("Explicit --confirm-init required after approval");
      result = initialize(root);
    } else if (command === "stage") result = stage(root, arg, id);
    else if (command === "activate") result = activate(root, arg);
    else if (command === "rollback") result = rollback(root);
    else throw Error("Unknown command");
    console.log(result);
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
