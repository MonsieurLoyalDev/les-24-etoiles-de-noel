import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";
const base = "186367cfb396aa52bf30d2e15bcbc40ff8751c47";
const git = (...args: string[]) =>
  execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
const baseline = git("ls-tree", "-r", "--name-only", base).split("\n");
const allowed = new Set([
  "README.md",
  "package.json",
  "package-lock.json",
  "ops/public-assets.json",
  "src/art/world.ts",
  "src/art/landscape.ts",
  "src/game/Game.ts",
  "tests/e2e/phase-c.spec.ts",
]);
const changed = git("diff", "--name-only", base).split("\n").filter(Boolean);
const unexpected = changed.filter(
  (p) => baseline.includes(p) && !allowed.has(p),
);
if (unexpected.length)
  throw Error("Unexpected change to D.3: " + unexpected.join(", "));
const oldText = git("show", base + ":src/game/Game.ts"),
  newText = readFileSync("src/game/Game.ts", "utf8");
const source = (text: string) =>
  ts.createSourceFile(
    "Game.ts",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
const old = source(oldText),
  current = source(newText),
  printer = ts.createPrinter({
    removeComments: true,
    newLine: ts.NewLineKind.LineFeed,
  });
const legacyCalendarOriginal = source(
  git("show", base + ":tests/e2e/phase-c.spec.ts"),
);
const legacyCalendarCurrent = source(
  readFileSync("tests/e2e/phase-c.spec.ts", "utf8").replace(
    /\/\/ D31 modal cleanup:[\s\S]*?\/\/ D31 modal cleanup end\./,
    "",
  ),
);
const legacyCalendarTestUnchangedOutsideAwait =
  printer.printFile(legacyCalendarOriginal) ===
  printer.printFile(legacyCalendarCurrent);
if (!legacyCalendarTestUnchangedOutsideAwait)
  throw Error("Legacy calendar test changed outside modal-cleanup await");
function methods(sf: ts.SourceFile) {
  const cls = sf.statements.find(
    (s) => ts.isClassDeclaration(s) && s.name?.text === "Village",
  ) as ts.ClassDeclaration;
  return new Map(
    cls.members
      .filter(ts.isMethodDeclaration)
      .map((m) => [m.name.getText(sf), m]),
  );
}
const oldMethods = methods(old),
  newMethods = methods(current);
const print = (node: ts.Node, sf: ts.SourceFile) =>
  printer.printNode(ts.EmitHint.Unspecified, node, sf);
const normalized = (
  name: string,
  sf: ts.SourceFile,
  method: ts.MethodDeclaration,
) => {
  const skip = (s: ts.Statement) => {
    const text = s.getText(sf);
    return (
      (name === "create" &&
        text.startsWith("this.scale.on(Phaser.Scale.Events.RESIZE")) ||
      (name === "refreshAdvent" &&
        text.startsWith("this.game.canvas.dataset.treeArt")) ||
      (name === "update" && text.startsWith("this.interiorLight?.update"))
    );
  };
  return method
    .body!.statements.filter((s) => !skip(s))
    .map((s) => print(s, sf))
    .join("\n");
};
const results = [...oldMethods]
  .filter(([name]) => name !== "renderRoom")
  .map(([name, method]) => ({
    name,
    unchangedOutsideDisplay:
      normalized(name, old, method) ===
      normalized(name, current, newMethods.get(name)!),
  }));
if (results.some((r) => !r.unchangedOutsideDisplay))
  throw Error(
    "Gameplay method changed: " +
      results.filter((r) => !r.unchangedOutsideDisplay).map((r) => r.name),
  );
function rects(sf: ts.SourceFile) {
  const entries: string[] = [];
  function visit(n: ts.Node) {
    if (
      ts.isExpressionStatement(n) &&
      n.expression.getText(sf).startsWith("this.rects")
    )
      entries.push(print(n, sf));
    ts.forEachChild(n, visit);
  }
  visit(sf);
  return entries;
}
const collisionConstructionUnchanged =
  JSON.stringify(rects(old)) === JSON.stringify(rects(current));
if (!collisionConstructionUnchanged)
  throw Error("Collision construction changed");
const output = {
  base,
  checkedProtectedFiles: baseline.filter((p) => !allowed.has(p)).length,
  allProtectedUnchanged: unexpected.length === 0,
  allowedExistingFiles: [...allowed],
  collisionConstructionUnchanged,
  legacyCalendarTestUnchangedOutsideAwait,
  methods: results,
  displayExceptions: [
    "renderRoom: interior art and removal of the standalone star",
    "create: interior camera letterboxing on resize",
    "refreshAdvent: read-only tree diagnostic",
    "update: call to the purely visual interior lighting controller",
    "legacy calendar browser test: wait for modal cleanup before sending held keyboard input",
  ],
  note: "Git compares canonical content, including validated assets and all existing HUD/dialogue/save/advent/minigame/physics files. New art files are separately hashed in INVENTAIRE-D31.json.",
};
writeFileSync(
  "docs/graphismes/INVARIANTS-D31.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    protectedFiles: output.checkedProtectedFiles,
    methods: results.length,
    collisionConstructionUnchanged,
  }),
);
