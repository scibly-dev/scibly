import type { DeletionInvocation, DeletionResolution } from "./deletion.types";

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

// The last chance to write the titles down: after this no id resolves to a name again.
export function buildClientDeletionToolOutput(
  invocation: DeletionInvocation,
  resolution: DeletionResolution,
  deletedIds: string[],
): ClientDeletionToolOutput {
  const { courseId } = invocation;
  const shownById = new Map(resolution.items.map((item) => [item.id, item]));

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
