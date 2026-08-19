import type { OrgSettingsPage } from "../i18n/org-settings.types";
import type { useOrgAiModelForm } from "./use-org-ai-model-form";

import { Input } from "@scibly/ui/components/input";
import { Label } from "@scibly/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { cn } from "@scibly/ui/utils";
import { Loader2 } from "lucide-react";

import {
  isManagedByoaiPreset,
  resolveByoaiPresetBaseUrl,
} from "@/shared/ai/byoai-provider-presets";

type Controller = ReturnType<typeof useOrgAiModelForm>;
type Copy = OrgSettingsPage["aiConfig"];

export interface CredentialSource {
  id: string;
  name: string;
  baseUrl: string;
}

function selectCredential(
  value: string,
  controller: Controller,
  sources: CredentialSource[],
) {
  const sourceId = value === "none" ? null : value;
  controller.setReuseCredentialsFromId(sourceId);
  const source = sources.find((item) => item.id === sourceId);
  if (source) {
    controller.setValue("baseUrl", source.baseUrl, { shouldValidate: false });
    controller.setValue("apiKey", "", { shouldValidate: false });
  } else if (isManagedByoaiPreset(controller.presetId)) {
    controller.setValue(
      "baseUrl",
      resolveByoaiPresetBaseUrl(controller.presetId),
      { shouldValidate: false },
    );
  }
  controller.setTestState("idle");
}

export function CredentialSelector({
  controller,
  sources,
  t,
}: {
  controller: Controller;
  sources: CredentialSource[];
  t: Copy;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{t.reuseCredentialsLabel}</Label>
      <Select
        value={controller.reuseCredentialsFromId ?? "none"}
        onValueChange={(value) => selectCredential(value, controller, sources)}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder={t.reuseCredentialsPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t.reuseCredentialsNone}</SelectItem>
          {sources.map((source) => (
            <SelectItem key={source.id} value={source.id}>
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function BaseUrlField({
  controller,
  suffix,
  t,
}: {
  controller: Controller;
  suffix: string;
  t: Copy;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <Label htmlFor={`model-baseUrl-${suffix}`} className="text-xs">
        {t.baseUrlLabel}
      </Label>
      <Input
        id={`model-baseUrl-${suffix}`}
        type={controller.isBaseUrlLocked ? "text" : "url"}
        placeholder={t.baseUrlPlaceholder}
        autoComplete="off"
        spellCheck={false}
        readOnly={controller.isBaseUrlLocked}
        className={cn(
          controller.isBaseUrlLocked && "cursor-default opacity-80",
        )}
        {...controller.register("baseUrl")}
      />
      {controller.formState.isSubmitted &&
      controller.formState.errors.baseUrl ? (
        <span className="text-[11px] text-red-500">
          {controller.formState.errors.baseUrl.message}
        </span>
      ) : null}
    </div>
  );
}

function apiKeyPlaceholder(controller: Controller, isEdit: boolean, t: Copy) {
  if (controller.reuseCredentialsFromId) {
    return t.reuseCredentialsActivePlaceholder;
  }
  if (isEdit) return t.apiKeyEditPlaceholder;
  if (isManagedByoaiPreset(controller.presetId)) {
    return controller.selectedPreset.apiKeyPlaceholder;
  }
  return t.apiKeyPlaceholder;
}

export function ApiKeyField({
  controller,
  suffix,
  isEdit,
  t,
}: {
  controller: Controller;
  suffix: string;
  isEdit: boolean;
  t: Copy;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`model-apiKey-${suffix}`} className="text-xs">
        {t.apiKeyLabel}
      </Label>
      <Input
        id={`model-apiKey-${suffix}`}
        type="password"
        placeholder={apiKeyPlaceholder(controller, isEdit, t)}
        autoComplete="off"
        spellCheck={false}
        disabled={Boolean(controller.reuseCredentialsFromId)}
        {...controller.register("apiKey")}
      />
      {controller.formState.isSubmitted &&
      controller.formState.errors.apiKey ? (
        <span className="text-[11px] text-red-500">
          {controller.formState.errors.apiKey.message}
        </span>
      ) : null}
    </div>
  );
}

export function ModelIdField({
  controller,
  suffix,
  t,
}: {
  controller: Controller;
  suffix: string;
  t: Copy;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`model-modelId-${suffix}`} className="text-xs">
          {t.modelIdLabel}
        </Label>
        <button
          type="button"
          onClick={controller.handleFetchModels}
          disabled={
            !controller.effectiveBaseUrl ||
            controller.listRemoteModelsMutation.isPending
          }
          className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          {controller.listRemoteModelsMutation.isPending ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t.fetchModelsLoading}
            </span>
          ) : (
            t.fetchModelsButton
          )}
        </button>
      </div>
      {controller.remoteModels.length > 0 ? (
        <Select
          value={controller.modelId || undefined}
          onValueChange={(value) =>
            controller.setValue("modelId", value, { shouldValidate: false })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t.modelIdPlaceholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {controller.remoteModels.map((id) => (
              <SelectItem key={id} value={id}>
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={`model-modelId-${suffix}`}
          placeholder={
            isManagedByoaiPreset(controller.presetId) &&
            controller.selectedPreset.modelIdPlaceholder
              ? controller.selectedPreset.modelIdPlaceholder
              : t.modelIdPlaceholder
          }
          autoComplete="off"
          spellCheck={false}
          {...controller.register("modelId")}
        />
      )}
      {controller.formState.isSubmitted &&
      controller.formState.errors.modelId ? (
        <span className="text-[11px] text-red-500">
          {controller.formState.errors.modelId.message}
        </span>
      ) : null}
    </div>
  );
}
