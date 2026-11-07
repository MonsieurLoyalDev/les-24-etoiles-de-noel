import type { Save, Point, Rect } from "../domain";
export type Room = Save["room"];
export const roomNames: Record<Room, string> = {
  village: "Place des Lanternes",
  house: "Maison de Loyal",
  library: "Bibliothèque d’Étoilebois",
  workshop: "Atelier des Cadeaux",
  inn: "Auberge des Étoiles",
};
export const rooms = {
  house: {
    color: 0x735651,
    furniture: 0x93516d,
    description: "Un refuge pour deux",
    object: "Une lettre pour Debby",
  },
  library: {
    color: 0x454e67,
    furniture: 0x71566c,
    description: "Papier, secrets et souvenirs",
    object: "Le livre des devinettes",
  },
  workshop: {
    color: 0x526354,
    furniture: 0x947044,
    description: "Les petites attentions se fabriquent ici",
    object: "Établi d’emballage",
  },
  inn: {
    color: 0x705044,
    furniture: 0x9d6249,
    description: "Une veillée au coin du feu",
    object: "Table des souvenirs",
  },
};
export const interiorRects: Rect[] = [
  { x: 0, y: 0, w: 480, h: 32 },
  { x: 0, y: 0, w: 32, h: 352 },
  { x: 448, y: 0, w: 32, h: 352 },
  { x: 0, y: 336, w: 480, h: 16 },
  { x: 200, y: 100, w: 80, h: 38 },
  { x: 50, y: 50, w: 90, h: 45 },
  { x: 350, y: 70, w: 70, h: 50 },
];
export const citizens = [
  {
    id: "mira",
    name: "Célestine",
    room: "library",
    color: 0xb9a3e8,
    path: [
      { x: 100, y: 230 },
      { x: 155, y: 230 },
      { x: 155, y: 180 },
      { x: 100, y: 180 },
    ],
  },
  {
    id: "oscar",
    name: "Basile",
    room: "workshop",
    color: 0x9fd5af,
    path: [
      { x: 100, y: 230 },
      { x: 160, y: 230 },
      { x: 160, y: 175 },
      { x: 100, y: 175 },
    ],
  },
  {
    id: "alma",
    name: "Madeleine",
    room: "inn",
    color: 0xffc299,
    path: [
      { x: 100, y: 230 },
      { x: 150, y: 230 },
      { x: 150, y: 180 },
      { x: 100, y: 180 },
    ],
  },
  {
    id: "noe",
    name: "Augustin",
    room: "village",
    color: 0x96d3e1,
    path: [
      { x: 660, y: 550 },
      { x: 730, y: 550 },
      { x: 730, y: 480 },
      { x: 660, y: 480 },
    ],
  },
] satisfies {
  id: string;
  name: string;
  room: Room;
  color: number;
  path: Point[];
}[];
export function period(clock: number) {
  return Math.floor((clock % 180000) / 45000);
}
export const periodNames = ["Aurore", "Jour", "Crépuscule", "Nuit"];
export function npcActivity(id: string, clock: number) {
  const night = period(clock) === 3;
  return id === "noe"
    ? night
      ? "allume les lanternes"
      : "inspecte la place"
    : night
      ? "prépare la veillée"
      : "range ses affaires";
}
