import { readFileSync, writeFileSync } from "node:fs";
import { decorativeObjects } from "../src/decor/model";
import { homes } from "../src/decor/neighbourhood";
const inventory = JSON.parse(
  readFileSync("docs/graphismes/INVENTAIRE-D32.json", "utf8"),
);
writeFileSync(
  "docs/graphismes/D32-EMPLACEMENTS.json",
  JSON.stringify(
    {
      homes,
      decorativeObjects,
      decorativeStorage: "etoilebois-decoration-v1",
      progressionWrites: false,
    },
    null,
    2,
  ) + "\n",
);
const css = `body{margin:0;background:#14212b;color:#f3e6ce;font:16px/1.6 system-ui}main{max-width:1400px;margin:auto;padding:28px}h1,h2{color:#f1c58a}a{color:#f1c58a}figure{margin:0}figcaption{padding:8px}.pair,.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:18px 0 40px}img,video{display:block;width:100%;height:auto;border-radius:6px}img{image-rendering:pixelated}.card{background:#22323d;border:1px solid #775a42;border-radius:8px;padding:14px}.sprite{display:flex;align-items:center;justify-content:center;min-height:220px;padding:12px}.sprite img{width:auto;max-width:100%;height:auto;max-height:210px;border-radius:0}.light{background:#ded8ca}.dark{background:#101a23}table{border-collapse:collapse;width:100%}td,th{padding:8px;border-bottom:1px solid #5a5549;text-align:left}.small{font-size:13px;opacity:.85}nav{display:flex;gap:18px;flex-wrap:wrap}@media(max-width:650px){main{padding:12px}.pair,.grid{grid-template-columns:1fr}}`;
const document = (title: string, body: string) =>
  `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style><main><h1>${title}</h1><nav><a href="comparatif-d32.html">Visite</a><a href="ressources-d32.html">Ressources</a><a href="FINITIONS-D32.md">Rapport</a></nav>${body}</main></html>`;
const root = "../screenshots/phase-d3-2";
const pair = (filename: string, title: string) =>
  `<h3>${title}</h3><div class="pair">${["avant", "apres"].map((v, i) => `<figure><img loading="lazy" src="${root}/${v}/${filename}" alt="${title} — D.3.${i ? 2 : 1}"><figcaption>D.3.${i ? 2 : 1}</figcaption></figure>`).join("")}</div>`;
const rooms = {
  house: "Maison de Loyal",
  library: "Bibliothèque",
  workshop: "Atelier des Cadeaux",
  inn: "Auberge des Étoiles",
};
let body = `<p>D.3.1 v0.7.1 → D.3.2 v0.7.2. Quatre intérieurs enrichis, dix-sept objets interactifs et quatre nouvelles habitations. Terrain, neige et personnages validés conservés. Captures issues du jeu, sans retouche.</p><h2>Le village</h2>`;
for (const time of ["jour", "crepuscule", "nuit"])
  body += pair(`village-complet-${time}.png`, `Village complet — ${time}`);
for (const [room, name] of Object.entries(rooms)) {
  body += `<h2>${name}</h2>`;
  for (const platform of ["desktop", "mobile"])
    for (const time of ["jour", "nuit"])
      body += pair(
        `${platform}-${room}-${time}.png`,
        `${name} — ${platform === "desktop" ? "PC" : "téléphone"} — ${time}`,
      );
  body += `<p>Le cadrage mobile suit Debby : les meubles périphériques s'observent en se déplaçant.</p><div class="pair"><figure><img loading="lazy" src="${root}/apres/mobile-${room}-nouveau-meuble.png" alt="${name}, meuble périphérique"><figcaption>Nouveau meuble — téléphone</figcaption></figure><figure><img loading="lazy" src="${root}/apres/mobile-${room}-coin-droit.png" alt="${name}, coin droit"><figcaption>Coin droit — téléphone</figcaption></figure></div>`;
}
body += `<h2>Interactions en mouvement</h2><p>Les vidéos montrent une caresse au chat, l'allumage et l'extinction d'une bougie, puis le petit train. Les changements de pièce utilisent les points de départ des tests ; les actions sont déclenchées par les contrôles réels.</p><div class="pair">${["desktop", "mobile"].map((p) => `<figure><video controls preload="metadata" src="${root}/apres/${p}-interactions.webm"></video><figcaption>${p === "desktop" ? "PC" : "Téléphone émulé"} — enregistrement navigateur</figcaption></figure>`).join("")}</div><h2>Les dix-sept objets</h2><table><tr><th>Pièce</th><th>Objet</th><th>Action</th></tr>${decorativeObjects.map((o) => `<tr><td>${rooms[o.room]}</td><td>${o.description}</td><td>${o.action === "toggle" ? "Allumer / éteindre" : o.action === "pet" ? "Caresse et réaction" : o.action === "mechanism" ? "Mouvement bref" : "Lecture / observation"}</td></tr>`).join("")}</table>`;
for (const p of ["desktop", "mobile"]) {
  body += `<h2>Exemples d'actions — ${p === "desktop" ? "PC" : "téléphone"}</h2><div class="grid">${["house-cat", "house-note", "library-book", "workshop-mechanism", "workshop-plan", "inn-menu"].map((key) => `<figure><img loading="lazy" src="${root}/apres/${p}-${key}.png" alt="${key}"><figcaption>${key}</figcaption></figure>`).join("")}</div><h3>Une vraie extinction</h3><div class="pair">${["allume", "eteint"].map((s) => `<figure><img loading="lazy" src="${root}/apres/${p}-house-candle-${s}.png" alt="Bougie ${s}"><figcaption>Bougie ${s}</figcaption></figure>`).join("")}</div>`;
}
body += `<h2>Les quatre nouvelles maisons</h2><p>Maisons décoratives, sans nouvel intérieur. Elles occupent des parcelles vérifiées, sans agrandissement du monde.</p><div class="grid">${homes.map((h) => `<figure><img loading="lazy" src="${root}/apres/desktop-${h.key}.png" alt="${h.key}"><figcaption>${h.key} — pied (${h.x}, ${h.y})</figcaption></figure>`).join("")}</div><p>Mesures et limites : voir le rapport. Aucun téléphone physique, déploiement ou serveur réel n'est validé ici. La validation artistique reste ouverte.</p>`;
writeFileSync(
  "docs/graphismes/comparatif-d32.html",
  document("Étoilebois — D.3.2, le village habité", body),
);
const cards = inventory.assets
  .map(
    (a: {
      key: string;
      width: number;
      height: number;
      public: { bytes: number };
    }) => {
      const image = `../../public/assets/life-d32/${a.key}.png`;
      return `<section class="card"><h2>${a.key}</h2><div class="pair"><div class="sprite light"><img src="${image}" alt="${a.key}, fond clair"></div><div class="sprite dark"><img src="${image}" alt="${a.key}, fond sombre"></div></div><p class="small">${a.width} × ${a.height} pixels · ${a.public.bytes.toLocaleString("fr-FR")} octets · alpha réel · export sans lissage</p></section>`;
    },
  )
  .join("");
writeFileSync(
  "docs/graphismes/ressources-d32.html",
  document(
    "Les 20 nouveaux sprites D.3.2",
    `<p>Exports natifs utilisés par le jeu, sur fonds clair et sombre. Les originaux et empreintes sont conservés dans l'inventaire. Cette présentation ne vaut pas validation artistique définitive.</p><div class="grid">${cards}</div>`,
  ),
);
console.log("Galeries D32 écrites");
