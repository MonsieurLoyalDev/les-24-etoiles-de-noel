import { choose, type DialogueGraph } from "../rpg/dialogue";
import type { Save } from "../domain";
import type { ScriptScene } from "./script";
/** Episode cursors have scoped persistence; don't exhaust the bounded legacy history. */
export function advancePrivateDialogue(
  save: Save,
  graph: DialogueGraph,
  node: string,
  index: number,
) {
  return choose(
    { ...save, dialogueHistory: [] },
    graph,
    node,
    index,
    "narrative",
  );
}
/** Translate private beats to the existing RPG dialogue graph, never a second dialogue engine. */
export function dialogueGraph(
  scene: ScriptScene,
  block: string,
): DialogueGraph {
  const beats = scene.dialogues[block];
  if (!beats) throw Error("Dialogue privé inconnu");
  return Object.fromEntries(
    beats.map((beat, index) => {
      const next = index + 1 < beats.length ? `beat-${index + 1}` : undefined;
      const choice = scene.choices.find((c) => c.id === beat.choiceId);
      return [
        `beat-${index}`,
        {
          speaker: beat.speaker,
          text: beat.text,
          choices: choice
            ? choice.options.map((o) => ({
                label: o.label,
                condition: o.condition,
                next:
                  beat.nextByOption && Object.hasOwn(beat.nextByOption, o.id)
                    ? beat.nextByOption[o.id] === null
                      ? undefined
                      : `beat-${beat.nextByOption[o.id]}`
                    : next,
              }))
            : [{ label: "Continuer", next }],
        },
      ];
    }),
  );
}
