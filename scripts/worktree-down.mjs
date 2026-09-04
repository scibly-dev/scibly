#!/usr/bin/env node
// @ts-check
/**
 * Tear this worktree's stack down: stop whatever is listening on its ports and
 * drop its database.
 *
 * Databases are left running after a review so a human can open the app and see
 * what the report meant, so nothing else reaps them. Run this once the feature
 * is done.
 *
 *   node scripts/worktree-down.mjs [--keep-db] [--yes]
 */
import path from "node:path";
import { createInterface } from "node:readline/promises";

import {
  databaseExists,
  dropDatabase,
  mainAdminUrl,
  portOwner,
  processCwd,
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

// Both refusals below exit non-zero, meaning "I did nothing", so they settle
// before the kill loop. Refusing after SIGTERMing this worktree's dev servers
// loses unsaved state on a run that reported it had stopped short.
if (!keepDb) {
  // Otherwise the only thing between this and an arbitrary DROP is how
  // `worktreeConfig` happens to build the name, three files away.
  if (!wt.db.startsWith("scibly_wt_")) {
    console.error(`Refusing to drop ${wt.db}: not a worktree database.`);
    process.exit(1);
  }
  // The documented caller is a review skill running as a subagent, where stdin
  // is not a TTY and the prompt below would hang. `--yes` is how a caller says
  // it meant it.
  if (!assumeYes && !process.stdin.isTTY) {
    console.error(
      `Refusing to drop ${wt.db} without a terminal to confirm at. Pass --yes.`,
    );
    process.exit(1);
  }
}

for (const [label, port] of Object.entries(wt.ports)) {
  const mine = [];
  for (const pid of portOwner(port)) {
    // `assertPortsFree` refuses a derived-block clash in `wt:up`, but an older
    // worktree may predate it. Killing the wrong dev server loses unsaved state
    // no `wt:up` brings back, worse than the drop below, which at least prompts.
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

const admin = mainAdminUrl(main);

if (!databaseExists(admin, wt.db)) {
  console.log(`${wt.db} does not exist`);
  process.exit(0);
}

if (!assumeYes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Drop database ${wt.db}? [y/N] `);
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) {
    console.log("kept.");
    process.exit(0);
  }
}

dropDatabase(admin, wt.db);
console.log(`dropped ${wt.db}`);
