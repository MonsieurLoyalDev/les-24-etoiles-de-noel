import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { loadSave, writeSave } from "../src/save";
import { initial } from "../src/domain";
import { openDB } from "idb";
it("enregistre et relit une progression versionnée dans IndexedDB", async () => {
  await writeSave({ ...initial, stage: 3 });
  expect((await loadSave())?.stage).toBe(3);
});
it("migre la clé Phase A sans l’écraser et préfère ensuite Phase B", async () => {
  const db = await openDB("etoilebois", 1);
  await db.delete("saves", "phase-b");
  const legacy = {
    version: 1,
    stage: 4,
    room: "house",
    position: { x: 240, y: 280 },
  };
  await db.put("saves", legacy, "phase-a");
  const migrated = await loadSave();
  expect(migrated?.stars).toEqual([1]);
  await writeSave({ ...migrated!, inventory: ["ribbon"] });
  expect((await loadSave())?.inventory).toEqual(["ribbon"]);
  expect(await db.get("saves", "phase-a")).toEqual(legacy);
  db.close();
});
