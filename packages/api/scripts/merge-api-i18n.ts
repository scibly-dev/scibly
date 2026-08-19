/// <reference types="node" />

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { mergeI18nFragments } from "@scibly/i18n/merge";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_PACKAGE_ROOT = join(__dirname, "..");

mergeI18nFragments({
  roots: [join(API_PACKAGE_ROOT, "src/router")],
  outDir: join(API_PACKAGE_ROOT, "src/i18n/generated"),
  getFragmentSuffix: (locale) => `.api.i18n.${locale}.json`,
  logRoot: API_PACKAGE_ROOT,
});
