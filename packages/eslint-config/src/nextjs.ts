import type { ESLint } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextVitals from "eslint-config-next/core-web-vitals";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";

import antiSlopPlugin from "./anti-slop/index.ts";

const importSortGroups = {
  typeImports: [
    "^node:.*\\u0000$",
    "^@?\\w.*\\u0000$",
    "^[^.].*\\u0000$",
    "^\\..*\\u0000$",
    "^src/.*\\u0000$",
    "^spec/.*\\u0000$",
  ],
  sideEffects: ["^\\u0000$"],
  nodeBuiltins: ["^node:"],
  external: ["^@?\\w"],
  internal: ["^"],
  relative: ["^\\.", "^src/", "^spec/"],
};

const testFiles = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/__tests__/**",
  "**/__test__/**",
  "**/shared/testing/**",
];

// SAFETY: typescript-eslint's plugin type predates ESLint's stricter `Plugin`
// shape; the rules/configs this config actually uses match at runtime.
const tsEslintPlugin = typescriptEslint as unknown as ESLint.Plugin;

// anti-slop ships as an Oxlint plugin; `eslintCompatPlugin` (applied in its own
// index) adds the `create` methods ESLint needs, so it loads here unchanged.
// SAFETY: the Oxlint plugin type doesn't structurally match ESLint's `Plugin`
// even after the compat shim, though the shimmed rules satisfy it at runtime.
const antiSlop = antiSlopPlugin as unknown as ESLint.Plugin;

const nextVitalsWithoutTsPlugin = nextVitals.map((config) => {
  if (!config?.plugins || !("@typescript-eslint" in config.plugins)) {
    return config;
  }

  const { ["@typescript-eslint"]: _tsPlugin, ...plugins } = config.plugins;

  return {
    ...config,
    plugins,
  };
});

export default defineConfig([
  ...nextVitalsWithoutTsPlugin,
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "**/package-copies/**",
    "**/coverage/**",
    "**/generated/**",
    "*.config.ts",
    "next-env.d.ts",
  ]),

  {
    files: ["**/*.{jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
      "anti-slop": antiSlop,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: true,
      },
    },
    rules: {
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",

      "anti-slop/no-module-mocking": "off",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",

      "anti-slop/no-runtime-typeof": "off",
      "anti-slop/no-shape-in-symbol-names": "error",

      // `require-safety-comment-for-type-assertion` instead.
      "anti-slop/no-unknown-parameters": "off",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/member-ordering": [
        "error",
        {
          default: {
            memberTypes: [
              "public-static-field",
              "protected-static-field",
              "private-static-field",
              "public-instance-field",
              "protected-instance-field",
              "private-instance-field",
              "public-constructor",
              "protected-constructor",
              "private-constructor",
              "public-instance-method",
              "protected-instance-method",
              "private-instance-method",
              "public-static-method",
              "protected-static-method",
              "private-static-method",
            ],
          },
        },
      ],
      "sort-imports": "off",
      "simple-import-sort/imports": [
        "error",
        {
          groups: Object.values(importSortGroups),
        },
      ],
      "simple-import-sort/exports": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          filter: {
            regex: "^(beforeIntent_|afterIntent_|beforeTransition_)$",
            match: false,
          },
        },
        {
          selector: "parameter",
          format: ["PascalCase"],
          filter: {
            regex: "(Components?|Extension)$",
            match: true,
          },
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allowSingleOrDouble",
        },
        {
          selector: "variable",
          format: ["PascalCase", "camelCase"],
          filter: {
            regex: "(Components?|Extension|Context)$",
            match: true,
          },
        },
        {
          selector: ["function", "variable"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allowSingleOrDouble",
        },
        {
          selector: "variable",
          modifiers: ["exported"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        {
          selector: "memberLike",
          modifiers: ["private"],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "memberLike",
          modifiers: ["protected"],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "classProperty",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          modifiers: ["public", "readonly"],
        },
        {
          selector: "classProperty",
          modifiers: ["readonly"],
          format: ["camelCase", "UPPER_CASE"],
        },
        {
          selector: "classProperty",
          modifiers: ["private"],
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "classProperty",
          modifiers: ["protected"],
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["enumMember", "objectLiteralProperty", "typeProperty"],
          format: null,
        },
        {
          selector: "enum",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "function",
          format: ["PascalCase", "camelCase"],
          filter: {
            regex: "(Components?|Extension|Node)$",
            match: true,
          },
        },
        {
          selector: "function",
          modifiers: ["exported"],
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
          leadingUnderscore: "allowSingleOrDouble",
        },
        {
          selector: "import",
          format: null,
        },
      ],
    },
  },

  {
    files: testFiles,
    rules: {
      "anti-slop/no-chained-type-assertions": "off",

      "anti-slop/no-unknown-returns": "off",

      // just made — `SAFETY:` is for a claim the reader can't check locally, and here they always

      "anti-slop/require-safety-comment-for-type-assertion": "off",
    },
  },
]);
