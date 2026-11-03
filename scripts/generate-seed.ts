import { writeFileSync } from "node:fs";
import { demoDays } from "../src/advent/demo";
const sql = (v: unknown) =>
  `'${JSON.stringify(v).replaceAll("'", "''")}'::jsonb`;
writeFileSync(
  "supabase/seed.sql",
  "-- FICTION UNIQUEMENT. Ne remplace pas les modifications administrateur.\nbegin;\n" +
    demoDays
      .map(
        (d) =>
          `insert into public.advent_days(day,content,version) values (${d.content.day},${sql(d.content)},1) on conflict do nothing;\ninsert into private.advent_rules(day,rules) values (${d.content.day},${sql(d.rules)}) on conflict do nothing;`,
      )
      .join("\n") +
    "\ncommit;\n",
);
