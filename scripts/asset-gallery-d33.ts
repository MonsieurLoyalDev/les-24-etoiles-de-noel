import { readFileSync, writeFileSync } from "node:fs";
const houses = JSON.parse(readFileSync("src/art/homes-d33.json", "utf8"));
const interior = JSON.parse(
  readFileSync("docs/graphismes/d33/ASSETS-INTERIEURS.json", "utf8"),
);
const assets = [...houses, ...interior];
writeFileSync(
  "docs/graphismes/ressources-d33.html",
  `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>D.3.3 — ressources et transparences</title><style>body{background:#192733;color:#f4e7cd;font:16px system-ui;margin:24px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}article{border:1px solid #ad8258;padding:12px;border-radius:8px}h2{font-size:16px}.pair{display:flex;gap:8px}.frame{width:50%;height:190px;display:flex;align-items:center;justify-content:center;background:#eee9df}.frame.dark{background:#14212c}img{max-width:100%;max-height:180px;image-rendering:pixelated}@media(max-width:700px){.grid{grid-template-columns:1fr}}</style><h1>D.3.3 — 24 ressources natives</h1><p>Présentation sur fond clair et sombre. Les parquets sont des textures opaques ; les meubles, fenêtres, murs et maisons sont détourés. Créations nouvelles soumises à validation artistique.</p><div class="grid">${assets.map((a) => `<article><h2>${a.key}</h2><div class="pair"><div class="frame"><img src="../../${a.public.path}" alt="${a.key} sur fond clair"></div><div class="frame dark"><img src="../../${a.public.path}" alt="${a.key} sur fond sombre"></div></div><p>${a.width} × ${a.height} px · ${Math.round(a.public.bytes / 1024)} Kio</p></article>`).join("")}</div></html>`,
);
