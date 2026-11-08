import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";
const base = "21f1e0a8c615b585e2600651f412ed0c565fb46c";
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
  "src/game/Game.ts",
]);
const changed = git("diff", "--name-only", base).split("\n").filter(Boolean);
const unexpected = changed.filter(
  (p) => baseline.includes(p) && !allowed.has(p),
);
if (unexpected.length)
  throw Error("Protected D31 files changed: " + unexpected.join(", "));
const source = (text: string) =>
  ts.createSourceFile(
    "Game.ts",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
const old = source(git("show", base + ":src/game/Game.ts")),
  current = source(readFileSync("src/game/Game.ts", "utf8"));
const printer = ts.createPrinter({
  removeComments: true,
  newLine: ts.NewLineKind.LineFeed,
});
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
function normalize(method: ts.MethodDeclaration, sf: ts.SourceFile) {
  const result = ts.transform(method, [
    (context) => (root) => {
      const visit: ts.Visitor = (node) => {
        const text = node.getText(sf);
        if (
          ts.isIfStatement(node) &&
          node.expression.getText(sf) === 't.id.startsWith("decor:")'
        )
          return undefined;
        if (
          ts.isExpressionStatement(node) &&
          /this\.(interiorLife|neighbourhood)\?\.update/.test(text)
        )
          return undefined;
        if (
          ts.isSpreadElement(node) &&
          text.includes("this.interiorLife?.candidates()")
        )
          return undefined;
        if (
          ts.isParenthesizedExpression(node) &&
          /decorativeObjects\s*\.find/.test(text)
        )
          return ts.factory.createNumericLiteral(43);
        return ts.visitEachChild(node, visit, context);
      };
      return ts.visitNode(root, visit) as ts.MethodDeclaration;
    },
  ]);
  const output = printer.printNode(
    ts.EmitHint.Unspecified,
    result.transformed[0],
    sf,
  );
  result.dispose();
  const scanner = ts.createScanner(
      ts.ScriptTarget.Latest,
      true,
      ts.LanguageVariant.Standard,
      output,
    ),
    tokens: string[] = [];
  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken)
    tokens.push(scanner.getTokenText());
  return tokens.join("\0");
}
const previous = methods(old),
  now = methods(current);
const checks = [...previous]
  .filter(([name]) => name !== "renderRoom")
  .map(([name, m]) => ({
    name,
    unchangedOutsideDecorHooks:
      normalize(m, old) === normalize(now.get(name)!, current),
  }));
if (checks.some((x) => !x.unchangedOutsideDecorHooks))
  throw Error(
    "Unexpected method edit: " +
      checks
        .filter((x) => !x.unchangedOutsideDecorHooks)
        .map((x) => x.name)
        .join(","),
  );
function collisionStatements(sf: ts.SourceFile) {
  const entries: string[] = [];
  function visit(n: ts.Node) {
    if (ts.isExpressionStatement(n)) {
      const t = n.expression.getText(sf);
      if (
        t.startsWith("this.rects") &&
        !t.includes("homes.map") &&
        !t.includes("decorationRects")
      )
        entries.push(printer.printNode(ts.EmitHint.Unspecified, n, sf));
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  return entries;
}
const originalCollisionsUnchanged =
  JSON.stringify(collisionStatements(old)) ===
  JSON.stringify(collisionStatements(current));
if (!originalCollisionsUnchanged) throw Error("Original collisions changed");
const beforeFrames = baseline.filter(
  (p) =>
    p.startsWith("docs/screenshots/phase-d3-1/apres/") && p.endsWith(".png"),
);
for (const path of beforeFrames) {
  const expected = execFileSync("git", ["show", base + ":" + path], {
    maxBuffer: 32 * 1024 * 1024,
  });
  const before = "docs/screenshots/phase-d3-2/avant/" + path.split("/").pop();
  if (!expected.equals(readFileSync(before)))
    throw Error("Baseline screenshot differs: " + before);
}
const result = {
  base,
  protectedFiles: baseline.filter((p) => !allowed.has(p)).length,
  allProtectedUnchanged: true,
  allowedExistingFiles: [...allowed],
  originalCollisionsUnchanged,
  authenticBeforeFrames: beforeFrames.length,
  methods: checks,
  exceptions: [
    "renderRoom: additive decorative sprites and footprints; original collision construction preserved",
    "candidates/nearest/interact: decorative candidates, per-object radius and early action return before all quest events",
    "update: calls to bounded presentation controllers",
  ],
  note: "All existing terrain/snow/tree/actors/HUD/dialogues/save/calendar/minigame/weather files and historical tests are protected byte-for-byte by Git comparison. New collisions are independently tested against every existing lane and entrance.",
};
writeFileSync(
  "docs/graphismes/INVARIANTS-D32.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    protectedFiles: result.protectedFiles,
    methods: checks.length,
    originalCollisionsUnchanged,
  }),
);
