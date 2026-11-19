import slots from "./audio-slots.json";
export type Sound = keyof typeof slots;
export type AudioChannel = "music" | "voices" | "ambience";
export type AudioPreferences = {
  muted: boolean;
  volume: number;
  channels?: Record<AudioChannel, number>;
};
const storageKey = "etoilebois-audio-v1";
export function normalizeAudio(value: unknown): AudioPreferences {
  const v =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const clamp = (v: unknown, fallback = 1) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.max(0, Math.min(1, v))
      : fallback;
  const channels =
    v.channels && typeof v.channels === "object"
      ? (v.channels as Record<string, unknown>)
      : undefined;
  return {
    ...(channels
      ? {
          channels: {
            music: clamp(channels.music),
            voices: clamp(channels.voices),
            ambience: clamp(channels.ambience),
          },
        }
      : {}),
    muted: typeof v.muted === "boolean" ? v.muted : true,
    volume:
      typeof v.volume === "number" && Number.isFinite(v.volume)
        ? Math.max(0, Math.min(1, v.volume))
        : 0.5,
  };
}
export function readAudio(): AudioPreferences {
  try {
    return normalizeAudio(
      JSON.parse(localStorage.getItem(storageKey) ?? "null"),
    );
  } catch {
    return normalizeAudio(null);
  }
}
let preferences: AudioPreferences | undefined;
const loops = new Map<Sound, HTMLAudioElement>();
let fadeFrame: number | undefined;
const gains = new WeakMap<HTMLAudioElement, number>();
const channels = new WeakMap<HTMLAudioElement, AudioChannel>();
export function audioGain(p: AudioPreferences, channel?: AudioChannel) {
  return p.volume * (channel ? (p.channels?.[channel] ?? 1) : 1);
}
export function setAudio(value: AudioPreferences) {
  preferences = normalizeAudio(value);
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    /* Settings in memory, without changing the game save. */
  }
  for (const audio of loops.values()) {
    audio.muted = preferences.muted;
    audio.volume =
      audioGain(preferences, channels.get(audio)) * (gains.get(audio) ?? 1);
  }
}
export function stopAmbience() {
  if (fadeFrame !== undefined) cancelAnimationFrame(fadeFrame);
  fadeFrame = undefined;
  for (const a of loops.values()) a.pause();
  loops.clear();
}
/** Same audio service and preferences; only local licensed slots, after a user gesture. */
export function transitionAmbience(
  name: Sound | null,
  duration = 700,
  channel: AudioChannel = "ambience",
) {
  const source = name ? (slots[name] as string | null) : null;
  if (
    !source ||
    !name ||
    (preferences ?? readAudio()).muted ||
    !/^\/assets\/audio\/[a-z0-9_-]+\.(ogg|mp3|wav)$/i.test(source) ||
    typeof navigator === "undefined" ||
    !navigator.userActivation?.hasBeenActive
  ) {
    stopAmbience();
    return;
  }
  if (loops.has(name)) return;
  if (fadeFrame !== undefined) cancelAnimationFrame(fadeFrame);
  const previous = [...loops.entries()];
  const next = new Audio(source);
  channels.set(next, channel);
  next.loop = true;
  next.volume = 0;
  gains.set(next, 0);
  loops.set(name, next);
  const start = performance.now(),
    length = Math.max(1, duration);
  const fade = (now: number) => {
    const t = Math.min(1, Math.max(0, (now - start) / length)),
      prefs = preferences ?? readAudio();
    if (prefs.muted) {
      stopAmbience();
      return;
    }
    gains.set(next, t);
    next.volume = audioGain(prefs, channel) * t;
    for (const [, audio] of previous) {
      gains.set(audio, 1 - t);
      audio.volume = audioGain(prefs, channels.get(audio)) * (1 - t);
    }
    if (t < 1) fadeFrame = requestAnimationFrame(fade);
    else {
      fadeFrame = undefined;
      for (const [key, audio] of previous) {
        audio.pause();
        if (loops.get(key) === audio) loops.delete(key);
      }
    }
  };
  void next
    .play()
    .then(() => {
      if (loops.get(name) === next) fadeFrame = requestAnimationFrame(fade);
    })
    .catch(() => {
      next.pause();
      if (loops.get(name) === next) loops.delete(name);
    });
}
/** No authorized sounds supplied. Null slots are silent; no synthesis or external requests. */
export function playSound(name: Sound, loop = false, channel?: AudioChannel) {
  const source = slots[name] as string | null,
    prefs = preferences ?? readAudio();
  if (
    !source ||
    prefs.muted ||
    !/^\/assets\/audio\/[a-z0-9_-]+\.(ogg|mp3|wav)$/i.test(source)
  )
    return;
  if (loop && loops.has(name)) return;
  const sound = new Audio(source);
  if (channel) channels.set(sound, channel);
  sound.volume = audioGain(prefs, channel);
  sound.loop = loop;
  if (loop) loops.set(name, sound);
  void sound.play().catch(() => {
    if (loop) loops.delete(name);
  });
}
