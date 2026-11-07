import type { Save } from "../domain";
import { acceptQuest, sendEvent, type GameEvent } from "./quests";
export type Condition = {
  flag?: string;
  quest?: string;
  done?: boolean;
  item?: string;
  not?: boolean;
};
export type Effect = {
  quest?: string;
  event?: GameEvent;
  flag?: string;
  item?: string;
};
export type Choice = {
  label: string;
  next?: string;
  condition?: Condition;
  effects?: Effect[];
};
export type DialogueNode = { speaker: string; text: string; choices: Choice[] };
export type DialogueGraph = Record<string, DialogueNode>;
export function satisfies(s: Save, c?: Condition) {
  if (!c) return true;
  let ok = true;
  if (c.flag) ok = ok && s.flags.includes(c.flag);
  if (c.item) ok = ok && s.inventory.includes(c.item);
  if (c.quest)
    ok =
      ok &&
      (c.done === undefined
        ? !!s.quests[c.quest]
        : s.quests[c.quest]?.done === c.done);
  return c.not ? !ok : ok;
}
export function choicesFor(s: Save, node: DialogueNode) {
  return node.choices.filter((c) => satisfies(s, c.condition));
}
export function choose(
  s: Save,
  graph: DialogueGraph,
  id: string,
  index: number,
  namespace = "",
): string | null {
  const choice = choicesFor(s, graph[id])[index];
  if (!choice) return id;
  for (const effect of choice.effects ?? []) {
    if (effect.quest) acceptQuest(s, effect.quest);
    if (effect.flag && !s.flags.includes(effect.flag))
      s.flags.push(effect.flag);
    if (effect.item && !s.inventory.includes(effect.item))
      s.inventory.push(effect.item);
    if (effect.event) sendEvent(s, effect.event);
  }
  const history = `${namespace ? namespace + ":" : ""}${id}:${graph[id].choices.indexOf(choice)}`;
  if (!s.dialogueHistory.includes(history)) s.dialogueHistory.push(history);
  return choice.next && graph[choice.next] ? choice.next : null;
}
const resident = (
  speaker: string,
  quest: string,
  room: string,
  offer: string,
): DialogueGraph => ({
  greeting: {
    speaker,
    text: offer,
    choices: [
      {
        label: "Avec plaisir, je m’en occupe",
        effects: [{ quest }, { event: { kind: "explore", target: room } }],
        condition: { quest, not: true },
        next: "accepted",
      },
      {
        label: "Où en sommes-nous ?",
        condition: { quest, done: false },
        next: "reminder",
      },
      {
        label: "Notre souvenir est terminé",
        condition: { quest, done: true },
        next: "thanks",
      },
      { label: "À bientôt" },
    ],
  },
  accepted: {
    speaker,
    text: "Merci Debby ! Tu trouveras chaque étape dans ton journal. Reviens me parler quand tu auras terminé.",
    choices: [{ label: "C’est parti !" }],
  },
  reminder: {
    speaker,
    text: "Le journal te guide pas à pas. Les objets près des meubles et les tables de jeu répondent à la touche E ou au bouton tactile.",
    choices: [{ label: "Je continue" }],
  },
  thanks: {
    speaker,
    text: "Grâce à toi, le village a un souvenir de plus. Ton étoile fait déjà briller le grand sapin.",
    choices: [{ label: "À bientôt" }],
  },
});
export const dialogues = {
  mira: resident(
    "Célestine · Bibliothécaire",
    "album",
    "library",
    "J’ai égaré mon marque-page dans le rayon de droite. Le livre sur la table cache ensuite une énigme ; au pupitre, une photographie attend d’être reconstituée. Tu m’aides ?",
  ),
  oscar: resident(
    "Basile · Artisan",
    "parcels",
    "workshop",
    "Le ruban est sur le meuble à droite. Retrouve-le, puis prépare trois commandes sur mon établi. On fera une surprise aux habitants !",
  ),
  alma: resident(
    "Madeleine · Aubergiste",
    "memories",
    "inn",
    "Une veillée commence à la table de jeux. Retrouve toutes les paires de souvenirs, puis viens me raconter ta partie.",
  ),
  noe: resident(
    "Augustin · Gardien des lanternes",
    "tour",
    "village",
    "Bienvenue Debby ! Visite la maison de Loyal, la bibliothèque, l’atelier puis l’auberge, dans cet ordre. Reviens me raconter ta promenade.",
  ),
  riddle: {
    question: {
      speaker: "Le livre des devinettes",
      text: "Je vous suis au soleil, je grandis quand il se couche et disparais dans la nuit. Qui suis-je ?",
      choices: [
        {
          label: "Une ombre",
          effects: [
            { event: { kind: "solve", target: "riddle" } },
            { flag: "riddle-solved" },
          ],
          next: "right",
        },
        { label: "Un flocon", next: "wrong" },
        { label: "Une étoile", next: "wrong" },
        { label: "Je reviendrai" },
      ],
    },
    right: {
      speaker: "Le livre",
      text: "Exactement ! Le souvenir se trouve maintenant au pupitre photographique de droite.",
      choices: [{ label: "Refermer le livre" }],
    },
    wrong: {
      speaker: "Le livre",
      text: "Presque… Pense à ce que dessine la lumière derrière toi.",
      choices: [
        { label: "Réessayer", next: "question" },
        { label: "Plus tard" },
      ],
    },
  } satisfies DialogueGraph,
};
