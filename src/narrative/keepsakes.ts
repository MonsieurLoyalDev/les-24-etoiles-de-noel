import type { AnchorRef } from "./flow";
import type { EpisodeProgress, EpisodeScript } from "./script";
import type { EpisodeContext } from "./context";

export type TheatreKeepsake = {
  point: AnchorRef;
  style: string | null;
  built: boolean;
};
/** Pure projection of existing authorized progress, never a second save or award. */
export function theatreKeepsake(
  script: EpisodeScript,
  progress: EpisodeProgress,
  context?: EpisodeContext,
): TheatreKeepsake | undefined {
  const definition = script.flow?.theatre;
  if (
    !definition ||
    (definition.requires && !progress.objectives.includes(definition.requires))
  )
    return context?.theatre;
  const built = definition.built.startsWith("episode-")
    ? context?.facts[definition.built] === true
    : progress.objectives.includes(definition.built);
  const choices = {
    ...progress.choices,
    ...progress.runtime.flow?.sideChoices,
  };
  const style = definition.inherited
    ? context?.facts[definition.inherited]
    : choices[definition.style ?? ""];
  return {
    point: progress.complete
      ? (definition.persistentPoint ?? definition.point)
      : definition.point,
    style: typeof style === "string" ? style : null,
    built,
  };
}
