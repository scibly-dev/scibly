/// <reference types="node" />

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { mergeI18nFragments } from "@scibly/i18n/merge";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");

mergeI18nFragments({
  roots: [join(APP_ROOT, "src")],
  outDir: join(APP_ROOT, "src/i18n/generated"),
  getFragmentSuffix: (locale) => `.i18n.${locale}.json`,
  excludeFile: (p) => p.includes(".api.i18n."),
  logRoot: APP_ROOT,
});
