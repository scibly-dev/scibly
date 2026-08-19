import {
  useHocuspocusEvent,
  useHocuspocusProvider,
} from "@hocuspocus/provider-react";
import { assertExhaustive } from "@scibly/lib";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

import { api, type RouterInputs } from "@/shared/api/trpc/client";
import {
  updateCourseUpdatesSchema,
  updateLessonUpdatesSchema,
} from "@/shared/content/course/course-validation";
import { updateSceneUpdatesSchema } from "@/shared/content/course/scene-validation";

const syncEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("invalidate_course") }),
  z.object({
    type: z.literal("update_course"),
    updates: updateCourseUpdatesSchema,
  }),
  z.object({ type: z.literal("invalidate_lesson") }),
  z.object({ type: z.literal("invalidate_lessons") }),
  z.object({ type: z.literal("invalidate_scenes") }),
  z.object({
    type: z.literal("update_scene"),
    sceneId: z.string(),
    updates: updateSceneUpdatesSchema,
  }),
  z.object({
    type: z.literal("update_lesson"),
    updates: updateLessonUpdatesSchema,
  }),
]);

type SyncEvent = z.infer<typeof syncEventSchema>;

type HocuspocusProviderType = ReturnType<typeof useHocuspocusProvider>;

function sendSyncEvent(provider: HocuspocusProviderType, event: SyncEvent) {
  provider.sendStateless(JSON.stringify(event));
}

type CourseMutationHandlers = {
  [P in keyof RouterInputs["course"]]?: (
    variables: RouterInputs["course"][P],
    ctx: { courseId: string; provider: HocuspocusProviderType },
  ) => void;
};

type SceneMutationHandlers = {
  [P in keyof RouterInputs["scene"]]?: (
    variables: RouterInputs["scene"][P],
    ctx: { courseId: string; provider: HocuspocusProviderType },
  ) => void;
};

const courseMutationHandlers: CourseMutationHandlers = {
  update: (variables, { courseId, provider }) => {
    if (variables?.courseId === courseId) {
      sendSyncEvent(provider, { type: "update_course", updates: variables });
    }
  },
  createLesson: (variables, { courseId, provider }) => {
    if (variables?.courseId === courseId) {
      sendSyncEvent(provider, { type: "invalidate_lessons" });
      sendSyncEvent(provider, { type: "invalidate_course" });
    }
  },
  updateLesson: (variables, { courseId, provider }) => {
    if (variables?.courseId === courseId) {
      sendSyncEvent(provider, { type: "invalidate_lessons" });
    }
  },
  updateLessonOrder: (variables, { courseId, provider }) => {
    if (variables?.courseId === courseId) {
      sendSyncEvent(provider, { type: "invalidate_lessons" });
    }
  },
  deleteLesson: (variables, { courseId, provider }) => {
    if (variables?.courseId === courseId) {
      sendSyncEvent(provider, { type: "invalidate_lessons" });
      sendSyncEvent(provider, { type: "invalidate_course" });
    }
  },
};

const sceneMutationHandlers: SceneMutationHandlers = {
  updateScene: (variables, { provider }) => {
    if (variables.updates) {
      sendSyncEvent(provider, {
        type: "update_scene",
        sceneId: variables.sceneId,
        updates: variables.updates,
      });
    }
  },
};

interface UseCourseSyncOptions {
  courseId: string;
  lessonId?: string;
}

type SyncContext = {
  courseId: string;
  provider: HocuspocusProviderType;
};

function dispatchSuccessfulMutation(
  mutationKey: readonly unknown[] | undefined,
  variables: unknown,
  context: SyncContext,
) {
  if (!mutationKey || !Array.isArray(mutationKey)) return;

  const flatKeys = mutationKey
    .flat(1)
    .filter((key): key is string => typeof key === "string");
  const router = flatKeys.find(
    (key): key is "course" | "scene" => key === "course" || key === "scene",
  );
  if (!router) return;

  if (router === "course") {
    const procedure = flatKeys.find(
      (key): key is keyof CourseMutationHandlers =>
        key in courseMutationHandlers,
    );
    if (procedure) {
      // SAFETY: the key and the variables come off the same mutation, so the

      courseMutationHandlers[procedure]?.(variables as never, context);
    }
    return;
  }

  const procedure = flatKeys.find(
    (key): key is keyof SceneMutationHandlers => key in sceneMutationHandlers,
  );
  if (procedure) {
    // SAFETY: same pairing as above — the mutation that carried this key is the

    sceneMutationHandlers[procedure]?.(variables as never, context);
  }
}

function useMutationBroadcast(
  courseId: string,
  provider: HocuspocusProviderType,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return;
      dispatchSuccessfulMutation(
        event.mutation.options.mutationKey,
        event.mutation.state.variables,
        { courseId, provider },
      );
    });

    return () => unsubscribe();
  }, [courseId, provider, queryClient]);
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
  useMutationBroadcast(courseId, provider);

  useHocuspocusEvent("stateless", ({ payload }) => {
    const event = parseSyncEvent(payload);
    if (event) applySyncEvent(event, utils, { courseId, lessonId });
  });

  return provider;
}
