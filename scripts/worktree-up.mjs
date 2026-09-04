#!/usr/bin/env node
/**
 * Give this worktree its own ports, its own `.env` files and its own database.
 *
 * Every `.env` is gitignored, so a fresh worktree has none and inherits nothing;
 * copying them by hand is how worktrees end up half-configured, and copying them
 * verbatim is how they end up all fighting over port 3001 and `scibly-dev`. This
 * does both halves: copy all five from the main checkout, then rewrite the ports
 * and the database name to ones only this worktree uses.
 *
 * Idempotent on purpose — files are written only when their content actually
 * changes, because `.env` is a `globalDependencies` entry in `turbo.json` and
 * touching it invalidates this worktree's entire turbo cache.
 *
 *   node scripts/worktree-up.mjs [--no-seed]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  ENV_FILES,
  adminUrl,
  assertLocal,
  derive,
  locate,
  portOwner,
  psql,
  readDatabaseUrl,
  rewrite,
} from "./worktree-lib.mjs";

const seed = !process.argv.includes("--no-seed");
const { root, main, isMain } = locate();

if (isMain) {
  console.error(
    "This is the main checkout — it already owns 3000/3001/4000 and scibly-dev.\n" +
      "Run this from a worktree under .claude/worktrees/.",
  );
  process.exit(1);
}

const wt = derive(path.basename(root));

// Read every source file before writing anything, so a missing one fails the
// run rather than leaving the worktree half-configured.
const sources = ENV_FILES.map((rel) => {
  try {
    return { rel, text: readFileSync(path.join(main, rel), "utf8") };
  } catch {
    throw new Error(
      `${rel} is missing from the main checkout (${main}) — this script copies it, it cannot invent it.`,
    );
  }
});

const sourceUrl = assertLocal(
  readDatabaseUrl(sources.find((s) => s.rel === "packages/db/.env").text),
);

let changed = 0;
for (const { rel, text } of sources) {
  const target = path.join(root, rel);
  const next = rewrite(text, wt);
  let current = null;
  try {
    current = readFileSync(target, "utf8");
  } catch {
    /* not written yet */
  }
  if (current === next) continue;
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, next);
  changed += 1;
  console.log(`  wrote ${rel}`);
}
console.log(
  changed === 0
    ? "env: unchanged (turbo cache intact)"
    : `env: ${changed} file${changed === 1 ? "" : "s"} rewritten`,
);

// The launch config is gitignored too, so it is this worktree's to generate.
writeFileSync(
  path.join(root, ".claude/launch.json"),
  `${JSON.stringify(
    {
      version: "0.0.1",
      configurations: [
        {
          name: "app",
          runtimeExecutable: "pnpm",
          runtimeArgs: ["--filter", "@scibly/app", "run", "dev"],
          port: wt.ports.app,
          autoPort: false,
        },
        {
          name: "web",
          runtimeExecutable: "pnpm",
          runtimeArgs: ["--filter", "@scibly/web", "run", "dev"],
          port: wt.ports.web,
          autoPort: false,
        },
        {
          name: "collab",
          runtimeExecutable: "pnpm",
          runtimeArgs: ["--filter", "@scibly/collab", "run", "dev"],
          port: wt.ports.collab,
          autoPort: false,
        },
      ],
    },
    null,
    2,
  )}\n`,
);

const admin = adminUrl(sourceUrl);
const exists =
  psql(admin, `SELECT 1 FROM pg_database WHERE datname = '${wt.db}'`) === "1";
if (!exists) {
  psql(admin, `CREATE DATABASE "${wt.db}"`);
  console.log(`db:  created ${wt.db}`);
} else {
  console.log(`db:  ${wt.db} exists`);
}

const run = (label, args) => {
  console.log(`==> ${label}`);
  execFileSync("pnpm", args, { cwd: root, stdio: "inherit" });
};

run("migrate", ["--filter", "@scibly/db", "run", "migrate:deploy"]);
if (seed) run("seed", ["--filter", "@scibly/db", "run", "seed"]);

// A worktree's node_modules is its own and starts empty, or stale from before
// the branch added a dependency — which surfaces as dozens of "cannot find
// module" type errors that look like the branch is broken.
run("install", ["install", "--frozen-lockfile"]);

// The i18n dictionaries and the editor html-schema are generated and gitignored,
// and are normally produced only by the apps' own predev/prebuild hooks — which
// `turbo run typecheck` does not trigger. Without them `pnpm validate` fails on
// a clean worktree for reasons that have nothing to do with the branch. `ci.yml`
// runs these same three for the same reason.
run("generate", ["--filter", "@scibly/app", "run", "i18n:merge"]);
run("generate", ["--filter", "@scibly/app", "run", "schema:generate"]);
run("generate", ["--filter", "@scibly/web", "run", "i18n:merge"]);

// Next writes a route validator into .next/dev/types from whatever was checked
// out at the time. A worktree reused for a second branch still has the first
// one's routes in there, and typecheck fails on pages the branch never had.
// `next dev` rebuilds it.
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
