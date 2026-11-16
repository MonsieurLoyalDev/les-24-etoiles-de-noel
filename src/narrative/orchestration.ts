import type { EpisodeProgress } from "./script";
import type { Save, Point } from "../domain";
export type Presentation = {
  location?: {
    room: Save["room"];
    position: Point;
    loyal: Point;
    flocon: Point | null;
  };
  introSeen: boolean;
  introRemaining: number;
  moment: "tree" | "invitation" | null;
  optional: string[];
  hintSpoken: number;
  completedAt: string | null;
};
/** Additive runtime extension: existing E.1 checkpoints retain all facts and choices. */
export function presentation(p: EpisodeProgress): Presentation {
  return (p.runtime.presentation ??= {
    introSeen:
      p.sceneIndex > 0 || p.objectives.length > 0 || p.runtime.origin !== null,
    introRemaining: 0,
    moment: null,
    optional: [],
    hintSpoken: 0,
    completedAt: null,
  });
}
export const phaseOf = (p: EpisodeProgress, kind: string) =>
  p.complete
    ? "COMPLETE"
    : kind === "arrival"
      ? p.objectives.some((id) => id.endsWith("/welcome"))
        ? "MOVEMENT_TUTORIAL"
        : "ARRIVAL"
      : (
          {
            meet: "VILLAGE_TOUR",
            tree: "TREE_DISCOVERY",
            scatter: "STARS_SCATTER",
            trail: "LIGHT_TRAIL",
            restore: "FIRST_STAR",
            home: "CHALET_EPILOGUE",
          } as Record<string, string>
        )[kind];
export function activeHintTime(
  previous: number,
  delta: number,
  paused: boolean,
) {
  return paused
    ? previous
    : Math.min(86400000, previous + Math.max(0, Math.min(delta, 200)));
}
export const hintLevel = (ms: number) => Math.min(3, Math.floor(ms / 30000));
