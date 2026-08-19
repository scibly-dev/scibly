"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { cn } from "@scibly/ui/utils";
import { ChevronRight } from "lucide-react";
import { createElement, useState } from "react";

import {
  type CourseBuilderStore,
  useCourseBuilderStore,
} from "../../course-builder/course-builder-store";
import { CourseBuilderView } from "../../course-builder/course-builder-view";
import { CoursePickerView } from "../../course-builder/course-picker-view";
import { authorOpenedStudioTool } from "../../course-builder/hooks/author-attention";
import { InfographicView } from "../../infographic/components/infographic-view";
import { useSidebarState } from "../hooks/use-sidebar-state";
import { STUDIO_TOOLS } from "../utils/constants";
import {
  notebookToolRow,
  notebookToolRowPress,
  notebookToolTile,
} from "./notebook-shell";

interface StudioPanelProps {
  t: NotebookTranslations;
  orgSlug: string;
  notebookId: string | undefined;
  openCoursePickerOnMount?: boolean;
}

export const StudioToolList = ({
  t,
  onSelect,
}: {
  t: NotebookTranslations;
  onSelect: (id: string) => void;
}) => {
  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-4">
      {STUDIO_TOOLS.map(({ id, Icon: icon, theme }) => (
        <button
          key={id}
          id={`studio-tool-${id}`}
          type="button"
          onClick={() => onSelect(id)}
          className={cn("group", notebookToolRow, notebookToolRowPress)}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn(notebookToolTile, theme)}>
              {createElement(icon, { className: "h-4 w-4 stroke-2" })}
            </span>
            <span className="text-ink truncate text-[14px] font-semibold dark:text-neutral-200">
              {t.studio.tools[id]}
            </span>
          </div>
          <ChevronRight className="text-ink-faint group-hover:text-ink-muted h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 dark:text-neutral-600" />
        </button>
      ))}
    </div>
  );
};

export function StudioPanel({
  t,
  orgSlug,
  notebookId,
  openCoursePickerOnMount = false,
}: StudioPanelProps) {
  const courseId = useCourseBuilderStore(
    (s: CourseBuilderStore) => s.course?.id,
  );
  const activeStudioTool = useSidebarState((s) => s.activeStudioTool);
  const openStudioTool = useSidebarState((s) => s.openStudioTool);

  const [pickerOpen, setPickerOpen] = useState<string | null>(
    openCoursePickerOnMount ? "courseBuilder" : null,
  );
  const activeToolId = activeStudioTool ?? (courseId ? "courseBuilder" : null);

  if (activeToolId === "courseBuilder") {
    return (
      <CourseBuilderView
        orgSlug={orgSlug}
        notebookId={notebookId}
        t={t}
        onExit={() => setPickerOpen("courseBuilder")}
      />
    );
  }

  if (activeToolId === "imageEditor") {
    return <InfographicView orgSlug={orgSlug} notebookId={notebookId} t={t} />;
  }

  if (pickerOpen === "courseBuilder") {
    return (
      <CoursePickerView
        onClose={() => setPickerOpen(null)}
        orgSlug={orgSlug}
        notebookId={notebookId}
        t={t}
      />
    );
  }

  return (
    <StudioToolList
      t={t}
      onSelect={(id) => {
        authorOpenedStudioTool(id);
        if (id === "courseBuilder") setPickerOpen(id);
        if (id === "imageEditor") openStudioTool("imageEditor");
      }}
    />
  );
}
