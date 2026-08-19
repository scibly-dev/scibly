"use client";

import type { ByoaiModelType } from "@/shared/ai/byoai/types";
import type { OrgSettingsPage } from "../i18n/org-settings.types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@scibly/ui/components/dialog";

import {
  EMPTY_FORM,
  ModelForm,
  type ModelFormState,
} from "./org-ai-model-form";

interface CredentialSource {
  id: string;
  name: string;
  baseUrl: string;
}

export type ModelDialogState =
  | {
      mode: "add";
      modelType: ByoaiModelType;
    }
  | {
      mode: "edit";
      modelType: ByoaiModelType;
      modelId: string;
      initial: ModelFormState;
      showDescription?: boolean;
    };

interface OrgAIModelDialogProps {
  orgSlug: string;
  dialogState: ModelDialogState | null;
  credentialSources: CredentialSource[];
  isSaving: boolean;
  t: OrgSettingsPage["aiConfig"];
  onSave: (
    values: ModelFormState & { reuseCredentialsFromId?: string },
    context: ModelDialogState,
  ) => void;
  onClose: () => void;
}

function getDialogTitle(
  state: ModelDialogState,
  t: OrgSettingsPage["aiConfig"],
): string {
  if (state.mode === "edit") {
    return state.initial.name || t.editButton;
  }

  return state.modelType === "IMAGE" ? t.addImageModelTitle : t.addModelTitle;
}

function getDialogDescription(
  state: ModelDialogState,
  t: OrgSettingsPage["aiConfig"],
): string | undefined {
  if (state.mode === "edit") return undefined;

  return state.modelType === "IMAGE"
    ? t.imageSectionDescription
    : t.chatSectionDescription;
}

export function OrgAIModelDialog({
  orgSlug,
  dialogState,
  credentialSources,
  isSaving,
  t,
  onSave,
  onClose,
}: OrgAIModelDialogProps) {
  const open = dialogState !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto overscroll-contain sm:max-w-xl">
        {dialogState ? (
          <>
            <DialogHeader>
              <DialogTitle>{getDialogTitle(dialogState, t)}</DialogTitle>
              {getDialogDescription(dialogState, t) ? (
                <DialogDescription>
                  {getDialogDescription(dialogState, t)}
                </DialogDescription>
              ) : null}
            </DialogHeader>
            <ModelForm
              orgSlug={orgSlug}
              modelType={dialogState.modelType}
              existingModelId={
                dialogState.mode === "edit" ? dialogState.modelId : undefined
              }
              credentialSources={
                dialogState.mode === "edit"
                  ? credentialSources.filter(
                      (source) => source.id !== dialogState.modelId,
                    )
                  : credentialSources
              }
              isEdit={dialogState.mode === "edit"}
              showDescription={
                dialogState.mode === "edit"
                  ? (dialogState.showDescription ?? false)
                  : dialogState.modelType === "CHAT"
              }
              initial={
                dialogState.mode === "edit" ? dialogState.initial : EMPTY_FORM
              }
              isSaving={isSaving}
              t={t}
              variant="dialog"
              onSave={(values) => onSave(values, dialogState)}
              onCancel={onClose}
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
