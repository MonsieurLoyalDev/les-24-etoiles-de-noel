import { openDB } from "idb";
import type { Value } from "./model";
const db = () =>
  openDB("etoilebois", 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("saves")) d.createObjectStore("saves");
    },
  });
export async function getLocal<T>(key: string): Promise<T | undefined> {
  const d = await db();
  try {
    return await d.get("saves", key);
  } finally {
    d.close();
  }
}
let queue = Promise.resolve();
export function putLocal(key: string, value: unknown) {
  const snapshot = structuredClone(value);
  const task = queue
    .catch(() => {})
    .then(async () => {
      const d = await db();
      try {
        await d.put("saves", snapshot, key);
      } finally {
        d.close();
      }
    });
  queue = task;
  return task;
}
export type Drafts = Record<string, Value>;
export const draftKey = (
  user: string,
  preview: boolean,
  day: number,
  run: string,
) => `advent-c:drafts:${user}:${preview ? "preview" : "live"}:${day}:${run}`;
