import { matchesGlob } from "path";
import { describe, expect, it } from "vitest";

import { globPrefix, touchesScope } from "./topic-repositories";

const GLOBS = [
  "src/scheduler/**",
  "docs/**/*.md",
  "packages/api/src/entitlement/*.ts",
  "src/**/{a,b}/*.ts",
  "apps/app/src/features/knowledge/server/topic-feed.ts",
  "**/*.sql",
  "!vendor/**",
  "src/?(a|b)/x.ts",
];

const PATHS = [
  "src/scheduler/lock.ts",
  "src/scheduler.ts",
  "docs/adr/0001-locks.md",
  "docs/readme.md",
  "packages/api/src/entitlement/policy.ts",
  "packages/api/src/entitlement/policies/plan-feature.ts",
  "src/x/a/y.ts",
  "apps/app/src/features/knowledge/server/topic-feed.ts",
  "packages/db/migrations/1/migration.sql",
  "vendor/lib.js",
  "src/a/x.ts",
  "README.md",
];

describe("the prefix the database filters on can never hide a match", () => {
  // A prefix that excluded a path the glob accepts would silently empty a feed.
  it.each(GLOBS)("%s keeps every path it matches", (glob) => {
    const prefix = globPrefix(glob);
    for (const path of PATHS) {
      if (!matchesGlob(path, glob)) continue;
      expect(path.startsWith(prefix)).toBe(true);
    }
  });

  it("narrows to nothing when the glob opens with a metacharacter", () => {
    expect(globPrefix("**/*.sql")).toBe("");
    expect(globPrefix("!vendor/**")).toBe("");
  });

  it("keeps a glob with no metacharacters whole", () => {
    expect(globPrefix("docs/adr/0001-locks.md")).toBe("docs/adr/0001-locks.md");
  });

  it("cuts at the first metacharacter, not the last", () => {
    expect(globPrefix("src/**/{a,b}/*.ts")).toBe("src/");
  });
});

describe("a topic with no globs watches the whole repository", () => {
  it("matches a bundle that touched nothing in particular", () => {
    expect(touchesScope([], [])).toBe(true);
  });

  it("needs one file in scope, not all of them", () => {
    expect(touchesScope(["README.md", "src/scheduler/lock.ts"], GLOBS)).toBe(
      true,
    );
    expect(touchesScope(["README.md"], ["src/scheduler/**"])).toBe(false);
  });
});
