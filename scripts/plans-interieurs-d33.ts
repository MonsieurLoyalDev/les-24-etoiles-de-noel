import { writeFileSync } from "node:fs";
import { roomPlans, allFurniture } from "../src/art/rooms33";
import { furnitureSlots } from "../src/art/interior-layout";
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
for (const room of ["house", "library", "workshop", "inn"] as const) {
  const p = roomPlans[room],
    draw = (phase: string, x: number) => {
      const before = phase === "D.3.2",
        volumes = before ? [{ x: 0, y: 0, w: 480, h: 352 }] : p.volumes,
        furniture = before
          ? furnitureSlots.map((f, i) => ({
              footprint: f.footprint,
              key: "Meuble " + (i + 1),
            }))
          : allFurniture(room);
      return `<g transform="translate(${x},65)"><text x="0" y="-20" fill="#ffe5b5" font-size="22">${phase} — ${before ? "480 × 352" : `${p.width} × ${p.height}`}</text>${volumes.map((v) => `<rect x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" fill="#795539" stroke="#d0a875" stroke-width="4"/>`).join("")}${furniture.map((f) => `<rect x="${f.footprint.x}" y="${f.footprint.y}" width="${f.footprint.w}" height="${f.footprint.h}" rx="3" fill="#dcc99c"/><text x="${f.footprint.x}" y="${f.footprint.y - 5}" fill="#fff6dd" font-size="10">${escape(f.key)}</text>`).join("")}<circle cx="240" cy="315" r="10" fill="#84dbac"/><text x="260" y="330" fill="#c7ffdc" font-size="15">Sortie conservée</text></g>`;
    };
  writeFileSync(
    `docs/graphismes/d33/PLAN-${room}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1530 700"><rect width="1530" height="700" fill="#192637"/><g font-family="sans-serif">${draw("D.3.2", 30)}${draw("D.3.3", 550)}<text x="30" y="660" fill="#ded4b9" font-size="18">${escape(p.title)} — les rectangles clairs indiquent les emprises physiques, pas les silhouettes graphiques.</text></g></svg>`,
  );
}
