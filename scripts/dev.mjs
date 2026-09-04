import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { parseEnv } from "node:util";

const appEnv = parseEnv(
  readFileSync(new URL("../apps/app/.env", import.meta.url), "utf8"),
);
const collabTokenSecret =
  process.env.COLLAB_TOKEN_SECRET ??
  appEnv.COLLAB_TOKEN_SECRET ??
  appEnv.BETTER_AUTH_SECRET;

if (!collabTokenSecret || collabTokenSecret.length < 32) {
  throw new Error(
    "Development requires COLLAB_TOKEN_SECRET (or BETTER_AUTH_SECRET) with at least 32 characters.",
  );
}

/**
 * Both Next apps take their port from the URLs already in `apps/app/.env`, so a
 * worktree that `scripts/worktree-up.mjs` moved off 3000/3001 actually boots
 * there. Reading the URL rather than a separate port variable keeps one source
 * of truth — a port here that disagreed with `NEXT_PUBLIC_APP_URL` would serve
 * the app somewhere it does not believe it lives.
 */
const portOf = (url, fallback) => {
  try {
    return new URL(url).port || fallback;
  } catch {
    return fallback;
  }
};

const child = spawn("pnpm", ["exec", "turbo", "run", "dev"], {
  env: {
    ...process.env,
    COLLAB_TOKEN_SECRET: collabTokenSecret,
    APP_PORT: portOf(appEnv.NEXT_PUBLIC_APP_URL, "3001"),
    WEB_PORT: portOf(appEnv.NEXT_PUBLIC_WEB_URL, "3000"),
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
