import { writeFileSync } from "node:fs";
import {
  villageSize,
  residentialPlots,
  urbanLanes,
} from "../src/art/urban-plan";
const roads = urbanLanes
  .map(
    (l) =>
      `<polyline points="${l.points.map((p) => p.x + "," + p.y).join(" ")}" fill="none" stroke="${l.material === "stone" ? "#9b9da4" : "#b2987b"}" stroke-width="${l.width}" stroke-linejoin="round" stroke-linecap="round"/>`,
  )
  .join("");
const houses = residentialPlots
  .map(
    (h, i) =>
      `<g><rect x="${h.x - 100}" y="${h.y - 160}" width="200" height="160" rx="15" fill="${h.district === "calme" ? "#47776a" : h.district === "artisans" ? "#9d714a" : "#865d63"}" stroke="#e1bd83" stroke-width="3"/><circle cx="${h.x}" cy="${h.y}" r="8" fill="#ffe2a6"/><text x="${h.x}" y="${h.y - 90}" text-anchor="middle" font-size="21" fill="white">${i + 1} · ${h.key}</text></g>`,
  )
  .join("");
writeFileSync(
  "docs/graphismes/d33/PLAN-VILLAGE.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${villageSize.width} ${villageSize.height}"><rect width="100%" height="100%" fill="#e3eaf0"/><rect width="1024" height="768" fill="#f6f4ef" stroke="#607584" stroke-dasharray="8 8"/><text x="280" y="60" font-size="32" fill="#354959">Centre historique conservé</text>${roads}<circle cx="512" cy="394" r="64" fill="#2f6d50"/><text x="512" y="405" text-anchor="middle" fill="white" font-size="24">Sapin</text>${houses}<text x="40" y="1380" fill="#354959" font-size="24">Plan d'implantation — portes calibrées, jardins et sentiers secondaires à ajuster après inspection des sprites.</text></svg>`,
);
