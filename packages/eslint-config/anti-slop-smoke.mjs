// anti-slop is authored against Oxlint's AST; this asserts every rule still
// fires on ESLint's. Run after bumping the vendored copy in src/anti-slop.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const violations = {
  "no-chained-type-assertions": "const a = ({} as unknown) as string;",
  "no-conditional-empty-object-spread": "const a = { ...(flag ? { b: 1 } : {}) };",
  "no-known-value-widening": "const a: Record<string, number> = { b: 1 };",
  "no-module-mocking": 'vi.mock("./dep.ts");',
  "no-object-parameters": "function f(a: object) { return a; }",
  "no-reflect-apply": "Reflect.apply(f, null, []);",
  "no-reflect-get": "const a = Reflect.get(o, k);",
  "no-runtime-typeof": 'if (typeof a === "string") { f(a); }',
  "no-shape-in-symbol-names": "const userShape = 1;",
  "no-unknown-parameters": "function f(a: unknown) { return a; }",
  "no-unknown-returns": "function f(): unknown { return 1; }",
  "no-unknown-type-aliases": "type A = unknown;",
  "no-unsafe-dictionary-type": "type A = Record<string, unknown>;",
  "no-widen-then-assert":
    "const a = { b: 1 }; const c: unknown = a; const d = c as { readonly b: number };",
  "require-safety-comment-for-type-assertion": "const a = b as string;",
};

// Rules whose escape hatch depends on source offsets — which oxc and typescript-eslint spell
// differently — need a clean fixture proving they report nothing when the escape hatch is used.
const clean = {
  "require-safety-comment-for-type-assertion":
    "// SAFETY: b is validated by the caller.\nconst a = b as string;",
};

// The fixtures live outside the workspace, so every import and the eslint binary itself have to
// be resolved from here and passed in as absolute paths.
const plugin = fileURLToPath(new URL("./src/anti-slop/index.ts", import.meta.url));
const parser = fileURLToPath(import.meta.resolve("@typescript-eslint/parser"));
const eslintBin = fileURLToPath(new URL("./node_modules/.bin/eslint", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "anti-slop-smoke-"));

writeFileSync(
  join(dir, "eslint.config.mjs"),
  `import plugin from ${JSON.stringify(plugin)};
import parser from ${JSON.stringify(parser)};

export default [
  {
    files: ["**/*.ts"],
    languageOptions: { parser },
    plugins: { "anti-slop": plugin },
    rules: ${JSON.stringify(Object.fromEntries(Object.keys(violations).map((r) => [`anti-slop/${r}`, "error"])))},
  },
];
`,
);

for (const [rule, code] of Object.entries(violations)) {
  writeFileSync(join(dir, `${rule}.ts`), `${code}\n`);
}
for (const [rule, code] of Object.entries(clean)) {
  writeFileSync(join(dir, `clean-${rule}.ts`), `${code}\n`);
}

// eslint exits 1 once it reports errors, which is the expected outcome here,
// so the report has to be read back off the thrown result.
const report = JSON.parse(
  (() => {
    try {
      return execFileSync(eslintBin, [".", "-f", "json"], {
        cwd: dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
      });
    } catch (error) {
      if (error.status !== 1) throw error;
      return error.stdout;
    }
  })(),
);

const messages = report.flatMap((file) =>
  file.messages.map((message) => ({ ...message, file: file.filePath })),
);

assert.deepEqual(messages.filter((m) => m.fatal), [], "parse errors");

const fired = new Set(
  messages.filter((m) => !m.file.includes("/clean-")).map((m) => m.ruleId?.replace("anti-slop/", "")),
);
for (const rule of Object.keys(violations)) {
  assert.ok(fired.has(rule), `anti-slop/${rule} did not fire on ESLint's AST`);
}

for (const message of messages.filter((m) => m.file.includes("/clean-"))) {
  assert.fail(`${message.ruleId} reported on a compliant fixture: ${message.message}`);
}

console.log(
  `anti-slop: all ${Object.keys(violations).length} rules fire under ESLint, ` +
    `${Object.keys(clean).length} escape hatch(es) respected`,
);
