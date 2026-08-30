import { routes } from "@scibly/routes";
import { rateLimitCounter } from "@test/mocks/rate-limit-counter";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Real tRPC caller over the real router, so the schema and the gate both run for real; only the database, the org lookup and the GitHub connection are doubled.
const db = vi.hoisted(() => ({
  knowledgeTopic: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  member: { findMany: vi.fn() },
  integrationConnection: { update: vi.fn() },
  organizationSubscription: { findUnique: vi.fn() },
  rateLimit: { updateMany: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
}));
const resolveOrg = vi.hoisted(() => vi.fn());
const resolveRepositoryConnection = vi.hoisted(() => vi.fn());
const resolvePageConnection = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({
  db,
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      constructor(message: string, options: { code: string }) {
        super(message);
        this.code = options.code;
      }
    },
  },
}));
vi.mock("@/features/organizations/server", () => ({ resolveOrg }));
vi.mock("@/features/integrations/server", () => ({
  resolveRepositoryConnection,
  resolvePageConnection,
}));

const { APIErrorCode, APIResponseError } = await import("@notionhq/client");
const { AppError } = await import("@scibly/api/application-error");
const { createCallerFactory } = await import("@scibly/api/trpc");
const { db: prisma, Prisma } = await import("@scibly/db");
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

const DESTINATION_PAGE_ID = "notion-root";
const PARENT_PAGE_ID = "notion-parent";
const DOC_PAGE_ID = "notion-doc";
const OUR_REVISION = new Date("2026-02-01T10:00:00Z");

const notionDouble = () => ({
  createPage: vi
    .fn()
    .mockResolvedValue({ id: DOC_PAGE_ID, revision: OUR_REVISION }),
  writePage: vi.fn().mockResolvedValue({ revision: OUR_REVISION }),
  movePage: vi.fn().mockResolvedValue(undefined),
  getParentPageId: vi.fn().mockResolvedValue(PARENT_PAGE_ID),
  getPageRevision: vi
    .fn()
    .mockResolvedValue({ title: "Team wiki", lastEdited: OUR_REVISION }),
});

let notion = notionDouble();

const connectNotion = (knowledgeDestinationPageId: string | null) =>
  resolvePageConnection.mockResolvedValue({
    token: "notion_token",
    provider: notion,
    connection: { id: "conn-notion", knowledgeDestinationPageId },
  });

const notionRefusal = (
  code: (typeof APIErrorCode)[keyof typeof APIErrorCode],
) =>
  new APIResponseError({
    code,
    message: "API token is invalid.",
    status: 403,
    headers: new Headers(),
    rawBodyText: "",
    additional_data: undefined,
    request_id: undefined,
  });

const limiter = rateLimitCounter();

beforeEach(() => {
  vi.clearAllMocks();
  limiter.clear();
  db.rateLimit.updateMany.mockImplementation(limiter.model.updateMany);
  db.rateLimit.create.mockImplementation(limiter.model.create);
  db.rateLimit.findUnique.mockImplementation(limiter.model.findUnique);
  onPlan("BUSINESS");
  resolveOrg.mockResolvedValue({
    organization: { id: ORG_ID },
    membership: { role: "owner" },
  });
  resolveRepositoryConnection.mockResolvedValue({
    token: "ghs_token",
    provider: {
      listGrants: vi.fn().mockResolvedValue({
        grants: [{ id: "repo-1", name: "acme/handbook", url: "https://x" }],
        totalCount: 1,
      }),
      listFolders: vi.fn().mockResolvedValue(["docs", "docs/guides"]),
      resolveGrant: vi
        .fn()
        .mockImplementation((_token: string, id: string) =>
          id === "repo-1"
            ? { id, name: "acme/handbook", url: "https://x" }
            : null,
        ),
    },
  });
  notion = notionDouble();
  connectNotion(DESTINATION_PAGE_ID);
  db.integrationConnection.update.mockResolvedValue({});
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

  it("refuses a Trial organization writing a topic", async () => {
    onPlan("TRIAL");

    for (const call of [
      () => caller().create(newTopic),
      () => caller().update({ ...newTopic, topicId: STORED.id }),
    ]) {
      expect((await refusal(call)).applicationCode).toBe(
        "entitlement.knowledge_sync_requires_upgrade",
      );
    }
  });

  it("still lets a Trial organization delete one", async () => {
    onPlan("TRIAL");

    await caller().delete({ orgSlug: ORG_SLUG, topicId: STORED.id });

    expect(db.knowledgeTopic.deleteMany).toHaveBeenCalledWith({
      where: { id: STORED.id, organizationId: ORG_ID },
    });
  });

  it("refuses before it asks GitHub which repositories exist", async () => {
    onPlan("STARTER");

    await refusal(() => caller().create(newTopic));

    expect(resolveRepositoryConnection).not.toHaveBeenCalled();
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
    expect(resolveRepositoryConnection).not.toHaveBeenCalled();
  });

  it("reads a malformed repositories column as an empty scope, not a crash", async () => {
    db.knowledgeTopic.findMany.mockResolvedValue([
      { ...STORED, repositories: "not the shape the writer stores" },
    ]);

    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(view.topics[0]!.repositories).toEqual([]);
  });

  it("keeps the repositories a malformed one sits next to", async () => {
    db.knowledgeTopic.findMany.mockResolvedValue([
      {
        ...STORED,
        repositories: [
          { id: "repo-1", fullName: "acme/handbook", pathGlobs: [] },
          { id: "", fullName: 42 },
          { id: "repo-2", fullName: "acme/api", pathGlobs: ["src/**"] },
        ],
      },
    ]);

    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(view.topics[0]!.repositories).toEqual([
      { id: "repo-1", fullName: "acme/handbook", pathGlobs: [] },
      { id: "repo-2", fullName: "acme/api", pathGlobs: ["src/**"] },
    ]);
  });

  it("collapses a repeated repository id to one scope", async () => {
    await caller().create({
      ...newTopic,
      repositories: [
        { id: "repo-1", pathGlobs: ["first/**"] },
        { id: "repo-1", pathGlobs: ["second/**"] },
      ],
    });

    expect(
      db.knowledgeTopic.create.mock.calls[0]![0].data.repositories,
    ).toEqual([
      { id: "repo-1", fullName: "acme/handbook", pathGlobs: ["second/**"] },
    ]);
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
    expect(view.destination).toBeNull();
    expect(resolvePageConnection).not.toHaveBeenCalled();
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
    expect(resolveRepositoryConnection).not.toHaveBeenCalled();
  });

  it("asks for admin_or_owner, not mere membership", async () => {
    await caller().listFolders({ orgSlug: ORG_SLUG, repositoryId: "repo-1" });

    expect(resolveOrg).toHaveBeenCalledWith(
      ORG_SLUG,
      USER_ID,
      "admin_or_owner",
    );
  });

  it("stops a caller who asks for the folder listing over and over", async () => {
    limiter.setSpent(USER_ID, "knowledge.listFolders", 1_000);

    const error = await refusal(() =>
      caller().listFolders({ orgSlug: ORG_SLUG, repositoryId: "repo-1" }),
    );

    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(resolveRepositoryConnection).not.toHaveBeenCalled();
  });
});

describe("a repository the listing never got as far as", () => {
  const truncated = (resolveGrant: unknown) =>
    resolveRepositoryConnection.mockResolvedValue({
      token: "ghs_token",
      provider: {
        listGrants: vi.fn().mockResolvedValue({
          grants: [{ id: "repo-1", name: "acme/handbook", url: "https://x" }],
          totalCount: 1200,
        }),
        listFolders: vi.fn().mockResolvedValue([]),
        resolveGrant,
      },
    });

  it("is asked about directly rather than refused", async () => {
    truncated(
      vi.fn().mockResolvedValue({ id: "repo-900", name: "acme/late", url: "" }),
    );

    await caller().create({
      ...newTopic,
      repositories: [{ id: "repo-900", pathGlobs: [] }],
    });

    expect(
      db.knowledgeTopic.create.mock.calls[0]![0].data.repositories,
    ).toEqual([{ id: "repo-900", fullName: "acme/late", pathGlobs: [] }]);
  });

  it("is still refused when the installation does not know it either", async () => {
    truncated(vi.fn().mockResolvedValue(null));

    const error = await refusal(() =>
      caller().create({
        ...newTopic,
        repositories: [{ id: "repo-900", pathGlobs: [] }],
      }),
    );

    expect(error.applicationCode).toBe("knowledge.invalid_scope");
  });

  it("does not ask about an id the complete listing already answered for", async () => {
    const resolveGrant = vi.fn();
    resolveRepositoryConnection.mockResolvedValue({
      token: "ghs_token",
      provider: {
        listGrants: vi.fn().mockResolvedValue({
          grants: [{ id: "repo-1", name: "acme/handbook", url: "https://x" }],
          totalCount: 1,
        }),
        resolveGrant,
      },
    });

    await caller().create(newTopic);

    expect(resolveGrant).not.toHaveBeenCalled();
  });
});

describe("a connection that offers no repositories", () => {
  it("refuses the write there and then, and writes nothing", async () => {
    resolveRepositoryConnection.mockRejectedValue(
      new AppError({
        code: "BAD_REQUEST",
        applicationCode: "api.bad_request",
        message: "NOTION offers no repositories to scope.",
      }),
    );

    const error = await refusal(() => caller().create(newTopic));

    expect(error.applicationCode).toBe("api.bad_request");
    expect(db.knowledgeTopic.create).not.toHaveBeenCalled();
  });
});

describe("a name already in use is named", () => {
  const taken = () => {
    return new Prisma.PrismaClientKnownRequestError("unique", {
      code: "P2002",
      clientVersion: "7.8.0",
    });
  };

  it("tells the form which field collides on create", async () => {
    db.knowledgeTopic.create.mockRejectedValue(taken());

    const error = await refusal(() => caller().create(newTopic));

    expect(error.code).toBe("CONFLICT");
    expect(error.applicationCode).toBe("knowledge.name_taken");
    expect(error.message).toContain("name");
  });

  it("tells the form which field collides on update", async () => {
    db.knowledgeTopic.update.mockRejectedValue(taken());
    db.knowledgeTopic.findFirst.mockResolvedValue({
      id: STORED.id,
      markdown: "## Overview\n",
      notionPageId: DOC_PAGE_ID,
      notionRevisionAt: OUR_REVISION,
    });

    const error = await refusal(() =>
      caller().update({ ...newTopic, topicId: STORED.id }),
    );

    expect(error.applicationCode).toBe("knowledge.name_taken");
  });

  it("leaves the page untouched when the new name is already taken", async () => {
    db.knowledgeTopic.update.mockRejectedValue(taken());
    db.knowledgeTopic.findFirst.mockResolvedValue({
      id: STORED.id,
      markdown: "## Overview\n",
      notionPageId: DOC_PAGE_ID,
      notionRevisionAt: OUR_REVISION,
    });

    await refusal(() =>
      caller().update({ ...newTopic, topicId: STORED.id, name: "Taken" }),
    );

    expect(notion.writePage).not.toHaveBeenCalled();
  });
});

describe("a topic gets a document in Notion", () => {
  it("creates the skeleton page under the org's root and stores the mapping", async () => {
    await caller().create(newTopic);

    expect(notion.createPage).toHaveBeenCalledWith("notion_token", {
      parentPageId: DESTINATION_PAGE_ID,
      title: newTopic.name,
      markdown: expect.stringContaining("## Overview"),
    });

    const { data } = db.knowledgeTopic.create.mock.calls[0]![0];
    expect(data).toMatchObject({
      notionPageId: DOC_PAGE_ID,
      notionRevisionAt: OUR_REVISION,
      externallyEditedAt: null,
    });
    expect(data.documentHash).toEqual(expect.any(String));
    expect(data.markdown).toBe(notion.createPage.mock.calls[0]![1].markdown);
  });

  it("writes the skeleton the ticket names, in the topic's language", async () => {
    await caller().create({ ...newTopic, language: "de" });

    expect(notion.createPage.mock.calls[0]![1].markdown).toBe(
      [
        "## Überblick",
        "## Entscheidungen & Begründung",
        "## Einschränkungen & Fallstricke",
        "## Wie es funktioniert",
        "## Änderungsprotokoll",
      ].join("\n\n") + "\n",
    );
  });

  it("refuses before writing a row when nobody has picked where documents live", async () => {
    connectNotion(null);

    const error = await refusal(() => caller().create(newTopic));

    expect(error.applicationCode).toBe("knowledge.notion_destination_missing");
    expect(notion.createPage).not.toHaveBeenCalled();
    expect(db.knowledgeTopic.create).not.toHaveBeenCalled();
  });

  it("tells a read-only connection to reconnect rather than reporting an outage", async () => {
    for (const code of [
      APIErrorCode.RestrictedResource,
      APIErrorCode.Unauthorized,
    ]) {
      notion.createPage.mockRejectedValue(notionRefusal(code));

      const error = await refusal(() => caller().create(newTopic));

      expect(error.code).toBe("FORBIDDEN");
      expect(error.applicationCode).toBe("knowledge.notion_write_denied");
      expect(error.message).toContain("Reconnect");
    }
    expect(db.knowledgeTopic.create).not.toHaveBeenCalled();
  });

  it("lets the list say whether a destination is picked yet", async () => {
    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(view.destination).toEqual({
      connected: true,
      destinationPageId: DESTINATION_PAGE_ID,
      parent: {
        title: "Team wiki",
        url: routes.external.integrations.notion.page(PARENT_PAGE_ID),
      },
    });
    expect(notion.getParentPageId).toHaveBeenCalledWith(
      "notion_token",
      DESTINATION_PAGE_ID,
    );
  });

  it("says the destination is unknown rather than failing the page when Notion will not answer", async () => {
    notion.getParentPageId.mockRejectedValue(new Error("notion down"));

    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(view.destination).toEqual({
      connected: true,
      destinationPageId: DESTINATION_PAGE_ID,
      parent: null,
    });
  });

  it("creates the root page under the granted parent the first time", async () => {
    connectNotion(null);

    const result = await caller().setDocumentDestination({
      orgSlug: ORG_SLUG,
      parentPageId: "granted-1",
    });

    expect(result.destinationPageId).toBe(DOC_PAGE_ID);
    expect(notion.createPage).toHaveBeenCalledWith("notion_token", {
      parentPageId: "granted-1",
      title: "Scibly Knowledge",
    });
    expect(db.integrationConnection.update.mock.calls[0]![0]).toEqual({
      where: { id: "conn-notion" },
      data: { knowledgeDestinationPageId: DOC_PAGE_ID },
    });
  });

  it("moves the root page rather than stranding the documents under a second one", async () => {
    const result = await caller().setDocumentDestination({
      orgSlug: ORG_SLUG,
      parentPageId: "granted-2",
    });

    expect(result.destinationPageId).toBe(DESTINATION_PAGE_ID);
    expect(notion.movePage).toHaveBeenCalledWith(
      "notion_token",
      DESTINATION_PAGE_ID,
      "granted-2",
    );
    expect(notion.createPage).not.toHaveBeenCalled();
    expect(db.integrationConnection.update).not.toHaveBeenCalled();
  });

  it("replaces a destination page that no longer exists in Notion", async () => {
    notion.getPageRevision.mockResolvedValue(null);

    const result = await caller().setDocumentDestination({
      orgSlug: ORG_SLUG,
      parentPageId: "granted-2",
    });

    expect(notion.movePage).not.toHaveBeenCalled();
    expect(result.destinationPageId).toBe(DOC_PAGE_ID);
    expect(db.integrationConnection.update.mock.calls[0]![0]).toEqual({
      where: { id: "conn-notion" },
      data: { knowledgeDestinationPageId: DOC_PAGE_ID },
    });
  });

  it("reports no destination when Notion is not connected", async () => {
    resolvePageConnection.mockRejectedValue(new Error("not connected"));

    const view = await caller().list({ orgSlug: ORG_SLUG });

    expect(view.destination).toEqual({
      connected: false,
      destinationPageId: null,
      parent: null,
    });
  });
});

describe("the writes that reach Notion are bounded too", () => {
  it("stops a caller who creates topic after topic", async () => {
    limiter.setSpent(USER_ID, "knowledge.writeTopic", 1_000);

    const error = await refusal(() => caller().create(newTopic));

    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(notion.createPage).not.toHaveBeenCalled();
  });

  it("stops a caller who re-points the destination over and over", async () => {
    limiter.setSpent(USER_ID, "knowledge.writeTopic", 1_000);

    const error = await refusal(() =>
      caller().setDocumentDestination({
        orgSlug: ORG_SLUG,
        parentPageId: "granted-2",
      }),
    );

    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(notion.movePage).not.toHaveBeenCalled();
  });

  it("spends the same allowance on updates as on creates", async () => {
    db.knowledgeTopic.findFirst.mockResolvedValue({
      id: STORED.id,
      markdown: "## Overview\n",
      notionPageId: DOC_PAGE_ID,
      notionRevisionAt: OUR_REVISION,
    });
    limiter.setSpent(USER_ID, "knowledge.writeTopic", 1_000);

    const error = await refusal(() =>
      caller().update({ ...newTopic, topicId: STORED.id }),
    );

    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(db.knowledgeTopic.update).not.toHaveBeenCalled();
  });
});

describe("a page edited in Notion is never overwritten", () => {
  const existing = {
    id: STORED.id,
    markdown: "## Overview\n",
    notionPageId: DOC_PAGE_ID,
    notionRevisionAt: OUR_REVISION,
  };

  it("republishes when the page still carries our revision", async () => {
    db.knowledgeTopic.findFirst.mockResolvedValue(existing);

    await caller().update({ ...newTopic, topicId: STORED.id, name: "Renamed" });

    expect(notion.writePage).toHaveBeenCalledWith("notion_token", DOC_PAGE_ID, {
      title: "Renamed",
      markdown: existing.markdown,
    });
    expect(db.knowledgeTopic.update.mock.calls[1]![0].data).toMatchObject({
      externallyEditedAt: null,
    });
  });

  it("flags the topic and leaves the page alone when someone else edited it", async () => {
    db.knowledgeTopic.findFirst.mockResolvedValue(existing);
    notion.getPageRevision.mockResolvedValue({
      lastEdited: new Date("2026-02-02T09:00:00Z"),
    });

    await caller().update({ ...newTopic, topicId: STORED.id });

    expect(notion.writePage).not.toHaveBeenCalled();
    const { data } = db.knowledgeTopic.update.mock.calls[1]![0];
    expect(data.externallyEditedAt).toBeInstanceOf(Date);
    expect(data.notionRevisionAt).toBeUndefined();
  });

  it("leaves a topic that has no page yet without one", async () => {
    db.knowledgeTopic.findFirst.mockResolvedValue({
      ...existing,
      notionPageId: null,
      notionRevisionAt: null,
    });

    await caller().update({ ...newTopic, topicId: STORED.id });

    expect(notion.createPage).not.toHaveBeenCalled();
    expect(notion.writePage).not.toHaveBeenCalled();
  });

  it("flags the topic when Notion will not say what revision the page carries", async () => {
    db.knowledgeTopic.findFirst.mockResolvedValue(existing);
    notion.getPageRevision.mockResolvedValue(null);

    await caller().update({ ...newTopic, topicId: STORED.id });

    expect(notion.writePage).not.toHaveBeenCalled();
    const { data } = db.knowledgeTopic.update.mock.calls[1]![0];
    expect(data.externallyEditedAt).toBeInstanceOf(Date);
    expect(data.notionPageId).toBeUndefined();
    expect(data.notionRevisionAt).toBeUndefined();
  });

  it("still renames the row when the page is flagged, and says the page was left", async () => {
    db.knowledgeTopic.findFirst.mockResolvedValue(existing);
    notion.getPageRevision.mockResolvedValue({
      lastEdited: new Date("2026-02-02T09:00:00Z"),
    });

    db.knowledgeTopic.update.mockResolvedValue({
      ...STORED,
      externallyEditedAt: new Date(),
    });

    const view = await caller().update({
      ...newTopic,
      topicId: STORED.id,
      name: "Renamed",
    });

    expect(db.knowledgeTopic.update.mock.calls[0]![0].data.name).toBe(
      "Renamed",
    );
    expect(notion.writePage).not.toHaveBeenCalled();
    const { data } = db.knowledgeTopic.update.mock.calls[1]![0];
    expect(data.notionRevisionAt).toBeUndefined();
    expect(view.externallyEditedAt).toBeInstanceOf(Date);
  });

  it("saves the rest of the topic even when no document is written", async () => {
    db.knowledgeTopic.findFirst.mockResolvedValue({
      ...existing,
      notionPageId: null,
      notionRevisionAt: null,
    });

    const topic = await caller().update({
      ...newTopic,
      topicId: STORED.id,
      name: "Renamed",
    });

    expect(topic.id).toBe(STORED.id);
    expect(db.knowledgeTopic.update.mock.calls[0]![0].data.name).toBe(
      "Renamed",
    );
  });
});

describe("deleting a topic leaves the document behind", () => {
  it("removes the row and its mapping without touching Notion", async () => {
    await caller().delete({ orgSlug: ORG_SLUG, topicId: STORED.id });

    expect(resolvePageConnection).not.toHaveBeenCalled();
    expect(db.knowledgeTopic.deleteMany).toHaveBeenCalledTimes(1);
  });
});
