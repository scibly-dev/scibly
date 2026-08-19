"use client";

import { useCourseSync } from "@/shared/content/course/hooks/use-course-sync";

export function CourseSyncWatcher({ courseId }: { courseId: string }) {
  useCourseSync({ courseId });
  return null;
}
