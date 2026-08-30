import type { PullRequestDetail } from "@/features/integrations/server";

import { describe, expect, it } from "vitest";

import { estimateTokens } from "@/shared/ai/token-estimate";

import { buildBundleContent, BUNDLE_LIMITS } from "./bundle";

const MERGED = new Date("2026-08-02T00:00:00Z");

const comment = (body: string) => ({
  author: "ada",
  body,
  url: "https://github.com/acme/api/pull/7#discussion",
  diffHunk: null,
});

const detail = (over: Partial<PullRequestDetail>): PullRequestDetail => ({
  externalId: "PR_1",
  number: 7,
  title: "Give the scheduler a per-account lock",
  body: "",
  url: "https://github.com/acme/api/pull/7",
  labels: ["design"],
  filePaths: ["src/scheduler.ts"],
  filesTruncated: false,
  linkedIssues: [],
  comments: [],
  threads: [],
  mergedAt: MERGED,
  updatedAt: MERGED,
  ...over,
});

const tokensOf = (content: unknown) => estimateTokens(JSON.stringify(content));

describe("a bundle is capped at the size it claims", () => {
  it("leaves a pull request that already fits alone", () => {
    const { content, truncated } = buildBundleContent(
      detail({
        body: "Why a global lock is the wrong shape here.",
        comments: [comment("Agreed, per-account is the boundary.")],
      }),
    );

    expect(truncated).toBe(false);
    expect(content.body).toBe("Why a global lock is the wrong shape here.");
    expect(content.comments).toHaveLength(1);
  });

  it("cuts a description that would blow the cap on its own", () => {
    const { content, truncated } = buildBundleContent(
      detail({ body: "a".repeat(65_000) }),
    );

    expect(tokensOf(content)).toBeLessThanOrEqual(BUNDLE_LIMITS.maxTokens);
    expect(truncated).toBe(true);
    expect(content.body.endsWith("…")).toBe(true);
  });

  it("drops comments once the description alone is not enough", () => {
    const { content, truncated } = buildBundleContent(
      detail({
        comments: Array.from({ length: 40 }, () => comment("b".repeat(2_000))),
      }),
    );

    expect(tokensOf(content)).toBeLessThanOrEqual(BUNDLE_LIMITS.maxTokens);
    expect(truncated).toBe(true);
    expect(content.comments.length).toBeLessThan(40);
  });

  it("spends the shallow threads before the deep one", () => {
    const deep = {
      path: "src/scheduler.ts",
      isResolved: false,
      comments: Array.from({ length: 6 }, () => comment("c".repeat(400))),
    };
    const shallow = Array.from({ length: 20 }, () => ({
      path: "src/queue.ts",
      isResolved: true,
      comments: [comment("d".repeat(2_000))],
    }));

    const { content } = buildBundleContent(
      detail({ threads: [...shallow, deep] }),
    );

    expect(tokensOf(content)).toBeLessThanOrEqual(BUNDLE_LIMITS.maxTokens);
    expect(content.threads.length).toBeLessThan(shallow.length);
    expect(content.threads.some((thread) => thread.comments.length === 6)).toBe(
      true,
    );
  });
});
