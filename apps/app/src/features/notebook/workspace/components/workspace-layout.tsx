"use client";

import type {
  WorkspaceLayoutCompositionProps,
  WorkspaceLayoutPresentation,
} from "./workspace-layout.types";

import {
  type ImperativePanelHandle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@scibly/ui/components/resizable";
import { cn } from "@scibly/ui/utils";
import { useEffect, useRef } from "react";

import {
  useNotebookActions,
  useNotebookMeta,
  useNotebookState,
} from "../../chat/runtime/context";
import { useSidebarState } from "../hooks/use-sidebar-state";
import { GenerationCounter } from "./generation-counter";
import {
  notebookAppFrame,
  notebookCanvas,
  notebookShell,
  notebookShellPadding,
} from "./notebook-shell";
import { WorkspaceComposer } from "./workspace-composer";
import { WorkspaceHeader } from "./workspace-header";

export function ProductionWorkspaceLayoutView(
  props: WorkspaceLayoutCompositionProps,
) {
  return (
    <WorkspaceLayoutViewComponent
      {...props}
      presentation={{
        type: "production",
        frame: "viewport",
        composer: "interactive",
      }}
    />
  );
}

export function ShowcaseWorkspaceLayoutView({
  initialWorkspaceTitle,
  initialPromptValue,
  promptOptions,
  ...props
}: WorkspaceLayoutCompositionProps & {
  initialWorkspaceTitle: string;
  initialPromptValue: string;
  promptOptions: ReadonlyArray<{ label: string; prompt: string }>;
}) {
  return (
    <WorkspaceLayoutViewComponent
      {...props}
      presentation={{
        type: "showcase",
        frame: "embedded",
        composer: "prompt-only",
        initialWorkspaceTitle,
        initialPromptValue,
        promptOptions,
      }}
    />
  );
}

export const RightWorkspacePanel = ({
  panelRef,
  open,
  setOpen,
  children,
}: {
  panelRef: React.RefObject<ImperativePanelHandle | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (open && panel.isCollapsed()) panel.expand();
    if (!open && !panel.isCollapsed()) panel.collapse();
  }, [open, panelRef]);
  return (
    <>
      <ResizableHandle
        className={cn(
          "bg-hairline w-0.5 dark:bg-neutral-800",
          !open && "pointer-events-none opacity-0",
        )}
      />
      <ResizablePanel
        ref={panelRef}
        defaultSize="38%"
        minSize="22%"
        maxSize="55%"
        collapsible
        onResize={(size) => setOpen(size.asPercentage !== 0)}
      >
        {children}
      </ResizablePanel>
    </>
  );
};

export const MainWorkspacePanel = ({
  header,
  composer,
}: {
  header: React.ReactNode;
  composer: React.ReactNode;
}) => {
  return (
    <ResizablePanel defaultSize="62%" minSize="35%">
      <div
        className={cn("relative flex h-full min-h-0 flex-col", notebookCanvas)}
      >
        {header}
        {composer}
      </div>
    </ResizablePanel>
  );
};

function useWorkspaceLayoutState() {
  const sidebar = useSidebarState();
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const { messages } = useNotebookState();
  const { updateTitle } = useNotebookActions();
  const { notebookTitle, orgSlug } = useNotebookMeta();
  return {
    sidebar,
    rightPanelRef,
    updateTitle,
    notebookTitle,
    orgSlug,
    hasMessages: messages.length > 0,
  };
}

function showcaseComposer(presentation: WorkspaceLayoutPresentation) {
  return presentation.type === "showcase"
    ? {
        initialPromptValue: presentation.initialPromptValue,
        promptOptions: presentation.promptOptions,
      }
    : undefined;
}

const WorkspaceLayoutViewComponent = ({
  greeting,
  t,
  modelOptions,
  leftSidebar,
  rightSidebar,
  presentation,
}: WorkspaceLayoutCompositionProps & {
  presentation: WorkspaceLayoutPresentation;
}) => {
  const state = useWorkspaceLayoutState();
  const {
    setMobileLeftOpen: setMobileSidebarOpen,
    desktopLeftOpen: desktopSidebarOpen,
    setDesktopLeftOpen: setDesktopSidebarOpen,
    setMobileRightOpen: setMobileRightSidebarOpen,
    desktopRightOpen: desktopRightSidebarOpen,
    setDesktopRightOpen: setDesktopRightSidebarOpen,
  } = state.sidebar;
  const { rightPanelRef, updateTitle, notebookTitle, orgSlug, hasMessages } =
    state;
  const isShowcase = presentation.type === "showcase";

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden",
        presentation.frame === "embedded" ? "min-h-0 flex-1" : "h-screen",
        notebookShell,
        notebookShellPadding,
      )}
    >
      <div className={notebookAppFrame}>
        {leftSidebar}

        <ResizablePanelGroup
          orientation="horizontal"
          className={cn("min-w-0 flex-1", notebookCanvas)}
        >
          <MainWorkspacePanel
            header={
              <WorkspaceHeader
                t={t}
                notebookTitle={notebookTitle}
                initialTitle={
                  isShowcase ? presentation.initialWorkspaceTitle : undefined
                }
                onUpdateTitle={updateTitle}
                hasChats={hasMessages}
                onMenuClick={() => setMobileSidebarOpen(true)}
                desktopSidebarOpen={desktopSidebarOpen}
                onDesktopMenuClick={() => setDesktopSidebarOpen(true)}
                rightSidebarOpen={desktopRightSidebarOpen}
                onRightMenuClick={() => setMobileRightSidebarOpen(true)}
                onDesktopRightMenuClick={() => setDesktopRightSidebarOpen(true)}
                accessory={
                  isShowcase ? null : (
                    <GenerationCounter orgSlug={orgSlug} t={t} />
                  )
                }
              />
            }
            composer={
              <WorkspaceComposer
                greeting={greeting}
                t={t}
                modelOptions={modelOptions}
                showcase={showcaseComposer(presentation)}
              />
            }
          />

          <RightWorkspacePanel
            panelRef={rightPanelRef}
            open={desktopRightSidebarOpen}
            setOpen={setDesktopRightSidebarOpen}
          >
            {rightSidebar}
          </RightWorkspacePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
