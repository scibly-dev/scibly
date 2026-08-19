"use client";

import type { ByoaiModelType } from "@/shared/ai/byoai/types";
import type { OrgSettingsPage } from "../i18n/org-settings.types";
import type { CredentialSource } from "./org-ai-model-form-fields";
import type { ModelFormState } from "./use-org-ai-model-form";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { Loader2 } from "lucide-react";

import { OrgAiModelFormFields } from "./org-ai-model-form-fields";
import { EMPTY_FORM, useOrgAiModelForm } from "./use-org-ai-model-form";

export { EMPTY_FORM };
export type { ModelFormState };

interface ModelFormProps {
  orgSlug: string;
  modelType: ByoaiModelType;
  existingModelId?: string;
  credentialSources?: CredentialSource[];
  initial: ModelFormState;
  isEdit: boolean;
  isSaving: boolean;
  showDescription?: boolean;
  variant?: "inline" | "dialog";
  t: OrgSettingsPage["aiConfig"];
  onSave: (
    values: ModelFormState & { reuseCredentialsFromId?: string },
  ) => void;
  onCancel: () => void;
}

function getModelFormTitle(
  props: Pick<ModelFormProps, "isEdit" | "initial" | "modelType" | "t">,
) {
  if (props.isEdit) return props.initial.name;
  if (props.modelType === "IMAGE") return props.t.addImageModelTitle;
  return props.t.addModelTitle;
}

function getSaveButtonText(
  isSaving: boolean,
  isEdit: boolean,
  t: OrgSettingsPage["aiConfig"],
) {
  if (isSaving) return isEdit ? t.savingButton : t.addingButton;
  return isEdit ? t.saveButton : t.addButton;
}

export const ModelFormActions = ({
  controller,
  isSaving,
  isEdit,
  t,
  onCancel,
}: {
  controller: ReturnType<typeof useOrgAiModelForm>;
  isSaving: boolean;
  isEdit: boolean;
  t: OrgSettingsPage["aiConfig"];
  onCancel: () => void;
}) => (
  <div className="flex flex-wrap items-center gap-2 pt-1">
    <Button type="submit" size="sm" disabled={isSaving}>
      {isSaving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : null}
      {getSaveButtonText(isSaving, isEdit, t)}
    </Button>
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={controller.handleTestConnection}
      disabled={
        !controller.canProbe || controller.testConnectionMutation.isPending
      }
    >
      {controller.testConnectionMutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : null}
      {t.testConnectionButton}
    </Button>
    {controller.testState === "ok" ? (
      <span className="text-[12px] text-emerald-600 dark:text-emerald-400">
        {t.testConnectionSuccess}
      </span>
    ) : null}
    {controller.testState === "failed" ? (
      <span className="text-[12px] text-red-600 dark:text-red-400">
        {t.testConnectionFailed}
      </span>
    ) : null}
    <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
      {t.cancelButton}
    </Button>
  </div>
);

export function ModelForm({
  orgSlug,
  modelType,
  existingModelId,
  credentialSources = [],
  initial,
  isEdit,
  isSaving,
  showDescription = false,
  variant = "inline",
  t,
  onSave,
  onCancel,
}: ModelFormProps) {
  const controller = useOrgAiModelForm({
    orgSlug,
    modelType,
    existingModelId,
    initial,
    isEdit,
    t,
    onSave,
  });
  const title = getModelFormTitle({ isEdit, initial, modelType, t });

  return (
    <form
      onSubmit={controller.submit}
      className={cn(
        "flex flex-col gap-3",
        variant === "inline" &&
          "rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50",
      )}
    >
      {variant === "inline" ? (
        <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
          {title}
        </p>
      ) : null}
      <OrgAiModelFormFields
        controller={controller}
        credentialSources={credentialSources}
        isEdit={isEdit}
        showDescription={showDescription}
        t={t}
      />
      <ModelFormActions
        controller={controller}
        isSaving={isSaving}
        isEdit={isEdit}
        t={t}
        onCancel={onCancel}
      />
    </form>
  );
}
