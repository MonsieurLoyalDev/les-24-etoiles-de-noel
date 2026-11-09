import {
  readFileSync,
  writeFileSync,
  copyFileSync,
  mkdirSync,
  existsSync,
  statSync,
} from "node:fs";
import { dirname, resolve, extname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const base = resolve(process.argv[2] || "../livraison-d35/final");
mkdirSync(base, { recursive: true });
const light = join(base, "source-light"),
  art = join(base, "artwork");
if (existsSync(light) || existsSync(art))
  throw Error("Choisir un dossier de préparation vierge.");
mkdirSync(light);
mkdirSync(art);
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const extras = [
  "scripts/package-d33-split.mjs",
  "scripts/audit-light.mjs",
  "tests/original-proof.ts",
  "tests/light-delivery.test.ts",
];
const files = [...new Set([...tracked, ...extras])];
const essentials = new Set([
  "docs/graphismes/d35/PRESERVATION.json",
  "docs/graphismes/d35/INVENTAIRE.json",
  "docs/graphismes/d35/RAPPORT.md",
  "docs/graphismes/d35/PROMPTS.md",
  "docs/graphismes/d34/plan-valide-v2.json",
  "docs/graphismes/d34/RAPPORT.md",
  "docs/graphismes/d34/PRESERVATION.json",
  "docs/CONFIGURATION-SUPABASE.md",
  "docs/PERSONNALISATION-24-JOURS.md",
  "docs/VPS-UBUNTU.md",
  "docs/SECRETS-ET-SAUVEGARDES.md",
  "docs/PLAN-VALIDATION-VPS.md",
  "docs/graphismes/INVENTAIRE.json",
  "docs/graphismes/INVENTAIRE-D3.json",
  "docs/graphismes/INVENTAIRE-D31.json",
  "docs/graphismes/INVENTAIRE-D32.json",
  "docs/graphismes/d33/ASSETS-INTERIEURS.json",
  "docs/graphismes/vegetation-d22.html",
  "docs/graphismes/ressources-d31.html",
]);
const buildScripts = new Set([
  "scripts/generate-seed.ts",
  "scripts/check-private-build.ts",
  "scripts/package-vps.mjs",
]);
const source = [],
  artwork = [],
  objects = new Map();
for (const path of files) {
  if (!existsSync(path)) throw Error("Fichier manquant : " + path);
  const bytes = readFileSync(path),
    sha256 = createHash("sha256").update(bytes).digest("hex");
  const selected =
    path === "README.md" ||
    (!path.startsWith("docs/") && !path.startsWith("scripts/")) ||
    essentials.has(path) ||
    buildScripts.has(path);
  if (selected) {
    const dest = join(light, path);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(path, dest);
    source.push({
      path,
      bytes: bytes.length,
      sha256,
      purpose: path.startsWith("public/")
        ? "runtime-or-regression-fixture"
        : "source-config-test-documentation",
    });
  } else {
    let object = objects.get(sha256);
    if (!object) {
      object = `objects/${sha256}${extname(path)}`;
      objects.set(sha256, object);
      const dest = join(art, object);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(path, dest);
    }
    const png = bytes.length > 24 && bytes.subarray(1, 4).toString() === "PNG";
    artwork.push({
      path,
      object,
      bytes: bytes.length,
      sha256,
      ...(png
        ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
        : {}),
      reason: path.startsWith("docs/screenshots/")
        ? "validation-media"
        : path.includes("/originals/") || path.includes("/d35/native/")
          ? "high-resolution-original"
          : path.startsWith("scripts/")
            ? "artwork-export-or-historical-tool"
            : "historical-documentation",
    });
  }
}
// Preserve the long historical README separately; replace only the handoff instructions.
const old = readFileSync("README.md"),
  hash = createHash("sha256").update(old).digest("hex"),
  object = `objects/${hash}.md`;
if (!objects.has(hash)) {
  writeFileSync(join(art, object), old);
  objects.set(hash, object);
}
artwork.push({
  path: "archives/README-D35-complet.md",
  object,
  bytes: old.length,
  sha256: hash,
  reason: "historical-documentation",
});
const readme = `# Étoilebois D.3.5 — SOURCE-LIGHT / 0.7.5\n\nMême jeu et mêmes graphismes, sans les originaux haute résolution et les médias de validation. Aucun fichier src ou public n'est recompressé ou modifié.\n\n## Installation\n\nNode.js 24 et npm. Dans ce dossier :\n\n\`\`\`powershell\nnpm ci\nnpm run dev\n\`\`\`\n\n## Vérification\n\n\`\`\`powershell\nnpx tsc --noEmit\nnpm test\nnpm run build\nnpm run build:e2e\n$env:ETB_E2E_BUILT='1'\nnpm run test:e2e\n\`\`\`\n\nSur Windows, Chrome installé est utilisé. Sur Linux CI : npx playwright install --with-deps chromium. Les captures générées par les tests ne font pas partie de ce ZIP initial.\n\n## Modes et données\n\nLe mode démonstration utilise des contenus fictifs. Pour le mode privé, suivre docs/CONFIGURATION-SUPABASE.md et utiliser npm run build:private ; aucun secret n'est livré, seul .env.example est fourni. Les sauvegardes et leurs clés restent inchangées.\n\n## Ressources et tests\n\nLes PNG fonctionnels et les fixtures graphiques référencées par les tests de non-régression sont conservés octet pour octet. Les tests lisent toujours les vrais PNG publics. Les contrôles d'origine haute résolution utilisent leurs métadonnées déclarées dans delivery-manifest.json lorsque ARTWORK n'est pas extrait ; ils relisent et vérifient les originaux lorsqu'ils sont disponibles. Les octets de ces originaux sont vérifiés séparément dans le ZIP ARTWORK à la livraison. Aucun test fonctionnel n'est désactivé.\n\n## ARTWORK\n\nDécompresser D35-ARTWORK.zip et lire son README. Les originaux, comparatifs, vidéos et archives sont stockés une seule fois par SHA-256, avec un manifeste de restauration. Ils ne sont pas nécessaires à npm ci, au build ou au jeu. Les outils d'export artistique peuvent être restaurés avec ARTWORK si besoin.\n`;
writeFileSync(join(light, "README.md"), readme);
const row = source.find((f) => f.path === "README.md");
row.bytes = Buffer.byteLength(readme);
row.sha256 = createHash("sha256").update(readme).digest("hex");
const fixturePath = "docs/graphismes/sapin-light.html";
const fixture = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Sapin — contrôle natif SOURCE-LIGHT</title><style>body{background:#192733;color:#ffe7c1;font:16px sans-serif;margin:24px}.frames{display:flex;gap:24px}.frame{width:225px;height:184px;background-image:url('../../public/assets/validated/atlases/sapin_atlas-Etoilebois_Sapin_V11_4.png');background-size:1125px 920px;image-rendering:pixelated}img{max-width:100%;image-rendering:pixelated}</style><h1>Atlas natif du sapin — SOURCE-LIGHT</h1><p>Les comparatifs historiques restent dans ARTWORK. Cette page contrôle le véritable atlas utilisé par le jeu, avec les états 0, 1 et 24.</p><div class="frames"><div class="frame"></div><div class="frame" style="background-position:-225px 0"></div><div class="frame" style="background-position:-900px -736px"></div></div><h2>Texture native complète</h2><img src="../../public/assets/validated/atlases/sapin_atlas-Etoilebois_Sapin_V11_4.png" alt="Atlas natif des 25 états"></html>`;
writeFileSync(join(light, fixturePath), fixture);
source.push({
  path: fixturePath,
  bytes: Buffer.byteLength(fixture),
  sha256: createHash("sha256").update(fixture).digest("hex"),
  purpose: "native-atlas-browser-test-fixture",
});
const manifest = {
  format: "etoilebois-source-light-1",
  version: "0.7.5",
  baseCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  source,
  artwork,
  notes: [
    "All public assets kept byte-for-byte: live runtime assets and required regression-test fixtures.",
    "Packaging copies D35 runtime code and public PNG files byte-for-byte; layout changes are documented in the D35 report.",
  ],
};
writeFileSync(
  join(light, "delivery-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
writeFileSync(
  join(art, "manifest.json"),
  JSON.stringify({ format: "etoilebois-artwork-1", files: artwork }, null, 2) +
    "\n",
);
writeFileSync(
  join(art, "restore-artwork.mjs"),
  `import{readFileSync,mkdirSync,existsSync,copyFileSync}from'node:fs';import{resolve,dirname,sep}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';const root=dirname(fileURLToPath(import.meta.url)),target=resolve(process.argv[2]||root+'/restored'),m=JSON.parse(readFileSync(root+'/manifest.json','utf8'));const hash=b=>createHash('sha256').update(b).digest('hex');for(const f of m.files){const out=resolve(target,f.path);if(!out.startsWith(target+sep))throw Error('Path outside target');const b=readFileSync(resolve(root,f.object));if(hash(b)!==f.sha256)throw Error('Corrupt object '+f.path);if(existsSync(out)&&hash(readFileSync(out))!==f.sha256)throw Error('Existing different file '+f.path);}for(const f of m.files){const out=resolve(target,f.path);mkdirSync(dirname(out),{recursive:true});if(!existsSync(out))copyFileSync(resolve(root,f.object),out);}console.log(m.files.length+' paths restored in '+target);\n`,
);
writeFileSync(
  join(art, "README.md"),
  '# Étoilebois D.3.5 — ARTWORK\n\nOriginaux graphiques, captures, vidéos et documents historiques. Aucun média n’a été recompressé. Les doublons exacts sont stockés une seule fois dans objects/, avec toutes leurs destinations dans manifest.json.\n\nRestaurer les dossiers lisibles :\n\n    node restore-artwork.mjs\n\nCela crée restored/ dans ce dossier. On peut aussi fournir un dossier cible vierge :\n\n    node restore-artwork.mjs "C:/chemin/artwork-restaure"\n\nPour remettre les outils artistiques et les originaux aux chemins du projet, fournir la racine de SOURCE-LIGHT comme cible. Un fichier existant différent est refusé. Le jeu et son build ne nécessitent pas cette restauration.\n',
);
const stats = {
  sourceFiles: source.length,
  sourceBytes: source.reduce((s, f) => s + f.bytes, 0),
  artworkPaths: artwork.length,
  uniqueArtworkObjects: objects.size,
  artworkBytes: artwork.reduce((s, f) => s + f.bytes, 0),
  uniqueArtworkBytes: [...objects.values()].reduce(
    (s, p) => s + statSync(join(art, p)).size,
    0,
  ),
};
writeFileSync(join(base, "PARTITION.json"), JSON.stringify(stats, null, 2));
console.log(stats);
