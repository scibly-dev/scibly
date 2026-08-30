// @vitest-environment node
/**
 * End-to-end against the real dev Postgres; only GitHub's network boundary is doubled.
 *   E2E_DATABASE_URL=postgres://… pnpm vitest run src/features/knowledge/server/collect/e2e-live-db.test.ts
 */
const live = process.env.E2E_DATABASE_URL;
if (live) process.env.DATABASE_URL = live;

import type {
  PullRequestDetail,
  PullRequestSummary,
} from "@/features/integrations/server";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const github = vi.hoisted(() => ({
  resolveRepositoryConnection: vi.fn(),
  listMergedPullRequests: vi.fn(),
  fetchPullRequestDetail: vi.fn(),
}));
vi.mock("@/features/integrations/server", () => github);

const { db } = await import("@scibly/db");
const { collectRepository, recordFailedCollection } =
  await import("./collect-run");
const { KNOWLEDGE_COLLECT_EVENT, requestCollections, requestDueCollections } =
  await import("./collection-sync");
const { parseStoredRepositories } = await import("../topic-repositories");

const ORG = "org_dummy_dev_id";
const REPO = "e2e-collect-repo";
const FULL_NAME = "acme/api";

// Fixtures must be newer than the watermark the first run plants; `base` is
// reassigned to it there.
let base = new Date();
const at = (minutes: number) => new Date(base.getTime() + minutes * 60_000);

const summary = (
  over: Partial<PullRequestSummary> = {},
): PullRequestSummary => ({
  externalId: "PR_rich",
  number: 7,
  title: "Give the scheduler a per-account lock",
  authorLogin: "ada",
  authorType: "User",
  labels: ["design"],
  commentCount: 6,
  updatedAt: at(1),
  mergedAt: at(0),
  url: "https://github.com/acme/api/pull/7",
  ...over,
});

const comment = (body: string) => ({
  author: "ada",
  body,
  url: "https://github.com/acme/api/pull/7#c",
  diffHunk: "@@ -1,3 +1,4 @@\n-old\n+new",
});

const richDetail = (
  over: Partial<PullRequestDetail> = {},
): PullRequestDetail => ({
  externalId: "PR_rich",
  number: 7,
  title: "Give the scheduler a per-account lock",
  body: "A global lock serialises every account behind the slowest one. ".repeat(
    12,
  ),
  url: "https://github.com/acme/api/pull/7",
  labels: ["design"],
  filePaths: ["src/scheduler.ts", "src/queue.ts"],
  filesTruncated: false,
  linkedIssues: [
    { number: 3, title: "Scheduler stalls", url: "https://x/3" },
    { number: 4, title: "Lock contention", url: "https://x/4" },
  ],
  comments: [comment("Why not a global lock? ".repeat(20))],
  threads: [
    {
      path: "src/scheduler.ts",
      isResolved: false,
      comments: [
        comment("Does this hold across restarts? ".repeat(15)),
        comment("It does — the lease is in Postgres. ".repeat(15)),
      ],
    },
    {
      path: "src/queue.ts",
      isResolved: true,
      comments: [comment("Nit: rename."), comment("Done.")],
    },
  ],
  mergedAt: at(0),
  updatedAt: at(1),
  ...over,
});

const wipe = () =>
  Promise.all([
    db.knowledgeBundle.deleteMany({
      where: { organizationId: ORG, repositoryId: REPO },
    }),
    db.knowledgeCollectionRun.deleteMany({
      where: { organizationId: ORG, repositoryId: REPO },
    }),
  ]);

const newRun = async () =>
  (
    await db.knowledgeCollectionRun.create({
      data: { organizationId: ORG, repositoryId: REPO },
      select: { id: true },
    })
  ).id;

const run = async (runId: string) =>
  collectRepository({ runId, organizationId: ORG, repositoryId: REPO });

const runRow = (id: string) =>
  db.knowledgeCollectionRun.findUniqueOrThrow({ where: { id } });

beforeAll(async () => {
  const organization = await db.organization.findUnique({
    where: { id: ORG },
    select: { id: true },
  });
  if (!organization) throw new Error(`Dev fixture org ${ORG} is missing.`);
  await wipe();
  github.resolveRepositoryConnection.mockResolvedValue({
    token: "ghs_double",
    provider: {
      resolveGrant: vi.fn().mockResolvedValue({ id: REPO, name: FULL_NAME }),
    },
  });
});

afterAll(async () => {
  await wipe();
  await db.$disconnect();
});

describe.runIf(live)("a repository collected against the real database", () => {
  it("plants the watermark on the first run and asks GitHub for nothing", async () => {
    const id = await newRun();

    expect(await run(id)).toEqual({
      collected: 0,
      discarded: 0,
      capped: false,
    });
    expect(github.listMergedPullRequests).not.toHaveBeenCalled();

    const row = await runRow(id);
    expect(row.status).toBe("SUCCEEDED");
    expect(row.collectedThrough).toBeInstanceOf(Date);
    base = row.collectedThrough!;
  });

  it("keeps what was argued over and refuses the rest", async () => {
    github.listMergedPullRequests.mockResolvedValue({
      // Newest first, the way GitHub answers — the collector reverses it.
      pullRequests: [
        summary({
          externalId: "PR_quiet",
          number: 9,
          title: "Fix off-by-one in the cursor",
          commentCount: 0,
          updatedAt: at(3),
        }),
        summary({
          externalId: "PR_bot",
          number: 8,
          authorLogin: "dependabot[bot]",
          authorType: "Bot",
          title: "Bump lodash from 4.17.20 to 4.17.21",
          updatedAt: at(2),
        }),
        summary(),
      ],
      nextCursor: null,
    });
    github.fetchPullRequestDetail.mockResolvedValue(richDetail());

    const id = await newRun();
    expect(await run(id)).toEqual({
      collected: 1,
      discarded: 2,
      capped: false,
    });

    expect(github.fetchPullRequestDetail).toHaveBeenCalledTimes(1);

    const bundles = await db.knowledgeBundle.findMany({
      where: { organizationId: ORG, repositoryId: REPO },
      orderBy: { number: "asc" },
    });
    expect(bundles.map((b) => [b.number, b.discardReason])).toEqual([
      [7, null],
      [8, "BOT_AUTHOR"],
      [9, "NO_DISCUSSION"],
    ]);

    const kept = bundles[0]!;
    expect(kept.content).not.toBeNull();
    expect(kept.mergedAt).toBeInstanceOf(Date);
    expect(kept.score).toBeGreaterThanOrEqual(30);
    const content = kept.content as {
      threads: { comments: { diffHunk: string | null }[] }[];
    };
    expect(content.threads[0]!.comments[0]!.diffHunk).toContain("@@");
    expect(JSON.stringify(kept.content).length / 4).toBeLessThanOrEqual(6_000);

    // Discarded rows must hold SQL NULL, not JSON null.
    const nulls = await db.$queryRawUnsafe<{ n: bigint }[]>(
      `select count(*) as n from knowledge_bundle
       where "organizationId" = $1 and "repositoryId" = $2 and content is null`,
      ORG,
      REPO,
    );
    expect(Number(nulls[0]!.n)).toBe(2);

    const row = await runRow(id);
    expect(row.status).toBe("SUCCEEDED");
    expect(row.collected).toBe(1);
    expect(row.discarded).toBe(2);
    expect(row.collectedThrough).toEqual(at(3));
  });

  it("is a no-op when the same pull requests come back unchanged", async () => {
    github.fetchPullRequestDetail.mockClear();
    const before = await db.knowledgeBundle.findMany({
      where: { organizationId: ORG, repositoryId: REPO },
      select: { externalId: true, githubUpdatedAt: true, collectedAt: true },
      orderBy: { number: "asc" },
    });

    const id = await newRun();
    expect(await run(id)).toEqual({
      collected: 0,
      discarded: 0,
      capped: false,
    });
    expect(github.fetchPullRequestDetail).not.toHaveBeenCalled();

    const after = await db.knowledgeBundle.findMany({
      where: { organizationId: ORG, repositoryId: REPO },
      select: { externalId: true, githubUpdatedAt: true, collectedAt: true },
      orderBy: { number: "asc" },
    });
    expect(after).toEqual(before);
  });

  it("collects again once the discussion has actually moved", async () => {
    const moved = at(10);
    github.listMergedPullRequests.mockResolvedValue({
      pullRequests: [summary({ commentCount: 9, updatedAt: moved })],
      nextCursor: null,
    });
    github.fetchPullRequestDetail.mockResolvedValue(
      richDetail({
        updatedAt: moved,
        comments: [
          comment("Why not a global lock? ".repeat(20)),
          comment("Because the lease has to be per account. ".repeat(20)),
        ],
      }),
    );
    const before = await db.knowledgeBundle.findUniqueOrThrow({
      where: {
        organizationId_repositoryId_externalId: {
          organizationId: ORG,
          repositoryId: REPO,
          externalId: "PR_rich",
        },
      },
    });

    const id = await newRun();
    expect(await run(id)).toEqual({
      collected: 1,
      discarded: 0,
      capped: false,
    });

    const after = await db.knowledgeBundle.findUniqueOrThrow({
      where: { id: before.id },
    });
    expect(after.content).not.toEqual(before.content);
    expect(after.githubUpdatedAt).toEqual(moved);
    expect(
      await db.knowledgeBundle.count({
        where: { organizationId: ORG, repositoryId: REPO },
      }),
    ).toBe(3);
  });

  it("cuts an oversized pull request down and says so on the row", async () => {
    const huge = at(20);
    github.listMergedPullRequests.mockResolvedValue({
      pullRequests: [
        summary({ externalId: "PR_huge", number: 11, updatedAt: huge }),
      ],
      nextCursor: null,
    });
    github.fetchPullRequestDetail.mockResolvedValue(
      richDetail({
        externalId: "PR_huge",
        number: 11,
        updatedAt: huge,
        body: "x".repeat(80_000),
      }),
    );

    const id = await newRun();
    expect((await run(id)).collected).toBe(1);

    const row = await db.knowledgeBundle.findUniqueOrThrow({
      where: {
        organizationId_repositoryId_externalId: {
          organizationId: ORG,
          repositoryId: REPO,
          externalId: "PR_huge",
        },
      },
    });
    expect(row.truncated).toBe(true);
    expect(JSON.stringify(row.content).length / 4).toBeLessThanOrEqual(6_000);
  });

  it("leaves the watermark alone when the run fails", async () => {
    const before = await db.knowledgeCollectionRun.findFirstOrThrow({
      where: { organizationId: ORG, repositoryId: REPO, status: "SUCCEEDED" },
      orderBy: { collectedThrough: "desc" },
    });
    github.listMergedPullRequests.mockRejectedValue(
      new Error("GitHub said 502"),
    );

    const id = await newRun();
    await expect(run(id)).rejects.toThrow("GitHub said 502");
    await recordFailedCollection(id, new Error("GitHub said 502"));

    const failed = await runRow(id);
    expect(failed.status).toBe("FAILED");
    expect(failed.failureReason).toBe("GitHub said 502");
    expect(failed.collectedThrough).toBeNull();

    const watermark = await db.knowledgeCollectionRun.findFirstOrThrow({
      where: { organizationId: ORG, repositoryId: REPO, status: "SUCCEEDED" },
      orderBy: { collectedThrough: "desc" },
    });
    expect(watermark.collectedThrough).toEqual(before.collectedThrough);
  });
});

describe.runIf(live)("queueing a collection", () => {
  it("reuses the run already waiting rather than piling them up", async () => {
    const sent: { data: { runId: string } }[] = [];
    const record = async (events: { data: { runId: string } }[]) => {
      sent.push(...events);
    };

    await requestCollections([[ORG, REPO]], record);
    await requestCollections([[ORG, REPO]], record);

    expect(sent[1]!.data.runId).toBe(sent[0]!.data.runId);
    expect(
      await db.knowledgeCollectionRun.count({
        where: { organizationId: ORG, repositoryId: REPO, status: "QUEUED" },
      }),
    ).toBe(1);
  });

  it("fails the run it could not hand off", async () => {
    const sent: { data: { runId: string } }[] = [];

    await expect(
      requestCollections([[ORG, REPO]], async (events) => {
        sent.push(...events);
        throw new Error("Inngest unreachable");
      }),
    ).rejects.toThrow("Inngest unreachable");

    const row = await runRow(sent[0]!.data.runId);
    expect(row.status).toBe("FAILED");
    expect(row.failureReason).toBe("Inngest unreachable");
  });
});

describe.runIf(live)("the nightly fan-out", () => {
  it("asks for every repository a topic watches, once each", async () => {
    const topics = await db.knowledgeTopic.findMany({
      select: { organizationId: true, repositories: true },
    });
    const expected = new Set(
      topics.flatMap((topic) =>
        parseStoredRepositories(topic.repositories).map(
          ({ id }) => `${topic.organizationId}:${id}`,
        ),
      ),
    );

    const sent: { name: string; data: { runId: string } }[] = [];
    const { requested } = await requestDueCollections(async (_id, events) => {
      sent.push(...events);
    });

    try {
      expect(requested).toBe(sent.length);
      expect(sent.every((e) => e.name === KNOWLEDGE_COLLECT_EVENT)).toBe(true);
      const queued = await db.knowledgeCollectionRun.findMany({
        where: { id: { in: sent.map((e) => e.data.runId) } },
        select: { organizationId: true, repositoryId: true, status: true },
      });
      expect(queued).toHaveLength(sent.length);
      expect(queued.every((run) => run.status === "QUEUED")).toBe(true);
      const asked = queued.map((r) => `${r.organizationId}:${r.repositoryId}`);
      expect(new Set(asked).size).toBe(asked.length);
      // A subset, not equality: a lapsed organization keeps its topics and is skipped.
      expect(asked.every((key) => expected.has(key))).toBe(true);
    } finally {
      await db.knowledgeCollectionRun.deleteMany({
        where: { id: { in: sent.map((e) => e.data.runId) } },
      });
    }
  });
});
