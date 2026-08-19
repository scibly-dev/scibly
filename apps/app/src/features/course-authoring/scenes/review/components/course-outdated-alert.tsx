"use client";

import { routes } from "@scibly/routes";

import { useRefreshStaleCourseSources } from "@/features/notebook/client";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { CourseOutdatedBanner } from "@/shared/content/course/components/course-outdated-banner";
import { useCourseOutdatedScenes } from "@/shared/content/course/hooks/use-course-outdated-scenes";

interface CourseOutdatedAlertProps {
  courseId: string;
  courseTitle: string;
  orgSlug: string;
}

export function CourseOutdatedAlert({
  courseId,
  courseTitle,
  orgSlug,
}: CourseOutdatedAlertProps) {
  const { translations: t } = useTranslation("courses");
  const alertT = t.detail.outdatedAlert;
  const { data: outdatedData } = useCourseOutdatedScenes(courseId);

  useRefreshStaleCourseSources(courseId);

  if (!outdatedData?.hasOutdatedScenes) return null;

  const firstOutdatedScene = outdatedData.scenes[0];
  const updatePrompt = alertT.updatePrompt
    .replace("{{courseId}}", courseId)
    .replace("{{courseTitle}}", courseTitle);

  const actionHref = outdatedData.linkedNotebookId
    ? routes.app.profile
        .org(orgSlug)
        .notebook.detail(outdatedData.linkedNotebookId, updatePrompt)
    : firstOutdatedScene
      ? routes.app.profile
          .org(orgSlug)
          .courses.lesson(courseId, firstOutdatedScene.lessonId)
      : routes.app.profile.org(orgSlug).courses.detail(courseId);

  return (
    <CourseOutdatedBanner
      courseId={courseId}
      outdatedSceneCount={outdatedData.outdatedSceneCount}
      labels={{
        title: alertT.title,
        description: alertT.description,
        actionLabel: alertT.actionLabel,
      }}
      action="link"
      href={actionHref}
    />
  );
}
