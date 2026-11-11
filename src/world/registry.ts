import type { Point, Save } from "../domain";
import { citizens, type Room } from "../rpg/world";
import type { Actor } from "../art/actors";
import type { DialogueGraph } from "../rpg/dialogue";
export type Activity = {
  point: string;
  label: string;
  state: "OBSERVING" | "RESTING";
  dwell: number;
};
export type WorldProfile = {
  id: string;
  name: string;
  actor: Actor;
  room: Room;
  spawn: Point;
  speed: number;
  schedule: readonly Activity[][];
};
const activity = (
  point: string,
  label: string,
  dwell = 7000,
  state: Activity["state"] = "OBSERVING",
): Activity => ({ point, label, dwell, state });
export const worldProfiles: WorldProfile[] = [
  {
    id: "noe",
    name: "Augustin",
    actor: "augustin",
    room: "village",
    spawn: { x: 1070, y: 760 },
    speed: 32,
    schedule: [
      [
        activity("plaza-gifts-lantern", "Ronde des lanternes"),
        activity("plaza-market-lantern", "Observe le marché"),
      ],
      [
        activity("plaza-market-lantern", "Veille sur la place"),
        activity("plaza-gifts-lantern", "Inspecte les lumières"),
      ],
      [
        activity("plaza-evening-lantern", "Veille aux lanternes", 11000),
        activity("plaza-quiet", "Admire le sapin", 9000),
      ],
      [
        activity("plaza-quiet", "Pause sous les étoiles", 14000, "RESTING"),
        activity("plaza-evening-lantern", "Ronde du soir", 10000),
      ],
    ],
  },
  {
    id: "emile",
    name: "Émile",
    actor: "emile",
    room: "village",
    spawn: { x: 750, y: 700 },
    speed: 42,
    schedule: [
      [activity("mail-books", "Vérifie le courrier", 10000)],
      [activity("mail-families", "Tournée des voisins", 11000)],
      [activity("post-start", "Retour de tournée", 10000, "RESTING")],
      [activity("post-start", "La sacoche se repose", 18000, "RESTING")],
    ],
  },
  {
    id: "mira",
    name: "Célestine",
    actor: "celestine",
    room: "library",
    spawn: { x: 100, y: 230 },
    speed: 28,
    schedule: [
      [
        activity("library-shelves", "Observe les rayonnages", 9000),
        activity("library-welcome", "Accueil des lecteurs"),
      ],
      [
        activity("library-welcome", "Accueil des lecteurs", 9000),
        activity("library-reading", "Au livre des histoires", 9000),
      ],
      [
        activity("library-reading", "Lecture de la veillée", 12000),
        activity("library-shelves", "Dernière ronde des livres"),
      ],
      [
        activity(
          "library-welcome",
          "La bibliothèque se repose",
          15000,
          "RESTING",
        ),
      ],
    ],
  },
];
export const existingResidents = [
  ...citizens.map((c) => ({
    id: c.id,
    name: c.name,
    room: c.room,
    managedByPrototype: ["noe", "mira"].includes(c.id),
  })),
  { id: "emile", name: "Émile", room: "village", managedByPrototype: true },
  { id: "flocon", name: "Flocon", room: "village", managedByPrototype: false },
];
export function markWorldEncounter(save: Save, id: string) {
  if (!existingResidents.some((p) => p.id === id && p.id !== "flocon"))
    return false;
  const flag = "world:met:" + id;
  if (save.flags.includes(flag) || save.flags.length >= 500) return false;
  save.flags.push(flag);
  return true;
}
const introductions: Record<string, string[]> = {
  noe: [
    "Je commence ma ronde ; les lanternes ont toutes leur place.",
    "Je veille sur la place pendant que les voisins passent.",
    "Le soir rend les lumières encore plus douces.",
    "Une petite ronde, puis le calme des étoiles.",
  ],
  emile: [
    "La tournée commence par le courrier du quartier des Livres.",
    "Je passe vérifier la boîte des voisins avant la veillée.",
    "La tournée est terminée ; ma sacoche peut souffler.",
    "Le courrier attendra l’aurore. Profitons du calme.",
  ],
  mira: [
    "Les rayonnages se réveillent doucement.",
    "Il y a toujours un livre à découvrir ici.",
    "Je prépare une lecture pour la veillée.",
    "Même les histoires ont besoin d’un peu de repos.",
  ],
};
export function contextualWorldDialogue(
  id: string,
  clock: number,
  existing?: DialogueGraph,
): DialogueGraph | undefined {
  const line =
    introductions[id]?.[
      Math.floor((((clock % 180000) + 180000) % 180000) / 45000)
    ];
  if (!line) return existing;
  if (existing)
    return {
      ...existing,
      greeting: {
        ...existing.greeting,
        text: line + "\n\n" + existing.greeting.text,
      },
    };
  return {
    greeting: {
      speaker: "Émile · Poste",
      text: line,
      choices: [
        { label: "Comment se passe la tournée ?", next: "round" },
        { label: "À bientôt" },
      ],
    },
    round: {
      speaker: "Émile",
      text: "Je prends le temps de passer près des boîtes du village. Une lettre, c’est parfois une petite chaleur qu’on apporte à quelqu’un.",
      choices: [{ label: "Bonne promenade, Émile !" }],
    },
  };
}
