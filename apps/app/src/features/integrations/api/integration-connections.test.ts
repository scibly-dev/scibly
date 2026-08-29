import type { z } from "zod";

import { AppError } from "@scibly/api/application-error";
import { createCallerFactory } from "@scibly/api/trpc";
// The context's `db` is the same doubled object, borrowed for its Prisma type.
import { db as contextDb } from "@scibly/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { INTEGRATION_PROVIDERS } from "../contracts";
import {
  disconnectIntegrationSchema,
  getAuthUrlSchema,
  linkPageSchema,
  linkPagesSchema,
  listPageChildrenSchema,
  providerInput,
  searchPagesSchema,
} from "./integration.schema";

// Real tRPC caller over the real router, so input validation runs for real.
// `db` and `resolveOrg` are mocked; `warnSourcesOfLostConnection` is not.

const db = vi.hoisted(() => {
  const client = {
    integrationConnection: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    notebookSource: { updateMany: vi.fn(), deleteMany: vi.fn() },
    notebookSourceChunk: { deleteMany: vi.fn() },
    scene: { deleteMany: vi.fn() },
    // The doubled client is handed straight back, so writes made inside the
    // transaction land on the same spy.
    $transaction: vi.fn((run: (tx: unknown) => unknown) => run(client)),
  };
  return client;
});
const resolveOrg = vi.hoisted(() => vi.fn());

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/organizations/server", () => ({
  requireOrgMember: vi.fn(),
  resolveOrg,
}));
vi.mock("@/features/notebook/server", () => ({
  boundedIngest: vi.fn(),
  boundedLink: vi.fn((_userId: string, link: () => unknown) => link()),
  linkNotebookPages: vi.fn(),
  resolveNotebook: vi.fn(),
  resolveOwnedNotebookSource: vi.fn(),
}));

const { integrationRouter } = await import("./integration.router");
const { PROVIDERS } = await import("../server/registry");
const { verifyOAuthState } = await import("@/lib/crypto/oauth-state");

const createCaller = createCallerFactory(integrationRouter);

function session(userId: string) {
  const now = new Date("2026-01-01T00:00:00Z");
  return {
    session: {
      id: "sess-1",
      createdAt: now,
      updatedAt: now,
      userId,
      expiresAt: new Date("2026-12-31T00:00:00Z"),
      token: "token",
    },
    user: {
      id: userId,
      name: "Admin",
      email: "admin@example.com",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  };
}

function caller(userId = "admin-1") {
  return createCaller({
    db: contextDb,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    session: session(userId),
    actor: { userId },
  });
}

async function refusalCode(call: () => Promise<unknown>): Promise<string> {
  try {
    await call();
  } catch (error) {
    if (error instanceof Error && "code" in error) return String(error.code);
    throw error;
  }
  return "resolved";
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveOrg.mockResolvedValue({ organization: { id: "org-resolved" } });
  db.integrationConnection.findMany.mockResolvedValue([]);
  db.integrationConnection.findUnique.mockResolvedValue({ id: "conn-1" });
  db.integrationConnection.update.mockResolvedValue({});
  db.notebookSource.updateMany.mockResolvedValue({ count: 2 });
});

describe("LA1 one door only", () => {
  it("LA1 exposes no procedure that exchanges a code or writes a token", () => {
    expect(Object.keys(integrationRouter._def.procedures).sort()).toEqual([
      "disconnect",
      "getAuthUrl",
      "linkPage",
      "linkPages",
      "list",
      "listGrants",
      "listPageChildren",
      "resyncSource",
      "searchPages",
    ]);
  });

  it("LA1 getAuthUrl only hands out a URL — it stores nothing", async () => {
    await caller().getAuthUrl({
      orgSlug: "acme",
      provider: "NOTION",
      lang: "de",
    });

    expect(db.integrationConnection.upsert).not.toHaveBeenCalled();
    expect(db.integrationConnection.create).not.toHaveBeenCalled();
  });

  it("LA1 the URL it hands out carries a state this product can verify", async () => {
    const { authUrl } = await caller().getAuthUrl({
      orgSlug: "acme",
      provider: "NOTION",
      lang: "de",
    });

    const state = new URL(authUrl).searchParams.get("state") ?? "";

    expect(verifyOAuthState(state)).toEqual({
      ok: true,
      payload: {
        orgSlug: "acme",
        provider: "NOTION",
        userId: "admin-1",
        lang: "de",
      },
    });
  });
});

describe("LR who may see, who may change", () => {
  const procedures: [
    string,
    (c: ReturnType<typeof caller>) => Promise<unknown>,
  ][] = [
    ["list", (c) => c.list({ orgSlug: "acme" })],
    [
      "getAuthUrl",
      (c) => c.getAuthUrl({ orgSlug: "acme", provider: "NOTION", lang: "en" }),
    ],
    [
      "disconnect",
      (c) => c.disconnect({ orgSlug: "acme", provider: "NOTION" }),
    ],
  ];

  it.each(procedures)("LR1 %s demands admin-or-owner", async (_name, call) => {
    await call(caller());

    expect(resolveOrg).toHaveBeenCalledWith(
      "acme",
      "admin-1",
      "admin_or_owner",
    );
  });

  it.each(procedures)(
    "LR1 %s changes nothing when membership is refused",
    async (_name, call) => {
      resolveOrg.mockRejectedValue(
        new AppError({
          code: "FORBIDDEN",
          applicationCode: "api.forbidden",
          message: "Admin or owner role required.",
        }),
      );

      expect(await refusalCode(() => call(caller()))).toBe("FORBIDDEN");
      expect(db.integrationConnection.update).not.toHaveBeenCalled();
      expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
    },
  );

  it("LR2 lists only the resolved org's connections", async () => {
    await caller().list({ orgSlug: "acme" });

    expect(db.integrationConnection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-resolved" }),
      }),
    );
  });

  it("LR2 lists only the connections that still hold a credential", async () => {
    await caller().list({ orgSlug: "acme" });

    expect(db.integrationConnection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { accessTokenEncrypted: { not: null } },
            { installationId: { not: null } },
          ],
        }),
      }),
    );
  });

  it("LR2 returns the provider catalogue alongside them", async () => {
    const result = await caller().list({ orgSlug: "acme" });

    expect(result.allProviders).toEqual(
      INTEGRATION_PROVIDERS.map((providerId) => ({
        providerId,
        displayName: expect.any(String),
        listsGrants: expect.any(Boolean),
      })),
    );
  });

  it("LS2 selects exactly the columns the settings card renders, and no token", async () => {
    await caller().list({ orgSlug: "acme" });

    expect(db.integrationConnection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          provider: true,
          workspaceId: true,
          workspaceName: true,
          createdAt: true,
          connectedBy: { select: { name: true, email: true } },
        },
      }),
    );
  });
});

describe("LD what a disconnect leaves behind", () => {
  it("LD1 wipes the credential off the row and keeps the row", async () => {
    const result = await caller().disconnect({
      orgSlug: "acme",
      provider: "NOTION",
    });

    expect(db.integrationConnection.update).toHaveBeenCalledWith({
      where: { id: "conn-1" },
      data: { accessTokenEncrypted: null, installationId: null },
    });
    expect(result).toEqual({ success: true });
  });

  it("LD2 warns the sources it pulled in and leaves them linked", async () => {
    await caller().disconnect({ orgSlug: "acme", provider: "NOTION" });

    expect(db.notebookSource.updateMany).toHaveBeenCalledWith({
      where: { integrationId: "conn-1" },
      data: { warning: expect.stringContaining("disconnected") },
    });
  });

  it("LD2 leaves the sources, their text and the scenes standing", async () => {
    await caller().disconnect({ orgSlug: "acme", provider: "NOTION" });

    expect(db.notebookSource.deleteMany).not.toHaveBeenCalled();
    expect(db.notebookSourceChunk.deleteMany).not.toHaveBeenCalled();
    expect(db.scene.deleteMany).not.toHaveBeenCalled();
  });

  it("LD2 warns before the credential the warning is about is gone", async () => {
    await caller().disconnect({ orgSlug: "acme", provider: "NOTION" });

    expect(
      db.notebookSource.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(
      db.integrationConnection.update.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("LD3 disconnecting something already disconnected succeeds and changes nothing", async () => {
    db.integrationConnection.findUnique.mockResolvedValue(null);

    const result = await caller().disconnect({
      orgSlug: "acme",
      provider: "NOTION",
    });

    expect(result).toEqual({ success: true });
    expect(db.integrationConnection.update).not.toHaveBeenCalled();
    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
  });

  it("LD5 finds the connection by the resolved org, not by the slug it was handed", async () => {
    await caller().disconnect({ orgSlug: "acme", provider: "NOTION" });

    expect(db.integrationConnection.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_provider: {
            organizationId: "org-resolved",
            provider: "NOTION",
          },
        },
      }),
    );
  });
});

describe("LP provider identity", () => {
  const schemasTakingAProvider: [string, z.ZodTypeAny][] = [
    ["getAuthUrl", getAuthUrlSchema],
    ["disconnect", disconnectIntegrationSchema],
    ["searchPages", searchPagesSchema],
    ["listPageChildren", listPageChildrenSchema],
    ["linkPage", linkPageSchema],
    ["linkPages", linkPagesSchema],
  ];

  it.each(schemasTakingAProvider)(
    "LP1 %s's input refuses an unknown provider",
    (_name, schema) => {
      const result = schema.safeParse({
        orgSlug: "acme",
        provider: "MYSPACE",
        notebookId: "nb-1",
        pageId: "p1",
        pageTitle: "Page",
        pageUrl: "https://example.com/p1",
        pages: [{ id: "p1", title: "Page", url: "https://example.com/p1" }],
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.map((issue) => issue.path.join(".")),
      ).toContain("provider");
    },
  );

  it("LP2 the schema accepts exactly the providers the registry can build", () => {
    expect(Object.keys(PROVIDERS).sort()).toEqual(
      [...INTEGRATION_PROVIDERS].sort(),
    );
    for (const providerId of INTEGRATION_PROVIDERS) {
      expect(providerInput.parse(providerId)).toBe(providerId);
    }
  });
});
