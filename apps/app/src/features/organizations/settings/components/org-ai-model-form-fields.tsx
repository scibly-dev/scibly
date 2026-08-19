import type { OrgSettingsPage } from "../i18n/org-settings.types";
import type { useOrgAiModelForm } from "./use-org-ai-model-form";

import { Input } from "@scibly/ui/components/input";
import { Label } from "@scibly/ui/components/label";
import { cn } from "@scibly/ui/utils";

import {
  BYOAI_CONTEXT_WINDOW_MIN,
  BYOAI_MODEL_DESCRIPTION_MAX_LENGTH,
} from "@/shared/ai/byoai-model-schema";
import { BYOAI_PROVIDER_PRESETS } from "@/shared/ai/byoai-provider-presets";

import {
  ApiKeyField,
  BaseUrlField,
  CredentialSelector,
  type CredentialSource,
  ModelIdField,
} from "./org-ai-model-connection-fields";

export type { CredentialSource } from "./org-ai-model-connection-fields";

type Controller = ReturnType<typeof useOrgAiModelForm>;
type FormFieldsProps = {
  controller: Controller;
  credentialSources: CredentialSource[];
  isEdit: boolean;
  showDescription: boolean;
  t: OrgSettingsPage["aiConfig"];
};

export const ProviderPresetButtons = ({
  controller,
}: {
  controller: Controller;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {BYOAI_PROVIDER_PRESETS.map((preset) => (
      <button
        key={preset.id}
        type="button"
        onClick={() => controller.applyPreset(preset.id)}
        className={cn(
          "rounded-full border px-2.5 py-1 text-[12px] transition-[color,background-color,border-color] focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none",
          controller.presetId === preset.id
            ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
            : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400",
        )}
      >
        {preset.label}
      </button>
    ))}
  </div>
);

export const NameField = ({
  controller,
  suffix,
  t,
}: {
  controller: Controller;
  suffix: string;
  t: OrgSettingsPage["aiConfig"];
}) => (
  <div className="flex flex-col gap-1.5 sm:col-span-2">
    <Label htmlFor={`model-name-${suffix}`} className="text-xs">
      {t.nameLabel}
    </Label>
    <Input
      id={`model-name-${suffix}`}
      placeholder={t.namePlaceholder}
      autoComplete="off"
      spellCheck={false}
      {...controller.register("name")}
    />
    {controller.formState.isSubmitted && controller.formState.errors.name ? (
      <span className="text-[11px] text-red-500">
        {controller.formState.errors.name.message}
      </span>
    ) : null}
  </div>
);

export const DescriptionField = ({
  controller,
  suffix,
  t,
}: {
  controller: Controller;
  suffix: string;
  t: OrgSettingsPage["aiConfig"];
}) => (
  <div className="flex flex-col gap-1.5 sm:col-span-2">
    <Label htmlFor={`model-description-${suffix}`} className="text-xs">
      {t.descriptionLabel}
    </Label>
    <Input
      id={`model-description-${suffix}`}
      placeholder={t.descriptionPlaceholder}
      maxLength={BYOAI_MODEL_DESCRIPTION_MAX_LENGTH}
      {...controller.register("description")}
    />
  </div>
);

export const ContextWindowField = ({
  controller,
  suffix,
  t,
}: {
  controller: Controller;
  suffix: string;
  t: OrgSettingsPage["aiConfig"];
}) => (
  <div className="flex flex-col gap-1.5 sm:col-span-2">
    <Label htmlFor={`model-context-window-${suffix}`} className="text-xs">
      {t.contextWindowLabel}
    </Label>
    <Input
      id={`model-context-window-${suffix}`}
      type="number"
      inputMode="numeric"
      min={BYOAI_CONTEXT_WINDOW_MIN}
      placeholder={t.contextWindowPlaceholder}
      {...controller.register("contextWindow")}
    />
    <p className="text-muted-foreground text-xs">{t.contextWindowHelp}</p>
    {controller.formState.errors.contextWindow ? (
      <p className="text-destructive text-xs">
        {controller.formState.errors.contextWindow.message}
      </p>
    ) : null}
  </div>
);

export function OrgAiModelFormFields(props: FormFieldsProps) {
  const { controller, credentialSources, isEdit, showDescription, t } = props;
  const suffix = isEdit ? "edit" : "add";
  return (
    <>
      {!isEdit ? <ProviderPresetButtons controller={controller} /> : null}
      {!isEdit && credentialSources.length > 0 ? (
        <CredentialSelector
          controller={controller}
          sources={credentialSources}
          t={t}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NameField controller={controller} suffix={suffix} t={t} />
        <BaseUrlField controller={controller} suffix={suffix} t={t} />
        <ApiKeyField
          controller={controller}
          suffix={suffix}
          isEdit={isEdit}
          t={t}
        />
        <ModelIdField controller={controller} suffix={suffix} t={t} />
        {showDescription ? (
          <>
            <DescriptionField controller={controller} suffix={suffix} t={t} />
            <ContextWindowField controller={controller} suffix={suffix} t={t} />
          </>
        ) : null}
      </div>
    </>
  );
}
