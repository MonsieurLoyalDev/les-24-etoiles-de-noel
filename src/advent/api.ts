import type { Day, DayStatus, EditableDay, Run, Value } from "./model";
export interface AdventAPI {
  mode: "demo" | "supabase";
  userId: string;
  isAdmin: boolean;
  developerAllowed: boolean;
  status(preview: boolean): Promise<DayStatus[]>;
  day(day: number, preview: boolean): Promise<Day>;
  start(day: number, preview: boolean, replay?: boolean): Promise<Run>;
  check(
    day: number,
    runId: string,
    step: string,
    value: Value,
    preview: boolean,
  ): Promise<{ accepted: boolean; run: Run }>;
  adminGet(day: number): Promise<EditableDay>;
  adminSave(day: EditableDay): Promise<void>;
  media(path: string, day: number): Promise<string>;
  upload(day: number, file: File): Promise<string>;
}
