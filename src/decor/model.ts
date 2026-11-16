import type { Save, Rect } from "../domain";
import { homeSizes } from "./neighbourhood";
export type DecorRoom = Exclude<Save["room"], "village" | "forest" | "bakery">;
export type DecorativeObject = {
  id: string;
  room: DecorRoom;
  x: number;
  y: number;
  radius: number;
  description: string;
  action: "read" | "toggle" | "pet" | "mechanism";
  text?: string;
  initial?: boolean;
};
export const decorativeObjects: DecorativeObject[] = [
  {
    id: "house-candle",
    room: "house",
    x: 300,
    y: 148,
    radius: 26,
    description: "la bougie du foyer",
    action: "toggle",
  },
  {
    id: "house-cat",
    room: "house",
    x: 423,
    y: 208,
    radius: 24,
    description: "Caresser le chat",
    action: "pet",
    text: "Loyal — Un petit ronron, puis il se rendort. Ici, même les silences tiennent chaud. ♥",
  },
  {
    id: "house-photo",
    room: "house",
    x: 107,
    y: 305,
    radius: 27,
    description: "Examiner les souvenirs",
    action: "read",
    text: "Loyal — Deux silhouettes emmitouflées, un carnet et nos chaussons : les petites choses font notre maison.",
  },
  {
    id: "house-note",
    room: "house",
    x: 205,
    y: 170,
    radius: 24,
    description: "Lire le petit mot",
    action: "read",
    text: "Loyal — « Debby, j’ai gardé la place près du feu. La journée peut attendre encore une tasse. ♥ » — Mot fictif de démonstration.",
  },
  {
    id: "house-chair",
    room: "house",
    x: 125,
    y: 179,
    radius: 24,
    description: "Examiner le fauteuil",
    action: "read",
    text: "Loyal — Un plaid pour deux et un coussin un peu de travers. Le fauteuil attend notre prochaine histoire.",
  },
  {
    id: "library-book",
    room: "library",
    x: 202,
    y: 170,
    radius: 24,
    description: "Consulter le livre ouvert",
    action: "read",
    text: "Célestine — « Au bord du bois, la neige gardait les pas ; dans la maison, on gardait les voix. » Un conte original d’Étoilebois.",
  },
  {
    id: "library-lamp",
    room: "library",
    x: 310,
    y: 130,
    radius: 26,
    description: "la lampe de lecture",
    action: "toggle",
    initial: true,
  },
  {
    id: "library-photo",
    room: "library",
    x: 107,
    y: 305,
    radius: 27,
    description: "Examiner la photographie",
    action: "read",
    text: "Célestine — Le premier hiver de la bibliothèque : trois caisses de livres, une échelle et déjà beaucoup de lecteurs.",
  },
  {
    id: "library-quote",
    room: "library",
    x: 70,
    y: 179,
    radius: 23,
    description: "Lire la citation",
    action: "read",
    text: "Célestine — « Une page tournée ensemble fait moins de bruit que la neige, mais réchauffe tout autant. » — Carnet d’Étoilebois.",
  },
  {
    id: "workshop-toy",
    room: "workshop",
    x: 202,
    y: 170,
    radius: 24,
    description: "Examiner le jouet",
    action: "read",
    text: "Basile — Ce petit renard attend ses roues. Le bois est encore doux sous les doigts, et le ruban est déjà choisi.",
  },
  {
    id: "workshop-mechanism",
    room: "workshop",
    x: 423,
    y: 247,
    radius: 22,
    description: "Remonter le petit train",
    action: "mechanism",
    text: "Basile — Un tour de clé, quelques centimètres de voyage… Ce petit train sait déjà rentrer à la maison.",
  },
  {
    id: "workshop-lantern",
    room: "workshop",
    x: 300,
    y: 148,
    radius: 26,
    description: "la lanterne de l’établi",
    action: "toggle",
    initial: true,
  },
  {
    id: "workshop-plan",
    room: "workshop",
    x: 107,
    y: 305,
    radius: 27,
    description: "Observer le plan",
    action: "read",
    text: "Basile — Sur le plan : un train, un renard et une boîte à secrets. Dans la marge : « Poncer les angles, garder la tendresse. »",
  },
  {
    id: "inn-candle",
    room: "inn",
    x: 300,
    y: 148,
    radius: 26,
    description: "la bougie des visiteurs",
    action: "toggle",
  },
  {
    id: "inn-menu",
    room: "inn",
    x: 107,
    y: 305,
    radius: 27,
    description: "Lire le menu de Noël",
    action: "read",
    text: "Madeleine — Ce soir : velouté de courge, pain aux noix, tarte aux poires et chocolat chaud. Une place est toujours gardée pour les voyageurs.",
  },
  {
    id: "inn-keepsake",
    room: "inn",
    x: 204,
    y: 173,
    radius: 24,
    description: "Observer le souvenir",
    action: "read",
    text: "Madeleine — Dans le livre des visiteurs, une feuille séchée marque cette phrase : « Nous sommes arrivés pour une nuit. Nous sommes restés pour les gens. »",
  },
  {
    id: "inn-bench",
    room: "inn",
    x: 356,
    y: 185,
    radius: 23,
    description: "Examiner la banquette",
    action: "read",
    text: "Madeleine — Deux coussins, une couverture et une théière à portée de main. Le coin préféré des longues conversations.",
  },
];
export const decorationKey = "etoilebois-decoration-v1";
export interface DecorationStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export class DecorationState {
  private switches: Record<string, boolean> = {};
  constructor(private storage?: DecorationStorage) {
    try {
      const data = JSON.parse(storage?.getItem(decorationKey) ?? "null");
      if (
        data?.version === 1 &&
        data.switches &&
        typeof data.switches === "object"
      )
        for (const item of decorativeObjects.filter(
          (x) => x.action === "toggle",
        ))
          if (
            Object.hasOwn(data.switches, item.id) &&
            typeof data.switches[item.id] === "boolean"
          )
            this.switches[item.id] = data.switches[item.id];
    } catch {
      /* Corrupt or unavailable decorative storage does not affect RPG saves. */
    }
  }
  isOn(item: DecorativeObject) {
    return this.switches[item.id] ?? item.initial ?? false;
  }
  toggle(item: DecorativeObject) {
    if (item.action !== "toggle") return;
    this.switches[item.id] = !this.isOn(item);
    try {
      this.storage?.setItem(
        decorationKey,
        JSON.stringify({ version: 1, switches: this.switches }),
      );
    } catch {
      /* Keep the visual state for this session when storage is unavailable. */
    }
  }
}
export function decorFor(room: Save["room"]) {
  return decorativeObjects.filter((x) => x.room === room);
}
export function decorLabel(item: DecorativeObject, state: DecorationState) {
  return item.action === "toggle"
    ? `${state.isOn(item) ? "Éteindre" : "Allumer"} ${item.description}`
    : item.description;
}
export function decorationRects(room: Save["room"]): Rect[] {
  if (room === "village" || room === "forest" || room === "bakery") return [];
  const consoleWidth = { house: 30, library: 40, workshop: 28, inn: 38 }[room];
  return [
    { x: 60 - consoleWidth / 2, y: 298, w: consoleWidth, h: 22 },
    { x: 337, y: 298, w: 91, h: 23 },
    ...(room === "house" ? [{ x: 409, y: 177, w: 24, h: 10 }] : []),
    ...(room === "workshop" ? [{ x: 412, y: 214, w: 26, h: 8 }] : []),
    room === "library"
      ? { x: 305, y: 99, w: 10, h: 6 }
      : { x: 296, y: 122, w: 8, h: 8 },
  ];
}
export const lifeAssetSizes: Record<
  string,
  { width: number; maxHeight: number }
> = {
  ...homeSizes,
  "house-nook": { width: 90, maxHeight: 55 },
  "library-nook": { width: 90, maxHeight: 55 },
  "workshop-nook": { width: 90, maxHeight: 55 },
  "inn-nook": { width: 90, maxHeight: 55 },
  "house-console": { width: 48, maxHeight: 85 },
  "library-console": { width: 48, maxHeight: 85 },
  "workshop-console": { width: 48, maxHeight: 85 },
  "inn-console": { width: 48, maxHeight: 85 },
  "cat-sleep": { width: 34, maxHeight: 32 },
  "cat-awake": { width: 34, maxHeight: 32 },
  "candle-off": { width: 12, maxHeight: 30 },
  "lamp-off": { width: 18, maxHeight: 44 },
  "flame-a": { width: 5, maxHeight: 9 },
  "flame-b": { width: 5, maxHeight: 9 },
  steam: { width: 10, maxHeight: 18 },
  "toy-train": { width: 30, maxHeight: 20 },
};
