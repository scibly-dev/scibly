import type { ImageModel, LanguageModel } from "ai";

import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@scibly/db";
import { createGateway } from "ai";

import { env } from "@/env";
import { decryptApiKey } from "@/lib/crypto/api-key";
import { assertSafeByoaiOutboundUrl } from "@/lib/network/ssrf-guard";
import { ChatError } from "@/shared/ai/errors";
import {
  byoaiModelId,
  DEFAULT_MODEL_ID,
  isOfferedSciblyModelId,
  parseByoaiId,
} from "@/shared/ai/models";

interface OrgAIModel {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

type ModelCapabilities = {
  tools: boolean;
  vision: boolean;

  contextWindow: number | null;
};

export const DEFAULT_CONTEXT_WINDOW = 128_000;

export function resolveContextWindow(
  capabilities: ModelCapabilities | undefined,
): number {
  return capabilities?.contextWindow ?? DEFAULT_CONTEXT_WINDOW;
}

// Used when capabilities can't be introspected; tools stay ON since silently disabling every tool is worse than leaving them enabled.
export const FALLBACK_CAPABILITIES: ModelCapabilities = {
  tools: true,
  vision: false,
  contextWindow: null,
};

async function fetchGatewayCapabilities(
  gatewayId: string,
): Promise<ModelCapabilities> {
  const res = await fetch(
    `https://ai-gateway.vercel.sh/v1/models/${gatewayId}/endpoints`,
    { next: { revalidate: 86_400 } },
  );
  if (!res.ok) {
    return FALLBACK_CAPABILITIES;
  }

  const json = await res.json();
  const endpoints = json.data?.endpoints;

  if (!Array.isArray(endpoints)) {
    return FALLBACK_CAPABILITIES;
  }
  const params = new Set(
    endpoints.flatMap(
      (e: { supported_parameters?: string[] }) => e.supported_parameters ?? [],
    ),
  );
  const inputModalities = new Set(
    json.data?.architecture?.input_modalities ?? [],
  );

  const windows = endpoints
    .map((e: { context_length?: number }) => e.context_length)
    .filter((n: unknown): n is number => typeof n === "number" && n > 0);

  return {
    tools: params.has("tools"),
    vision: inputModalities.has("image"),
    contextWindow: windows.length > 0 ? Math.max(...windows) : null,
  };
}

async function loadByoaiContextWindow(
  orgSlug: string,
  modelRecordId: string,
): Promise<number | null> {
  const model = await db.organizationAIModel.findFirst({
    where: {
      id: modelRecordId,
      type: "CHAT",
      organization: { slug: orgSlug },
    },
    select: { contextWindow: true },
  });

  return model?.contextWindow ?? null;
}

export async function getModelCapabilities(
  modelId: string = DEFAULT_MODEL_ID,
  orgSlug?: string,
): Promise<ModelCapabilities> {
  const byoaiId = parseByoaiId(modelId);
  if (byoaiId !== null) {
    return {
      ...FALLBACK_CAPABILITIES,
      contextWindow: orgSlug
        ? await loadByoaiContextWindow(orgSlug, byoaiId)
        : null,
    };
  }

  try {
    return await fetchGatewayCapabilities(env.SCIBLY_DEFAULT_CHAT_MODEL);
  } catch {
    return FALLBACK_CAPABILITIES;
  }
}

const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

const BYOAI_MODEL_FIELDS = {
  id: true,
  name: true,
  baseUrl: true,
  apiKeyEncrypted: true,
  modelId: true,
} as const;

function toOrgAIModel(record: {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyEncrypted: string;
  modelId: string;
}): OrgAIModel {
  return {
    id: record.id,
    name: record.name,
    baseUrl: record.baseUrl,
    apiKey: decryptApiKey(record.apiKeyEncrypted),
    modelId: record.modelId,
  };
}

async function findByoaiChatModel(
  orgSlug: string,
  modelRecordId: string,
): Promise<OrgAIModel | null> {
  const record = await db.organizationAIModel.findFirst({
    where: {
      id: modelRecordId,
      type: "CHAT",
      organization: { slug: orgSlug },
    },
    select: BYOAI_MODEL_FIELDS,
  });

  return record ? toOrgAIModel(record) : null;
}

async function loadOrgImageModel(orgSlug: string): Promise<OrgAIModel | null> {
  const record = await db.organizationAIModel.findFirst({
    where: {
      type: "IMAGE",
      isActive: true,
      organization: { slug: orgSlug },
    },
    select: BYOAI_MODEL_FIELDS,
  });

  return record ? toOrgAIModel(record) : null;
}

async function createByoaiOpenAI(model: OrgAIModel) {
  await assertSafeByoaiOutboundUrl(model.baseUrl);
  return createOpenAI({ baseURL: model.baseUrl, apiKey: model.apiKey });
}

export type ImageGenerationBackend =
  | { kind: "gateway"; model: LanguageModel }
  | { kind: "byoai"; model: ImageModel };

export async function resolveImageGenerationBackend(
  orgSlug: string,
): Promise<ImageGenerationBackend> {
  const orgImageModel = await loadOrgImageModel(orgSlug);
  if (orgImageModel) {
    return {
      kind: "byoai",
      model: (await createByoaiOpenAI(orgImageModel)).image(
        orgImageModel.modelId,
      ),
    };
  }

  return {
    kind: "gateway",
    model: gateway.languageModel(env.SCIBLY_DEFAULT_IMAGE_MODEL),
  };
}

export const IMAGE_MODEL_TIMEOUT_MS = 90_000;

// Gemini image models are registered as language models on AI Gateway; image output comes via providerOptions.google.responseModalities on result.files.
export function getImageGenerationLanguageModel(
  modelId: string = env.SCIBLY_DEFAULT_IMAGE_MODEL,
): LanguageModel {
  return gateway.languageModel(modelId);
}

type ImageGenerationAspectRatio = `${number}:${number}`;

const isAspectRatio = (value: string): value is ImageGenerationAspectRatio =>
  /^\d+:\d+$/.test(value);

export function resolveImageGenerationAspectRatio(
  aspectRatio?: string,
): ImageGenerationAspectRatio | undefined {
  if (!aspectRatio || !isAspectRatio(aspectRatio)) return undefined;
  return aspectRatio;
}

async function resolveByoaiLanguageModel(
  byoaiId: string,
  requestedId: string,
  orgSlug: string,
): Promise<LanguageModel> {
  const orgModel = await findByoaiChatModel(orgSlug, byoaiId);
  if (!orgModel) {
    throw new ChatError(
      "bad_request:model",
      `BYOAI model "${requestedId}" is not configured for this organization.`,
    );
  }
  return (await createByoaiOpenAI(orgModel)).chat(orgModel.modelId);
}

function resolveSciblyLanguageModel(id: string): LanguageModel {
  if (!isOfferedSciblyModelId(id)) {
    throw new ChatError(
      "bad_request:model",
      `Model "${id}" is not one this organization offers.`,
    );
  }

  return gateway.languageModel(env.SCIBLY_DEFAULT_CHAT_MODEL);
}

async function orgDefaultChatModelId(orgSlug: string): Promise<string> {
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { defaultChatModelId: true },
  });
  return org?.defaultChatModelId
    ? byoaiModelId(org.defaultChatModelId)
    : DEFAULT_MODEL_ID;
}

export async function getLanguageModel(
  modelId: string | undefined,
  orgSlug: string,
): Promise<{ id: string; model: LanguageModel; isByoai: boolean }> {
  const id = modelId ?? (await orgDefaultChatModelId(orgSlug));
  const byoaiId = parseByoaiId(id);

  const model =
    byoaiId !== null
      ? await resolveByoaiLanguageModel(byoaiId, id, orgSlug)
      : resolveSciblyLanguageModel(id);

  return { id, model, isByoai: byoaiId !== null };
}
