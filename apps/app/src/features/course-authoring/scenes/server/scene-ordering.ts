import { db } from "@scibly/db";

import { rewriteDraftSceneOrder } from "../../ordering/server/ordering";
import { requireDraftLesson } from "./scene-access";

export async function reorderDraftScenes(
  userId: string,
  input: { lessonId: string; sceneIds: string[] },
) {
  const lesson = await requireDraftLesson(db, input.lessonId, userId);
  await db.$transaction((tx) =>
    rewriteDraftSceneOrder(tx, input.lessonId, input.sceneIds),
  );
  return {
    success: true as const,
    lessonId: input.lessonId,
    courseId: lesson.courseId,
  };
}
