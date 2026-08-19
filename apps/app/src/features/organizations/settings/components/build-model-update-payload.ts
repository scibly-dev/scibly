import type { ModelFormState } from "./org-ai-model-form";

export interface StoredByoaiModelValues {
  name: string;
  baseUrl: string;
  modelId: string;
  description?: string | null;
  contextWindow?: number | null;
}

interface ModelUpdateInput {
  orgSlug: string;
  id: string;
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  modelId?: string;
  description?: string | null;

  contextWindow?: string | null;
}

function changedConnectionFields(
  stored: StoredByoaiModelValues,
  submitted: ModelFormState,
): Pick<ModelUpdateInput, "baseUrl" | "apiKey" | "modelId"> {
  const apiKey = submitted.apiKey.trim();
  const changed: Pick<ModelUpdateInput, "baseUrl" | "apiKey" | "modelId"> = {};
  if (submitted.baseUrl !== stored.baseUrl) changed.baseUrl = submitted.baseUrl;
  if (submitted.modelId !== stored.modelId) changed.modelId = submitted.modelId;
  if (apiKey) changed.apiKey = apiKey;
  return changed;
}

function changedDescription(
  stored: StoredByoaiModelValues,
  submitted: ModelFormState,
  includeDescription: boolean,
): Pick<ModelUpdateInput, "description"> {
  if (!includeDescription) return {};
  const nextDescription = submitted.description?.trim() ?? "";
  const storedDescription = stored.description?.trim() ?? "";
  return nextDescription === storedDescription
    ? {}
    : { description: nextDescription || null };
}

function changedContextWindow(
  stored: StoredByoaiModelValues,
  submitted: ModelFormState,
): Pick<ModelUpdateInput, "contextWindow"> {
  const next = submitted.contextWindow?.trim() ?? "";
  const storedWindow = stored.contextWindow ? String(stored.contextWindow) : "";
  return next === storedWindow ? {} : { contextWindow: next || null };
}

export function buildModelUpdatePayload(
  orgSlug: string,
  modelId: string,
  stored: StoredByoaiModelValues,
  submitted: ModelFormState,
  options?: { includeDescription?: boolean },
): ModelUpdateInput | null {
  const changes: Omit<ModelUpdateInput, "orgSlug" | "id"> = {
    ...changedConnectionFields(stored, submitted),
    ...changedDescription(
      stored,
      submitted,
      options?.includeDescription ?? false,
    ),
    ...changedContextWindow(stored, submitted),
  };
  if (submitted.name !== stored.name) changes.name = submitted.name;
  return Object.keys(changes).length > 0
    ? { orgSlug, id: modelId, ...changes }
    : null;
}
