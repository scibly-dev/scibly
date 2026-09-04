// @ts-check
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  lstatSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

/** The one env file that carries `DATABASE_URL`. */
export const DB_ENV_FILE = "packages/db/.env";

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
  DB_ENV_FILE,
];

/** The ports the main worktree keeps for itself, and that copies must vacate. */
const MAIN_PORTS = { web: 3000, app: 3001, collab: 4000 };

/** Ports a worktree must not land on: the main checkout's, the docs app, Postgres, Prisma Studio. */
const RESERVED_PORTS = new Set([3000, 3001, 3002, 4000, 5432, 5433, 5555]);

/**
 * Every three-port block from 3200 up that holds no reserved port — about 900
 * of them. It was 90, which put six worktrees at a ~15% chance of two sharing a
 * block; two of them did.
 */
const SLOTS = (() => {
  /** @type {number[]} */
  const slots = [];
  for (let web = 3200; web + 2 < 6000; web += 3) {
    const block = [web, web + 1, web + 2];
    if (!block.some((p) => RESERVED_PORTS.has(p))) slots.push(web);
  }
  return slots;
})();

/**
 * @param {string[]} args
 * @param {string} [cwd]
 */
const git = (args, cwd) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/**
 * The worktree we were invoked in, and the main checkout it was cut from.
 * `--git-common-dir` is the one path shared by every worktree — it resolves to
 * the main checkout's `.git`, which no other git command hands you directly.
 *
 * @param {string} [cwd]
 */
export function worktreePaths(cwd = process.cwd()) {
  const root = git(["rev-parse", "--show-toplevel"], cwd);
  const commonDir = path.resolve(
    root,
    git(["rev-parse", "--git-common-dir"], cwd),
  );
  const main = path.dirname(commonDir);
  return { root, main, isMain: path.resolve(root) === path.resolve(main) };
}

/**
 * Three consecutive ports and a database name, both from the worktree's
 * directory name, so the same worktree always gets the same ones — a port that
 * moved between runs would mean rewriting `.env`, and `.env` is a
 * `globalDependencies` entry in `turbo.json`.
 *
 * @param {string} dirName the worktree directory's basename
 */
export function worktreeConfig(dirName) {
  const digest = createHash("sha1").update(dirName).digest();
  const web = SLOTS[digest.readUInt32BE(0) % SLOTS.length];
  const slug = dirName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  // The slug is not injective — `feat-x`, `feat_x`, `Feat.x` and `feat/x` all
  // flatten to `feat_x` — and Postgres truncates identifiers at 63 bytes
  // silently, so two long names sharing a prefix collide too. The digest
  // answers both, which is why it is unconditional rather than a fallback.
  // 10 + 44 + 1 + 8 = 63, the limit exactly.
  const db = `scibly_wt_${slug.slice(0, 44)}_${digest.toString("hex").slice(0, 8)}`;
  return { name: dirName, ports: { web, app: web + 1, collab: web + 2 }, db };
}

/**
 * The other worktrees beside this one. Empty when `root` is not inside a
 * directory of worktrees, which is the normal case for a plain clone.
 *
 * @param {string} root
 * @returns {string[]}
 */
function siblingNames(root) {
  try {
    return readdirSync(path.dirname(root), { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== path.basename(root))
      .map((e) => e.name);
  } catch (err) {
    const code = /** @type {NodeJS.ErrnoException} */ (err).code;
    if (code === "ENOENT" || code === "ENOTDIR") return [];
    throw err;
  }
}

/**
 * Two worktrees hashing to the same block get the same three ports and simply
 * fight over them; nothing downstream can tell the difference. Every sibling's
 * ports come from its directory name, so the clash is cheap to see coming.
 *
 * @param {{name: string, ports: Record<string, number>}} config
 * @param {string} root
 */
export function assertPortsFree(config, root) {
  const mine = new Set(Object.values(config.ports));
  for (const name of siblingNames(root)) {
    const clash = Object.values(worktreeConfig(name).ports).filter((p) =>
      mine.has(p),
    );
    if (!clash.length) continue;
    throw new Error(
      `${config.name} derives port${clash.length === 1 ? "" : "s"} ${clash.join(", ")}, ` +
        `which the worktree ${name} derives too.\n` +
        `  Rename one of the two directories, or run 'pnpm wt:down' in ${name} and delete it.`,
    );
  }
}

/**
 * Swap the database name in a connection string, leaving host and credentials alone.
 *
 * @param {string} url
 * @param {string} name
 */
export function withDatabase(url, name) {
  const parsed = new URL(url);
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

/** Node reports an IPv6 host bracketed, so the bare `::1` form never matched. */
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "host.docker.internal"];

/**
 * These scripts create and drop databases. `DATABASE_URL` in the main checkout
 * is a local one today, but the file it comes from also carries a commented-out
 * hosted URL that is one `#` away from being live.
 *
 * @param {string} url
 */
export function assertLocal(url) {
  const parsed = new URL(url);
  if (!LOCAL_HOSTS.includes(parsed.hostname)) {
    throw new Error(
      `refusing to manage databases on ${parsed.hostname}: point DATABASE_URL at a local server.`,
    );
  }
  // libpq lets a query parameter override the host from the URI, so a URL that
  // reads as local can still connect somewhere else entirely.
  for (const key of ["host", "hostaddr"]) {
    if (parsed.searchParams.has(key)) {
      throw new Error(
        `refusing to manage databases: DATABASE_URL overrides its host with ?${key}=.`,
      );
    }
  }
  return url;
}

/**
 * Read `DATABASE_URL` out of an env file's text. `parseEnv` is the same stdlib
 * parser `scripts/dev.mjs` uses, and unlike a line regex it knows what a quote
 * and a trailing comment are.
 *
 * @param {string} text
 */
export function readDatabaseUrl(text) {
  const url = parseEnv(text).DATABASE_URL;
  if (typeof url !== "string" || !url) {
    throw new Error("no DATABASE_URL found in the main worktree's env");
  }
  return url;
}

/** @type {Map<number, string>} main port -> the app that owns it */
const APP_BY_MAIN_PORT = new Map(
  Object.entries(MAIN_PORTS).map(([app, port]) => [port, app]),
);

/**
 * Rewrite one env file for this worktree. Ports are substituted wherever a
 * loopback host is followed by one of the main checkout's ports — which means
 * `NEXT_PUBLIC_BASE_URL` lands on the app port in `apps/app/.env` and the web
 * port in `apps/web/.env` without either being named here.
 *
 * One pass over the text rather than a chain of them, so no substitution can
 * re-match another's output.
 *
 * @param {string} text
 * @param {{ports: Record<string, number>, db: string}} config
 */
export function rewriteEnv(text, { ports, db }) {
  const out = text
    // `(?!\d)` so `localhost:30000` is not read as `localhost:3000` then "0".
    .replace(
      /(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]):(\d+)(?!\d)/g,
      (whole, host, port) => {
        const app = APP_BY_MAIN_PORT.get(Number(port));
        return app ? `${host}:${ports[app]}` : whole;
      },
    )
    .replace(/^(\s*COLLAB_PORT\s*=\s*)"?\d+"?$/gm, `$1"${ports.collab}"`)
    // The value may be quoted or bare and may carry a trailing comment. The
    // comment is kept — it is usually explaining the URL it sits next to.
    .replace(
      /^(\s*DATABASE_URL\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s#]*))([ \t]*(?:#.*)?)$/gm,
      (whole, key, dquoted, squoted, bare, trailing) => {
        const value = dquoted ?? squoted ?? bare;
        if (!value) return whole;
        return `${key}"${withDatabase(value, db)}"${trailing}`;
      },
    );
  // A host spelled some way the pattern above does not know survives the
  // rewrite silently, and `dev.mjs` then parses the main checkout's port back
  // out of it and boots this worktree on top of the main one. Fail here
  // instead: a written file is what makes that collision permanent.
  // Ports this worktree was itself given are not misses. Real slots never
  // include a main port, but a test may hand us one.
  const stale = Object.values(MAIN_PORTS).filter(
    (p) => !Object.values(ports).includes(p),
  );
  const missed =
    stale.length &&
    out.match(new RegExp(`//[^/\\s"']*:(${stale.join("|")})(?!\\d)`));
  if (missed) {
    throw new Error(
      `rewrite left "${missed[0]}" pointing at a main-checkout port — its host spelling is not one this script substitutes.`,
    );
  }
  return out;
}

/**
 * `writeFileSync` follows symlinks. A worktree cut before this script existed
 * can have its `.env` symlinked back into the main checkout, and writing
 * through one overwrites the very file we just read — after which the main
 * checkout no longer holds 3000/3001/4000, `rewriteEnv` is a silent no-op for
 * the next worktree, and it copies these ports verbatim. That is exactly the
 * collision this script exists to prevent.
 *
 * The read-back in the caller cannot notice: through the same link it sees its
 * own output and reports "unchanged". So the link has to go before anything
 * reads.
 *
 * @param {string} target absolute path this worktree should own
 * @param {string} source absolute path in the main checkout it was copied from
 * @param {string} rel the repo-relative path, for the log line
 * @returns {boolean} true if a link was removed, so there is nothing to read back
 */
export function detachFromSource(target, source, rel) {
  const stat = lstatSync(target, { throwIfNoEntry: false });
  if (!stat) return false;
  if (stat.isSymbolicLink()) {
    console.log(`  unlinked ${rel} (was a symlink into the main checkout)`);
    rmSync(target);
    return true;
  }
  // Not a symlink, but a hard link reaches the same inode — and `realpathSync`
  // resolves symlinks only, so it cannot see that.
  const src = statSync(source, { throwIfNoEntry: false });
  if (src && stat.dev === src.dev && stat.ino === src.ino) {
    throw new Error(
      `${rel} in this worktree is the same file as the main checkout's — refusing to overwrite the source.`,
    );
  }
  return false;
}

/** Credentials go to `psql` in argv, so they come back in its failure message too. */
const redact = (/** @type {string} */ text) =>
  text.replace(/(:\/\/[^:@/]+):[^@]*@/g, "$1:***@");

/**
 * @param {string} admin
 * @param {string} sql
 */
export function psql(admin, sql) {
  try {
    return execFileSync("psql", [admin, "-tAc", sql], {
      encoding: "utf8",
    }).trim();
  } catch (err) {
    const e = /** @type {NodeJS.ErrnoException & {stderr?: string}} */ (err);
    if (e.code === "ENOENT") {
      throw new Error(
        "psql is not on PATH — install the Postgres client tools to manage worktree databases.",
      );
    }
    throw new Error(redact(`${e.message}\n${e.stderr ?? ""}`.trim()));
  }
}

/**
 * A connection to the server rather than to any one database on it.
 * @param {string} url
 */
export const adminUrl = (url) => withDatabase(url, "postgres");

/**
 * The main checkout's `DATABASE_URL`, verified local — the one place that path,
 * that read and that check live.
 *
 * @param {string} main
 */
export function mainAdminUrl(main) {
  const file = path.join(main, DB_ENV_FILE);
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    throw new Error(
      `${DB_ENV_FILE} is missing from the main checkout (${main}) — this script copies it, it cannot invent it.`,
    );
  }
  return adminUrl(assertLocal(readDatabaseUrl(text)));
}

/**
 * @param {string} admin
 * @param {string} name
 */
export function databaseExists(admin, name) {
  return (
    psql(admin, `SELECT 1 FROM pg_database WHERE datname = '${name}'`) === "1"
  );
}

/**
 * The working directory a process was started in, or `null` if it is gone or
 * `lsof` will not say. `wt:down` kills by port, and two worktrees deriving the
 * same block (see `assertPortsFree`) means the port alone does not identify
 * whose dev server it is.
 *
 * @param {string} pid
 * @returns {string | null}
 */
export function processCwd(pid) {
  try {
    const out = execFileSync("lsof", ["-p", pid, "-a", "-d", "cwd", "-Fn"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const line = out.split("\n").find((l) => l.startsWith("n"));
    return line ? line.slice(1) : null;
  } catch {
    return null; // exited between the two lsof calls, or not ours to look at.
  }
}

/**
 * PIDs listening on a port, or none. A missing `lsof` is not "nothing is
 * listening" — it is a question we could not ask, and the caller kills
 * processes based on the answer.
 *
 * @param {number} port
 * @returns {string[]}
 */
export function portOwner(port) {
  try {
    return execFileSync(
      "lsof",
      ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"],
      {
        encoding: "utf8",
      },
    )
      .split("\n")
      .filter(Boolean);
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === "ENOENT") {
      throw new Error(
        "lsof is not on PATH — cannot tell which process holds a port.",
      );
    }
    return []; // lsof exits non-zero when nothing matches, which is the common case.
  }
}
