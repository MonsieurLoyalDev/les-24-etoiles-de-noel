import type { EpisodeScript, ScriptScene } from "../../src/narrative/script";
// Entirely synthetic technical content. Never the PDF's dialogues or memories.
export function technicalEpisode(): EpisodeScript {
  const kinds: ScriptScene["kind"][] = [
    "arrival",
    "meet",
    "tree",
    "scatter",
    "trail",
    "restore",
    "home",
  ];
  const events = [
    { welcome: { kind: "talk", target: "welcome" } },
    {
      emile: { kind: "talk", target: "emile" },
      noe: { kind: "talk", target: "noe" },
      mira: { kind: "talk", target: "mira" },
    },
    { tree: { kind: "talk", target: "tree-story" } },
    { scatter: { kind: "interact", target: "dispersal" } },
    {
      "clue-1": { kind: "find", target: "clue-1" },
      "clue-2": { kind: "find", target: "clue-2" },
      "clue-3": { kind: "find", target: "clue-3" },
    },
    { star: { kind: "talk", target: "shared-moment" } },
    { home: { kind: "talk", target: "home-story" } },
  ] as ScriptScene["dialogueEvents"][];
  const scenes = kinds.map((kind, i): ScriptScene => {
    const e = events[i];
    const objectives = Object.entries(e).map(([id, event]) => ({ id, event }));
    if (i === 0)
      objectives.push({
        id: "walk",
        event: { kind: "explore", target: "first-walk" },
      });
    if (i === 1)
      objectives.push({
        id: "place",
        event: { kind: "explore", target: "central-square" },
      });
    if (i === 5)
      objectives.push({
        id: "restoration",
        event: { kind: "interact", target: "restored-star" },
      });
    if (i === 6)
      objectives.push({
        id: "book",
        event: { kind: "interact", target: "book-at-home" },
      });
    return {
      id: `scene-${i + 1}`,
      kind,
      title: `Fixture ${i + 1}`,
      prompt: `Objectif technique ${i + 1}`,
      objectives,
      choices:
        i === 0 || i === 5
          ? [
              {
                id: "fixture-choice",
                options: [
                  { id: "one", label: "Option technique A" },
                  { id: "two", label: "Option technique B" },
                ],
              },
            ]
          : [],
      dialogueEvents: e,
      dialogues: Object.fromEntries(
        Object.keys(e).map((id) => [
          id,
          [
            {
              speaker: "Loyal",
              text: `Réplique de fixture ${id}.`,
              ...(i === 0 || i === 5 ? { choiceId: "fixture-choice" } : {}),
            },
          ],
        ]),
      ),
    };
  });
  scenes[4].objectives[1].after = ["clue-1"];
  scenes[4].objectives[2].after = ["clue-2"];
  return {
    schema: 1,
    day: 1,
    version: 1,
    scriptStatus: "validated",
    dependsOn: [],
    title: "Épisode technique fictif",
    scenes,
    book: {
      title: "Archive technique",
      text: "Donnée de test, sans souvenir personnel.",
    },
  };
}
