import { Suspense } from "react";

import { api } from "@/shared/api/trpc/server";

import { LessonBuilder } from "./components/lesson-builder";

export async function LessonBuilderScreen({
  lessonId,
  courseId,
  orgSlug,
}: {
  orgSlug: string;
  courseId: string;
  lessonId: string;
}) {
  const [initialScenes, lesson] = await Promise.all([
    api.scene.getLessonScenes({ lessonId }),
    api.course.getLesson({ courseId, lessonId }),
  ]);

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  return (
    <Suspense fallback={null}>
      <LessonBuilder
        lessonId={lessonId}
        courseId={courseId}
        orgSlug={orgSlug}
        initialScenes={initialScenes}
        lesson={lesson}
      />
    </Suspense>
  );
}
