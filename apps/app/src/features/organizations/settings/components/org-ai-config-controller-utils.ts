import type { ByoaiModelType, OrgByoaiModel } from "@/shared/ai/byoai/types";
import type { ModelDialogState } from "./org-ai-model-dialog";
import type { ModelFormState } from "./org-ai-model-form";

export type EditableByoaiModel = Pick<
  OrgByoaiModel,
  "id" | "name" | "baseUrl" | "modelId" | "description" | "contextWindow"
>;
export type CapabilityTab = "chat" | "image";
export type DeleteTarget = {
  id: string;
  name: string;
};

export function buildAddModelPayload(
  orgSlug: string,
  values: ModelFormState & { reuseCredentialsFromId?: string },
  type: ByoaiModelType,
) {
  return {
    orgSlug,
    name: values.name,
    baseUrl: values.baseUrl,
    apiKey: values.reuseCredentialsFromId ? undefined : values.apiKey,
    modelId: values.modelId,
    description: values.description,
    contextWindow: values.contextWindow,
    type,
    reuseCredentialsFromId: values.reuseCredentialsFromId,
  };
}

export function findDialogModel(
  context: ModelDialogState,
  models: {
    imageModels: OrgByoaiModel[];
    chatModels: OrgByoaiModel[];
  },
) {
  if (context.mode !== "edit") return null;
  const candidates =
    context.modelType === "IMAGE" ? models.imageModels : models.chatModels;
  return candidates.find((item) => item.id === context.modelId) ?? null;
}

export function buildEditDialogState(
  modelType: ByoaiModelType,
  model: EditableByoaiModel,
  showDescription: boolean,
): ModelDialogState {
  return {
    mode: "edit",
    modelType,
    modelId: model.id,
    showDescription,
    initial: {
      name: model.name,
      baseUrl: model.baseUrl,
      modelId: model.modelId,
      apiKey: "",
      description: model.description ?? "",
      contextWindow: model.contextWindow ? String(model.contextWindow) : "",
    },
  };
}
