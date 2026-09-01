import type * as Ai from "ai";

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  knowledgeBundle: { findMany: vi.fn(), updateMany: vi.fn() },
  knowledgeTopic: { findMany: vi.fn() },
  organization: { findUniqueOrThrow: vi.fn() },
}));
const ai = vi.hoisted(() => ({ generateText: vi.fn() }));

vi.mock("@scibly/db", () => ({ db, Prisma: { DbNull: "DbNull" } }));
// Partial: the notebook barrel the prompts import builds real `ai` tools.
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof Ai>()),
  ...ai,
}));
vi.mock("@/shared/ai/server/models/registry", () => ({
  getLanguageModel: vi
    .fn()
    .mockResolvedValue({ model: "cheap", isByoai: false }),
}));
// The metering wrapper is tested on its own; doubled here to isolate the reply handling.
vi.mock("@/features/organizations/server", async () => {
  const { generateText } = await import("ai");
  return {
    assertNotTruncated: () => undefined,
    meteredGenerateText: async (
      _spend: unknown,
      options: { prompt: string; maxOutputTokens?: number },
      read?: (reply: { text: string }) => unknown,
    ) => {
      const reply = await generateText({ model: "cheap", ...options } as never);
      return read ? read(reply) : reply.text;
    },
  };
});

const { triageBundles } = await import("./triage");

const content = (title: string) => ({
  title,
  body: "Why we did it this way.",
  url: "https://github.com/acme/api/pull/7",
  labels: [],
  filePaths: ["src/scheduler.ts"],
  linkedIssues: [],
  comments: [],
  threads: [],
});

const bundle = {
  id: "bundle-1",
  repositoryId: "42",
  filePaths: ["src/scheduler.ts"],
  content: content("Per-account locks"),
};

const topic = {
  id: "topic-1",
  name: "Scheduler",
  repositories: [{ id: "42", fullName: "acme/api", pathGlobs: ["src/**"] }],
};

const replies = (reply: unknown) =>
  ai.generateText.mockResolvedValue({ text: JSON.stringify(reply) });

const outcomeOf = (bundleId: string) =>
  db.knowledgeBundle.updateMany.mock.calls.find(([call]) =>
    call.where.id.in.includes(bundleId),
  )?.[0].data;

beforeEach(() => {
  vi.clearAllMocks();
  db.knowledgeBundle.findMany.mockResolvedValue([bundle]);
  db.knowledgeTopic.findMany.mockResolvedValue([topic]);
  db.organization.findUniqueOrThrow.mockResolvedValue({ slug: "acme" });
  db.knowledgeBundle.updateMany.mockResolvedValue({ count: 1 });
});

describe("structural narrowing happens before the model is asked", () => {
  it("settles a bundle no topic's globs cover without spending a call", async () => {
    db.knowledgeBundle.findMany.mockResolvedValue([
      { ...bundle, filePaths: ["docs/readme.md"] },
    ]);

    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([]);
    expect(ai.generateText).not.toHaveBeenCalled();
    expect(outcomeOf("bundle-1")).toMatchObject({
      outcome: "OFF_TOPIC",
      content: "DbNull",
    });
    expect(outcomeOf("bundle-1").processedAt).toBeInstanceOf(Date);
  });
});

describe("the model answers in positions, never in ids", () => {
  it("asks with numbers, so there is no cuid to miscopy", async () => {
    replies({ bundles: [{ id: 1, topicIds: [1], worth: 80 }] });

    await triageBundles("org-1", ["bundle-1"]);

    const { prompt } = ai.generateText.mock.calls[0]![0];
    expect(prompt).toContain('<topic id="1"');
    expect(prompt).toContain('<pull-request id="1"');
    expect(prompt).not.toContain("topic-1");
    expect(prompt).not.toContain("bundle-1");
  });

  it("leaves a bundle alone when the model names a number nobody offered", async () => {
    replies({ bundles: [{ id: 1, topicIds: [7], worth: 95 }] });

    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([]);
    expect(db.knowledgeBundle.updateMany).not.toHaveBeenCalled();
  });

  it("drops a topic that does not cover this pull request", async () => {
    db.knowledgeBundle.findMany.mockResolvedValue([
      bundle,
      { ...bundle, id: "bundle-2", repositoryId: "43" },
    ]);
    db.knowledgeTopic.findMany.mockResolvedValue([
      topic,
      {
        ...topic,
        id: "topic-2",
        repositories: [
          { id: "43", fullName: "acme/web", pathGlobs: ["src/**"] },
        ],
      },
    ]);
    replies({ bundles: [{ id: 1, topicIds: [2], worth: 95 }] });

    expect(await triageBundles("org-1", ["bundle-1", "bundle-2"])).toEqual([
      { organizationId: "org-1", bundleId: "bundle-1", topicIds: ["topic-1"] },
    ]);
  });

  it("keeps the maintainer's scope when the model names no topic", async () => {
    replies({ bundles: [{ id: 1, topicIds: [], worth: 80 }] });

    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([
      { organizationId: "org-1", bundleId: "bundle-1", topicIds: ["topic-1"] },
    ]);
    expect(db.knowledgeBundle.updateMany).not.toHaveBeenCalled();
  });

  it("routes a worthwhile bundle to the topic that covers it", async () => {
    replies({
      bundles: [{ id: 1, topicIds: [1], worth: 80 }],
    });

    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([
      { organizationId: "org-1", bundleId: "bundle-1", topicIds: ["topic-1"] },
    ]);
    expect(db.knowledgeBundle.updateMany).not.toHaveBeenCalled();
  });
});

describe("weak results are dropped quietly", () => {
  it("settles below the worthiness threshold and prunes the content", async () => {
    replies({
      bundles: [{ id: 1, topicIds: [1], worth: 20 }],
    });

    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([]);
    expect(outcomeOf("bundle-1")).toMatchObject({
      outcome: "LOW_VALUE",
      content: "DbNull",
    });
  });

  it("leaves a bundle the model forgot for the nightly sweep", async () => {
    replies({ bundles: [] });

    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([]);
    expect(db.knowledgeBundle.updateMany).not.toHaveBeenCalled();
  });

  it("keeps the whole batch retryable when the reply is unusable", async () => {
    ai.generateText.mockResolvedValue({ text: "sorry, no" });

    await expect(triageBundles("org-1", ["bundle-1"])).rejects.toThrow();
    expect(db.knowledgeBundle.updateMany).not.toHaveBeenCalled();
  });
});
