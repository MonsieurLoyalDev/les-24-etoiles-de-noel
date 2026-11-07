import slots from "./audio-slots.json";
export type Sound = keyof typeof slots;
export type AudioPreferences = { muted: boolean; volume: number };
const storageKey = "etoilebois-audio-v1";
export function normalizeAudio(value: unknown): AudioPreferences {
  const v =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
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
export function setAudio(value: AudioPreferences) {
  preferences = normalizeAudio(value);
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    /* Settings in memory, without changing the game save. */
  }
  for (const audio of loops.values()) {
    audio.muted = preferences.muted;
    audio.volume = preferences.volume;
  }
}
export function stopAmbience() {
  for (const a of loops.values()) a.pause();
  loops.clear();
}
/** No authorized sounds supplied. Null slots are silent; no synthesis or external requests. */
export function playSound(name: Sound, loop = false) {
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
  sound.volume = prefs.volume;
  sound.loop = loop;
  if (loop) loops.set(name, sound);
  void sound.play().catch(() => {
    if (loop) loops.delete(name);
  });
}
