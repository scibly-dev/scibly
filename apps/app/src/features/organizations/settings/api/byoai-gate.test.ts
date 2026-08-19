import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  caller,
  crypto,
  db,
  MODEL_ID,
  ORG_ID,
  ORG_SLUG,
  policy,
  probe,
  ssrfGuard,
  USER_ID,
} from "./testing";

function onPlan(plan: string, status = "ACTIVE") {
  db.organizationSubscription.findUnique.mockResolvedValue({
    plan,
    status,
    purchasedLearnerSeats: 0,
  });
}

const STORED_MODEL = {
  id: MODEL_ID,
  type: "CHAT",
  name: "In-house chat",
  description: null,
  baseUrl: "https://models.example.com/v1",
  apiKeyEncrypted: "enc:secret",
  modelId: "gpt-x",
  isActive: true,
};

function storedModel(overrides: Partial<typeof STORED_MODEL> = {}) {
  return { ...STORED_MODEL, ...overrides };
}

const newChatModel = {
  orgSlug: ORG_SLUG,
  name: "In-house chat",
  baseUrl: "https://models.example.com/v1",
  apiKey: "secret",
  modelId: "gpt-x",
  type: "CHAT" as const,
};

function wroteAnything(): boolean {
  return [
    db.organizationAIModel.create,
    db.organizationAIModel.update,
    db.organizationAIModel.updateMany,
    db.organizationAIModel.deleteMany,
    db.organization.update,
  ].some((mock) => mock.mock.calls.length > 0);
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    const thrown = error as {
      code?: string;
      message: string;
      cause?: { applicationCode?: string; details?: unknown };
    };
    return {
      code: thrown.code,
      message: thrown.message,
      applicationCode: thrown.cause?.applicationCode,
      details: thrown.cause?.details,
    };
  }
  throw new Error("expected the change to be refused, but it resolved");
}

beforeEach(() => {
  vi.clearAllMocks();
  onPlan("STARTER");
  policy.requireOrganizationBySlug.mockResolvedValue({ id: ORG_ID });
  policy.requireOrgMember.mockResolvedValue({ id: "mem-1", role: "owner" });
  db.organizationAIModel.findFirst.mockResolvedValue(null);
  db.organizationAIModel.create.mockResolvedValue({ id: MODEL_ID });
  db.organizationAIModel.update.mockResolvedValue({});
  db.organizationAIModel.updateMany.mockResolvedValue({ count: 1 });
  db.organizationAIModel.deleteMany.mockResolvedValue({ count: 1 });
  db.organization.update.mockResolvedValue({});
  db.organization.updateMany.mockResolvedValue({ count: 0 });
  db.$transaction.mockResolvedValue([]);
  probe.testByoaiConnection.mockResolvedValue(undefined);
});

describe("connecting an endpoint below the Business tier", () => {
  it("refuses a Starter organization adding a chat model, with the upgrade message", async () => {
    const error = await refusal(() => caller().addModel(newChatModel));

    expect(error.code).toBe("PAYMENT_REQUIRED");
    expect(error.applicationCode).toBe("entitlement.byoai_requires_upgrade");
    expect(error.message).toContain("Business");
    expect(wroteAnything()).toBe(false);
  });

  it("refuses before the endpoint is probed and before the key is encrypted", async () => {
    await refusal(() => caller().addModel(newChatModel));

    expect(probe.testByoaiConnection).not.toHaveBeenCalled();
    expect(crypto.encryptApiKey).not.toHaveBeenCalled();
    expect(ssrfGuard.assertSafeByoaiOutboundUrl).not.toHaveBeenCalled();
  });

  it("refuses a Starter organization re-pointing an endpoint it already has", async () => {
    db.organizationAIModel.findFirst.mockResolvedValue(storedModel());

    const error = await refusal(() =>
      caller().updateModel({
        orgSlug: ORG_SLUG,
        id: MODEL_ID,
        baseUrl: "https://other.example.com/v1",
      }),
    );

    expect(error.applicationCode).toBe("entitlement.byoai_requires_upgrade");
    expect(wroteAnything()).toBe(false);
  });

  it("permits the same additions on BUSINESS", async () => {
    onPlan("BUSINESS");

    await caller().addModel(newChatModel);

    expect(db.organizationAIModel.create).toHaveBeenCalledTimes(1);
    expect(probe.testByoaiConnection).toHaveBeenCalledTimes(1);
  });

  it("refuses a Starter organization probing an endpoint it has not saved", async () => {
    const probeInput = {
      orgSlug: ORG_SLUG,
      baseUrl: "https://models.example.com/v1",
      apiKey: "secret",
      modelId: "gpt-x",
      type: "CHAT" as const,
    };

    const listed = await refusal(() => caller().listRemoteModels(probeInput));
    const tested = await refusal(() => caller().testConnection(probeInput));

    expect(listed.applicationCode).toBe("entitlement.byoai_requires_upgrade");
    expect(tested.applicationCode).toBe("entitlement.byoai_requires_upgrade");

    expect(probe.listRemoteModels).not.toHaveBeenCalled();
    expect(probe.testByoaiConnection).not.toHaveBeenCalled();
    expect(ssrfGuard.assertSafeByoaiOutboundUrl).not.toHaveBeenCalled();
  });

  it("permits both probes on BUSINESS", async () => {
    onPlan("BUSINESS");
    probe.listRemoteModels.mockResolvedValue(["gpt-x"]);
    const probeInput = {
      orgSlug: ORG_SLUG,
      baseUrl: "https://models.example.com/v1",
      apiKey: "secret",
      modelId: "gpt-x",
      type: "CHAT" as const,
    };

    await caller().listRemoteModels(probeInput);
    await caller().testConnection(probeInput);

    expect(probe.listRemoteModels).toHaveBeenCalledTimes(1);
    expect(probe.testByoaiConnection).toHaveBeenCalledTimes(1);
  });

  it("the gate reads the organization resolved from the slug, after the role check", async () => {
    onPlan("BUSINESS");

    await caller().addModel(newChatModel);

    expect(policy.requireOrgMember).toHaveBeenCalledWith(
      ORG_ID,
      USER_ID,
      "admin_or_owner",
    );
    expect(db.organizationSubscription.findUnique).toHaveBeenCalledWith({
      where: { organizationId: ORG_ID },
      select: {
        plan: true,
        purchasedLearnerSeats: true,
        status: true,
        pastDueSince: true,
        currentPeriodStart: true,
      },
    });
  });
});

describe("selecting an endpoint is configuring one", () => {
  beforeEach(() => {
    db.organizationAIModel.findFirst.mockResolvedValue({ id: MODEL_ID });
  });

  it("refuses a Starter organization making a chat endpoint its default", async () => {
    const error = await refusal(() =>
      caller().setDefaultChatModel({ orgSlug: ORG_SLUG, modelId: MODEL_ID }),
    );

    expect(error.applicationCode).toBe("entitlement.byoai_requires_upgrade");
    expect(db.organization.update).not.toHaveBeenCalled();
  });

  it("refuses a Starter organization activating an image endpoint", async () => {
    const error = await refusal(() =>
      caller().setActiveImageModel({ orgSlug: ORG_SLUG, modelId: MODEL_ID }),
    );

    expect(error.applicationCode).toBe("entitlement.byoai_requires_upgrade");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("permits both on BUSINESS", async () => {
    onPlan("BUSINESS");

    await caller().setDefaultChatModel({
      orgSlug: ORG_SLUG,
      modelId: MODEL_ID,
    });
    await caller().setActiveImageModel({
      orgSlug: ORG_SLUG,
      modelId: MODEL_ID,
    });

    expect(db.organization.update).toHaveBeenCalledTimes(1);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe("a downgraded organization can always hand inference back", () => {
  it("lets a Starter organization delete the endpoint it configured on Business", async () => {
    db.organizationAIModel.findFirst.mockResolvedValue({ type: "CHAT" });

    await caller().deleteModel({ orgSlug: ORG_SLUG, id: MODEL_ID });

    expect(db.organizationAIModel.deleteMany).toHaveBeenCalledWith({
      where: { id: MODEL_ID, organizationId: ORG_ID },
    });
  });

  it("lets it switch chat back to our own model", async () => {
    await caller().setDefaultChatModel({ orgSlug: ORG_SLUG, modelId: null });

    expect(db.organization.update).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { defaultChatModelId: null },
    });
  });

  it("lets it turn every image endpoint off", async () => {
    await caller().setActiveImageModel({ orgSlug: ORG_SLUG, modelId: null });

    expect(db.organizationAIModel.updateMany).toHaveBeenCalledWith({
      where: { organizationId: ORG_ID, type: "IMAGE" },
      data: { isActive: false },
    });
  });
});

describe("a lapsed subscription withdraws the feature", () => {
  it("refuses a canceled Business organization, and says so", async () => {
    onPlan("BUSINESS", "CANCELED");

    const error = await refusal(() => caller().addModel(newChatModel));

    expect(error.message).toMatch(/lapsed/i);
    expect(wroteAnything()).toBe(false);
  });
});
