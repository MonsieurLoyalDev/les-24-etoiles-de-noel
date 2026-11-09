import { readFileSync, writeFileSync } from "node:fs";
const dir = "docs/graphismes/d35/",
  root = "../../screenshots/phase-d3-5/",
  meta = JSON.parse(readFileSync("src/art/environment-d35.json", "utf8"));
const audit = JSON.parse(
  readFileSync("docs/screenshots/phase-d3-5/apres/audit-desktop.json", "utf8"),
);
const proof = JSON.parse(readFileSync(dir + "PRESERVATION.json", "utf8"));
const p = JSON.parse(readFileSync("src/art/plan-d34.json", "utf8"));
const categories = {
  bancs: 4,
  cadeaux: 9,
  bois: 6,
  accessoires: 12,
  modulesClotures: 16,
  matieresSol: 4,
};
const used = new Set([
  ...audit.scenery.placed
    .filter((p) => p.texture.startsWith("d35-"))
    .map((p) => p.key),
  ...meta.frames.filter((f) => f.name.startsWith("fence-")).map((f) => f.name),
  "gift-red",
  "gift-cream",
]);
const trees = audit.scenery.placed.filter(
  (p) =>
    p.key.startsWith("fir_") ||
    p.key.includes("pine") ||
    p.key === "prop-bare-tree",
);
const inventory = {
  phase: "D.3.5",
  version: "0.7.5",
  categories,
  createdSpriteFrames: 47,
  createdGroundMaterials: 4,
  liveNamedFrames: meta.frames.filter((f) => used.has(f.name)).length,
  publicAtlases: [
    "public/assets/environment-d35/sprites.png",
    "public/assets/environment-d35/path-materials.png",
  ],
  nativeOriginals: meta.originals,
  frames: meta.frames,
  scene: {
    props: audit.scenery.placed.length,
    benches: audit.seats.length,
    seats: audit.seats,
    trees: trees.length,
    innerQuarterTrees: trees.filter((p) => p.quarter.startsWith("Q")).length,
    innerCentreTrees: trees.filter((p) => p.quarter === "Centre").length,
    byQuarter: p.quarters.map((q) => ({
      id: q.id,
      name: q.name,
      trees: trees.filter((p) => p.quarter === q.id).length,
      props: audit.scenery.placed.filter((p) => p.quarter === q.id).length,
    })),
    fencePosts: audit.fences.posts.length,
    fencePanels: audit.fences.panels.length,
    gates: audit.fences.gates,
  },
  protectedFiles: proof.files.length,
};
writeFileSync(
  dir + "INVENTAIRE.json",
  JSON.stringify(inventory, null, 2) + "\n",
);
const fig = (file, caption) =>
  `<figure><a href="${root + file}"><img loading="lazy" src="${root + file}" alt="${caption}"></a><figcaption>${caption}</figcaption></figure>`;
const pair = (file, title) =>
  `<h3>${title}</h3><div class="grid">${fig("avant/" + file + ".png", "D.3.4 — " + title)}${fig("apres/" + file + ".png", "D.3.5 — " + title)}</div>`;
let html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Étoilebois D.3.5 — validation artistique</title><style>body{margin:0;background:#172b35;color:#f4e9d5;font:16px system-ui}header,section{max-width:1700px;margin:auto;padding:26px 4vw}h1{font-size:clamp(26px,4vw,43px)}p{max-width:1050px;line-height:1.65}a{color:#e8bc82}nav{display:flex;gap:20px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0;min-width:0}img{display:block;width:100%}figcaption{background:#25404b;padding:11px;font-size:14px}.muted{color:#b6c9cf}@media(max-width:850px){.grid{grid-template-columns:1fr}}</style><header><p class="muted">Version 0.7.5 · proposition pour validation artistique · aucune fusion ni mise en ligne</p><h1>Étoilebois — la magie dans les détails</h1><p>L’implantation D.3.4 et les quatre intérieurs sont conservés. Cette galerie présente les captures réelles de D.3.4 et D.3.5, les mêmes cadrages rapprochés et les sprites d’exécution à leur échelle de jeu.</p><nav><a href="#village">Village</a><a href="#sols">Chemins et places</a><a href="#clotures">Clôtures</a><a href="#accessoires">Accessoires</a><a href="#quartiers">Nature et quartiers</a><a href="#nuit">Jour/nuit</a><a href="RAPPORT.md">Rapport</a><a href="INVENTAIRE.json">Inventaire</a><a href="PROMPTS.md">Origines et prompts</a></nav><p>${inventory.scene.props} ornements placés, ${inventory.scene.benches} bancs deux places, ${inventory.scene.innerQuarterTrees} arbres dans les quatre quartiers. Les chiffres distinguent les variantes créées de celles employées dans la scène. Le bilan final des tests, les tailles et les SHA-256 accompagnent les deux ZIP dans LIVRAISON-D35.md.</p></header><section id="village"><h2>Village complet</h2>${pair("village-complet-jour", "Vue générale")}</section><section id="sols"><h2>Chemins et places enneigés</h2>${pair("chemin-principal", "Chemin principal")}${pair("carrefour", "Raccords et croisements")}${pair("place-centrale", "Place centrale")}${fig("apres/atlas-sols.png", "Quatre matières — échelle du jeu ×2")}</section><section id="clotures"><h2>Cinq jardins, quatre familles de clôtures</h2>${["J1", "J2", "J3", "J4", "JL"].map((id) => pair("cloture-" + id, "Jardin " + id)).join("")}${fig("apres/atlas-clotures.png", "Modules d’exécution — poteaux, panneaux, profils et vantaux")}</section><section id="accessoires"><h2>Accessoires et petits coins habités</h2>${pair("bancs-cour", "Banc et petit bosquet")}${pair("cadeaux-bois", "Cadeaux et bois près de l’atelier")}${pair("coin-bibliotheque", "Abords de la bibliothèque")}${pair("coin-auberge", "Table et petit coin de marché près de l’auberge")}${["bancs", "cadeaux", "bois", "accessoires"].map((n) => fig("apres/atlas-" + n + ".png", "Collection " + n + " — vrais sprites à l’échelle de jeu ×2")).join("")}</section><section id="quartiers"><h2>La nature au cœur des quartiers</h2>${p.quarters.map((q) => `<h3>${q.name}</h3><div class="grid">${fig("avant/desktop-" + q.id + ".png", "D.3.4 — " + q.name)}${fig("apres/desktop-" + q.id + ".png", "D.3.5 — " + q.name)}</div>`).join("")}<h3>Téléphone émulé</h3><div class="grid">${p.quarters.map((q) => fig("apres/mobile-" + q.id + ".png", q.name + " — mobile")).join("")}</div></section><section id="nuit"><h2>Crépuscule et nuit</h2><div class="grid">${fig("apres/village-complet-crepuscule.png", "Crépuscule — D.3.5")}${fig("apres/village-complet-nuit.png", "Nuit — D.3.5")}</div><p class="muted">Le HUD, les personnages, le sapin, les portraits, les dialogues, les intérieurs et les règles du calendrier restent ceux de D.3.4. Les nouveaux bancs n’ajoutent pas de posture assise extérieure. Le mobile est émulé ; une validation sur téléphone physique reste à effectuer.</p></section></html>`;
writeFileSync(dir + "validation.html", html);
const md = `# D.3.5 — la magie dans les détails\n\nVersion 0.7.5, branche feature/phase-d3-5-details. Base : D.3.4 SOURCE-LIGHT et son code identique au dépôt, avant intervention. Cette livraison attend votre validation artistique. Aucune fusion, aucun déploiement et aucune D.4.\n\n## Environnement\n\nLes 20 bâtiments, les 38 chemins et les cinq cours conservent exactement le plan D.3.4. Les nouvelles matières de chemins sont composées dans une seule surface statique : distance aux tracés et aux polygones, variations corrélées des contours, neige mêlée au passage, prélèvement de pavés à petite échelle et raccords continus par prolongement miroir. Les intersections sont calculées ensemble ; aucun trait épais ou ruban de sprite ne sert de rendu. La neige générale D.3.1 et les zones de terre/herbe/pierres sont conservées.\n\nLes clôtures réemploient les contours physiques et les cinq ouvertures de 32 pixels D.3.4. ${inventory.scene.fencePanels} panneaux et ${inventory.scene.fencePosts} poteaux uniques composent les cinq enclos. Les rails sont projetés sur le sol et les poteaux restent verticaux ; les profils verticaux ont leurs modules propres. Les vantaux sont rabattus hors du passage. Quatre matières distinguent les jardins : bois rustique, piquets, rondins sculptés et bois/cuivre.\n\nLa scène emploie ${inventory.scene.props} ornements, ${inventory.scene.benches} bancs et ${inventory.scene.innerQuarterTrees} arbres dans les quartiers résidentiels, plus ${inventory.scene.innerCentreTrees} arbres dans le centre et les boisements préservés. Les arbres sont placés en petits groupes autour des cours, en conservant les vues sur les façades et les portes. Les cinq jardins ont des compositions distinctes. Une table avec deux tasses, un panier et un traîneau, un présentoir de cadeaux et un stock de bois complètent les coins de vie.\n\nLes bancs mesurent environ 80 pixels de large pour 25 à 32 pixels de haut, face aux personnages de 52 pixels. Deux positions d’assise sont préparées par banc, sans nouveau bouton ni animation de posture. Les cadeaux de quête conservent leurs identifiants, positions, conditions et récompenses ; leurs images sont remplacées par les paquets rouge et crème, de faible hauteur. Le paquet haut est décoratif et placé hors des chemins. Les empreintes des nouveaux bancs, stocks et arbres sont adaptées à leurs bases visibles.\n\n## Ressources\n\n51 variantes graphiques créées : 4 bancs, 9 compositions de cadeaux, 6 stocks de bois, 12 accessoires, 16 modules de clôture et 4 matières de sol. Les 47 sprites sont préparés dans un atlas de 1820 × 1820 et les quatre matières dans un atlas de 224 × 224. Les deux PNG publics sont les seules nouvelles images nécessaires au jeu. ${inventory.liveNamedFrames} des 47 cadres servent directement à la scène ; la collection complète est présentée dans les planches. Les PNG natifs et les prompts sont séparés dans ARTWORK.\n\nLe test des pixels vérifie chaque cadre RGBA contre l’export de préparation ; les marges transparentes et les emplacements des cadres sont contrôlés. Les ${proof.files.length} fichiers protégés couvrent les 221 images publiques antérieures, les personnages, le HUD, les intérieurs, les dialogues, les quêtes, le calendrier, les mini-jeux, la sauvegarde, la neige et le plan de référence.\n\n## Validation et limites\n\nLes commandes et résultats définitifs figurent dans le bilan LIVRAISON-D35.md fourni avec les ZIP et dans les journaux de livraison. Les contrôles comprennent TypeScript, lint, tests unitaires, builds privé/production, navigateurs PC/mobile, parcours des entrées et sorties, collisions, interactions, anciennes sauvegardes, 24 journées et mini-jeux. Les nouveaux contrôles vérifient aussi les centres des 38 chemins avec les colliders réels, les façades dégagées, les cinq ouvertures, les bancs et la réduction des effets.\n\nLes mesures graphiques sont effectuées dans Chrome local, avec CPU ralenti ×4 pour le contrôle mobile ciblé. Ce ne sont pas des mesures sur téléphone physique ni une garantie de fréquence sur tous les appareils. Le terrain et les clôtures sont calculés à la création puis réutilisés, sans travail de génération par image. Les effets conservent les budgets et la réduction des mouvements existants.\n\nCertaines variantes de la collection sont réservées à la réutilisation et ne sont pas toutes placées simultanément dans le village. Les façades V10, le sapin et les apparences validées sont conservés, avec les limites intrinsèques déjà documentées. L’assise extérieure et l’ouverture/fermeture interactive des portillons ne sont pas ajoutées. La validation artistique finale vous appartient.\n\n## Livrables\n\nD35-SOURCE-LIGHT.zip contient le code, les deux atlas d’exécution, tous les assets nécessaires et les fixtures de non-régression, les tests, configurations et documents essentiels. D35-ARTWORK.zip contient les originaux, captures, comparatifs et outils artistiques, avec dédoublonnage exact par SHA-256. Aucun média n’est recompressé avec perte. Les tailles exactes, SHA-256 et résultats de l’extraction vierge sont fournis à côté des archives.\n\nOuvrir validation.html pour la galerie ; consulter INVENTAIRE.json pour les cadres, variantes, positions d’assise et compositions ; consulter PROMPTS.md pour la génération et la reproduction de l’export.\n`;
writeFileSync(dir + "RAPPORT.md", md);
console.log({
  frames: 47,
  materials: 4,
  live: inventory.liveNamedFrames,
  scene: inventory.scene,
});
