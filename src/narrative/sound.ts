import { stopAmbience } from "../art/audio";
// Scene hooks only. No licensed music supplied: deliberately silent, no synthesis/network.
export const sceneAudio = {
  arrival: null,
  meet: null,
  tree: null,
  scatter: null,
  trail: null,
  restore: null,
  home: null,
} as const;
export function playSceneAudio(cue: string) {
  if (cue in sceneAudio) stopAmbience();
}
