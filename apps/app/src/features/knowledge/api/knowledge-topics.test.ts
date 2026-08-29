import { beforeEach, describe, expect, it, vi } from "vitest";

// Real tRPC caller over the real router, so the schema and the gate both run for
// real; only the database, the org lookup and the GitHub connection are doubled.
const db = vi.hoisted(() => ({
  knowledgeTopic: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  member: { findMany: vi.fn() },
  organizationSubscription: { findUnique: vi.fn() },
}));
const resolveOrg = vi.hoisted(() => vi.fn());
const resolveConnection = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => ({ resolveOrg }));
vi.mock("@/features/integrations/server", () => ({ resolveConnection }));

const { createCallerFactory } = await import("@scibly/api/trpc");
const { db: prisma } = await import("@scibly/db");
const { knowledgeRouter } = await import("./knowledge.router");

const ORG_ID = "org-1";
const ORG_SLUG = "acme";
const USER_ID = "user-1";

const createCaller = createCallerFactory(knowledgeRouter);

function caller() {
  const now = new Date("2026-01-01T00:00:00Z");
  return createCaller({
    db: prisma,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    actor: { userId: USER_ID },
    session: {
      session: {
        id: "sess-1",
        createdAt: now,
        updatedAt: now,
        userId: USER_ID,
        expiresAt: new Date("2026-12-31T00:00:00Z"),
        token: "token",
      },
      user: {
        id: USER_ID,
        name: "Owner",
        email: "owner@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
}

function onPlan(plan: string, status = "ACTIVE") {
  db.organizationSubscription.findUnique.mockResolvedValue({
    plan,
    status,
    purchasedLearnerSeats: 0,
  });
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    const thrown = error as {
      code?: string;
      message: string;
      cause?: { applicationCode?: string };
    };
    return {
      code: thrown.code,
      message: thrown.message,
      applicationCode: thrown.cause?.applicationCode,
    };
  }
  throw new Error("expected the call to be refused, but it resolved");
}

const newTopic = {
  orgSlug: ORG_SLUG,
  name: "Onboarding guide",
  repositories: [{ id: "repo-1", pathGlobs: ["docs/**/*.md"] }],
  maintainerMemberIds: ["mem-1"],
  language: "en" as const,
};

const STORED = {
  id: "topic-1",
  name: "Onboarding guide",
  repositories: [
    { id: "repo-1", fullName: "acme/handbook", pathGlobs: ["docs/**/*.md"] },
  ],
  language: "en",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  maintainers: [
    { id: "mem-1", user: { name: "Maintainer", email: "m@example.com" } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  onPlan("BUSINESS");
  resolveOrg.mockResolvedValue({
    organization: { id: ORG_ID },
    membership: { role: "owner" },
  });
  resolveConnection.mockResolvedValue({
    token: "ghs_token",
    provider: {
      listGrants: vi.fn().mockResolvedValue({
        grants: [{ id: "repo-1", name: "acme/handbook", url: "https://x" }],
        totalCount: 1,
      }),
      listFolders: vi.fn().mockResolvedValue(["docs", "docs/guides"]),
    },
  });
  db.member.findMany.mockResolvedValue([{ id: "mem-1" }]);
  db.knowledgeTopic.findMany.mockResolvedValue([STORED]);
  db.knowledgeTopic.findFirst.mockResolvedValue({ id: STORED.id });
  db.knowledgeTopic.create.mockResolvedValue(STORED);
  db.knowledgeTopic.update.mockResolvedValue(STORED);
  db.knowledgeTopic.deleteMany.mockResolvedValue({ count: 1 });
});

describe("the plan gate", () => {
  it("refuses a Starter organization creating a topic, and writes nothing", async () => {
    onPlan("STARTER");

    const error = await refusal(() => caller().create(newTopic));

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe(
      "entitlement.knowledge_sync_requires_upgrade",
    );
    expect(error.message).toContain("Business");
    expect(db.knowledgeTopic.create).not.toHaveBeenCalled();
  });

  it("refuses a Trial organization on every mutation", async () => {
    onPlan("TRIAL");

    for (const call of [
      () => caller().create(newTopic),
      () => caller().update({ ...newTopic, topicId: STORED.id }),
      () => caller().delete({ orgSlug: ORG_SLUG, topicId: STORED.id }),
    ]) {
      expect((await refusal(call)).applicationCode).toBe(
        "entitlement.knowledge_sync_requires_upgrade",
      );
    }
    expect(db.knowledgeTopic.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses before it asks GitHub which repositories exist", async () => {
    onPlan("STARTER");

    await refusal(() => caller().create(newTopic));

    expect(resolveConnection).not.toHaveBeenCalled();
  });

  it("permits the same creation on BUSINESS", async () => {
    await caller().create(newTopic);

    expect(db.knowledgeTopic.create).toHaveBeenCalledTimes(1);
  });

  it("still lists topics for a Starter organization, with the gate decision", async () => {
    onPlan("STARTER");

    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(view.access).toMatchObject({
      allowed: false,
      reason: "not_in_plan",
      requiredPlan: "Business",
    });
    expect(view.topics).toHaveLength(1);
  });
});

describe("scope is the server's to decide", () => {
  it("refuses a repository the installation does not reach", async () => {
    const error = await refusal(() =>
      caller().create({
        ...newTopic,
        repositories: [
          { id: "repo-1", pathGlobs: [] },
          { id: "repo-elsewhere", pathGlobs: [] },
        ],
      }),
    );

    expect(error.applicationCode).toBe("knowledge.invalid_scope");
    expect(db.knowledgeTopic.create).not.toHaveBeenCalled();
  });

  it("stores the name GitHub gave, not one the client could have sent", async () => {
    await caller().create(newTopic);

    expect(
      db.knowledgeTopic.create.mock.calls[0]![0].data.repositories,
    ).toEqual([
      { id: "repo-1", fullName: "acme/handbook", pathGlobs: ["docs/**/*.md"] },
    ]);
  });

  it("refuses a maintainer who is not a member of this organization", async () => {
    db.member.findMany.mockResolvedValue([]);

    const error = await refusal(() =>
      caller().create({ ...newTopic, maintainerMemberIds: ["mem-elsewhere"] }),
    );

    expect(error.applicationCode).toBe("knowledge.invalid_scope");
  });

  it("rejects a glob that reaches outside the repository", async () => {
    const error = await refusal(() =>
      caller().create({
        ...newTopic,
        repositories: [{ id: "repo-1", pathGlobs: ["../etc/passwd"] }],
      }),
    );

    expect(error.code).toBe("BAD_REQUEST");
    expect(resolveConnection).not.toHaveBeenCalled();
  });

  it("reads a malformed repositories column as an empty scope, not a crash", async () => {
    db.knowledgeTopic.findMany.mockResolvedValue([
      { ...STORED, repositories: "not the shape the writer stores" },
    ]);

    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(view.topics[0]!.repositories).toEqual([]);
  });

  it("requires at least one repository", async () => {
    const error = await refusal(() =>
      caller().create({ ...newTopic, repositories: [] }),
    );

    expect(error.code).toBe("BAD_REQUEST");
  });
});

describe("only an admin may change a topic", () => {
  it("asks for admin_or_owner on every mutation and for membership on the list", async () => {
    await caller().create(newTopic);
    expect(resolveOrg).toHaveBeenCalledWith(
      ORG_SLUG,
      USER_ID,
      "admin_or_owner",
    );

    vi.clearAllMocks();
    resolveOrg.mockResolvedValue({
      organization: { id: ORG_ID },
      membership: { role: "member" },
    });
    onPlan("BUSINESS");
    db.knowledgeTopic.findMany.mockResolvedValue([]);

    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(resolveOrg).toHaveBeenCalledWith(ORG_SLUG, USER_ID, "member");
    expect(view.canManage).toBe(false);
  });
});

describe("a topic from another organization is a miss", () => {
  it("refuses an update whose topic is not in the resolved organization", async () => {
    db.knowledgeTopic.findFirst.mockResolvedValue(null);

    const error = await refusal(() =>
      caller().update({ ...newTopic, topicId: "topic-elsewhere" }),
    );

    expect(error.code).toBe("NOT_FOUND");
    expect(db.knowledgeTopic.update).not.toHaveBeenCalled();
  });

  it("refuses a delete that matched no row", async () => {
    db.knowledgeTopic.deleteMany.mockResolvedValue({ count: 0 });

    const error = await refusal(() =>
      caller().delete({ orgSlug: ORG_SLUG, topicId: "topic-elsewhere" }),
    );

    expect(error.code).toBe("NOT_FOUND");
  });
});

describe("health is a placeholder until the sync tickets land", () => {
  it("reports never-synced and no pending suggestions", async () => {
    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(view.topics[0]).toMatchObject({
      lastSyncedAt: null,
      pendingSuggestions: 0,
    });
  });
});

describe("the folder preview is guarded like the write it feeds", () => {
  it("lists the folders of a repository the installation reaches", async () => {
    const { folders } = await caller().listFolders({
      orgSlug: ORG_SLUG,
      repositoryId: "repo-1",
    });

    expect(folders).toEqual(["docs", "docs/guides"]);
  });

  it("refuses a repository the installation does not reach", async () => {
    const error = await refusal(() =>
      caller().listFolders({
        orgSlug: ORG_SLUG,
        repositoryId: "repo-elsewhere",
      }),
    );

    expect(error.applicationCode).toBe("knowledge.invalid_scope");
  });

  it("refuses a Starter organization, and asks GitHub nothing", async () => {
    onPlan("STARTER");

    const error = await refusal(() =>
      caller().listFolders({ orgSlug: ORG_SLUG, repositoryId: "repo-1" }),
    );

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(resolveConnection).not.toHaveBeenCalled();
  });

  it("asks for admin_or_owner, not mere membership", async () => {
    await caller().listFolders({ orgSlug: ORG_SLUG, repositoryId: "repo-1" });

    expect(resolveOrg).toHaveBeenCalledWith(
      ORG_SLUG,
      USER_ID,
      "admin_or_owner",
    );
  });
});
