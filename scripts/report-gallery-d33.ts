import { writeFileSync } from "node:fs";
const pairs = [
  ["Village complet", "village-complet-jour.png", "village-complet-jour.png"],
  ...["house", "library", "workshop", "inn"].map((r) => [
    r,
    `desktop-${r}-jour.png`,
    `desktop-${r}-jour.png`,
  ]),
];
pairs.push(
  ...["house", "library", "workshop", "inn"].map((r) => [
    r + " — téléphone",
    `mobile-${r}-jour.png`,
    `mobile-${r}-jour.png`,
  ]),
);
const image = (phase, file) => `../screenshots/phase-d3-3/${phase}/${file}`;
const items = pairs
  .map(
    ([title, before, after]) =>
      `<section><h2>${title}</h2><div class="pair"><figure><figcaption>D.3.2</figcaption><a href="${image("avant", before)}"><img loading="lazy" src="${image("avant", before)}"></a></figure><figure><figcaption>D.3.3</figcaption><a href="${image("apres", after)}"><img loading="lazy" src="${image("apres", after)}"></a></figure></div></section>`,
  )
  .join("");
const galleries = [
  [
    "Quartiers PC",
    ["centre", "residentiel", "artisans", "calme"].map(
      (r) => `desktop-quartier-${r}.png`,
    ),
  ],
  [
    "Intérieurs de nuit",
    ["house", "library", "workshop", "inn"].map((r) => `desktop-${r}-nuit.png`),
  ],
  [
    "Annexes et circulation",
    ["house", "library", "workshop", "inn"].map(
      (r) => `desktop-${r}-annexe.png`,
    ),
  ],
  [
    "Téléphone émulé",
    ["house", "library", "workshop", "inn"].map(
      (r) => `mobile-${r}-annexe.png`,
    ),
  ],
];
writeFileSync(
  "docs/graphismes/comparatif-d33.html",
  `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Étoilebois D.3.3 — visite artistique</title><style>body{background:#142431;color:#f6ead3;font:16px system-ui;margin:0 auto;padding:32px;max-width:1600px}h1,h2{color:#edc78d}a{color:#c4e8df}section{margin:40px 0}.pair,.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}figure{margin:0;background:#243844;padding:12px;border:1px solid #8b6e49;border-radius:10px}img{width:100%;height:auto;display:block}figcaption{padding:8px}p{max-width:920px;line-height:1.7}@media(max-width:700px){body{padding:16px}.pair,.gallery{grid-template-columns:1fr}}</style><h1>Étoilebois — D.3.3 / 0.7.3</h1><p>Le centre historique est conservé et se prolonge en quartiers résidentiel, artisanal et calme. Seize façades, des allées vers les portes, des jardins et quatre plans intérieurs différents. Cliquez une capture pour la consulter à sa résolution originale.</p><p>Les images « avant » proviennent de la livraison D.3.2. Les vues complètes utilisent des formats adaptés aux dimensions respectives des deux mondes : elles ne constituent pas une mesure à échelle d'écran identique.</p>${items}${galleries.map(([title, files]) => `<section><h2>${title}</h2><div class="gallery">${(files as string[]).map((file) => `<figure><a href="${image("apres", file)}"><img loading="lazy" src="${image("apres", file)}"></a><figcaption>${file}</figcaption></figure>`).join("")}</div></section>`).join("")}<section><h2>Silhouettes et portes</h2><img src="${image("apres", "maisons-portes-audit.png")}"><p>Repères verts : segment de porte utilisé pour la calibration ; les marches et les porches ne sont pas comptés comme hauteur de porte.</p></section><section><h2>Interactions en mouvement</h2><div class="pair"><video controls preload="metadata" style="width:100%" src="../screenshots/phase-d3-3/apres/desktop-interactions.webm"></video><video controls preload="metadata" style="width:100%" src="../screenshots/phase-d3-3/apres/mobile-interactions.webm"></video></div></section><p><a href="ressources-d33.html">Ressources sur fonds clair et sombre</a> · <a href="d33/RAPPORT.md">Rapport, tests et limites</a> · <a href="d33/PLAN-VILLAGE.svg">Plan d'implantation</a> · <a href="d33/ASSETS-MAISONS.json">Inventaire des maisons</a> · <a href="d33/ASSETS-INTERIEURS.json">Inventaire du mobilier</a></p></html>`,
);
