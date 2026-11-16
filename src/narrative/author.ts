// Development-only local author workshop. Not authentication or production privacy.
import { getLocal, putLocal } from "../advent/local";
import { uuid } from "../advent/id";
import { episodeCatalog } from "./catalog";
import { loadCheckpoint, saveCheckpoint } from "./checkpoint";
import { validateScript, type EpisodeProgress } from "./script";
import type { EpisodeAPI } from "./api";
const contentKey = "narrative:local-author:content:v1";
export async function authorAPI(input?: unknown): Promise<EpisodeAPI | null> {
  if (!import.meta.env.DEV)
    throw Error("Atelier local réservé au développement");
  const raw = input ?? (await getLocal(contentKey));
  if (!raw) return null;
  const content = validateScript(raw);
  if (input) await putLocal(contentKey, content);
  const key = `narrative:local-author:run:${content.day}:${content.version}`;
  let run = await getLocal<string>(key);
  if (!run) {
    run = uuid();
    await putLocal(key, run);
  }
  const scope = () => ({ userId: "local-author", preview: true, runId: run });
  return {
    mode: "author",
    userId: "local-author",
    preview: true,
    async status() {
      const p = (await loadCheckpoint(
        scope(),
        content,
      )) as EpisodeProgress | null;
      return episodeCatalog.map((e) => ({
        day: e.day,
        title: e.day === content.day ? content.title : null,
        available: e.day === content.day,
        unlocked: e.day === content.day,
        complete: e.day === content.day && !!p?.complete,
        restored: e.day === content.day && !!p?.runtime?.restored,
      }));
    },
    async load(day, _replay = false, restart = false) {
      if (day !== content.day) throw Error("Cahier non importé");
      if (restart) {
        run = uuid();
        await putLocal(key, run);
      }
      const progress = (await loadCheckpoint(
        scope(),
        content,
      )) as EpisodeProgress | null;
      return {
        content,
        progress,
        runId: run!,
        revision: progress?.revision ?? -1,
        restored: !!progress?.runtime.restored,
        complete: !!progress?.complete,
      };
    },
    async save(day, runId, expected, p) {
      if (day !== content.day || runId !== run)
        throw Error("Session incorrecte");
      await saveCheckpoint(scope(), content, p, expected < 0 ? null : expected);
    },
  };
}
