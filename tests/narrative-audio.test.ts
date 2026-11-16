import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("../src/art/audio-slots.json", () => ({
  default: {
    wind: "/assets/audio/licensed.ogg",
    fire: null,
    star: "https://untrusted.invalid/track.mp3",
  },
}));
import { transitionAmbience, stopAmbience, setAudio } from "../src/art/audio";
const sounds: FakeAudio[] = [];
class FakeAudio {
  volume = 0;
  muted = false;
  loop = false;
  paused = false;
  constructor(public src: string) {
    sounds.push(this);
  }
  play() {
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}
let callback: FrameRequestCallback | undefined;
beforeEach(() => {
  sounds.length = 0;
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("navigator", { userActivation: { hasBeenActive: true } });
  vi.stubGlobal("performance", { now: () => 0 });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    callback = cb;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    callback = undefined;
  });
  setAudio({ muted: false, volume: 0.6 });
});
afterEach(() => {
  stopAmbience();
  vi.unstubAllGlobals();
});
it("aucun fichier absent, externe ou sans geste utilisateur ne joue", () => {
  transitionAmbience("fire");
  transitionAmbience("star");
  vi.stubGlobal("navigator", { userActivation: { hasBeenActive: false } });
  transitionAmbience("wind");
  expect(sounds).toHaveLength(0);
});
it("fondu borné, volume existant, aucune duplication et arrêt muet", async () => {
  transitionAmbience("wind", 700);
  await Promise.resolve();
  expect(sounds).toHaveLength(1);
  expect(sounds[0].volume).toBe(0);
  callback?.(350);
  expect(sounds[0].volume).toBeCloseTo(0.3);
  setAudio({ muted: false, volume: 0.4 });
  expect(sounds[0].volume).toBeCloseTo(0.2);
  callback?.(700);
  expect(sounds[0].volume).toBeCloseTo(0.4);
  transitionAmbience("wind");
  expect(sounds).toHaveLength(1);
  setAudio({ muted: true, volume: 0.4 });
  transitionAmbience("wind");
  expect(sounds[0].paused).toBe(true);
});
