import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
/** Runtime PNGs are always read by tests. High-resolution originals live in ARTWORK.
 * A light delivery must declare their exact digest and dimensions; missing undeclared files fail.
 */
export function originalProof(path: string): {
  sha256: string;
  width: number;
  height: number;
} {
  if (existsSync(path)) {
    const b = readFileSync(path);
    return {
      sha256: createHash("sha256").update(b).digest("hex"),
      width: b.readUInt32BE(16),
      height: b.readUInt32BE(20),
    };
  }
  const file = "delivery-manifest.json";
  if (!existsSync(file))
    throw Error("Original absent et livraison non identifiée : " + path);
  const m = JSON.parse(readFileSync(file, "utf8"));
  if (m.format !== "etoilebois-source-light-1")
    throw Error("Profil de livraison inconnu");
  const item = m.artwork.find((x: { path: string }) => x.path === path);
  if (!item || !item.sha256 || !item.width || !item.height)
    throw Error("Original absent du manifeste ARTWORK : " + path);
  return { sha256: item.sha256, width: item.width, height: item.height };
}
