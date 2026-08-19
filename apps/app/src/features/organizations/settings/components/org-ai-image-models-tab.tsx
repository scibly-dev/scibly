"use client";

import type { OrgByoaiModel } from "@/shared/ai/byoai/types";
import type { OrgSettingsPage } from "../i18n/org-settings.types";

import { Button } from "@scibly/ui/components/button";
import { TabsContent } from "@scibly/ui/components/tabs";
import { Plus } from "lucide-react";

import { ByoaiEndpointOption, ByoaiOptionList } from "./byoai-endpoint-option";

interface OrgAiImageModelsTabProps {
  t: OrgSettingsPage["aiConfig"];
  imageModels: OrgByoaiModel[];
  isPending: boolean;

  isLocked: boolean;
  onSetActive: (modelId: string | null) => void;
  onEdit: (model: OrgByoaiModel) => void;
  onDelete: (target: { id: string; name: string }) => void;
  onAdd: () => void;
}

export function OrgAiImageModelsTab({
  t,
  imageModels,
  isPending,
  isLocked,
  onSetActive,
  onEdit,
  onDelete,
  onAdd,
}: OrgAiImageModelsTabProps) {
  return (
    <TabsContent value="image" className="mt-0 space-y-4">
      <p className="text-muted-foreground text-[13px] leading-relaxed">
        {t.imageSectionDescription}
      </p>

      <ByoaiOptionList>
        <ByoaiEndpointOption
          id="image-scibly"
          radioGroupName="image-provider"
          name={t.imageProviderDefault}
          subtitle={t.imageProviderDefaultDescription}
          isManaged
          isSelected={!imageModels.some((model) => model.isActive)}
          isDisabled={isPending}
          t={t}
          onSelect={() => onSetActive(null)}
        />
        {imageModels.map((model) => (
          <ByoaiEndpointOption
            key={model.id}
            id={`image-${model.id}`}
            radioGroupName="image-provider"
            name={model.name}
            subtitle={model.modelId}
            isSelected={model.isActive}
            isDisabled={isPending}
            isSelectLocked={isLocked}
            healthStatus={model.lastTestStatus}
            t={t}
            onSelect={() => onSetActive(model.id)}
            onEdit={isLocked ? undefined : () => onEdit(model)}
            onDelete={() => onDelete({ id: model.id, name: model.name })}
          />
        ))}
      </ByoaiOptionList>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isLocked}
        onClick={onAdd}
        className="text-muted-foreground hover:text-foreground h-9 gap-1.5 px-2 text-[13px]"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {t.addImageModelButton}
      </Button>
    </TabsContent>
  );
}
