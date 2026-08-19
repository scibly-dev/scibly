import { AppError } from "@scibly/api/application-error";
import { type Prisma } from "@scibly/db/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The entitlement seam is mocked at its edge: this file asserts which decide
// function gets asked and that a refusal reaches the caller as a thrown
// error; refusal wording is covered end to end in source-cap.test.ts.

const entitlement = vi.hoisted(() => ({
  decideIngestFunding: vi.fn(),
  decideOwnEndpointGeneration: vi.fn(),
  assertAllowed: vi.fn(
    (decision: {
      refusal: {
        applicationCode: string;
        message: string;
        details?: unknown;
      } | null;
    }) => {
      if (decision.refusal) {
        throw new AppError({ code: "PAYMENT_REQUIRED", ...decision.refusal });
      }
    },
  ),
}));
vi.mock("@scibly/api/entitlement", () => entitlement);

const { assertOrgCanAffordIngest } = await import("./ingest-funding");

const ORG_ID = "org-1";

const findUnique = vi.fn();
const client = {
  organization: { findUnique },
} as unknown as Prisma.TransactionClient;

function ownTextModel(id: string | null) {
  findUnique.mockResolvedValue({ defaultChatModelId: id });
}

const allowed = { refusal: null };

function refused(applicationCode: string, message: string, details?: unknown) {
  return { refusal: { applicationCode, message, details } };
}

beforeEach(() => {
  vi.clearAllMocks();
  entitlement.decideIngestFunding.mockResolvedValue(allowed);
  entitlement.decideOwnEndpointGeneration.mockResolvedValue(allowed);
  ownTextModel(null);
});

describe("refusing before accepting", () => {
  it("a funded organization is allowed through", async () => {
    await expect(
      assertOrgCanAffordIngest(client, ORG_ID),
    ).resolves.toBeUndefined();
  });

  it("an empty balance refuses with what decideIngestFunding says", async () => {
    entitlement.decideIngestFunding.mockResolvedValue(
      refused(
        "entitlement.credits_exhausted",
        "Indexing this source costs 1 generation, and 0 are left.",
        { sources: 1, credits: 1, balance: 0 },
      ),
    );

    const error = await assertOrgCanAffordIngest(client, ORG_ID).catch(
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      code: "PAYMENT_REQUIRED",
      applicationCode: "entitlement.credits_exhausted",
      details: { sources: 1, credits: 1, balance: 0 },
    });
  });

  it("a batch is priced by decideIngestFunding with the batch size", async () => {
    await assertOrgCanAffordIngest(client, ORG_ID, 12);

    expect(entitlement.decideIngestFunding).toHaveBeenCalledWith(
      client,
      ORG_ID,
      "SOURCE_INGEST",
      12,
    );
  });

  it("exactly enough is enough", async () => {
    entitlement.decideIngestFunding.mockResolvedValue(allowed);

    await expect(
      assertOrgCanAffordIngest(client, ORG_ID, 3),
    ).resolves.toBeUndefined();
  });

  it("a lapsed subscription refuses in the debit's own words", async () => {
    entitlement.decideIngestFunding.mockResolvedValue(
      refused(
        "entitlement.generations_require_subscription",
        "This organization's subscription has lapsed, so AI generations have stopped. Reactivate the subscription to generate again — everything already created stays where it is.",
        { reason: "lapsed" },
      ),
    );

    await expect(assertOrgCanAffordIngest(client, ORG_ID)).rejects.toThrow(
      /subscription has lapsed/,
    );
  });
});

describe("an organization that runs text on its own endpoint", () => {
  beforeEach(() => {
    ownTextModel("org-model-1");
  });

  it("is not priced against a balance it never spends", async () => {
    await assertOrgCanAffordIngest(client, ORG_ID, 12);

    expect(entitlement.decideIngestFunding).not.toHaveBeenCalled();
    expect(entitlement.decideOwnEndpointGeneration).toHaveBeenCalledWith(
      client,
      ORG_ID,
    );
  });

  it("is refused when its plan no longer includes its own endpoint", async () => {
    entitlement.decideOwnEndpointGeneration.mockResolvedValue(
      refused(
        "entitlement.byoai_generation_withdrawn",
        "Generating on your own AI endpoint is included from the Pro plan upwards, so this turn cannot run there anymore.",
      ),
    );

    await expect(assertOrgCanAffordIngest(client, ORG_ID)).rejects.toThrow(
      /own AI endpoint/,
    );
  });
});
