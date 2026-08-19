"use client";

import type { ReactNode } from "react";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { PanelRightClose } from "lucide-react";
import dynamic from "next/dynamic";
import { memo } from "react";

import { useNotebookState } from "../../chat/runtime/context";
import { shouldFlagStudioActivity } from "../../course-builder/agent-activity";
import { useCourseBuilderStore } from "../../course-builder/course-builder-store";
import { authorSelectedSidebarTab } from "../../course-builder/hooks/author-attention";
import { SourcesPanel } from "../../sources/sources-panel";
import { useSidebarState } from "../hooks/use-sidebar-state";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import { notebookIconButton } from "./notebook-shell";
import { StudioPanel } from "./studio-panel";

const MediaLibraryPanelComponent = dynamic(
  () =>
    import("../../media/media-library-panel").then(
      (module) => module.MediaLibraryPanel,
    ),
  { ssr: false },
);

export const SIDEBAR_WIDTH = 360;

interface CreatorRightSidebarViewProps {
  t: NotebookTranslations;
  sourcesPanel: ReactNode;
  mediaPanel: ReactNode;
  studioPanel: ReactNode;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  desktopOpen?: boolean;
  onDesktopOpenChange?: (open: boolean) => void;

  isAgentWorkingOffScreen?: boolean;
}

export const CreatorRightSidebarView = memo(
  ({
    t,
    sourcesPanel,
    mediaPanel,
    studioPanel,
    mobileOpen,
    onMobileOpenChange,
    desktopOpen = true,
    onDesktopOpenChange,
    isAgentWorkingOffScreen = false,
  }: CreatorRightSidebarViewProps) => {
    const { rightSidebarTab, setRightSidebarTab } = useSidebarState();

    return (
      <CollapsibleSidebar
        side="right"
        width={SIDEBAR_WIDTH}
        desktopOpen={desktopOpen}
        mobileOpen={mobileOpen}
        onMobileOpenChange={onMobileOpenChange}
        isResizable
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-5">
            {(["sources", "media", "studio"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  authorSelectedSidebarTab(tab);
                  setRightSidebarTab(tab);
                }}
                className={cn(
                  "relative pb-1 text-[14px] transition-colors",
                  rightSidebarTab === tab
                    ? "text-ink font-bold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-[#0066ff] dark:text-neutral-50 dark:after:bg-neutral-100"
                    : "text-ink-faint hover:text-ink-muted font-semibold dark:text-neutral-500 dark:hover:text-neutral-300",
                )}
              >
                {tab === "sources"
                  ? t.sources.title
                  : tab === "media"
                    ? t.mediaLibrary.title
                    : t.studio.title}
                {tab === "studio" && isAgentWorkingOffScreen ? (
                  <span
                    aria-label={t.studio.courseBuilder.agentWorking}
                    title={t.studio.courseBuilder.agentWorking}
                    className="absolute top-0 -right-2.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
                  />
                ) : null}
              </button>
            ))}
          </div>
          {onDesktopOpenChange ? (
            <button
              onClick={() => onDesktopOpenChange(false)}
              type="button"
              className={cn(
                "hidden h-8 w-8 items-center justify-center rounded-lg md:flex",
                notebookIconButton,
              )}
              title={t.page.collapseSidebar}
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {rightSidebarTab === "studio" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {studioPanel}
            </div>
          ) : null}
          {rightSidebarTab === "sources" ? (
            <div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-950">
              {sourcesPanel}
            </div>
          ) : null}
          {rightSidebarTab === "media" ? (
            <div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-950">
              {mediaPanel}
            </div>
          ) : null}
        </div>
      </CollapsibleSidebar>
    );
  },
);

CreatorRightSidebarView.displayName = "CreatorRightSidebarView";

interface CreatorRightSidebarProps {
  t: NotebookTranslations;
  notebookId: string | undefined;
  orgSlug: string;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  desktopOpen?: boolean;
  onDesktopOpenChange?: (open: boolean) => void;
}

export function CreatorRightSidebar({
  t,
  notebookId,
  orgSlug,
  ...viewProps
}: CreatorRightSidebarProps) {
  const studioCoursePickerNonce = useSidebarState(
    (state) => state.studioCoursePickerNonce,
  );
  const rightSidebarTab = useSidebarState((state) => state.rightSidebarTab);
  const agentTarget = useCourseBuilderStore((state) => state.agentTarget);
  const { status } = useNotebookState();

  return (
    <CreatorRightSidebarView
      {...viewProps}
      isAgentWorkingOffScreen={shouldFlagStudioActivity({
        chatStatus: status,
        agentTarget,
        rightSidebarTab,
        isSidebarOpen: (viewProps.desktopOpen ?? true) || viewProps.mobileOpen,
      })}
      t={t}
      sourcesPanel={
        <SourcesPanel t={t} notebookId={notebookId} orgSlug={orgSlug} />
      }
      mediaPanel={
        <MediaLibraryPanelComponent
          t={t}
          notebookId={notebookId}
          orgSlug={orgSlug}
        />
      }
      studioPanel={
        <StudioPanel
          key={
            studioCoursePickerNonce > 0
              ? `studio-picker-${studioCoursePickerNonce}`
              : "studio-default"
          }
          notebookId={notebookId}
          openCoursePickerOnMount={studioCoursePickerNonce > 0}
          orgSlug={orgSlug}
          t={t}
        />
      }
    />
  );
}
