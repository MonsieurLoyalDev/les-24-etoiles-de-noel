import { it, expect } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  unlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  assertPublicAssets,
  requiredPublicAssets,
  assertAssetBytes,
  checkPrivateBuild,
  publicAssetFamilies,
} from "../ops/lib/private-assets.mjs";
import { publicConfig } from "../ops/lib/public-config.mjs";
const root = resolve(".");
const assets = JSON.parse(readFileSync("ops/public-assets.json", "utf8"));
function smallBuild() {
  const root = mkdtempSync(join(tmpdir(), "etoilebois-e1-artifact-"));
  for (const family of publicAssetFamilies)
    mkdirSync(join(root, "public/assets", family), { recursive: true });
  for (const dir of ["src/art", "src/world", "ops", "dist/assets/ground"])
    mkdirSync(join(root, dir), { recursive: true });
  for (const file of ["assets-manifest.json", "src/art/catalog.json"])
    writeFileSync(join(root, file), "{}");
  const source = "public/assets/ground/ground.png";
  copyFileSync(source, join(root, source));
  copyFileSync(source, join(root, "dist/assets/ground/ground.png"));
  writeFileSync(join(root, "ops/public-assets.json"), JSON.stringify([source]));
  writeFileSync(
    join(root, "dist/index.html"),
    '<html><script src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"></html>',
  );
  writeFileSync(join(root, "dist/assets/app.js"), 'console.log("fixture")');
  writeFileSync(join(root, "dist/assets/app.css"), "body{margin:0}");
  writeFileSync(
    join(root, "dist/build-info.json"),
    JSON.stringify({ mode: "supabase", configured: false, captcha: false }),
  );
  return root;
}
it("E1 refuse une spritesheet D42 retirée de la liste, même si le PNG source existe", () => {
  for (const name of ["celestine", "emile", "augustin"])
    expect(() =>
      assertPublicAssets(
        root,
        assets.filter((p) => !p.endsWith(`/activities-d42/${name}.png`)),
      ),
    ).toThrow(`public/assets/activities-d42/${name}.png`);
});
it("E2.1 refuse une planche narrative absente de la livraison privée", () => {
  for (const name of ["human", "fox", "seats"])
    expect(() =>
      assertPublicAssets(
        root,
        assets.filter((p) => !p.endsWith(`/narrative-polish/${name}.png`)),
      ),
    ).toThrow(`public/assets/narrative-polish/${name}.png`);
});
it("E1 couvre les familles dynamiques, atlas, fontes et références CSS sans copier public entier", () => {
  const required = requiredPublicAssets(root);
  expect(assertPublicAssets(root, assets)).toEqual(assets);
  expect(required).toContain("public/assets/activities-d42/celestine.png");
  expect(required).toContain(
    "public/assets/validated/calendar/calendrier_art.png",
  );
  expect(required).toContain(
    "public/assets/validated/fonts/Nunito-Regular.ttf",
  );
});
it("E1 refuse HTML sous un nom PNG, fontes corrompues et chemins privés", () => {
  expect(() =>
    assertAssetBytes("missing.png", Buffer.from("<html>SPA</html>")),
  ).toThrow("PNG");
  expect(() => assertAssetBytes("font.ttf", Buffer.from("<html>"))).toThrow(
    "font",
  );
  expect(() =>
    assertPublicAssets(root, [...assets, "public/assets/private/24.png"]),
  ).toThrow("Unreviewed");
  expect(() =>
    assertPublicAssets(root, [...assets, "public/demo/private.png"]),
  ).toThrow("Invalid");
  expect(() => assertPublicAssets(root, [...assets, assets[0]])).toThrow(
    "duplicate",
  );
});
it("E1 détecte un PNG absent du résultat compilé avant toute publication", () => {
  const output = mkdtempSync(join(tmpdir(), "etoilebois-e1-missing-"));
  expect(() => checkPrivateBuild(root, output)).toThrow(
    "Missing built resource",
  );
});
it("E1 refuse un PNG compilé remplacé par du HTML ou par des octets différents", () => {
  const fixture = smallBuild(),
    file = join(fixture, "dist/assets/ground/ground.png");
  expect(checkPrivateBuild(fixture).assets).toBe(1);
  writeFileSync(file, "<html>SPA fallback</html>");
  expect(() => checkPrivateBuild(fixture)).toThrow("Invalid PNG");
  const bytes = readFileSync("public/assets/ground/ground.png");
  bytes[bytes.length - 1] ^= 1;
  writeFileSync(file, bytes);
  expect(() => checkPrivateBuild(fixture)).toThrow("differs");
});
it("E1 refuse un chunk JavaScript ou une feuille CSS obligatoire absent du paquet", () => {
  for (const name of ["app.js", "app.css"]) {
    const fixture = smallBuild();
    unlinkSync(join(fixture, "dist/assets", name));
    expect(() => checkPrivateBuild(fixture)).toThrow(
      "Missing compiled dependency",
    );
  }
});
it("E1 refuse des surprises ajoutées au site, les modules demo et les références inconnues", () => {
  const fixture = smallBuild(),
    extra = join(fixture, "dist/future.json"),
    js = join(fixture, "dist/assets/extra.js");
  writeFileSync(extra, '{"surprise":"fiction"}');
  expect(() => checkPrivateBuild(fixture)).toThrow("Unexpected");
  unlinkSync(extra);
  writeFileSync(js, 'console.log("Ce voyage de démonstration nous attend")');
  expect(() => checkPrivateBuild(fixture)).toThrow("Demo surprise");
  writeFileSync(js, 'fetch("/assets/ground/not-approved.png")');
  expect(() => checkPrivateBuild(fixture)).toThrow("Unapproved");
});
it("E1 empêche réellement le packaging sans Auth ou CAPTCHA, avant toute écriture", () => {
  for (const info of [
    { mode: "supabase", configured: false, captcha: false },
    { mode: "supabase", configured: true, captcha: false },
  ]) {
    const dir = mkdtempSync(join(tmpdir(), "etoilebois-e1-unconfigured-"));
    mkdirSync(join(dir, "dist"));
    writeFileSync(join(dir, "dist/build-info.json"), JSON.stringify(info));
    const r = spawnSync(
      process.execPath,
      [resolve("scripts/package-vps.mjs")],
      { cwd: dir, encoding: "utf8" },
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain(
      "Configured private build with CAPTCHA required",
    );
  }
});
it("E1 refuse clés inconnues, JWT sans rôle anon et secrets ; accepte uniquement la forme publique", () => {
  for (const key of [
    "a-password-not-a-key",
    "sb_secret_fixture",
    "x.invalid.x",
    `x.${Buffer.from("{}").toString("base64url")}.x`,
  ])
    expect(() => publicConfig({ VITE_SUPABASE_ANON_KEY: key })).toThrow();
  expect(() =>
    publicConfig({ VITE_TURNSTILE_SITE_KEY: "sb_secret_fixture" }),
  ).toThrow("Server key");
  expect(() => publicConfig({ VITE_APP_MODE: "unexpected" })).toThrow("mode");
  expect(
    publicConfig({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "sb_publishable_fixture_not_real",
      VITE_TURNSTILE_SITE_KEY: "fixture-public-site-key",
    }),
  ).toMatchObject({ configured: true, captcha: true });
});
