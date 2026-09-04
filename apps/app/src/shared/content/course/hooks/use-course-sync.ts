import {
  useHocuspocusEvent,
  useHocuspocusProvider,
} from "@hocuspocus/provider-react";
import { assertExhaustive } from "@scibly/lib";

import { api } from "@/shared/api/trpc/client";
import {
  type SyncEvent,
  syncEventSchema,
} from "@/shared/content/course/course-sync-events";

interface UseCourseSyncOptions {
  courseId: string;
  lessonId?: string;
}

function parseSyncEvent(payload: string): SyncEvent | null {
  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch (error) {
    console.warn(
      "[useCollaborativeSync] Failed to parse stateless payload:",
      error,
    );
    return null;
  }

  const result = syncEventSchema.safeParse(raw);
  if (result.success) return result.data;

  console.warn(
    "[useCollaborativeSync] Invalid stateless event payload:",
    result.error,
  );
  return null;
}

type ApiUtils = ReturnType<typeof api.useUtils>;

function applySyncEvent(
  data: SyncEvent,
  utils: ApiUtils,
  { courseId, lessonId }: UseCourseSyncOptions,
) {
  switch (data.type) {
    case "invalidate_course":
      utils.course.getById.invalidate({ courseId });
      utils.course.getStats.invalidate({ courseId });
      utils.course.listLessons.invalidate({ courseId });
      break;
    case "update_course":
      utils.course.getById.setData({ courseId }, (old) => {
        if (!old) return old;
        return { ...old, ...data.updates };
      });
      break;
    case "invalidate_lesson":
      if (lessonId) {
        utils.course.getLesson.invalidate({ courseId, lessonId });
      }
      break;
    case "invalidate_lessons":
      utils.course.listLessons.invalidate({ courseId });
      break;
    case "invalidate_scenes":
      if (lessonId) {
        utils.scene.getLessonScenes.invalidate({ lessonId });
      }
      break;
    case "invalidate_practice":
      utils.scene.getPractice.invalidate({ sceneId: data.sceneId });
      break;
    case "update_scene":
      if (lessonId) {
        utils.scene.getLessonScenes.setData({ lessonId }, (old) => {
          if (!old) return old;
          return old.map((scene) => {
            if (scene.id !== data.sceneId) return scene;
            const newScene = { ...scene, ...data.updates };
            if (newScene.integration === null) newScene.integration = undefined;
            // SAFETY: the cache spells a cleared integration `undefined`, and

            return newScene as typeof scene;
          });
        });
      }
      break;
    case "update_lesson":
      if (lessonId) {
        utils.course.getLesson.setData({ courseId, lessonId }, (old) => {
          if (!old) return old;
          return { ...old, ...data.updates };
        });
      }
      break;
    default:
      assertExhaustive(data);
  }
}

export function useCourseSync({ courseId, lessonId }: UseCourseSyncOptions) {
  const utils = api.useUtils();
  const provider = useHocuspocusProvider();

  useHocuspocusEvent("stateless", ({ payload }) => {
    const event = parseSyncEvent(payload);
    if (event) applySyncEvent(event, utils, { courseId, lessonId });
  });

  return provider;
}
