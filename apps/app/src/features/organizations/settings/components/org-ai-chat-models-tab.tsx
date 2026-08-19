"use client";

import type { OrgByoaiModel } from "@/shared/ai/byoai/types";
import type { OrgSettingsPage } from "../i18n/org-settings.types";

import { Button } from "@scibly/ui/components/button";
import { TabsContent } from "@scibly/ui/components/tabs";
import { Plus } from "lucide-react";

import { ByoaiEndpointOption, ByoaiOptionList } from "./byoai-endpoint-option";

interface OrgAiChatModelsTabProps {
  t: OrgSettingsPage["aiConfig"];
  chatModels: OrgByoaiModel[];
  defaultChatModelId: string | null | undefined;
  isSciblyDefaultChatActive: boolean;
  isPending: boolean;

  isLocked: boolean;
  onSetDefault: (modelId: string | null) => void;
  onEdit: (model: OrgByoaiModel) => void;
  onDelete: (target: { id: string; name: string }) => void;
  onAdd: () => void;
}

export function OrgAiChatModelsTab({
  t,
  chatModels,
  defaultChatModelId,
  isSciblyDefaultChatActive,
  isPending,
  isLocked,
  onSetDefault,
  onEdit,
  onDelete,
  onAdd,
}: OrgAiChatModelsTabProps) {
  return (
    <TabsContent value="chat" className="mt-0 space-y-4">
      <p className="text-muted-foreground text-[13px] leading-relaxed">
        {t.chatSectionDescription}
      </p>

      <ByoaiOptionList>
        <ByoaiEndpointOption
          id="chat-scibly"
          radioGroupName="chat-provider"
          name={t.defaultChatModelScibly}
          subtitle={t.defaultChatModelSciblyDescription}
          isManaged
          isSelected={isSciblyDefaultChatActive}
          isDisabled={isPending}
          t={t}
          onSelect={() => onSetDefault(null)}
        />
        {chatModels.map((model) => (
          <ByoaiEndpointOption
            key={model.id}
            id={`chat-${model.id}`}
            radioGroupName="chat-provider"
            name={model.name}
            subtitle={model.modelId}
            isSelected={defaultChatModelId === model.id}
            isDisabled={isPending}
            isSelectLocked={isLocked}
            healthStatus={model.lastTestStatus}
            t={t}
            onSelect={() => onSetDefault(model.id)}
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
        {t.addChatModelButton}
      </Button>
    </TabsContent>
  );
}
