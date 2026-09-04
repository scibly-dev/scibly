// @ts-check
/**
 * Tests for the pure half of `worktree-lib.mjs`.
 *
 * These started as characterization tests pinning current behavior, bugs
 * included. Where a fix has since landed, the assertion was flipped in the same
 * commit as the fix and carries the bug's number, so the two stay tied
 * together. Everything else still pins behavior that must not move.
 *
 * `node:test` rather than vitest because root `scripts/` is in no workspace, so
 * no `vitest.config.ts` in this repo can reach it.
 *
 *   pnpm test:scripts
 */
import assert from "node:assert/strict";
import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  assertLocal,
  assertPortsFree,
  detachFromSource,
  readDatabaseUrl,
  rewriteEnv,
  withDatabase,
  worktreeConfig,
} from "./worktree-lib.mjs";

const WT = worktreeConfig("ponytail-ultra-083fae");

describe("worktreeConfig", () => {
  it("gives a worktree three consecutive ports and a database name", () => {
    assert.deepEqual(WT, {
      name: "ponytail-ultra-083fae",
      ports: { web: 3731, app: 3732, collab: 3733 },
      db: "scibly_wt_ponytail_ultra_083fae_c8a542d3",
    });
  });

  it("is stable — the same name always gets the same ports", () => {
    assert.deepEqual(
      worktreeConfig("feat-x").ports,
      worktreeConfig("feat-x").ports,
    );
  });

  it("never lands on a reserved port", () => {
    const reserved = new Set([3000, 3001, 3002, 4000, 5432, 5433, 5555]);
    for (let i = 0; i < 3000; i++) {
      const { ports } = worktreeConfig(`w${i}`);
      for (const p of Object.values(ports)) assert.ok(!reserved.has(p), `${p}`);
    }
  });

  it("FIXED(B3): names that flatten to the same slug get different databases", () => {
    const names = ["feat-x", "feat_x", "Feat.x", "feat/x"];
    assert.equal(new Set(names.map((n) => worktreeConfig(n).db)).size, 4);
  });

  it("FIXED(B3): the database name always fits Postgres' 63-byte limit", () => {
    for (const n of ["x", "a".repeat(200), "ponytail-ultra-083fae"]) {
      const { db } = worktreeConfig(n);
      assert.ok(db.length <= 63, `${db.length}`);
      assert.match(db, /^scibly_wt_.*_[0-9a-f]{8}$/);
    }
  });

  it("spreads names across the slot space rather than clumping", () => {
    const webs = new Set(
      Array.from(
        { length: 500 },
        (_, i) => worktreeConfig(`wt-${i}`).ports.web,
      ),
    );
    // 500 names into ~900 slots: some collision is expected, clumping is not.
    assert.ok(webs.size > 350, `only ${webs.size} distinct slots`);
  });
});

describe("assertPortsFree", () => {
  /** @param {string[]} names */
  const worktreesDir = (names) => {
    const dir = mkdtempSync(path.join(tmpdir(), "wt-ports-"));
    for (const n of names) mkdirSync(path.join(dir, n));
    return dir;
  };

  it("passes when no sibling derives the same ports", () => {
    const dir = worktreesDir(["alpha", "beta"]);
    try {
      assertPortsFree(worktreeConfig("alpha"), path.join(dir, "alpha"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("FIXED(B2): refuses when a sibling derives the same ports", () => {
    // `wt-25` and `wt-56` hash to the same block — found by search, and the
    // reason this check exists: two live worktrees here did exactly this.
    const dir = worktreesDir(["wt-25", "wt-56"]);
    try {
      assert.equal(
        worktreeConfig("wt-25").ports.web,
        worktreeConfig("wt-56").ports.web,
      );
      assert.throws(
        () => assertPortsFree(worktreeConfig("wt-25"), path.join(dir, "wt-25")),
        /wt-25 derives ports 4496, 4497, 4498, which the worktree wt-56 derives too/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("is silent when there is no worktrees directory at all", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "wt-solo-"));
    try {
      assertPortsFree(worktreeConfig("solo"), path.join(dir, "nope", "solo"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("withDatabase", () => {
  it("swaps only the database, keeping credentials, host, port and query", () => {
    assert.equal(
      withDatabase(
        "postgresql://u:p@localhost:5432/scibly-dev?schema=public",
        "scibly_wt_x",
      ),
      "postgresql://u:p@localhost:5432/scibly_wt_x?schema=public",
    );
  });
});

describe("assertLocal", () => {
  for (const host of ["localhost", "127.0.0.1", "host.docker.internal"]) {
    it(`accepts ${host}`, () => {
      const url = `postgresql://u:p@${host}:5432/d`;
      assert.equal(assertLocal(url), url);
    });
  }

  it("refuses a remote host", () => {
    assert.throws(
      () => assertLocal("postgresql://u:p@db.example.com:5432/d"),
      /refusing to manage databases on db\.example\.com/,
    );
  });

  it("FIXED(B15): accepts IPv6 loopback, which Node reports bracketed", () => {
    const url = "postgresql://u:p@[::1]:5432/d";
    assert.equal(assertLocal(url), url);
  });

  it("FIXED(B15): refuses a libpq ?host= override of a local-looking URL", () => {
    assert.throws(
      () => assertLocal("postgresql://u:p@localhost:5432/d?host=prod.internal"),
      /overrides its host/,
    );
    assert.throws(
      () => assertLocal("postgresql://u:p@localhost:5432/d?hostaddr=10.0.0.1"),
      /overrides its host/,
    );
  });
});

describe("readDatabaseUrl", () => {
  it("reads a quoted value", () => {
    assert.equal(
      readDatabaseUrl(
        `FOO=1\nDATABASE_URL="postgres://u:p@localhost:5432/d"\n`,
      ),
      "postgres://u:p@localhost:5432/d",
    );
  });

  it("reads an unquoted value", () => {
    assert.equal(
      readDatabaseUrl(`DATABASE_URL=postgres://u:p@localhost:5432/d\n`),
      "postgres://u:p@localhost:5432/d",
    );
  });

  it("ignores a commented-out DATABASE_URL", () => {
    assert.equal(
      readDatabaseUrl(
        `DATABASE_URL="postgres://u:p@localhost:5432/d"\n# DATABASE_URL="postgres://u:p@hosted.example.com:5432/d"\n`,
      ),
      "postgres://u:p@localhost:5432/d",
    );
  });

  it("throws when the key is absent", () => {
    assert.throws(() => readDatabaseUrl("FOO=1\n"), /no DATABASE_URL found/);
  });

  it("FIXED(B8): strips a trailing comment instead of swallowing it", () => {
    assert.equal(
      readDatabaseUrl(`DATABASE_URL="postgres://u:p@localhost:5432/d" # hi`),
      "postgres://u:p@localhost:5432/d",
    );
  });

  it("FIXED(B8): recognises `export DATABASE_URL=`", () => {
    assert.equal(
      readDatabaseUrl(`export DATABASE_URL="postgres://u:p@localhost:5432/d"`),
      "postgres://u:p@localhost:5432/d",
    );
  });
});

describe("rewriteEnv", () => {
  it("moves each app off the main checkout's port", () => {
    assert.equal(
      rewriteEnv(`NEXT_PUBLIC_APP_URL="http://localhost:3001"`, WT),
      `NEXT_PUBLIC_APP_URL="http://localhost:3732"`,
    );
    assert.equal(
      rewriteEnv(`NEXT_PUBLIC_WEB_URL="http://localhost:3000"`, WT),
      `NEXT_PUBLIC_WEB_URL="http://localhost:3731"`,
    );
    assert.equal(
      rewriteEnv(`NEXT_PUBLIC_COLLAB_URL="ws://localhost:4000"`, WT),
      `NEXT_PUBLIC_COLLAB_URL="ws://localhost:3733"`,
    );
  });

  it("quotes COLLAB_PORT whether or not it started quoted", () => {
    assert.equal(rewriteEnv(`COLLAB_PORT="4000"`, WT), `COLLAB_PORT="3733"`);
    assert.equal(rewriteEnv(`COLLAB_PORT=4000`, WT), `COLLAB_PORT="3733"`);
  });

  it("points DATABASE_URL at this worktree's database", () => {
    assert.equal(
      rewriteEnv(
        `DATABASE_URL="postgresql://u:p@localhost:5432/scibly-dev"`,
        WT,
      ),
      `DATABASE_URL="postgresql://u:p@localhost:5432/${WT.db}"`,
    );
  });

  it("leaves the Postgres port alone", () => {
    assert.match(
      rewriteEnv(
        `DATABASE_URL="postgresql://u:p@localhost:5432/scibly-dev"`,
        WT,
      ),
      /localhost:5432/,
    );
  });

  it("leaves a commented-out DATABASE_URL alone", () => {
    const line = `# DATABASE_URL='postgresql://u:p@hosted.example.com:5432/postgres'`;
    assert.equal(rewriteEnv(line, WT), line);
  });

  it("FIXED(B7): rewrites loopback hosts other than `localhost`", () => {
    assert.equal(
      rewriteEnv(`NEXT_PUBLIC_APP_URL="http://127.0.0.1:3001"`, WT),
      `NEXT_PUBLIC_APP_URL="http://127.0.0.1:3732"`,
    );
    assert.equal(
      rewriteEnv(`NEXT_PUBLIC_WEB_URL="http://0.0.0.0:3000"`, WT),
      `NEXT_PUBLIC_WEB_URL="http://0.0.0.0:3731"`,
    );
    assert.equal(
      rewriteEnv(`X="http://[::1]:4000"`, WT),
      `X="http://[::1]:3733"`,
    );
  });

  it("FIXED(B7): leaves a longer port that merely shares the prefix", () => {
    assert.equal(
      rewriteEnv(`X="http://localhost:30000/x"`, WT),
      `X="http://localhost:30000/x"`,
    );
  });

  it("FIXED(B8): keeps a trailing comment out of the connection string", () => {
    assert.equal(
      rewriteEnv(
        `DATABASE_URL="postgresql://u:p@localhost:5432/scibly-dev" # main db`,
        WT,
      ),
      `DATABASE_URL="postgresql://u:p@localhost:5432/${WT.db}" # main db`,
    );
  });

  it("handles CRLF — `$` matches before `\\r`, which JS counts as a line terminator", () => {
    assert.equal(
      rewriteEnv(
        `NEXT_PUBLIC_APP_URL="http://localhost:3001"\r\nCOLLAB_PORT="4000"\r\n`,
        WT,
      ),
      `NEXT_PUBLIC_APP_URL="http://localhost:3732"\r\nCOLLAB_PORT="3733"\r\n`,
    );
  });

  it("is idempotent — rewriting its own output changes nothing", () => {
    const once = rewriteEnv(
      `NEXT_PUBLIC_APP_URL="http://localhost:3001"\nCOLLAB_PORT="4000"\nDATABASE_URL="postgresql://u:p@localhost:5432/scibly-dev"\n`,
      WT,
    );
    assert.equal(rewriteEnv(once, WT), once);
  });

  it("FIXED(B7): refuses to return a file that still points at a main port", () => {
    assert.throws(
      () => rewriteEnv(`A="http://LOCALHOST:3001"`, WT),
      /not one this script substitutes/,
    );
  });

  it("no substitution re-matches another's output", () => {
    // The old chained form relied on derived ports never equalling 3000/3001/4000.
    const fake = { ports: { web: 3001, app: 4000, collab: 3000 }, db: "d" };
    assert.equal(
      rewriteEnv(`A="http://localhost:3000" B="http://localhost:3001"`, fake),
      `A="http://localhost:3001" B="http://localhost:4000"`,
    );
  });
});

describe("detachFromSource (B1 — the symlink write-through)", () => {
  const scratch = () => {
    const dir = mkdtempSync(path.join(tmpdir(), "wt-detach-"));
    const main = path.join(dir, "main");
    const wt = path.join(dir, "worktree");
    mkdirSync(main, { recursive: true });
    mkdirSync(wt, { recursive: true });
    writeFileSync(path.join(main, ".env"), 'PORT="3001"\n');
    return {
      main,
      wt,
      cleanup: () => rmSync(dir, { recursive: true, force: true }),
    };
  };

  it("removes a symlink pointing back at the main checkout", () => {
    const { main, wt, cleanup } = scratch();
    try {
      const target = path.join(wt, ".env");
      symlinkSync(path.join(main, ".env"), target);

      assert.equal(
        detachFromSource(target, path.join(main, ".env"), ".env"),
        true,
      );
      assert.equal(existsSync(target), false);

      // The whole point: writing now cannot reach the main checkout.
      writeFileSync(target, 'PORT="3732"\n');
      assert.equal(
        readFileSync(path.join(main, ".env"), "utf8"),
        'PORT="3001"\n',
      );
      assert.equal(readFileSync(target, "utf8"), 'PORT="3732"\n');
    } finally {
      cleanup();
    }
  });

  it("leaves a real file alone", () => {
    const { main, wt, cleanup } = scratch();
    try {
      const target = path.join(wt, ".env");
      writeFileSync(target, 'PORT="3732"\n');
      assert.equal(
        detachFromSource(target, path.join(main, ".env"), ".env"),
        false,
      );
      assert.equal(existsSync(target), true);
    } finally {
      cleanup();
    }
  });

  it("is a no-op when the worktree has no file yet", () => {
    const { main, wt, cleanup } = scratch();
    try {
      const target = path.join(wt, ".env");
      assert.equal(
        detachFromSource(target, path.join(main, ".env"), ".env"),
        false,
      );
      assert.equal(existsSync(target), false);
    } finally {
      cleanup();
    }
  });

  it("refuses a hard link rather than overwriting the source", () => {
    const { main, wt, cleanup } = scratch();
    try {
      const target = path.join(wt, ".env");
      linkSync(path.join(main, ".env"), target);
      assert.throws(
        () => detachFromSource(target, path.join(main, ".env"), ".env"),
        /refusing to overwrite the source/,
      );
      assert.equal(
        readFileSync(path.join(main, ".env"), "utf8"),
        'PORT="3001"\n',
      );
    } finally {
      cleanup();
    }
  });
});
