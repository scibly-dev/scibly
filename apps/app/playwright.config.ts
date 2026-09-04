import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

const webDir = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(webDir, ".env"), quiet: true });

// Read from the .env just loaded rather than hardcoded, because every worktree
// runs on ports of its own (scripts/worktree-up.mjs). With a fixed 3001 and
// `reuseExistingServer` below, a run here would attach to whichever worktree
// booted first and test that branch's code.
const appURL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
const appProbeURL = `${appURL}/api/health`;
const collabPort =
  new URL(process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? "ws://localhost:4000")
    .port || "4000";

// Keep route constants used in tests aligned with the Playwright server.
process.env.NEXT_PUBLIC_APP_URL = appURL;
process.env.NEXT_PUBLIC_BASE_URL = appURL;

const collabTokenSecret =
  process.env.COLLAB_TOKEN_SECRET ?? process.env.BETTER_AUTH_SECRET;
if (!collabTokenSecret || collabTokenSecret.length < 32) {
  throw new Error(
    "Playwright requires COLLAB_TOKEN_SECRET (or BETTER_AUTH_SECRET) with at least 32 characters.",
  );
}

const appEnvs = {
  ...process.env,
  COLLAB_TOKEN_SECRET: collabTokenSecret,
  NEXT_PUBLIC_APP_URL: appURL,
  NEXT_PUBLIC_BASE_URL: appURL,
  NEXT_PUBLIC_ENV: "test",
  NEXT_PUBLIC_BETA_FLAG: "",
};

export default defineConfig({
  timeout: 60_000,
  testDir: "./__test__/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    locale: "de-DE",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: `pnpm --filter @scibly/app exec next dev --turbo --port ${new URL(appURL).port} --hostname localhost`,
      url: appProbeURL,
      reuseExistingServer: true,
      timeout: 120_000,
      env: appEnvs,
    },
    {
      command: "pnpm --filter @scibly/collab run dev",
      url: `http://localhost:${collabPort}/health`,
      reuseExistingServer: true,
      timeout: 60_000,
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || "test",
        COLLAB_PORT: collabPort,
        COLLAB_TRUST_PROXY: "false",
        COLLAB_TOKEN_SECRET: collabTokenSecret,
      },
    },
  ],
});
