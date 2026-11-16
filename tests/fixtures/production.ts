import type { EpisodeScript } from "../../src/narrative/script";
/** Synthetic data only. Private PDF scenarios must never enter fixtures or CI. */
export function technicalProductionEpisode(day = 2): EpisodeScript {
  const point = { room: "village" as const, anchor: "square" };
  return {
    schema: 1,
    day,
    version: 1,
    scriptStatus: "validated",
    dependsOn: day === 1 ? [] : [day - 1],
    title: "Fixture de production",
    book: { title: "Page de test", text: "Aucun souvenir personnel." },
    flow: { schema: 1, portals: [] },
    scenes: [
      {
        id: "activity",
        kind: "meet",
        title: "Activité technique",
        prompt: "Résoudre la fixture.",
        choices: [],
        objectives: [
          { id: "check", event: { kind: "solve", target: "technical-puzzle" } },
        ],
        dialogues: {},
        dialogueEvents: {},
        flow: {
          actions: [
            {
              id: "check",
              label: "Activité de test",
              point,
              puzzle: {
                kind: "selection",
                title: "Test",
                prompt: "Sélection technique",
                hint: "Fixture",
                items: [
                  { id: "a", label: "A" },
                  { id: "b", label: "B" },
                ],
                answer: ["a"],
              },
            },
          ],
        },
      },
      {
        id: "award",
        kind: "restore",
        title: "Restitution technique",
        prompt: "Confirmer.",
        choices: [],
        objectives: [
          {
            id: "restoration",
            event: { kind: "interact", target: "restored-star" },
          },
        ],
        dialogues: {
          confirm: [{ speaker: "Fixture", text: "Réplique de test." }],
        },
        dialogueEvents: {
          confirm: { kind: "interact", target: "restored-star" },
        },
        flow: {
          actions: [
            {
              id: "restoration",
              label: "Confirmation",
              point,
              dialogue: "confirm",
              effect: "restore",
            },
          ],
        },
      },
      {
        id: "extra",
        kind: "meet",
        title: "Facultatif",
        prompt: "Exploration libre.",
        choices: [],
        objectives: [
          {
            id: "look",
            optional: true,
            event: { kind: "interact", target: "optional-fixture" },
          },
        ],
        dialogues: {
          look: [{ speaker: "Fixture", text: "Texte facultatif de test." }],
        },
        dialogueEvents: {
          look: { kind: "interact", target: "optional-fixture" },
        },
        flow: {
          optional: true,
          actions: [
            {
              id: "look",
              label: "Facultatif",
              point,
              dialogue: "look",
              availableAfter: 0,
            },
          ],
        },
      },
    ],
  };
}
