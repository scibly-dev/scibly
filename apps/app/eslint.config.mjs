import nextConfig from "@scibly/eslint-config/next";

import architectureBoundaries from "./eslint-rules/architecture-boundaries.mjs";

const config = [
  {
    ignores: ["scripts/tmp-editor-schema.cjs"],
  },
  ...nextConfig,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      architecture: architectureBoundaries,
    },
    rules: {
      "architecture/boundaries": "error",
    },
  },
  {
    // `tsconfig.json` maps `@collab/*` only so tests can boot a real collab
    // server; shipped code importing it would pull Hocuspocus into the Next.js bundle.
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@collab/*"],
              message:
                "The collab server is a separate app; only its tests may import it.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/demo-notebook/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/trpc",
                "@/trpc/*",
                "@/server",
                "@/server/*",
                "@scibly/api",
                "@scibly/api/*",
                "@scibly/auth",
                "@scibly/auth/*",
                "@scibly/db",
                "@scibly/db/*",
                "@scibly/observability",
                "@scibly/observability/*",
                "@hocuspocus/*",
                "@tanstack/react-query",
                "@tanstack/react-query/*",
              ],
              message:
                "The demo runtime is frontend-only; use controlled views and @scibly/showcase.",
            },
          ],
        },
      ],
    },
  },
];

export default config;
