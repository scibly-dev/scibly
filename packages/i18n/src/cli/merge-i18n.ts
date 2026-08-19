/// <reference types="node" />

import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

import { mergeI18nFragments } from "../merge-i18n";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    root: { type: "string", short: "r" },
    "src-dir": { type: "string" },
    "out-dir": { type: "string" },
    locales: { type: "string" },
  },
  allowPositionals: true,
});

const rootArg = values.root ?? positionals[0];
if (!rootArg) {
  console.error(
    "Usage: merge-i18n --root <app-root>   (absolute or relative path to the Next.js app)",
  );
  process.exit(1);
}

const appRoot = resolve(rootArg);
const srcDir = values["src-dir"]
  ? resolve(values["src-dir"])
  : join(appRoot, "src");
const outDir = values["out-dir"]
  ? resolve(values["out-dir"])
  : join(appRoot, "src/i18n/generated");
const locales = values.locales
  ? values.locales
      .split(",")
      .map((segment: string) => segment.trim())
      .filter((segment) => segment.length > 0)
  : undefined;

mergeI18nFragments({
  roots: [srcDir],
  outDir,
  getFragmentSuffix: (locale) => `.i18n.${locale}.json`,
  excludeFile: (p) => p.includes(".api.i18n."),
  locales,
  logRoot: appRoot,
});
