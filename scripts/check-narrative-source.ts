import { readFileSync } from "node:fs";
import { validateScript } from "../src/narrative/script";
if (process.env.CI)
  throw Error(
    "Les scénarios originaux ne doivent pas être transmis à la CI publique.",
  );
if (!process.argv.slice(2).length)
  throw Error("Fichiers privés attendus en arguments.");
for (const file of process.argv.slice(2)) {
  try {
    const content = validateScript(JSON.parse(readFileSync(file, "utf8")));
    console.log(
      JSON.stringify({
        day: content.day,
        version: content.version,
        scenes: content.scenes.length,
        valid: true,
      }),
    );
  } catch {
    throw Error(
      "Validation privée refusée ; consulter le fichier local sans publier son contenu.",
    );
  }
}
