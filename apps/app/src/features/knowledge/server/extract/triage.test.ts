import type * as Ai from "ai";

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  knowledgeBundle: { findMany: vi.fn(), update: vi.fn() },
  knowledgeTopic: { findMany: vi.fn() },
  organization: { findUniqueOrThrow: vi.fn() },
}));
const ai = vi.hoisted(() => ({ generateText: vi.fn() }));

vi.mock("@scibly/db", () => ({ db, Prisma: { DbNull: "DbNull" } }));
// Partial: `prompts.ts` reads `toSourcePassage` off the notebook barrel, which
// also carries tool definitions built with the real `ai`.
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof Ai>()),
  ...ai,
}));
vi.mock("@/shared/ai/server/models/registry", () => ({
  getLanguageModel: vi
    .fn()
    .mockResolvedValue({ model: "cheap", isByoai: false }),
}));

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

const replies = (verdict: unknown) =>
  ai.generateText.mockResolvedValue({ text: JSON.stringify(verdict) });

const outcomeOf = (bundleId: string) =>
  db.knowledgeBundle.update.mock.calls.find(
    ([call]) => call.where.id === bundleId,
  )?.[0].data;

beforeEach(() => {
  vi.clearAllMocks();
  db.knowledgeBundle.findMany.mockResolvedValue([bundle]);
  db.knowledgeTopic.findMany.mockResolvedValue([topic]);
  db.organization.findUniqueOrThrow.mockResolvedValue({ slug: "acme" });
  db.knowledgeBundle.update.mockResolvedValue({});
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

    // A broken reply, not a verdict: settling would file it off-topic for good.
    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([]);
    expect(db.knowledgeBundle.update).not.toHaveBeenCalled();
  });

  it("drops a topic that does not cover this pull request", async () => {
    // Two bundles, one topic each — so topic 2 is offered to the model (it
    // covers the second bundle) but is no candidate for the first.
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

    // Topic 2 is dropped; the topic whose scope does cover it still stands.
    expect(await triageBundles("org-1", ["bundle-1", "bundle-2"])).toEqual([
      { organizationId: "org-1", bundleId: "bundle-1", topicIds: ["topic-1"] },
    ]);
  });

  it("keeps the maintainer's scope when the model names no topic", async () => {
    // A topic is a bare name to the model. Reading nothing into it is not a
    // verdict, and settling on one would drop the pull request for good.
    replies({ bundles: [{ id: 1, topicIds: [], worth: 80 }] });

    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([
      { organizationId: "org-1", bundleId: "bundle-1", topicIds: ["topic-1"] },
    ]);
    expect(db.knowledgeBundle.update).not.toHaveBeenCalled();
  });

  it("routes a worthwhile bundle to the topic that covers it", async () => {
    replies({
      bundles: [{ id: 1, topicIds: [1], worth: 80 }],
    });

    expect(await triageBundles("org-1", ["bundle-1"])).toEqual([
      { organizationId: "org-1", bundleId: "bundle-1", topicIds: ["topic-1"] },
    ]);
    expect(db.knowledgeBundle.update).not.toHaveBeenCalled();
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
    expect(db.knowledgeBundle.update).not.toHaveBeenCalled();
  });

  it("keeps the whole batch retryable when the reply is unusable", async () => {
    ai.generateText.mockResolvedValue({ text: "sorry, no" });

    await expect(triageBundles("org-1", ["bundle-1"])).rejects.toThrow();
    expect(db.knowledgeBundle.update).not.toHaveBeenCalled();
  });
});
