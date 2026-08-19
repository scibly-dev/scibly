"use client";

import type { DeleteTarget } from "./org-ai-config-controller-utils";
import type { ModelDialogState } from "./org-ai-model-dialog";

import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

type ControllerTranslations = {
  savedSuccessfully: string;
  removedSuccessfully: string;
};

export function useModelCollections(orgSlug: string) {
  const { data: allModels = [] } = api.orgAiConfig.listModels.useQuery({
    orgSlug,
  });
  const { data: preferences } = api.orgAiConfig.getPreferences.useQuery({
    orgSlug,
  });
  return {
    allModels,
    chatModels: allModels.filter((model) => model.type === "CHAT"),
    credentialSources: allModels.map((model) => ({
      id: model.id,
      name: model.name,
      baseUrl: model.baseUrl,
    })),
    imageModels: allModels.filter((model) => model.type === "IMAGE"),
    preferences,
  };
}

function useModelCrudMutations({
  t,
  invalidateModels,
  setDialogState,
  setDeleteTarget,
}: {
  t: ControllerTranslations;
  invalidateModels: () => void;
  setDialogState: (state: ModelDialogState | null) => void;
  setDeleteTarget: (target: DeleteTarget | null) => void;
}) {
  const addMutation = api.orgAiConfig.addModel.useMutation({
    onSuccess: () => {
      toast.success(t.savedSuccessfully);
      setDialogState(null);
      invalidateModels();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = api.orgAiConfig.updateModel.useMutation({
    onSuccess: () => {
      toast.success(t.savedSuccessfully);
      setDialogState(null);
      invalidateModels();
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = api.orgAiConfig.deleteModel.useMutation({
    onSuccess: () => {
      toast.success(t.removedSuccessfully);
      setDeleteTarget(null);
      invalidateModels();
    },
    onError: (error) => toast.error(error.message),
  });
  return { addMutation, deleteMutation, updateMutation };
}

function useModelSelectionMutations(
  orgSlug: string,
  t: ControllerTranslations,
  invalidateModels: () => void,
) {
  const utils = api.useUtils();
  const setActiveImageModelMutation =
    api.orgAiConfig.setActiveImageModel.useMutation({
      onSuccess: () => {
        toast.success(t.savedSuccessfully);
        invalidateModels();
      },
      onError: (error) => toast.error(error.message),
    });
  const setDefaultChatModelMutation =
    api.orgAiConfig.setDefaultChatModel.useMutation({
      onSuccess: () => {
        toast.success(t.savedSuccessfully);
        void utils.orgAiConfig.getPreferences.invalidate({ orgSlug });
        invalidateModels();
      },
      onError: (error) => toast.error(error.message),
    });
  return { setActiveImageModelMutation, setDefaultChatModelMutation };
}

export function useControllerMutations({
  orgSlug,
  t,
  setDialogState,
  setDeleteTarget,
}: {
  orgSlug: string;
  t: ControllerTranslations;
  setDialogState: (state: ModelDialogState | null) => void;
  setDeleteTarget: (target: DeleteTarget | null) => void;
}) {
  const utils = api.useUtils();
  const invalidateModels = () => {
    void utils.orgAiConfig.listModels.invalidate({ orgSlug });
  };
  const crud = useModelCrudMutations({
    t,
    invalidateModels,
    setDialogState,
    setDeleteTarget,
  });
  const selection = useModelSelectionMutations(orgSlug, t, invalidateModels);
  return { crud, selection };
}
