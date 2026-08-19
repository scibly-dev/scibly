import {
  openRightSidebar,
  useSidebarState,
} from "../../workspace/hooks/use-sidebar-state";

interface OpenCourseBuilderStudioOptions {
  openCoursePicker?: boolean;
}

export function openCourseBuilderStudio(
  options?: OpenCourseBuilderStudioOptions,
): void {
  openRightSidebar();
  if (options?.openCoursePicker) {
    useSidebarState.getState().requestStudioCoursePicker();
  }
}
