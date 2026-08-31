import { vi } from "vitest";

export const db = {
  organizationAIModel: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  organization: { update: vi.fn(), updateMany: vi.fn() },
  organizationSubscription: { findUnique: vi.fn() },
  organizationCredit: { findUnique: vi.fn() },
  notebookSource: { count: vi.fn() },
  $transaction: vi.fn(),
};

export const policy = {
  requireOrganizationBySlug: vi.fn(),
  requireOrgMember: vi.fn(),
};

export const probe = {
  testByoaiConnection: vi.fn(),
  listRemoteModels: vi.fn(),
};

export const crypto = {
  encryptApiKey: vi.fn((key: string) => `enc:${key}`),
  decryptApiKey: vi.fn((key: string) => key.replace("enc:", "")),
};

export const ssrfGuard = {
  assertSafeByoaiOutboundUrl: vi.fn(),
};

vi.mock("@scibly/db", () => ({ db }));
vi.mock("../../server/policy", () => policy);
vi.mock("../server/endpoint-probe", () => probe);
vi.mock("@/lib/crypto/api-key", () => crypto);
vi.mock("@/lib/network/ssrf-guard", () => ssrfGuard);

// Imported dynamically — a static import would pull `@scibly/db` in above the doubles, closing over an uninitialised `db`.
const { createCallerFactory } = await import("@scibly/api/trpc");
const { db: prisma } = await import("@scibly/db");
const { orgAiConfigRouter } = await import("./org-ai-config.router");

const createCaller = createCallerFactory(orgAiConfigRouter);

export const ORG_ID = "org-1";
export const ORG_SLUG = "org-1-slug";
export const USER_ID = "user-1";
export const MODEL_ID = "model-1";

export function caller() {
  const now = new Date("2026-01-01T00:00:00Z");
  return createCaller({
    db: prisma,
    headers: new Headers(),
    locale: "en",
    correlationId: "corr-1",
    actor: { userId: USER_ID },
    session: {
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
