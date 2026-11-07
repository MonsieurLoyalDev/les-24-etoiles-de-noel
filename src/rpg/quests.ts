import type { Save } from "../domain";
export type EventKind =
  "talk" | "explore" | "find" | "solve" | "minigame" | "interact";
export type GameEvent = { kind: EventKind; target: string };
export type Objective = GameEvent & { label: string };
export type Quest = {
  id: string;
  title: string;
  day: number;
  objectives: Objective[];
};
export const quests: Quest[] = [
  {
    id: "first-light",
    title: "La première lumière",
    day: 1,
    objectives: [
      { kind: "talk", target: "loyal", label: "Parler à Loyal" },
      {
        kind: "explore",
        target: "house",
        label: "Entrer dans la maison de Loyal au sud-est",
      },
      { kind: "find", target: "letter", label: "Lire la lettre sur la table" },
      {
        kind: "interact",
        target: "tree",
        label: "Placer votre étoile au sapin",
      },
    ],
  },
  {
    id: "album",
    title: "Les pages de l’hiver",
    day: 2,
    objectives: [
      { kind: "explore", target: "library", label: "Explorer la bibliothèque" },
      {
        kind: "find",
        target: "bookmark",
        label: "Retrouver le marque-page près du rayon de droite",
      },
      {
        kind: "solve",
        target: "riddle",
        label: "Résoudre l’énigme du livre sur la table",
      },
      {
        kind: "minigame",
        target: "photo",
        label: "Reconstituer la photographie au pupitre de droite",
      },
      {
        kind: "talk",
        target: "mira",
        label: "Rapporter votre découverte à Célestine",
      },
    ],
  },
  {
    id: "parcels",
    title: "Un cadeau bien entouré",
    day: 3,
    objectives: [
      { kind: "explore", target: "workshop", label: "Explorer l’atelier" },
      {
        kind: "find",
        target: "ribbon",
        label: "Retrouver le ruban sur le meuble de droite",
      },
      {
        kind: "minigame",
        target: "wrap",
        label: "Emballer trois commandes à l’établi",
      },
      { kind: "talk", target: "oscar", label: "Montrer les cadeaux à Basile" },
    ],
  },
  {
    id: "memories",
    title: "La veillée des souvenirs",
    day: 4,
    objectives: [
      { kind: "explore", target: "inn", label: "Explorer l’auberge" },
      {
        kind: "minigame",
        target: "memory",
        label: "Réunir toutes les paires sur la table de jeux",
      },
      {
        kind: "talk",
        target: "alma",
        label: "Retrouver Madeleine après la partie",
      },
    ],
  },
  {
    id: "tour",
    title: "Bienvenue chez nous",
    day: 5,
    objectives: [
      { kind: "explore", target: "house", label: "Visiter la maison de Loyal" },
      { kind: "explore", target: "library", label: "Visiter la bibliothèque" },
      { kind: "explore", target: "workshop", label: "Visiter l’atelier" },
      { kind: "explore", target: "inn", label: "Visiter l’auberge" },
      {
        kind: "talk",
        target: "noe",
        label: "Raconter votre promenade à Augustin sur la place",
      },
    ],
  },
];
export function acceptQuest(save: Save, id: string) {
  if (!save.quests[id] && quests.some((q) => q.id === id))
    save.quests[id] = { step: 0, done: false };
}
export function sendEvent(save: Save, event: GameEvent) {
  const fact = `${event.kind}:${event.target}`;
  if (!save.flags.includes(fact)) save.flags.push(fact);
  for (const definition of quests) {
    const progress = save.quests[definition.id];
    if (!progress || progress.done) continue;
    const goal = definition.objectives[progress.step];
    if (goal?.kind === event.kind && goal.target === event.target) {
      progress.step++;
      if (progress.step === definition.objectives.length) {
        progress.done = true;
        if (!save.stars.includes(definition.day))
          save.stars.push(definition.day);
      }
    }
  }
  save.stage = Math.min(
    4,
    save.quests["first-light"]?.step ?? 0,
  ) as Save["stage"];
}
export function activeGoals(save: Save) {
  return quests
    .filter((q) => save.quests[q.id] && !save.quests[q.id].done)
    .map((q) => ({
      title: q.title,
      label: q.objectives[save.quests[q.id].step]?.label ?? "",
    }));
}
