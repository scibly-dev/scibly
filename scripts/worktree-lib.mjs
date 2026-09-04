import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Every `.env` in the repo is gitignored, so a fresh worktree starts with none
 * of them and someone hand-copies whichever ones they notice are missing. These
 * five are the whole set; the main worktree is the source of truth for all of
 * them.
 */
export const ENV_FILES = [
  ".env",
  "apps/app/.env",
  "apps/collab/.env",
  "apps/web/.env",
  "packages/db/.env",
];

/** The ports the main worktree keeps for itself, and that copies must vacate. */
export const MAIN_PORTS = { web: 3000, app: 3001, collab: 4000 };

const git = (args, cwd) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/**
 * The worktree we were invoked in, and the main checkout it was cut from.
 * `--git-common-dir` is the one path shared by every worktree — it resolves to
 * the main checkout's `.git`, which no other git command hands you directly.
 */
export function locate(cwd = process.cwd()) {
  const root = git(["rev-parse", "--show-toplevel"], cwd);
  const commonDir = path.resolve(
    root,
    git(["rev-parse", "--git-common-dir"], cwd),
  );
  const main = path.dirname(commonDir);
  return { root, main, isMain: path.resolve(root) === path.resolve(main) };
}

/**
 * Three consecutive ports from the worktree's name, so the same worktree always
 * gets the same ones — a port that moved between runs would mean rewriting
 * `.env`, and `.env` is a `globalDependencies` entry in `turbo.json`.
 *
 * 90 slots from 3200 clears the main checkout's 3000/3001/4000 and Postgres'
 * 5432/5433. Two worktrees can still collide; `assertPortsFree` is what
 * notices.
 */
export function derive(name) {
  const digest = createHash("sha1").update(name).digest();
  const slot = digest.readUInt16BE(0) % 90;
  const web = 3200 + slot * 3;
  const db = `scibly_wt_${name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`;
  return {
    name,
    ports: { web, app: web + 1, collab: web + 2 },
    // Postgres truncates identifiers at 63 bytes, and silently — two long
    // worktree names sharing a prefix would otherwise share a database.
    db: db.length > 63 ? `${db.slice(0, 55)}_${digest.toString("hex").slice(0, 7)}` : db,
  };
}

/** Swap the database name in a connection string, leaving host and credentials alone. */
export function withDatabase(url, name) {
  const parsed = new URL(url);
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

/**
 * These scripts create and drop databases. `DATABASE_URL` in the main checkout
 * is a local one today, but the file it comes from also carries a commented-out
 * hosted URL that is one `#` away from being live.
 */
export function assertLocal(url) {
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(host)) {
    throw new Error(
      `refusing to manage databases on ${host}: point DATABASE_URL at a local server.`,
    );
  }
  return url;
}

/** Read `DATABASE_URL` out of an env file's text. */
export function readDatabaseUrl(text) {
  const line = text.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m);
  if (!line) throw new Error("no DATABASE_URL found in the main worktree's env");
  return line[1].trim().replace(/^["']|["']$/g, "");
}

/**
 * Rewrite one env file for this worktree. Ports are substituted as literal
 * `localhost:<port>` because every file spells its URLs that way — which means
 * `NEXT_PUBLIC_BASE_URL` lands on the app port in `apps/app/.env` and the web
 * port in `apps/web/.env` without either being named here.
 */
export function rewrite(text, { ports, db }) {
  return text
    .replaceAll(`localhost:${MAIN_PORTS.web}`, `localhost:${ports.web}`)
    .replaceAll(`localhost:${MAIN_PORTS.app}`, `localhost:${ports.app}`)
    .replaceAll(`localhost:${MAIN_PORTS.collab}`, `localhost:${ports.collab}`)
    .replace(/^(\s*COLLAB_PORT\s*=\s*)"?\d+"?$/gm, `$1"${ports.collab}"`)
    .replace(
      /^(\s*DATABASE_URL\s*=\s*)(.+)$/gm,
      (_, key, value) =>
        `${key}"${withDatabase(value.trim().replace(/^["']|["']$/g, ""), db)}"`,
    );
}

export function psql(adminUrl, sql) {
  return execFileSync("psql", [adminUrl, "-tAc", sql], {
    encoding: "utf8",
  }).trim();
}

/** A connection to the server rather than to any one database on it. */
export const adminUrl = (url) => withDatabase(url, "postgres");

export function portOwner(port) {
  try {
    return execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}
