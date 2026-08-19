import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

type MergeI18nFragmentsOptions = {
  roots: readonly string[];

  outDir: string;
  /**
   * Fragment filename suffix per locale, e.g. `(locale) => \`.i18n.${locale}.json\`` for UI,
   * or `(locale) => \`.api.i18n.${locale}.json\`` for API error catalogs.
   */
  getFragmentSuffix: (locale: string) => string;

  excludeFile?: (filePath: string) => boolean;
  /**
   * Optional second suffix merged into the same output (e.g. app merges `*.api.i18n.*`
   * into the same `dictionary.*.json` as UI fragments).
   */
  getSecondaryFragmentSuffix?: (locale: string) => string;
  locales?: readonly string[];

  logRoot?: string;
};

type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };

const isObject = (v: unknown): v is JsonObject =>
  v !== null && typeof v === "object" && !Array.isArray(v);

function* walkFiles(dir: string): Generator<string> {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") {
        continue;
      }
      yield* walkFiles(full);
    } else {
      yield full;
    }
  }
}

const merge = (target: JsonObject, source: JsonObject, at: string) => {
  const out = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const path = `${at}.${key}`;
    if (!Object.prototype.hasOwnProperty.call(out, key)) {
      out[key] = value;
      continue;
    }
    const cur = out[key];
    if (isObject(cur) && isObject(value)) {
      out[key] = merge(cur, value, path);
      continue;
    }
    if (cur !== value) {
      throw new Error(
        `i18n merge conflict at ${path}: ${JSON.stringify(cur)} vs ${JSON.stringify(value)}`,
      );
    }
  }
  return out;
};

const readFragment = (file: string): JsonObject => {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(`Invalid JSON in ${file}: ${e}`);
  }
  if (!isObject(data)) {
    throw new Error(`Root must be a JSON object in ${file}`);
  }
  return data;
};

const defaultLocales = ["en", "de"] as const;

export const mergeI18nFragments = (
  options: MergeI18nFragmentsOptions,
): void => {
  const existingRoots = options.roots.filter((r) => existsSync(r));
  const outRoot = options.outDir;
  const locales = options.locales?.length
    ? options.locales
    : [...defaultLocales];
  const logRoot = options.logRoot ?? existingRoots[0] ?? outRoot;
  const exclude = options.excludeFile;

  if (existingRoots.length === 0) {
    throw new Error(
      "mergeI18nFragments: no existing roots to scan (check paths exist)",
    );
  }

  mkdirSync(outRoot, { recursive: true });

  const collectPaths = (suffix: string, applyExclude: boolean): string[] =>
    existingRoots
      .flatMap((root) =>
        [...walkFiles(root)].filter((p) => {
          if (!p.endsWith(suffix)) return false;
          if (!applyExclude) return true;
          if (exclude === undefined) return true;
          return !exclude(p);
        }),
      )
      .sort((a, b) => a.localeCompare(b));

  for (const locale of locales) {
    const primarySuffix = options.getFragmentSuffix(locale);
    const primaryPaths = collectPaths(primarySuffix, true);
    const secondarySuffix = options.getSecondaryFragmentSuffix?.(locale);
    const secondaryPaths = secondarySuffix
      ? collectPaths(secondarySuffix, false)
      : [];

    const paths = [...primaryPaths, ...secondaryPaths].sort((a, b) =>
      a.localeCompare(b),
    );

    if (paths.length === 0) {
      throw new Error(
        `No i18n fragments for locale "${locale}" under roots: ${existingRoots.join(", ")}`,
      );
    }

    let global: JsonObject = {};
    for (const file of paths) {
      global = merge(global, readFragment(file), relative(logRoot, file));
    }

    const outPath = join(outRoot, `dictionary.${locale}.json`);
    writeFileSync(outPath, `${JSON.stringify(global, null, 2)}\n`, "utf8");
    console.log(
      `[i18n:merge] ${relative(logRoot, outPath)} (${paths.length} files)`,
    );
  }
};
