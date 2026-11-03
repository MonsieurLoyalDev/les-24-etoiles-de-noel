import { demoDays } from "./demo";
import {
  demoUnlocked,
  newRun,
  validEvidence,
  validateEditable,
  type EditableDay,
  type Run,
} from "./model";
import { getLocal, putLocal } from "./local";
import type { AdventAPI } from "./api";
export function createDemoAPI(
  developerAllowed: boolean,
  now = () => Date.now(),
): AdventAPI {
  const key = (p: boolean) => `advent-c:runs:${p ? "developer" : "demo"}`;
  const guard = (day: number, preview: boolean) => {
    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 24 ||
      (preview && !developerAllowed) ||
      (!preview && !demoUnlocked(day, now()))
    )
      throw Error("Journée verrouillée dans cette simulation.");
  };
  const read = async () => {
    const custom = await getLocal<Record<string, EditableDay>>(
      "advent-c:fiction-editor",
    );
    return demoDays.map((d) => custom?.[d.content.day] ?? d);
  };
  return {
    mode: "demo",
    userId: "fiction",
    isAdmin: developerAllowed,
    developerAllowed,
    async status(preview) {
      if (preview && !developerAllowed)
        throw Error("Mode développeur indisponible");
      const runs = (await getLocal<Record<string, Run>>(key(preview))) ?? {};
      return Array.from({ length: 24 }, (_, i) => ({
        day: i + 1,
        unlocked: preview || demoUnlocked(i + 1, now()),
        complete: runs[i + 1]?.complete ?? false,
        run: runs[i + 1] ?? null,
      }));
    },
    async day(day, preview) {
      guard(day, preview);
      return structuredClone((await read())[day - 1].content);
    },
    async start(day, preview, replay = false) {
      guard(day, preview);
      const runs = (await getLocal<Record<string, Run>>(key(preview))) ?? {};
      const version = (await read())[day - 1].content.version;
      if (!runs[day] || replay || runs[day].contentVersion !== version) {
        runs[day] = newRun(day, runs[day]);
        runs[day].contentVersion = version;
      }
      await putLocal(key(preview), runs);
      return structuredClone(runs[day]);
    },
    async check(day, runId, stepId, value, preview) {
      guard(day, preview);
      const runs = (await getLocal<Record<string, Run>>(key(preview))) ?? {};
      const run = runs[day];
      if (!run || run.runId !== runId)
        throw Error("Session modifiée : reprendre la journée");
      const definition = (await read())[day - 1];
      if (run.contentVersion !== definition.content.version)
        throw Error("Contenu modifié : reprendre la journée");
      if (run.checked.includes(stepId)) return { accepted: true, run };
      const step = definition.content.steps[run.checked.length];
      if (
        !step ||
        step.id !== stepId ||
        !validEvidence(step, definition.rules[step.id], value)
      )
        return { accepted: false, run };
      run.checked.push(step.id);
      run.values[step.id] = value;
      if (run.checked.length === definition.content.steps.length) {
        run.complete = true;
        run.completedAt ??= new Date(now()).toISOString();
        run.memory = structuredClone(run.values);
      }
      await putLocal(key(preview), runs);
      return { accepted: true, run: structuredClone(run) };
    },
    async adminGet(day) {
      if (!developerAllowed)
        throw Error("Éditeur fictif réservé au développement");
      return structuredClone((await read())[day - 1]);
    },
    async adminSave(input) {
      if (!developerAllowed)
        throw Error("Éditeur fictif réservé au développement");
      const d = validateEditable(input);
      const records =
        (await getLocal<Record<string, EditableDay>>(
          "advent-c:fiction-editor",
        )) ?? {};
      d.content.version++;
      records[d.content.day] = d;
      await putLocal("advent-c:fiction-editor", records);
    },
    async media(path) {
      if (!path.startsWith("/demo/"))
        throw Error("Le mode démo ne charge que les médias fictifs du projet");
      return path;
    },
    async upload() {
      throw Error("Les vrais médias nécessitent le stockage privé Supabase.");
    },
  };
}
