#!/usr/bin/env node
// @ts-check
/**
 * Tear this worktree's stack down: stop whatever is listening on its ports and
 * drop its database.
 *
 * Databases are deliberately left running after a review so a human can open the
 * app and see what the report meant, which means nothing reaps them — this is
 * the reaping, run once the feature is done.
 *
 *   node scripts/worktree-down.mjs [--keep-db] [--yes]
 */
import path from "node:path";
import { createInterface } from "node:readline/promises";

import {
  databaseExists,
  mainAdminUrl,
  portOwner,
  processCwd,
  psql,
  worktreeConfig,
  worktreePaths,
} from "./worktree-lib.mjs";

const keepDb = process.argv.includes("--keep-db");
const assumeYes = process.argv.includes("--yes");
const { root, main, isMain } = worktreePaths();

if (isMain) {
  console.error("Refusing to tear down the main checkout.");
  process.exit(1);
}

const wt = worktreeConfig(path.basename(root));

for (const [label, port] of Object.entries(wt.ports)) {
  const mine = [];
  for (const pid of portOwner(port)) {
    // Ports come from a hash, so a second worktree can derive this same block
    // (`assertPortsFree` refuses that in `wt:up`, but an older worktree may
    // predate it). Killing the wrong dev server loses unsaved state that no
    // `wt:up` brings back — strictly worse than the database drop below, which
    // at least prompts.
    const cwd = processCwd(pid);
    if (cwd && !path.resolve(cwd).startsWith(path.resolve(root))) {
      console.log(`skipped pid ${pid} on ${port}: started in ${cwd}, not here`);
      continue;
    }
    mine.push(pid);
  }
  if (!mine.length) continue;
  for (const pid of mine) {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  console.log(`stopped ${label} on ${port} (pid ${mine.join(", ")})`);
}

if (keepDb) {
  console.log(`kept ${wt.db}`);
  process.exit(0);
}

// The only things standing between this and an arbitrary DROP are the isMain
// check above and how `worktreeConfig` happens to build the name three files
// away. Pin the invariant where the damage would happen instead.
if (!wt.db.startsWith("scibly_wt_")) {
  console.error(`Refusing to drop ${wt.db}: not a worktree database.`);
  process.exit(1);
}

const admin = mainAdminUrl(main);

if (!databaseExists(admin, wt.db)) {
  console.log(`${wt.db} does not exist`);
  process.exit(0);
}

if (!assumeYes) {
  // The documented caller is a review skill that runs as a subagent, where
  // stdin is not a TTY and the prompt below would simply hang. Refuse rather
  // than assume yes — `--yes` is how a caller says it meant it.
  if (!process.stdin.isTTY) {
    console.error(
      `Refusing to drop ${wt.db} without a terminal to confirm at. Pass --yes.`,
    );
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Drop database ${wt.db}? [y/N] `);
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) {
    console.log("kept.");
    process.exit(0);
  }
}

// Prisma Studio and stale dev servers hold connections that would make DROP fail.
psql(
  admin,
  `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${wt.db}' AND pid <> pg_backend_pid()`,
);
psql(admin, `DROP DATABASE IF EXISTS "${wt.db}"`);
console.log(`dropped ${wt.db}`);
