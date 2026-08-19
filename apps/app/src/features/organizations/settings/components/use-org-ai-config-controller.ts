"use client";

import type { ByoaiModelType } from "@/shared/ai/byoai/types";
import type { ModelDialogState } from "./org-ai-model-dialog";
import type { ModelFormState } from "./org-ai-model-form";

import { useState } from "react";

import { buildModelUpdatePayload } from "./build-model-update-payload";
import {
  buildAddModelPayload,
  buildEditDialogState,
  type CapabilityTab,
  type DeleteTarget,
  type EditableByoaiModel,
  findDialogModel,
} from "./org-ai-config-controller-utils";
import {
  useControllerMutations,
  useModelCollections,
} from "./use-org-ai-controller-mutations";

type ControllerTranslations = {
  savedSuccessfully: string;
  removedSuccessfully: string;
};

export function useOrgAiConfigController(
  orgSlug: string,
  t: ControllerTranslations,
) {
  const collections = useModelCollections(orgSlug);
  const [activeTab, setActiveTab] = useState<CapabilityTab>("chat");
  const [dialogState, setDialogState] = useState<ModelDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const { crud, selection } = useControllerMutations({
    orgSlug,
    t,
    setDialogState,
    setDeleteTarget,
  });

  const handleDialogSave = (
    values: ModelFormState & { reuseCredentialsFromId?: string },
    context: ModelDialogState,
  ) => {
    if (context.mode === "add") {
      crud.addMutation.mutate(
        buildAddModelPayload(orgSlug, values, context.modelType),
      );
      return;
    }
    const model = findDialogModel(context, collections);
    if (!model) return;
    const payload = buildModelUpdatePayload(
      orgSlug,
      context.modelId,
      {
        name: model.name,
        baseUrl: model.baseUrl,
        modelId: model.modelId,
        description: model.description,
        contextWindow: model.contextWindow,
      },
      values,
      { includeDescription: context.modelType === "CHAT" },
    );
    if (!payload) {
      setDialogState(null);
      return;
    }
    crud.updateMutation.mutate(payload);
  };

  return {
    activeTab,
    setActiveTab,
    chatModels: collections.chatModels,
    imageModels: collections.imageModels,
    preferences: collections.preferences,
    isSciblyDefaultChatActive: !collections.preferences?.defaultChatModelId,
    dialogState,
    setDialogState,
    deleteTarget,
    setDeleteTarget,
    credentialSources: collections.credentialSources,
    isSaving: crud.addMutation.isPending || crud.updateMutation.isPending,
    isDeletePending: crud.deleteMutation.isPending,
    isDefaultChatPending: selection.setDefaultChatModelMutation.isPending,
    isImagePending: selection.setActiveImageModelMutation.isPending,
    handleDialogSave,
    confirmDelete: () => {
      if (!deleteTarget) return;
      crud.deleteMutation.mutate({ orgSlug, id: deleteTarget.id });
    },
    openAddForTab: (tab: CapabilityTab) => {
      const modelType: ByoaiModelType = tab === "chat" ? "CHAT" : "IMAGE";
      setDialogState({ mode: "add", modelType });
    },
    openEditDialog: (
      modelType: ByoaiModelType,
      model: EditableByoaiModel,
      showDescription = false,
    ) =>
      setDialogState(buildEditDialogState(modelType, model, showDescription)),
    setDefaultChatModel: (modelId: string | null) =>
      selection.setDefaultChatModelMutation.mutate({ orgSlug, modelId }),
    setActiveImageModel: (modelId: string | null) =>
      selection.setActiveImageModelMutation.mutate({ orgSlug, modelId }),
  };
}
