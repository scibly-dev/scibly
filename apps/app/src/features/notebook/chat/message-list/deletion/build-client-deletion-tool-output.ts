import type { DeletionInvocation } from "./deletion.types";

type SceneDeleteToolOutput = {
  success: true;
  courseId: string;
  deleted: Array<{
    sceneId: string;
    title?: string;
    lessonTitle?: string;
    lessonId?: string;
    courseId?: string;
  }>;
};

type LessonDeleteToolOutput = {
  success: true;
  courseId: string;
  deletedLessonIds: string[];
  deletedLessons: Array<{
    lessonId: string;
    title?: string;
  }>;
};

export type ClientDeletionToolOutput =
  | SceneDeleteToolOutput
  | LessonDeleteToolOutput;

// `deletedIds` is the server's answer, not the request — a delete can drop fewer ids than asked (e.g. one published between read and write) — so the card's items supply only the titles, which the server doesn't return.
export function buildClientDeletionToolOutput(
  invocation: DeletionInvocation,
  deletedIds: string[],
  courseId: string,
): ClientDeletionToolOutput {
  const shownById = new Map(invocation.items.map((item) => [item.id, item]));

  if (invocation.kind === "scene") {
    return {
      success: true,
      courseId,
      deleted: deletedIds.map((sceneId) => ({
        sceneId,
        title: shownById.get(sceneId)?.title,
        lessonTitle: shownById.get(sceneId)?.subtitle,
        lessonId: shownById.get(sceneId)?.lessonId,
        courseId,
      })),
    };
  }

  return {
    success: true,
    courseId,
    deletedLessonIds: deletedIds,
    deletedLessons: deletedIds.map((lessonId) => ({
      lessonId,
      title: shownById.get(lessonId)?.title,
    })),
  };
}
