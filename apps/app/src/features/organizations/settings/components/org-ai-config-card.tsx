"use client";

import type { OrgSettingsPage } from "../i18n/org-settings.types";

import { Tabs, TabsList, TabsTrigger } from "@scibly/ui/components/tabs";

import { api } from "@/shared/api/trpc/client";
import { SettingsCard } from "@/shared/ui/settings-card";

import { ByoaiUpgradeNotice } from "./byoai-upgrade-notice";
import { DeleteModelDialog } from "./delete-model-dialog";
import { OrgAiChatModelsTab } from "./org-ai-chat-models-tab";
import { OrgAiImageModelsTab } from "./org-ai-image-models-tab";
import { OrgAIModelDialog } from "./org-ai-model-dialog";
import { useOrgAiConfigController } from "./use-org-ai-config-controller";

interface OrgAIConfigCardProps {
  orgSlug: string;
  t: OrgSettingsPage["aiConfig"];
}

export const CapabilityTabs = ({ t }: { t: OrgSettingsPage["aiConfig"] }) => (
  <TabsList className="mb-5 h-auto w-full justify-start gap-1 p-1 sm:w-auto">
    {(
      [
        ["chat", t.chatModelsTab],
        ["image", t.imageTab],
      ] as const
    ).map(([tab, label]) => (
      <TabsTrigger
        key={tab}
        value={tab}
        className="flex-1 px-4 py-2 sm:flex-none"
      >
        {label}
      </TabsTrigger>
    ))}
  </TabsList>
);

export function OrgAIConfigCard({ orgSlug, t }: OrgAIConfigCardProps) {
  const controller = useOrgAiConfigController(orgSlug, t);
  const { data: access } = api.billing.getFeatureAccess.useQuery({ orgSlug });

  const byoai = access?.byoai;
  const isLocked = byoai?.allowed === false;

  return (
    <>
      <SettingsCard title={t.title} description={t.description}>
        {isLocked && byoai ? (
          <ByoaiUpgradeNotice
            access={byoai}
            hasEndpoints={
              controller.chatModels.length > 0 ||
              controller.imageModels.length > 0
            }
            t={t}
          />
        ) : null}
        <Tabs
          value={controller.activeTab}
          onValueChange={(value) =>
            controller.setActiveTab(value === "image" ? "image" : "chat")
          }
        >
          <CapabilityTabs t={t} />

          <OrgAiChatModelsTab
            t={t}
            chatModels={controller.chatModels}
            defaultChatModelId={controller.preferences?.defaultChatModelId}
            isSciblyDefaultChatActive={controller.isSciblyDefaultChatActive}
            isPending={controller.isDefaultChatPending}
            isLocked={isLocked}
            onSetDefault={controller.setDefaultChatModel}
            onEdit={(model) => controller.openEditDialog("CHAT", model, true)}
            onDelete={controller.setDeleteTarget}
            onAdd={() => controller.openAddForTab("chat")}
          />

          <OrgAiImageModelsTab
            t={t}
            imageModels={controller.imageModels}
            isPending={controller.isImagePending}
            isLocked={isLocked}
            onSetActive={controller.setActiveImageModel}
            onEdit={(model) => controller.openEditDialog("IMAGE", model)}
            onDelete={controller.setDeleteTarget}
            onAdd={() => controller.openAddForTab("image")}
          />
        </Tabs>
      </SettingsCard>

      <OrgAIModelDialog
        orgSlug={orgSlug}
        dialogState={controller.dialogState}
        credentialSources={controller.credentialSources}
        isSaving={controller.isSaving}
        t={t}
        onSave={controller.handleDialogSave}
        onClose={() => controller.setDialogState(null)}
      />

      <DeleteModelDialog t={t} controller={controller} />
    </>
  );
}
