"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { CourseOutdatedBanner } from "@/shared/content/course/components/course-outdated-banner";

import {
  useNotebookActions,
  useNotebookMeta,
} from "../../chat/runtime/context";
import { useNotebookSourcesIngesting } from "../../sources/hooks/use-notebook-sources-ingesting";
import { useCourseBuilderStore } from "../course-builder-store";

interface OutdatedScenesBannerProps {
  t: NotebookTranslations["studio"]["courseBuilder"];
}

export function OutdatedScenesBanner({ t }: OutdatedScenesBannerProps) {
  const course = useCourseBuilderStore((s) => s.course);
  const { sendMessage } = useNotebookActions();
  const { notebookId } = useNotebookMeta();
  const sourcesIngesting = useNotebookSourcesIngesting(notebookId);

  const handleUpdateOutdated = () => {
    if (!course?.id) return;
    void sendMessage({
      text: t.updateOutdatedScenesPrompt
        .replace("{{courseId}}", course.id)
        .replace("{{courseTitle}}", course.title ?? ""),
    });
  };

  return (
    <CourseOutdatedBanner
      courseId={course?.id}
      hidden={sourcesIngesting}
      labels={{
        title: t.outdatedTitle,
        description: t.outdatedDescription,
        actionLabel: t.updateOutdatedScenes,
      }}
      action="button"
      onAction={handleUpdateOutdated}
    />
  );
}
