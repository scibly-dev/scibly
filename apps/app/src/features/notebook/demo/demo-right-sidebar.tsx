"use client";

import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";

import { useCourseBuilderRuntime } from "@/features/notebook/course-builder/components/course-builder-runtime-context";
import { CreatorRightSidebarView } from "@/features/notebook/workspace/components/creator-right-sidebar";
import { useSidebarState } from "@/features/notebook/workspace/hooks/use-sidebar-state";

import { DemoCourseBuilderView } from "./demo-course-builder-view";
import { DemoMediaLibraryPanel } from "./demo-media-library-panel";
import { DemoSourcesPanel } from "./demo-sources-panel";
import { DemoStudioToolList } from "./demo-studio-tool-list";

const DemoStudioPanelComponent = ({ t }: { t: NotebookTranslations }) => {
  const {
    state: { course },
  } = useCourseBuilderRuntime();
  const courseId = course?.id;
  if (courseId) return <DemoCourseBuilderView t={t} />;

  return <DemoStudioToolList t={t} />;
};

export function DemoRightSidebar({ t }: { t: NotebookTranslations }) {
  const {
    mobileRightOpen,
    setMobileRightOpen,
    desktopRightOpen,
    setDesktopRightOpen,
  } = useSidebarState();

  return (
    <CreatorRightSidebarView
      t={t}
      mobileOpen={mobileRightOpen}
      onMobileOpenChange={setMobileRightOpen}
      desktopOpen={desktopRightOpen}
      onDesktopOpenChange={setDesktopRightOpen}
      sourcesPanel={<DemoSourcesPanel t={t} />}
      mediaPanel={<DemoMediaLibraryPanel t={t} />}
      studioPanel={<DemoStudioPanelComponent t={t} />}
    />
  );
}
