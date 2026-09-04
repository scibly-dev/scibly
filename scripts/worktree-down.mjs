#!/usr/bin/env node
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
import { readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";

import {
  adminUrl,
  assertLocal,
  derive,
  locate,
  portOwner,
  psql,
  readDatabaseUrl,
} from "./worktree-lib.mjs";

const keepDb = process.argv.includes("--keep-db");
const assumeYes = process.argv.includes("--yes");
const { root, main, isMain } = locate();

if (isMain) {
  console.error("Refusing to tear down the main checkout.");
  process.exit(1);
}

const wt = derive(path.basename(root));

for (const [label, port] of Object.entries(wt.ports)) {
  const pids = portOwner(port);
  if (!pids.length) continue;
  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  console.log(`stopped ${label} on ${port} (pid ${pids.join(", ")})`);
}

if (keepDb) {
  console.log(`kept ${wt.db}`);
  process.exit(0);
}

const admin = adminUrl(
  assertLocal(readDatabaseUrl(readFileSync(path.join(main, "packages/db/.env"), "utf8"))),
);

if (psql(admin, `SELECT 1 FROM pg_database WHERE datname = '${wt.db}'`) !== "1") {
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

// Prisma Studio and stale dev servers hold connections that would make DROP fail.
psql(
  admin,
  `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${wt.db}' AND pid <> pg_backend_pid()`,
);
psql(admin, `DROP DATABASE IF EXISTS "${wt.db}"`);
console.log(`dropped ${wt.db}`);
