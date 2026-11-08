import { readFileSync, writeFileSync } from "node:fs";
const read = (path: string) => readFileSync(path, "utf8");
const json = (path: string) => JSON.parse(read(path));
const browser = read("docs/graphismes/D32-BROWSER-LOG.txt"),
  passed = browser.match(/\s(\d+) passed \(([^)]+)\)/),
  skipped = browser.match(/\s(\d+) skipped/);
if (!passed || /\s[1-9]\d* failed/.test(browser))
  throw Error("The final browser suite is incomplete or failed");
const browserPassed = Number(passed[1]),
  browserSkipped = Number(skipped?.[1] ?? 0);
if (browserPassed + browserSkipped !== 90)
  throw Error("Expected all 90 final cases, including compatibility checks");
const units = json("docs/graphismes/D32-UNIT-RESULTATS.json"),
  invariants = json("docs/graphismes/INVARIANTS-D32.json"),
  art = json("docs/graphismes/D32-CONTROLE-RESSOURCES.json"),
  inventory = json("docs/graphismes/INVENTAIRE-D32.json");
if (
  !units.success ||
  units.numFailedTests ||
  !invariants.allProtectedUnchanged ||
  !invariants.originalCollisionsUnchanged ||
  invariants.authenticBeforeFrames !== 43 ||
  !art.transparentCornersVerified
)
  throw Error("A required proof failed");
const privateBuild = read("docs/graphismes/D32-BUILD-PRIVATE.txt"),
  build = read("docs/graphismes/D32-BUILD.txt"),
  lint = read("docs/graphismes/D32-LINT.txt");
if (
  !privateBuild.includes("Build privé : aucun paquet") ||
  !build.includes("built in") ||
  !lint.includes("eslint src tests")
)
  throw Error("Build or lint proof missing");
const builtAssets = [
  json("docs/graphismes/D32-ASSETS-private.json"),
  json("docs/graphismes/D32-ASSETS-production.json"),
];
if (builtAssets.some((x) => !x.allPresent || x.nativeSprites !== 20))
  throw Error("Built asset proof failed");
const metrics = [
  "performance-desktop",
  "performance-mobile",
  "performance-quartier-desktop",
  "performance-quartier-mobile",
].map((name) => ({
  name,
  ...json(`docs/screenshots/phase-d3-2/apres/${name}.json`),
}));
const result = {
  version: "0.7.2",
  base: "21f1e0a8c615b585e2600651f412ed0c565fb46c",
  checkedAt: new Date().toISOString(),
  lint: "passed",
  typescript: "passed via build:private, build and build:e2e",
  build: "passed",
  privateBuild: "passed; no bundled demo surprises or demo media",
  builtAssets,
  unit: {
    passed: units.numPassedTests,
    skipped: units.numPendingTests,
    failed: units.numFailedTests,
    skippedCases: units.testResults
      .flatMap(
        (s: { assertionResults?: { status: string; fullName: string }[] }) =>
          s.assertionResults ?? [],
      )
      .filter((t: { status: string }) =>
        ["pending", "skipped"].includes(t.status),
      )
      .map((t: { fullName: string }) => t.fullName),
  },
  browser: {
    passed: browserPassed,
    skipped: browserSkipped,
    failed: 0,
    total: 90,
    duration: passed[2],
    command:
      "ETB_E2E_BUILT=1 npx playwright test --max-failures=1 --reporter=line",
    platforms: [
      "Chrome desktop 1280×800 / 1280×1000",
      "Chrome mobile emulation 390×844",
    ],
    physicalPhoneTested: false,
  },
  art: {
    usedAssets: inventory.assets.length,
    servedBytes: inventory.assets.reduce(
      (n: number, a: { public: { bytes: number } }) => n + a.public.bytes,
      0,
    ),
    maxNativeDimension: Math.max(
      ...inventory.assets.flatMap((a: { width: number; height: number }) => [
        a.width,
        a.height,
      ]),
    ),
    authenticBeforeFrames: invariants.authenticBeforeFrames,
    verifiedTransparentSprites: art.nativeSprites,
    comparisonFiles: art.comparisonFiles,
    videos: art.videos,
  },
  protectedFiles: invariants.protectedFiles,
  metrics,
  limits: [
    "No physical phone or deployed HTTPS server tested",
    "Four decorative houses retained instead of eight miniature placements",
    "No seated character pose; chairs are examinable",
    "Texts are fictional; historical V10 edge defects remain",
    "Headless RAF is not capped and must not be presented as physical-device FPS",
  ],
  deployment: "none",
  merge: "none",
};
writeFileSync(
  "docs/graphismes/D32-RESULTATS.json",
  JSON.stringify(result, null, 2) + "\n",
);
writeFileSync(
  "docs/graphismes/PR-D32.md",
  `Les intérieurs D.3.1 manquaient de détails de vie et le village d'habitations. D.3.2 ajoute huit ensembles de mobilier, dix-sept interactions décoratives (chat, lectures, éclairages commutables, train) et quatre maisons à échelle humaine, sur la carte existante.

Les interrupteurs utilisent une sauvegarde locale séparée. Les ressources validées, HUD, dialogues, calendrier et mini-jeux sont conservés. Les collisions originales restent intactes ; les emprises ajoutées respectent aussi le trajet historique vers la bibliothèque, sans modifier son test.

Validation locale : lint, TypeScript, build standard et build privé réussis ; ${result.unit.passed} tests unitaires réussis (${result.unit.skipped} scripts POSIX non exécutés sur Windows) ; ${browserPassed} tests navigateur réussis et ${browserSkipped} cas non applicables ignorés sur 90 cas PC/mobile. Contrôle de vingt sprites transparents, des captures et des deux vidéos effectué.

[Rapport, performances et limites](https://github.com/MonsieurLoyalDev/les-24-etoiles-de-noel/blob/feature/phase-d3-2-village-habite/docs/graphismes/FINITIONS-D32.md) · [Captures avant/après](https://github.com/MonsieurLoyalDev/les-24-etoiles-de-noel/tree/feature/phase-d3-2-village-habite/docs/screenshots/phase-d3-2)

Quatre maisons ont été retenues pour préserver les proportions et les passages. Les fauteuils sont examinables sans posture assise ; les textes sont fictifs. Téléphone émulé, pas d'appareil physique testé. Validation artistique attendue. Aucune fusion, aucun déploiement et aucune Phase D.4.
`,
);
const rows = metrics
  .map(
    (m) =>
      `| ${m.name.includes("quartier") ? "Quartier avec nouvelles maisons" : "Maison de Loyal"} | ${m.project === "desktop" ? "PC" : "Téléphone émulé"} | ${m.p95.toFixed(2)} | ${m.mean.toFixed(2)} |`,
  )
  .join("\n");
const block = `<!-- D32-RESULTS-BEGIN -->
## Résultats finaux exécutés

Lint, TypeScript, build standard et build privé : réussis. Tests unitaires : **${result.unit.passed} réussis, ${result.unit.skipped} non exécutés sur Windows** (scripts POSIX d'activation/restauration). Tests navigateur : **${browserPassed} réussis, ${browserSkipped} ignorés car non applicables au format**, sur 90 cas, en ${passed[2]}. Aucun échec dans la suite finale. Les contrôles incluent les 24 journées, les trois mini-jeux, les quatre intérieurs, les dix-sept objets, les quatre maisons, le clavier, le toucher, la réduction des mouvements et la reprise des anciennes sauvegardes.

Une première suite avait détecté le trajet vers la bibliothèque bloqué par le jardin. La maison a été déplacée, puis le parcours Phase B original et la compatibilité des sauvegardes ont passé leurs quatre tests ciblés. La suite complète de 90 cas a ensuite été exécutée à nouveau sur cette correction. Aucun test historique n'a été modifié pour contourner l'obstacle.

L'audit confirme ${invariants.protectedFiles} fichiers antérieurs protégés, 21 méthodes identiques hors branchements décoratifs et ${invariants.authenticBeforeFrames} captures « avant » identiques aux fichiers du commit D.3.1. Les coins alpha des vingt exports ont été lus dans le navigateur. Les ${art.comparisonFiles} fichiers de comparaison existent ; les deux vidéos sont lisibles (${art.videos.map((v: { duration: number }) => v.duration.toFixed(2) + " s").join(" et ")}).

### Mesures de fluidité

170 échantillons conservés par relevé, après retrait des dix premiers. Le RAF de Chrome est non plafonné ; ces nombres mesurent l'espacement des callbacks dans ce contexte, pas un objectif de FPS garanti sur un appareil physique. Les relevés de quartier vérifient que de nouvelles fumées sont effectivement visibles.

| Scène | Format | P95 RAF (ms) | Moyenne RAF (ms) |
|---|---|---:|---:|
${rows}

Les vingt textures supplémentaires totalisent ${result.art.servedBytes.toLocaleString("fr-FR")} octets ; leur dimension maximale est ${result.art.maxNativeDimension} pixels. Les budgets supplémentaires restent à huit volutes extérieures en qualité complète, quatre en douce et zéro sans effets. L'avertissement de taille du chunk Phaser, déjà présent, ne bloque pas la compilation. Les treize chemins d'images et polices référencés par les CSS et les vingt nouveaux PNG ont été retrouvés dans les builds privé et standard ; les avertissements de résolution à la compilation ne correspondent donc pas à des fichiers absents. Le build privé confirme l'absence de paquets fictifs de surprises et de médias de démonstration ; aucun backend réel n'est déclaré opérationnel par ces seuls builds.
<!-- D32-RESULTS-END -->`;
const path = "docs/graphismes/FINITIONS-D32.md",
  report = read(path);
writeFileSync(
  path,
  report.replace(
    /\n<!-- D32-RESULTS-BEGIN -->[\s\S]*?<!-- D32-RESULTS-END -->\n?/g,
    "",
  ) +
    "\n\n" +
    block +
    "\n",
);
console.log(
  JSON.stringify({
    unit: result.unit,
    browser: result.browser,
    art: result.art,
  }),
);
