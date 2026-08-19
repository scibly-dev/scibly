"use client";

import type { SidebarState } from "../../workspace/hooks/use-sidebar-state";

import { useCourseBuilderStore } from "../course-builder-store";

type SidebarTab = SidebarState["rightSidebarTab"];

export function authorSelectedSidebarTab(tab: SidebarTab): void {
  if (tab === "studio") return;
  useCourseBuilderStore.getState().takeOverFromAgent();
}

export function authorOpenedStudioTool(toolId: string): void {
  if (toolId === "courseBuilder") return;
  useCourseBuilderStore.getState().takeOverFromAgent();
}

export function authorEditedCourse(): void {
  useCourseBuilderStore.getState().takeOverFromAgent();
}
