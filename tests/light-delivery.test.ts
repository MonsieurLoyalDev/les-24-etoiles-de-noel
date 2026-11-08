import { it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import allowlist from "../ops/public-assets.json";
import { originalProof } from "./original-proof";
it("tous les assets de production restent disponibles et identiques dans SOURCE-LIGHT", () => {
  const manifest = existsSync("delivery-manifest.json")
    ? JSON.parse(readFileSync("delivery-manifest.json", "utf8"))
    : null;
  for (const path of allowlist) {
    const data = readFileSync(path);
    expect(data.length).toBeGreaterThan(0);
    if (manifest) {
      const proof = manifest.source.find(
        (f: { path: string }) => f.path === path,
      );
      expect(proof, path).toBeDefined();
      expect(createHash("sha256").update(data).digest("hex")).toBe(
        proof.sha256,
      );
    }
  }
  expect(() => originalProof("public/asset-runtime-manquant.png")).toThrow();
});
