import type {
  PullRequestDetail,
  PullRequestSummary,
} from "@/features/integrations/server";

import { describe, expect, it } from "vitest";

import {
  isDenseEnough,
  rejectFromSummary,
  scoreDiscussionDensity,
} from "./structural-filter";

const summary = (
  overrides: Partial<PullRequestSummary> = {},
): PullRequestSummary => ({
  externalId: "PR_1",
  number: 1,
  title: "Give the scheduler a per-account lock",
  authorLogin: "ada",
  authorType: "User",
  labels: [],
  commentCount: 6,
  updatedAt: new Date("2026-08-01T00:00:00Z"),
  mergedAt: new Date("2026-08-01T00:00:00Z"),
  url: "https://github.com/acme/api/pull/1",
  ...overrides,
});

const comment = (body: string) => ({
  author: "ada",
  body,
  url: "https://github.com/acme/api/pull/1#c1",
  diffHunk: null,
});

const detail = (
  overrides: Partial<PullRequestDetail> = {},
): PullRequestDetail => ({
  externalId: "PR_1",
  number: 1,
  title: "Give the scheduler a per-account lock",
  body: "",
  url: "https://github.com/acme/api/pull/1",
  labels: [],
  filePaths: ["src/scheduler.ts"],
  filesTruncated: false,
  linkedIssues: [],
  comments: [],
  threads: [],
  mergedAt: new Date("2026-08-01T00:00:00Z"),
  updatedAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

describe("what the listing alone is enough to refuse", () => {
  it("drops a bot by its type, whatever it called itself", () => {
    expect(
      rejectFromSummary(
        summary({ authorType: "Bot", authorLogin: "renovate" }),
      ),
    ).toBe("BOT_AUTHOR");
  });

  it("drops a bot by the login suffix, when the type is missing", () => {
    expect(
      rejectFromSummary(
        summary({ authorType: null, authorLogin: "dependabot[bot]" }),
      ),
    ).toBe("BOT_AUTHOR");
  });

  it("drops a pull request nobody said anything about", () => {
    expect(rejectFromSummary(summary({ commentCount: 1 }))).toBe(
      "NO_DISCUSSION",
    );
  });

  it("drops a dependency bump", () => {
    expect(
      rejectFromSummary(
        summary({ title: "Bump zod from 3.23.8 to 4.0.1", commentCount: 3 }),
      ),
    ).toBe("CHORE_TITLE");
  });

  it("drops a typo fix", () => {
    expect(
      rejectFromSummary(
        summary({ title: "Fix typo in README", commentCount: 2 }),
      ),
    ).toBe("CHORE_TITLE");
  });

  it("keeps a chore that turned into a real argument", () => {
    expect(
      rejectFromSummary(
        summary({ title: "chore: drop the legacy poller", commentCount: 9 }),
      ),
    ).toBeNull();
  });

  it("keeps a discussed change", () => {
    expect(rejectFromSummary(summary())).toBeNull();
  });
});

describe("how much was argued", () => {
  it("keeps a pull request with a real description and deep threads", () => {
    const score = scoreDiscussionDensity(
      detail({
        body: "x".repeat(500),
        labels: ["design"],
        threads: [
          {
            path: "src/scheduler.ts",
            isResolved: true,
            comments: [
              comment("Why a global lock rather than one per account?"),
              comment("y".repeat(400)),
            ],
          },
          {
            path: "src/scheduler.ts",
            isResolved: false,
            comments: [
              comment("Same question for the retry path?"),
              comment("Agreed."),
            ],
          },
        ],
      }),
    );
    expect(isDenseEnough(score)).toBe(true);
  });

  it("refuses a pull request whose comments are all one-liners", () => {
    const score = scoreDiscussionDensity(
      detail({
        body: "Fixes the flake.",
        comments: [comment("LGTM"), comment("ship it")],
      }),
    );
    expect(isDenseEnough(score)).toBe(false);
  });
});
