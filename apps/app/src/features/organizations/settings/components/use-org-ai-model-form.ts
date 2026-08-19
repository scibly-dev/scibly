"use client";

import type { ByoaiModelType } from "@/shared/ai/byoai/types";
import type { ByoaiProviderPresetId } from "@/shared/ai/byoai-provider-presets";
import type { OrgSettingsPage } from "../i18n/org-settings.types";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  byoaiContextWindowFieldSchema,
  byoaiModelDescriptionSchema,
} from "@/shared/ai/byoai-model-schema";
import {
  getByoaiProviderPreset,
  isManagedByoaiPreset,
} from "@/shared/ai/byoai-provider-presets";
import { api } from "@/shared/api/trpc/client";

export interface ModelFormState {
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  description?: string;

  contextWindow?: string;
}

interface ModelFormValues extends ModelFormState {
  presetId: ByoaiProviderPresetId;
}

export const EMPTY_FORM: ModelFormState = {
  name: "",
  baseUrl: "",
  apiKey: "",
  modelId: "",
  description: "",
  contextWindow: "",
};

const EMPTY_MODEL_FORM_VALUES: ModelFormValues = {
  ...EMPTY_FORM,
  presetId: "openai",
  baseUrl: getByoaiProviderPreset("openai").baseUrl,
};

type ModelFormParams = {
  orgSlug: string;
  modelType: ByoaiModelType;
  existingModelId?: string;
  initial: ModelFormState;
  isEdit: boolean;
  t: OrgSettingsPage["aiConfig"];
  onSave: (
    values: ModelFormState & { reuseCredentialsFromId?: string },
  ) => void;
};

function createModelFormSchema(
  messages: { apiKeyRequired: string; invalidUrl: string },
  requireApiKey: boolean,
) {
  return z
    .object({
      name: z.string().min(1, "Name is required"),
      presetId: z.custom<ByoaiProviderPresetId>(),
      baseUrl: z.string(),
      modelId: z.string().min(1, "Model ID is required"),
      apiKey: z.string(),
      description: byoaiModelDescriptionSchema,
      contextWindow: byoaiContextWindowFieldSchema,
    })
    .superRefine((data, context) => {
      if (!z.url(messages.invalidUrl).safeParse(data.baseUrl.trim()).success) {
        context.addIssue({
          code: "custom",
          message: messages.invalidUrl,
          path: ["baseUrl"],
        });
      }
      if (requireApiKey && !data.apiKey.trim()) {
        context.addIssue({
          code: "custom",
          message: messages.apiKeyRequired,
          path: ["apiKey"],
        });
      }
    });
}

function useModelFormCore(params: ModelFormParams) {
  const [remoteModels, setRemoteModels] = useState<string[]>([]);
  const [reuseCredentialsFromId, setReuseCredentialsFromId] = useState<
    string | null
  >(null);
  const [testState, setTestState] = useState<
    "idle" | "loading" | "ok" | "failed"
  >("idle");
  const requireApiKey =
    !params.isEdit && !reuseCredentialsFromId && !params.existingModelId;
  const resolver = useMemo(
    () =>
      zodResolver(
        createModelFormSchema(
          {
            apiKeyRequired: params.t.apiKeyPlaceholder,
            invalidUrl: "Must be a valid URL",
          },
          requireApiKey,
        ),
      ),
    [params.t.apiKeyPlaceholder, requireApiKey],
  );
  const form = useForm<ModelFormValues>({
    resolver,
    defaultValues: {
      ...EMPTY_MODEL_FORM_VALUES,
      ...params.initial,

      baseUrl: params.initial.baseUrl || EMPTY_MODEL_FORM_VALUES.baseUrl,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const baseUrl = useWatch({ control: form.control, name: "baseUrl" });
  const apiKey = useWatch({ control: form.control, name: "apiKey" });
  const modelId = useWatch({ control: form.control, name: "modelId" });
  const presetId =
    useWatch({ control: form.control, name: "presetId" }) ?? "openai";
  return {
    apiKey,
    baseUrl,
    form,
    modelId,
    presetId,
    remoteModels,
    reuseCredentialsFromId,
    setRemoteModels,
    setReuseCredentialsFromId,
    setTestState,
    testState,
  };
}

function deriveConnectionState(
  core: ReturnType<typeof useModelFormCore>,
  params: ModelFormParams,
) {
  const selectedPreset = getByoaiProviderPreset(core.presetId);
  const isBaseUrlLocked =
    Boolean(core.reuseCredentialsFromId) ||
    (!params.isEdit && isManagedByoaiPreset(core.presetId));

  const effectiveBaseUrl = core.baseUrl?.trim() ?? "";
  const canProbe = Boolean(
    effectiveBaseUrl &&
    core.modelId?.trim() &&
    (core.apiKey?.trim() ||
      params.existingModelId ||
      core.reuseCredentialsFromId),
  );
  return {
    canProbe,
    effectiveBaseUrl,
    isBaseUrlLocked,
    selectedPreset,
  };
}

function useModelProbeMutations(
  t: OrgSettingsPage["aiConfig"],
  core: ReturnType<typeof useModelFormCore>,
) {
  const listRemoteModelsMutation = api.orgAiConfig.listRemoteModels.useMutation(
    {
      onSuccess: (data) => {
        core.setRemoteModels(data.models);
        if (data.models.length === 0) {
          toast.message(t.fetchModelsEmpty);
          return;
        }
        toast.success(
          t.fetchModelsSuccess.replace("{count}", String(data.models.length)),
        );
      },
      onError: (error) => toast.error(error.message),
    },
  );
  const testConnectionMutation = api.orgAiConfig.testConnection.useMutation({
    onSuccess: () => {
      core.setTestState("ok");
      toast.success(t.testConnectionSuccess);
    },
    onError: (error) => {
      core.setTestState("failed");
      toast.error(error.message);
    },
  });
  return { listRemoteModelsMutation, testConnectionMutation };
}

function useModelFormActions(
  params: ModelFormParams,
  core: ReturnType<typeof useModelFormCore>,
  derived: ReturnType<typeof deriveConnectionState>,
) {
  const mutations = useModelProbeMutations(params.t, core);
  const applyPreset = (id: ByoaiProviderPresetId) => {
    core.setReuseCredentialsFromId(null);
    core.form.setValue("presetId", id, { shouldValidate: false });
    core.form.setValue(
      "baseUrl",
      id === "custom" ? "" : getByoaiProviderPreset(id).baseUrl,
      { shouldValidate: false },
    );
    core.setRemoteModels([]);
    core.setTestState("idle");
  };
  const handleFetchModels = () => {
    if (!derived.effectiveBaseUrl) return;
    mutations.listRemoteModelsMutation.mutate({
      orgSlug: params.orgSlug,
      baseUrl: derived.effectiveBaseUrl,
      apiKey: core.apiKey?.trim() || undefined,
      existingModelId: core.reuseCredentialsFromId ?? params.existingModelId,
    });
  };
  const handleTestConnection = () => {
    if (!derived.canProbe) return;
    core.setTestState("loading");
    mutations.testConnectionMutation.mutate({
      orgSlug: params.orgSlug,
      baseUrl: derived.effectiveBaseUrl,
      apiKey: core.apiKey?.trim() || undefined,
      modelId: core.modelId,
      type: params.modelType,
      existingModelId: core.reuseCredentialsFromId ?? params.existingModelId,
    });
  };
  const submit = core.form.handleSubmit((values) =>
    params.onSave({
      name: values.name,
      baseUrl: values.baseUrl,
      apiKey: values.apiKey,
      modelId: values.modelId,
      description: values.description,
      contextWindow: values.contextWindow,
      reuseCredentialsFromId: core.reuseCredentialsFromId ?? undefined,
    }),
  );
  return {
    applyPreset,
    handleFetchModels,
    handleTestConnection,
    submit,
    ...mutations,
  };
}

export function useOrgAiModelForm(params: ModelFormParams) {
  const core = useModelFormCore(params);
  const derived = deriveConnectionState(core, params);
  const actions = useModelFormActions(params, core, derived);
  return {
    ...core.form,
    ...actions,
    ...derived,
    apiKey: core.apiKey,
    baseUrl: core.baseUrl,
    modelId: core.modelId,
    presetId: core.presetId,
    remoteModels: core.remoteModels,
    reuseCredentialsFromId: core.reuseCredentialsFromId,
    setReuseCredentialsFromId: core.setReuseCredentialsFromId,
    setTestState: core.setTestState,
    testState: core.testState,
  };
}
