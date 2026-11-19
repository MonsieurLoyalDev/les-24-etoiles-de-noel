import { transitionAmbience, type Sound } from "../art/audio";
// Scene hooks only. No licensed music supplied: deliberately silent, no synthesis/network.
export const sceneAudio: Record<string, Sound | null> = {
  theatre: "theatre",
  fireflies: "fireflies",
  confidences: "confidences",
  concert: "concert",
  market: null,
  lake: null,
  archive: null,
  craft: null,
  storm: null,
  clockwork: null,
  arrival: null,
  meet: null,
  tree: null,
  scatter: null,
  trail: null,
  restore: null,
  home: null,
} as const;
export function playSceneAudio(cue: string) {
  if (cue in sceneAudio)
    transitionAmbience(
      sceneAudio[cue],
      700,
      cue === "fireflies" ? "ambience" : "music",
    );
}
