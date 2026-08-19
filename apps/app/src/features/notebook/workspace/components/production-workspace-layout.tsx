"use client";

import type { ModelSelectorOption } from "../../chat/model-selector";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { useMemo } from "react";

import { byoaiModelId, SCIBLY_MODEL } from "@/shared/ai/models";
import { api } from "@/shared/api/trpc/client";

import {
  useNotebookActions,
  useNotebookMeta,
} from "../../chat/runtime/context";
import { GeneratedImageActionsProvider } from "../../media/generated-image/generated-image-actions-provider";
import { useInvalidateGeneratedImagesOnNewChatImages } from "../../media/hooks/use-invalidate-generated-images-on-new-chat-images";
import { useSidebarState } from "../hooks/use-sidebar-state";
import { CreatorRightSidebar } from "./creator-right-sidebar";
import { CreatorSidebar } from "./creator-sidebar";
import { ProductionWorkspaceLayoutView } from "./workspace-layout";

interface ProductionWorkspaceLayoutProps {
  greeting: string;
  orgSlug: string;
  t: NotebookTranslations;
}

export function ProductionWorkspaceLayout({
  greeting,
  orgSlug,
  t,
}: ProductionWorkspaceLayoutProps) {
  const {
    mobileLeftOpen,
    setMobileLeftOpen,
    desktopLeftOpen,
    setDesktopLeftOpen,
    mobileRightOpen,
    setMobileRightOpen,
    desktopRightOpen,
    setDesktopRightOpen,
  } = useSidebarState();
  const { resetChat } = useNotebookActions();
  const { notebookId } = useNotebookMeta();

  useInvalidateGeneratedImagesOnNewChatImages({ notebookId, orgSlug });

  const { data: allOrgModels = [] } = api.orgAiConfig.listModels.useQuery({
    orgSlug,
  });
  const modelOptions = useMemo<readonly ModelSelectorOption[]>(
    () => [
      {
        id: SCIBLY_MODEL.id,
        label: SCIBLY_MODEL.label,
        description: SCIBLY_MODEL.description,
        groupLabel: SCIBLY_MODEL.providerLabel,
      },
      ...allOrgModels
        .filter((model) => model.type === "CHAT")
        .map((model) => ({
          id: byoaiModelId(model.id),
          label: model.name,
          description: model.description || model.modelId,
          groupLabel: t.chat.customModelsLabel,
        })),
    ],
    [allOrgModels, t.chat.customModelsLabel],
  );

  return (
    <GeneratedImageActionsProvider
      t={t}
      notebookId={notebookId}
      orgSlug={orgSlug}
    >
      <ProductionWorkspaceLayoutView
        greeting={greeting}
        modelOptions={modelOptions}
        t={t}
        leftSidebar={
          <CreatorSidebar
            orgSlug={orgSlug}
            t={t}
            mobileOpen={mobileLeftOpen}
            onMobileOpenChange={setMobileLeftOpen}
            desktopOpen={desktopLeftOpen}
            onDesktopOpenChange={setDesktopLeftOpen}
            onNewChat={resetChat}
          />
        }
        rightSidebar={
          <CreatorRightSidebar
            t={t}
            notebookId={notebookId}
            orgSlug={orgSlug}
            mobileOpen={mobileRightOpen}
            onMobileOpenChange={setMobileRightOpen}
            desktopOpen={desktopRightOpen}
            onDesktopOpenChange={setDesktopRightOpen}
          />
        }
      />
    </GeneratedImageActionsProvider>
  );
}
