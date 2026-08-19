import type { ByoaiModelType } from "@/shared/ai/byoai/types";

import { z } from "zod";

export const REQUEST_TIMEOUT_MS = 15_000;

interface ByoaiEndpointConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function openAiHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

const modelsCatalogSchema = z
  .object({
    data: z.array(z.object({ id: z.string().optional() }).catch({})).catch([]),
  })
  .catch({ data: [] });

async function readErrorMessage(response: Response): Promise<string> {
  const body = await response.text().catch(() => "");
  return (
    body.trim() || `Request failed (${response.status} ${response.statusText}).`
  );
}

async function fetchModelsCatalog(
  config: Pick<ByoaiEndpointConfig, "baseUrl" | "apiKey">,
): Promise<string[]> {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const response = await fetch(`${baseUrl}/models`, {
    headers: openAiHeaders(config.apiKey),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const ids = modelsCatalogSchema
    .parse(await response.json())
    .data.map((entry) => entry.id?.trim())
    .filter((id): id is string => Boolean(id));

  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

async function pingModelMetadata(
  config: ByoaiEndpointConfig,
): Promise<boolean> {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const response = await fetch(
    `${baseUrl}/models/${encodeURIComponent(config.modelId)}`,
    {
      headers: openAiHeaders(config.apiKey),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (response.ok) {
    return true;
  }

  if (
    response.status === 404 ||
    response.status === 405 ||
    response.status === 501
  ) {
    return false;
  }

  throw new Error(await readErrorMessage(response));
}

export async function listRemoteModels(
  config: Pick<ByoaiEndpointConfig, "baseUrl" | "apiKey">,
): Promise<string[]> {
  return fetchModelsCatalog(config);
}

export async function testByoaiConnection(
  type: ByoaiModelType,
  config: ByoaiEndpointConfig,
): Promise<void> {
  const modelMetadataAvailable = await pingModelMetadata(config);
  if (modelMetadataAvailable) {
    return;
  }

  const catalogIds = await fetchModelsCatalog(config);
  if (catalogIds.length === 0) {
    throw new Error(
      `Model "${config.modelId}" was not found on this endpoint for ${type} models. The models catalog is empty or unavailable.`,
    );
  }

  const trimmedModelId = config.modelId.trim();
  const matchesCatalog = catalogIds.some(
    (id) => id === trimmedModelId || id.endsWith(`/${trimmedModelId}`),
  );
  if (!matchesCatalog) {
    throw new Error(
      `Model "${config.modelId}" was not found on this endpoint for ${type} models. Check the model ID or fetch models from the endpoint.`,
    );
  }
}
