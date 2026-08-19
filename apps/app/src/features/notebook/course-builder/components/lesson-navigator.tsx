"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";
import { useLessonNavigatorMutations } from "@/shared/content/course/hooks/use-lesson-navigator-mutations";

import { useCourseBuilderStore } from "../course-builder-store";
import { authorEditedCourse } from "../hooks/author-attention";
import { LessonNavigatorView } from "./lesson-navigator-view";

export function LessonNavigator({ t }: { t: NotebookTranslations }) {
  const courseId = useCourseBuilderStore((state) => state.course?.id);
  const activeLessonId = useCourseBuilderStore(
    (state) => state.activeLesson?.id,
  );
  const setActiveLesson = useCourseBuilderStore(
    (state) => state.setActiveLesson,
  );
  const { data, isLoading } = api.course.listLessons.useQuery(
    { courseId: courseId ?? "", limit: 100 },
    { enabled: Boolean(courseId) },
  );
  const lessons = data?.items ?? [];
  const mutations = useLessonNavigatorMutations({
    courseId,
    activeLessonId,
    setActiveLesson,
    onDeleteFailed: (message) =>
      toast.error(message || t.studio.courseBuilder.deleteLessonFailed),
  });

  return (
    <LessonNavigatorView
      t={t}
      lessons={lessons}
      activeLessonId={activeLessonId}
      isLoading={isLoading}
      onSelectLesson={setActiveLesson}
      onRepairSelection={(lesson) => setActiveLesson(lesson, "system")}
      {...(courseId
        ? {
            mode: "editable" as const,
            actions: {
              create: (title) => {
                authorEditedCourse();
                mutations.createLesson.mutate({ courseId, title });
              },
              delete: async (lessonId) => {
                authorEditedCourse();
                try {
                  const result = await mutations.deleteLesson.mutateAsync({
                    courseId,
                    lessonIds: [lessonId],
                  });
                  return result.success;
                } catch {
                  return false;
                }
              },
              updateTitle: (lessonId, title) => {
                authorEditedCourse();
                mutations.updateLesson.mutate({
                  courseId,
                  lessonId,
                  title,
                });
                if (lessonId === activeLessonId) {
                  setActiveLesson({ id: lessonId, title });
                }
              },
              updateTime: (lessonId, estimatedTimeToCompleteMinutes) => {
                authorEditedCourse();
                mutations.updateLesson.mutate({
                  courseId,
                  lessonId,
                  estimatedTimeToCompleteMinutes,
                });
              },
              isCreating: mutations.createLesson.isPending,
              isDeleting: mutations.deleteLesson.isPending,
            },
          }
        : { mode: "readonly" as const })}
    />
  );
}
