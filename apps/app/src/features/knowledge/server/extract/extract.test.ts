import type * as Ai from "ai";

import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  knowledgeBundle: { findFirst: vi.fn(), updateMany: vi.fn() },
  knowledgeTopic: { findMany: vi.fn() },
  knowledgeInsight: { createMany: vi.fn(), deleteMany: vi.fn() },
  organization: { findUniqueOrThrow: vi.fn() },
  $transaction: vi.fn(),
}));
const ai = vi.hoisted(() => ({ generateText: vi.fn() }));
const organizations = vi.hoisted(() => ({ meteredGenerateText: vi.fn() }));

vi.mock("@scibly/db", () => ({ db, Prisma: { DbNull: "DbNull" } }));
// Partial: the notebook barrel the prompts import builds real `ai` tools.
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof Ai>()),
  ...ai,
}));
// The metering wrapper is tested on its own; doubled here to isolate the reply handling.
vi.mock("@/features/organizations/server", () => ({
  assertNotTruncated: () => undefined,
  ...organizations,
}));

const { extractInsights } = await import("./extract");

const PR = "https://github.com/acme/api/pull/7";
const COMMENT = "https://github.com/acme/api/pull/7#discussion_r1";

const content = {
  title: "Per-account locks",
  body: "Why we did it this way.",
  url: PR,
  labels: [],
  filePaths: ["src/scheduler.ts"],
  linkedIssues: [{ number: 3, title: "Lock contention", url: "https://x/i/3" }],
  comments: [
    {
      author: "ada",
      body: "Global lock stalls everyone.",
      url: COMMENT,
      diffHunk: null,
    },
  ],
  threads: [],
};

const request = {
  organizationId: "org-1",
  bundleId: "bundle-1",
  topicIds: ["topic-1"],
};

const replies = (insights: unknown[]) =>
  ai.generateText.mockResolvedValue({ text: JSON.stringify({ insights }) });

const insight = (
  over: Partial<{
    topicId: number;
    claim: string;
    citations: { url: string; label: string }[];
    confidence: number;
  }> = {},
) => ({
  topicId: 1,
  claim: "The scheduler locks per account, not globally.",
  citations: [{ url: COMMENT, label: "the argument" }],
  confidence: 90,
  ...over,
});

const stored = () => db.knowledgeInsight.createMany.mock.calls[0]?.[0].data;
const settled = () => db.knowledgeBundle.updateMany.mock.calls[0]?.[0].data;

beforeEach(() => {
  vi.clearAllMocks();
  db.knowledgeBundle.findFirst.mockResolvedValue({ id: "bundle-1", content });
  db.knowledgeTopic.findMany.mockResolvedValue([
    { id: "topic-1", name: "Scheduler", repositories: [] },
  ]);
  db.organization.findUniqueOrThrow.mockResolvedValue({ slug: "acme" });
  db.knowledgeBundle.updateMany.mockResolvedValue({ count: 1 });
  db.$transaction.mockResolvedValue([]);
  organizations.meteredGenerateText.mockImplementation(
    async (
      _spend: unknown,
      options: { prompt: string; maxOutputTokens?: number },
      read?: (reply: { text: string }) => unknown,
    ) => {
      const reply = await ai.generateText({ model: "capable", ...options });
      return read ? read(reply) : reply.text;
    },
  );
});

describe("a claim may only cite what the bundle contains", () => {
  it("keeps a citation the conversation actually holds", async () => {
    replies([insight()]);

    expect(await extractInsights(request)).toEqual({ insights: 1 });
    expect(stored()).toEqual([
      expect.objectContaining({
        topicId: "topic-1",
        confidence: 90,
        citations: [{ url: COMMENT, label: "the argument" }],
      }),
    ]);
    expect(settled()).toMatchObject({
      outcome: "EXTRACTED",
      content: "DbNull",
    });
  });

  it("drops a claim whose only citation was invented", async () => {
    replies([
      insight({ citations: [{ url: "https://evil/pr/1", label: "x" }] }),
    ]);

    expect(await extractInsights(request)).toEqual({ insights: 0 });
    expect(db.knowledgeInsight.createMany).not.toHaveBeenCalled();
    expect(settled()).toMatchObject({ outcome: "NO_INSIGHTS" });
  });

  it("does not let a linked issue stand in for the discussion", async () => {
    replies([
      insight({ citations: [{ url: "https://x/i/3", label: "issue" }] }),
    ]);

    expect(await extractInsights(request)).toEqual({ insights: 0 });
  });
});

describe("confidence and topic are both floors, not hints", () => {
  it("drops a claim below the floor without surfacing it", async () => {
    replies([insight({ confidence: 10 })]);

    expect(await extractInsights(request)).toEqual({ insights: 0 });
    expect(db.knowledgeInsight.createMany).not.toHaveBeenCalled();
  });

  it("drops a claim filed against a topic that was not offered", async () => {
    replies([insight({ topicId: 7 })]);

    expect(await extractInsights(request)).toEqual({ insights: 0 });
  });
});

describe("every extraction is metered", () => {
  it("bills the reading to the organization whose pull request it was", async () => {
    replies([insight()]);

    await extractInsights(request);

    expect(organizations.meteredGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        action: "KNOWLEDGE_EXTRACT",
        orgSlug: "acme",
      }),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it("records an org out of credits without pruning what it could not read", async () => {
    organizations.meteredGenerateText.mockRejectedValue(
      new AppError({
        code: "PAYMENT_REQUIRED",
        applicationCode: "entitlement.credits_exhausted",
        message: "no credits",
      }),
    );

    expect(await extractInsights(request)).toEqual({ insights: 0 });
    expect(settled()).toEqual({ outcome: "UNFUNDED", failureReason: null });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("lets any other failure through so Inngest retries it", async () => {
    organizations.meteredGenerateText.mockRejectedValue(
      new Error("gateway down"),
    );

    await expect(extractInsights(request)).rejects.toThrow("gateway down");
    expect(db.knowledgeBundle.updateMany).not.toHaveBeenCalled();
  });
});

describe("an unreadable reply is a failure, not an outcome", () => {
  it("throws rather than pruning the conversation it could not parse", async () => {
    ai.generateText.mockResolvedValue({ text: "I'm afraid I can't do that." });

    await expect(extractInsights(request)).rejects.toThrow(/usable JSON/);
    expect(db.knowledgeBundle.updateMany).not.toHaveBeenCalled();
  });
});

describe("a re-collected pull request replaces its own claims", () => {
  it("clears the previous round before filing the new one", async () => {
    replies([insight()]);

    await extractInsights(request);

    expect(db.knowledgeInsight.deleteMany).toHaveBeenCalledWith({
      where: { bundleId: "bundle-1" },
    });
  });
});

describe("a bundle already settled has nothing left to read", () => {
  it("does no work and spends nothing", async () => {
    db.knowledgeBundle.findFirst.mockResolvedValue(null);

    expect(await extractInsights(request)).toEqual({ insights: 0 });
    expect(organizations.meteredGenerateText).not.toHaveBeenCalled();
  });
});
