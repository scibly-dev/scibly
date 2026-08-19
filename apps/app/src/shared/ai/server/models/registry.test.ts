import type * as Ai from "ai";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnsafeOutboundUrlError } from "@/lib/network/ssrf-guard";
import { ChatError } from "@/shared/ai/errors";

const db = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  organizationAIModel: { findFirst: vi.fn() },
}));

const env = vi.hoisted(() => ({
  SCIBLY_DEFAULT_CHAT_MODEL: "vendor/flagship-4",
  SCIBLY_DEFAULT_IMAGE_MODEL: "vendor/image-2",
  AI_GATEWAY_API_KEY: "gateway-key",
}));

const gateway = vi.hoisted(() => ({ languageModel: vi.fn() }));
const openai = vi.hoisted(() => ({ createOpenAI: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/env", () => ({ env }));
vi.mock("@/lib/crypto/api-key", () => ({
  decryptApiKey: (value: string) => value.replace("sealed:", ""),
}));
vi.mock("@ai-sdk/openai", () => openai);
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof Ai>();
  return { ...actual, createGateway: () => gateway };
});

const {
  DEFAULT_CONTEXT_WINDOW,
  FALLBACK_CAPABILITIES,
  getLanguageModel,
  getModelCapabilities,
  resolveContextWindow,
} = await import("./registry");
const { DEFAULT_MODEL_ID } = await import("@/shared/ai/models");

const ORG = "biology-dept";
const OTHER_ORG = "chemistry-dept";
const BYOAI_RECORD = "org-model-1";

function orgModels(
  records: {
    id: string;
    baseUrl: string;
    modelId: string;
    contextWindow?: number | null;
  }[],
  defaultChatModelId: string | null = null,
) {
  const stored = records.map((record) => ({
    ...record,
    name: "In-house model",
    apiKeyEncrypted: "sealed:org-secret",
  }));

  db.organization.findUnique.mockImplementation(
    ({ where }: { where: { slug: string } }) =>
      where.slug === ORG
        ? { defaultChatModelId, organizationAIModels: stored }
        : { defaultChatModelId: null, organizationAIModels: [] },
  );

  db.organizationAIModel.findFirst.mockImplementation(
    ({ where }: { where: { id: string; organization: { slug: string } } }) =>
      where.organization.slug === ORG
        ? (stored.find((record) => record.id === where.id) ?? null)
        : null,
  );
}

function onPremEndpoint(baseUrl = "https://models.biology.example/v1") {
  return { id: BYOAI_RECORD, baseUrl, modelId: "in-house-7b" };
}

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof ChatError) {
      return { applicationCode: error.applicationCode, message: error.message };
    }
    throw error;
  }
  throw new Error("expected the model to be refused, but it resolved");
}

function gatewayAnswers(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) })),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  gateway.languageModel.mockImplementation((id: string) => ({
    kind: "gateway",
    id,
  }));
  openai.createOpenAI.mockImplementation((config: unknown) => ({
    chat: (modelId: string) => ({ kind: "byoai", config, modelId }),
  }));
  orgModels([onPremEndpoint()]);
});

describe("CM1: a turn runs on the model the author named, or not at all", () => {
  it("CM1: an invented Scibly model is refused rather than answered by the default", async () => {
    expect(await refusal(() => getLanguageModel("scibly/pro", ORG))).toEqual({
      applicationCode: "bad_request:model",
      message: expect.stringContaining("isn't available for this organization"),
    });
    expect(gateway.languageModel).not.toHaveBeenCalled();
  });

  it("CM1: a stale BYOAI id for an endpoint an admin removed is refused, not silently billed", async () => {
    orgModels([]);

    expect(
      await refusal(() => getLanguageModel(`byoai:${BYOAI_RECORD}`, ORG)),
    ).toMatchObject({ applicationCode: "bad_request:model" });
    expect(gateway.languageModel).not.toHaveBeenCalled();
    expect(openai.createOpenAI).not.toHaveBeenCalled();
  });

  it("CM1: a name from another vendor's catalogue is refused", async () => {
    expect(
      await refusal(() => getLanguageModel("vendor/flagship-4", ORG)),
    ).toMatchObject({ applicationCode: "bad_request:model" });
  });

  it("CM1: naming nothing at all runs the default the author is offered", async () => {
    const { id, model } = await getLanguageModel(undefined, ORG);

    expect(id).toBe(DEFAULT_MODEL_ID);
    expect(model).toEqual({ kind: "gateway", id: "vendor/flagship-4" });
  });

  it("CM1: naming nothing runs the organization's own model when it chose one", async () => {
    orgModels([onPremEndpoint()], BYOAI_RECORD);

    const { id, isByoai } = await getLanguageModel(undefined, ORG);

    expect({ id, isByoai }).toEqual({
      id: `byoai:${BYOAI_RECORD}`,
      isByoai: true,
    });
  });
});

describe("CM2: a BYOAI endpoint belongs to one organization", () => {
  it("CM2: the endpoints consulted are the ones configured in the notebook's organization", async () => {
    await getLanguageModel(`byoai:${BYOAI_RECORD}`, ORG);

    expect(db.organizationAIModel.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization: { slug: ORG } }),
      }),
    );
  });

  it("CM2: another organization's endpoint id is not found, so its credentials are never spent", async () => {
    expect(
      await refusal(() => getLanguageModel(`byoai:${BYOAI_RECORD}`, OTHER_ORG)),
    ).toMatchObject({ applicationCode: "bad_request:model" });
    expect(openai.createOpenAI).not.toHaveBeenCalled();
  });
});

describe("CM3: where a BYOAI turn is allowed to be sent", () => {
  const unsafe: [string, string][] = [
    ["the cloud metadata service", "http://169.254.169.254/v1"],
    ["a host on the private network", "https://10.0.0.7/v1"],
    ["the machine the server runs on", "http://localhost:11434/v1"],
  ];

  it.each(unsafe)(
    "CM3: an endpoint pointing at %s is refused before it is dialled",
    async (_case, baseUrl) => {
      orgModels([onPremEndpoint(baseUrl)]);

      await expect(
        getLanguageModel(`byoai:${BYOAI_RECORD}`, ORG),
      ).rejects.toBeInstanceOf(UnsafeOutboundUrlError);
      expect(openai.createOpenAI).not.toHaveBeenCalled();
    },
  );

  it("CM3: an ordinary public endpoint is dialled with the organization's own key", async () => {
    await getLanguageModel(`byoai:${BYOAI_RECORD}`, ORG);

    expect(openai.createOpenAI).toHaveBeenCalledWith({
      baseURL: "https://models.biology.example/v1",
      apiKey: "org-secret",
    });
  });
});

describe("CM4: the id a turn reports back is the model that ran", () => {
  it("CM4: a BYOAI turn reports the endpoint it was answered by", async () => {
    const { id, model } = await getLanguageModel(`byoai:${BYOAI_RECORD}`, ORG);

    expect(id).toBe(`byoai:${BYOAI_RECORD}`);
    expect(model).toMatchObject({ kind: "byoai", modelId: "in-house-7b" });
  });

  it("CM4: a Scibly turn reports the public id the author chose, on the gateway model behind it", async () => {
    const { id, model } = await getLanguageModel(DEFAULT_MODEL_ID, ORG);

    expect(id).toBe(DEFAULT_MODEL_ID);
    expect(model).toEqual({ kind: "gateway", id: "vendor/flagship-4" });
  });
});

describe("CM5: a model whose capabilities cannot be established", () => {
  it("CM5: a gateway that refuses the question leaves the tools on", async () => {
    gatewayAnswers({}, false);

    expect(await getModelCapabilities(DEFAULT_MODEL_ID)).toEqual(
      FALLBACK_CAPABILITIES,
    );
    expect(FALLBACK_CAPABILITIES.tools).toBe(true);
  });

  it("CM5: a gateway that cannot be reached at all leaves the tools on", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("ECONNREFUSED"))),
    );

    expect(await getModelCapabilities(DEFAULT_MODEL_ID)).toEqual(
      FALLBACK_CAPABILITIES,
    );
  });

  it("CM5: an answer we cannot read establishes nothing, so the tools stay on", async () => {
    gatewayAnswers({ data: { endpoints: "unexpected" } });

    expect(await getModelCapabilities(DEFAULT_MODEL_ID)).toEqual(
      FALLBACK_CAPABILITIES,
    );
  });

  it("CM5: a BYOAI endpoint, which cannot be asked, keeps its tools", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect(await getModelCapabilities(`byoai:${BYOAI_RECORD}`)).toEqual(
      FALLBACK_CAPABILITIES,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("CM5: a gateway that does answer is believed - the fallback is not a blanket yes", async () => {
    gatewayAnswers({
      data: {
        endpoints: [{ supported_parameters: ["reasoning"] }],
        architecture: { input_modalities: ["text", "image"] },
      },
    });

    expect(await getModelCapabilities(DEFAULT_MODEL_ID)).toEqual({
      tools: false,
      vision: true,
      contextWindow: null,
    });
  });
});

describe("how much the model can be told at once", () => {
  it("takes the largest window across the endpoints serving the model", async () => {
    gatewayAnswers({
      data: {
        endpoints: [
          { context_length: 1_000_000 },
          { context_length: 1_048_576 },
          { context_length: 128_000 },
        ],
      },
    });

    const caps = await getModelCapabilities(DEFAULT_MODEL_ID);

    expect(caps.contextWindow).toBe(1_048_576);
  });

  it("reports no window rather than a guess when the gateway omits it", async () => {
    gatewayAnswers({
      data: { endpoints: [{ supported_parameters: ["tools"] }] },
    });

    const caps = await getModelCapabilities(DEFAULT_MODEL_ID);

    expect(caps.contextWindow).toBeNull();
    expect(resolveContextWindow(caps)).toBe(DEFAULT_CONTEXT_WINDOW);
  });

  it("falls back for a model that was never asked about at all", () => {
    expect(resolveContextWindow(undefined)).toBe(DEFAULT_CONTEXT_WINDOW);
  });

  it("reads a BYOAI window from what the organization configured", async () => {
    orgModels([{ ...onPremEndpoint(), contextWindow: 32_768 }]);

    const caps = await getModelCapabilities(`byoai:${BYOAI_RECORD}`, ORG);

    expect(caps.contextWindow).toBe(32_768);
  });

  it("falls back when the organization never stated one", async () => {
    orgModels([{ ...onPremEndpoint(), contextWindow: null }]);

    const caps = await getModelCapabilities(`byoai:${BYOAI_RECORD}`, ORG);

    expect(resolveContextWindow(caps)).toBe(DEFAULT_CONTEXT_WINDOW);
  });

  it("does not read a gateway model's org record at all", async () => {
    gatewayAnswers({ data: { endpoints: [{ context_length: 200_000 }] } });

    await getModelCapabilities(DEFAULT_MODEL_ID, ORG);

    expect(db.organizationAIModel.findFirst).not.toHaveBeenCalled();
  });
});
