"use client";

import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";

import { useEffect } from "react";

import { ShowcaseNotebookPresentation } from "@/features/notebook/workspace/components/notebook-presentation";
import { ShowcaseWorkspaceLayoutView } from "@/features/notebook/workspace/components/workspace-layout";
import { useSidebarState } from "@/features/notebook/workspace/hooks/use-sidebar-state";

import { DemoCourseBuilderRuntimeProvider } from "./demo-course-builder-runtime-provider";
import { DemoCreatorSidebar } from "./demo-creator-sidebar";
import { DemoGeneratedImageActionsProvider } from "./demo-generated-image-actions-provider";
import { DEMO_MODEL } from "./demo-model";
import { DemoNotebookProvider } from "./demo-notebook-provider";
import { DemoRightSidebar } from "./demo-right-sidebar";
import { DevScriptPanel } from "./dev-script-panel";
import { demoNotebookFixture } from "./fixture";

export function DemoNotebookWorkspace({
  t,
  greeting,
  initialMessage,
  ctaHref,
  workspaceTitle,
}: {
  t: NotebookTranslations;
  greeting: string;
  initialMessage?: string;
  ctaHref: string;
  workspaceTitle: string;
}) {
  useEffect(() => {
    useSidebarState.getState().clearStudioTool();
  }, []);

  return (
    <ShowcaseNotebookPresentation>
      <DemoCourseBuilderRuntimeProvider>
        <DemoNotebookProvider>
          <DemoGeneratedImageActionsProvider t={t}>
            <ShowcaseWorkspaceLayoutView
              greeting={greeting}
              initialWorkspaceTitle={workspaceTitle}
              initialPromptValue={
                initialMessage ?? demoNotebookFixture.promptOptions[0]!.prompt
              }
              promptOptions={demoNotebookFixture.promptOptions}
              t={t}
              modelOptions={[
                {
                  id: DEMO_MODEL.id,
                  label: DEMO_MODEL.label,
                  description: DEMO_MODEL.description,
                  groupLabel: DEMO_MODEL.groupLabel,
                },
              ]}
              leftSidebar={<DemoCreatorSidebar t={t} ctaHref={ctaHref} />}
              rightSidebar={<DemoRightSidebar t={t} />}
            />
            {process.env.NODE_ENV === "development" ? <DevScriptPanel /> : null}
          </DemoGeneratedImageActionsProvider>
        </DemoNotebookProvider>
      </DemoCourseBuilderRuntimeProvider>
    </ShowcaseNotebookPresentation>
  );
}
