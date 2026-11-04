import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
function scan(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? scan(join(path, f.name)) : [join(path, f.name)],
  );
}
const files = scan("dist");
if (
  existsSync("dist/demo") ||
  files.some(
    (p) =>
      /demoApi/.test(p) ||
      (/\.js$/.test(p) &&
        readFileSync(p, "utf8").includes(
          "Ce voyage de démonstration nous attend",
        )),
  )
)
  throw Error("Contenu fictif embarqué dans le build privé");
console.log(
  "Build privé : aucun paquet de surprises fictives ni média de démonstration.",
);
