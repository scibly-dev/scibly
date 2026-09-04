#!/usr/bin/env node
// @ts-check
/**
 * Give this worktree its own ports, its own `.env` files and its own database:
 * copy all five `.env` files from the main checkout, then rewrite the ports and
 * the database name to ones only this worktree uses.
 *
 * The `.env` files are written only when their content changes, because `.env`
 * is a `globalDependencies` entry in `turbo.json` and touching one invalidates
 * this worktree's whole turbo cache. `.claude/launch.json` is rewritten always.
 *
 *   node scripts/worktree-up.mjs [--no-seed]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  ENV_FILES,
  assertPortsFree,
  databaseExists,
  detachFromSource,
  mainAdminUrl,
  portOwner,
  psql,
  rewriteEnv,
  secureEnvFile,
  worktreeConfig,
  worktreePaths,
} from "./worktree-lib.mjs";

const seed = !process.argv.includes("--no-seed");
const { root, main, isMain } = worktreePaths();

if (isMain) {
  console.error(
    "This is the main checkout — it already owns 3000/3001/4000 and scibly-dev.\n" +
      "Run this from a worktree under .claude/worktrees/.",
  );
  process.exit(1);
}

const wt = worktreeConfig(path.basename(root));
assertPortsFree(wt, root);

// Read every source before writing any target, so a missing one fails the run
// rather than leaving the worktree half-configured.
const sources = ENV_FILES.map((rel) => {
  try {
    return { rel, text: readFileSync(path.join(main, rel), "utf8") };
  } catch {
    throw new Error(
      `${rel} is missing from the main checkout (${main}) — this script copies it, it cannot invent it.`,
    );
  }
});

const admin = mainAdminUrl(main);

let changed = 0;
for (const { rel, text } of sources) {
  const target = path.join(root, rel);
  const next = rewriteEnv(text, wt);
  const detached = detachFromSource(target, path.join(main, rel), rel);
  let current = null;
  if (!detached) {
    try {
      current = readFileSync(target, "utf8");
    } catch {
      /* not written yet */
    }
  }
  if (current === next) {
    // The mode is part of the invariant too, and a file left at 0644 by an
    // older run never gets rewritten.
    secureEnvFile(target);
    continue;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, next, { mode: 0o600 });
  secureEnvFile(target);
  changed += 1;
  console.log(`  wrote ${rel}`);
}
console.log(
  changed === 0
    ? "env: unchanged (turbo cache intact)"
    : `env: ${changed} file${changed === 1 ? "" : "s"} rewritten`,
);

// `wt.ports` keys are exactly the three package names, and each package reads
// its port from `<NAME>_PORT`. Without `env` the `port` field is decorative:
// launching from here bypasses `scripts/dev.mjs`, so `apps/app` falls back to
// `${APP_PORT:-3001}` and boots on the main checkout's port while the debugger
// waits on this worktree's.
writeFileSync(
  path.join(root, ".claude/launch.json"),
  `${JSON.stringify(
    {
      version: "0.0.1",
      configurations: Object.entries(wt.ports).map(([name, port]) => ({
        name,
        runtimeExecutable: "pnpm",
        runtimeArgs: ["--filter", `@scibly/${name}`, "run", "dev"],
        port,
        autoPort: false,
        env: { [`${name.toUpperCase()}_PORT`]: `${port}` },
      })),
    },
    null,
    2,
  )}\n`,
);

if (!databaseExists(admin, wt.db)) {
  psql(admin, `CREATE DATABASE "${wt.db}"`);
  console.log(`db:  created ${wt.db}`);
} else {
  console.log(`db:  ${wt.db} exists`);
}

/**
 * @param {string} label
 * @param {string[]} args
 */
const run = (label, args) => {
  console.log(`==> ${label}`);
  execFileSync("pnpm", args, { cwd: root, stdio: "inherit" });
};

// Runs first because `prisma generate` is `@scibly/db`'s postinstall and
// migrate and seed below are prisma invocations. No `--frozen-lockfile`: a
// branch that added a dependency is exactly the case that flag refuses.
run("install", ["install"]);

run("migrate", ["--filter", "@scibly/db", "run", "migrate:deploy"]);
if (seed) run("seed", ["--filter", "@scibly/db", "run", "seed"]);

// The i18n dictionaries and editor html-schema are gitignored and normally come
// from the apps' predev/prebuild hooks, which `turbo run typecheck` skips.
// Without them `pnpm validate` fails for reasons unrelated to the branch.
// `ci.yml` runs the same root script for the same reason.
run("generate", ["run", "generate"]);

// Next writes a route validator into .next/dev/types from whatever was checked
// out at the time, so a worktree reused for a second branch fails typecheck on
// pages the branch never had. `next dev` rebuilds it.
for (const app of ["app", "web"]) {
  rmSync(path.join(root, `apps/${app}/.next/dev/types`), {
    recursive: true,
    force: true,
  });
}

const busy = Object.entries(wt.ports).filter(([, p]) => portOwner(p).length);
if (busy.length) {
  console.log(
    `\n! ports already listening: ${busy.map(([k, p]) => `${k}:${p}`).join(", ")}` +
      "\n  Either this worktree's stack is already up, or another process took them.",
  );
}

console.log(
  `\n${wt.name}\n` +
    `  web    http://localhost:${wt.ports.web}\n` +
    `  app    http://localhost:${wt.ports.app}\n` +
    `  collab ws://localhost:${wt.ports.collab}\n` +
    `  db     ${wt.db}\n\n` +
    `  pnpm dev`,
);
