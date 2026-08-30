import type * as SearchSources from "../server/search-sources";

import { AppError } from "@scibly/api/application-error";
import { createCallerFactory } from "@scibly/api/trpc";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Real tRPC caller over the real source router; only the notebook boundary and the presigner are doubled.
const db = vi.hoisted(() => ({
  notebookSource: { findMany: vi.fn(), update: vi.fn() },
}));

const notebookServer = vi.hoisted(() => ({
  addTextSource: vi.fn(),
  deleteNotebookSource: vi.fn(),
  ingestOrRefreshSource: vi.fn(),
  isSourceProcessingLeaseStale: vi.fn(() => false),
  resolveNotebook: vi.fn(),
  resolveOwnedNotebookSource: vi.fn(),
}));

const s3 = vi.hoisted(() => ({
  getPresignedDownloadUrl: vi.fn(async () => "https://signed.example/object"),
}));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/notebook/server", () => notebookServer);
vi.mock("@/lib/file/s3", () => s3);
// Kept out of the way rather than exercised — `search` has its own file.
vi.mock("../server/search-sources", async (importOriginal) => ({
  ...(await importOriginal<typeof SearchSources>()),
  searchNotebookSources: vi.fn(async () => ({
    status: "NOT_INDEXED" as const,
    ingestingSources: 0,
  })),
  readNotebookSource: vi.fn(async () => ({ status: "NOT_FOUND" as const })),
}));

const { db: prisma } = await import("@scibly/db");
const { sourceRouter } = await import("./source.router");

const createCaller = createCallerFactory(sourceRouter);

const OWNER = "user-owner";
const ORG_A = "org-a";
const NOTEBOOK = "nb-1";
const IN_SCOPE_KEY = `notebook-sources/${ORG_A}/${NOTEBOOK}/src-1/report.pdf`;

function caller(userId: string) {
  const now = new Date("2026-01-01T00:00:00Z");
  return createCaller({
    db: prisma,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    actor: { userId },
    session: {
      user: {
        id: userId,
        name: "Author",
        email: "author@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
}

function sourceWithKey(url: string | null) {
  notebookServer.resolveOwnedNotebookSource.mockResolvedValueOnce({
    source: { id: "src-1", notebookId: NOTEBOOK, url },
    notebook: { id: NOTEBOOK, organizationId: ORG_A },
  });
}

async function refusalCode(call: () => Promise<unknown>) {
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
  s3.getPresignedDownloadUrl.mockResolvedValue("https://signed.example/object");
});

describe("issuing a download URL for a source file", () => {
  const outOfScope = [
    {
      case: "another notebook in the same organization",
      url: `notebook-sources/${ORG_A}/nb-other/src-1/report.pdf`,
    },
    {
      case: "the same notebook id under another organization",
      url: `notebook-sources/org-b/${NOTEBOOK}/src-1/report.pdf`,
    },
    {
      case: "a key that only mentions this notebook's prefix further along",
      url: `notebook-sources/org-b/nb-other/notebook-sources/${ORG_A}/${NOTEBOOK}/src-1/report.pdf`,
    },
    {
      case: "generated media rather than an uploaded source",
      url: `notebook-media/${ORG_A}/${NOTEBOOK}/diagram.webp`,
    },
  ];

  it.each(outOfScope)(
    "NC4: refuses to presign a stored key pointing at $case",
    async ({ url }) => {
      sourceWithKey(url);

      expect(
        await refusalCode(() =>
          caller(OWNER).getDownloadUrl({ sourceId: "src-1" }),
        ),
      ).toBe("BAD_REQUEST");
      expect(s3.getPresignedDownloadUrl).not.toHaveBeenCalled();
    },
  );

  it("NC4: presigns a key inside the caller's own organization and notebook", async () => {
    sourceWithKey(IN_SCOPE_KEY);

    await expect(
      caller(OWNER).getDownloadUrl({ sourceId: "src-1" }),
    ).resolves.toEqual({ downloadUrl: "https://signed.example/object" });
    expect(s3.getPresignedDownloadUrl).toHaveBeenCalledWith(IN_SCOPE_KEY);
  });

  it("NC4: a source with no stored file is refused rather than presigned", async () => {
    sourceWithKey(null);

    expect(
      await refusalCode(() =>
        caller(OWNER).getDownloadUrl({ sourceId: "src-1" }),
      ),
    ).toBe("BAD_REQUEST");
    expect(s3.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("NC4: never reaches the key check when the source's notebook refuses the caller", async () => {
    notebookServer.resolveOwnedNotebookSource.mockRejectedValueOnce(
      new AppError({
        code: "NOT_FOUND",
        applicationCode: "api.not_found",
        message: "Source not found.",
      }),
    );

    expect(
      await refusalCode(() =>
        caller(OWNER).getDownloadUrl({ sourceId: "src-of-another-user" }),
      ),
    ).toBe("NOT_FOUND");
    expect(s3.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });
});
