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

const child = spawn("pnpm", ["exec", "turbo", "run", "dev"], {
  env: {
    ...process.env,
    COLLAB_TOKEN_SECRET: collabTokenSecret,
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
