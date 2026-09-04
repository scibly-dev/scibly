#!/usr/bin/env node
// @ts-check
/**
 * Drop the worktree databases no worktree points at any more.
 *
 * `wt:down` is the deliberate teardown: it runs inside a worktree, on a stack
 * that is still there, because the stack is meant to outlive the agent that made
 * it so a human can open the app and see what a review meant. This is the other
 * case — the worktree itself is gone, `git worktree list` no longer names it, and
 * its database is unreachable rather than kept.
 *
 * Runs from anywhere, the main checkout included, since standing in the deleted
 * worktree is not an option.
 *
 *   node scripts/worktree-prune.mjs [--dry-run]
 */
import {
  dropDatabase,
  mainAdminUrl,
  orphanDatabases,
  worktreePaths,
} from "./worktree-lib.mjs";

const dryRun = process.argv.includes("--dry-run");
const { main } = worktreePaths();
const admin = mainAdminUrl(main);
const orphans = orphanDatabases(admin, main);

if (!orphans.length) {
  console.log("no orphaned worktree databases.");
  process.exit(0);
}

for (const db of orphans) {
  // No prompt: every name here belongs to a worktree git cannot find, so there
  // is no session to interrupt and nobody to ask. `--dry-run` is for looking
  // first.
  if (dryRun) {
    console.log(`would drop ${db}`);
    continue;
  }
  dropDatabase(admin, db);
  console.log(`dropped ${db}`);
}
