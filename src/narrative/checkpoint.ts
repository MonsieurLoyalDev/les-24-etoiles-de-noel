import { openDB } from "idb";
import { episodeId } from "./catalog";
import {
  restoreProgress,
  type EpisodeDefinition,
  type NarrativeProgress,
} from "./engine";
export type PrototypeScope = {
  userId: string;
  preview: boolean;
  runId?: string;
};
function storageKey(scope: PrototypeScope, d: EpisodeDefinition) {
  if (
    !/^[a-zA-Z0-9-]{1,80}$/.test(scope.userId) ||
    typeof scope.preview !== "boolean"
  )
    throw Error("Portée invalide");
  const run = scope.runId ?? "prototype";
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(run)) throw Error("Session invalide");
  return `narrative:checkpoint:v1:${scope.userId}:${scope.preview ? "preview" : "player"}:${run}:${episodeId(d.day)}`;
}
const db = () =>
  openDB("etoilebois", 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("saves")) d.createObjectStore("saves");
    },
  });
// Scoped checkpoints contain progression only, never dialogue bodies.
// They never replace phase-a/phase-b saves. Server authorization remains mandatory.
export async function loadCheckpoint(
  scope: PrototypeScope,
  d: EpisodeDefinition,
) {
  const key = storageKey(scope, d),
    connection = await db();
  try {
    const raw = await connection.get("saves", key);
    return raw === undefined ? null : restoreProgress(d, raw);
  } finally {
    connection.close();
  }
}
export async function saveCheckpoint(
  scope: PrototypeScope,
  d: EpisodeDefinition,
  progress: NarrativeProgress,
  expectedRevision: number | null,
) {
  const key = storageKey(scope, d),
    next = restoreProgress(d, progress),
    connection = await db();
  try {
    const tx = connection.transaction("saves", "readwrite");
    const raw = await tx.store.get(key);
    let valid = true;
    try {
      const old = raw === undefined ? null : restoreProgress(d, raw);
      if (old && JSON.stringify(old) === JSON.stringify(next)) {
        await tx.done;
        return;
      }
      valid =
        (old?.revision ?? null) === expectedRevision &&
        (!old || next.revision > old.revision);
    } catch {
      valid = false;
    }
    if (!valid) {
      tx.abort();
      await tx.done.catch(() => {});
      throw Error("Conflit de checkpoint : progression existante préservée");
    }
    await tx.store.put(next, key);
    await tx.done;
  } finally {
    connection.close();
  }
}
