import type { ProgressionMode } from "../../utils/player-types";
import type {
  SceneResult,
  SceneSubmissionCommand,
  SubmitScene,
} from "./lesson-progression.model";

import { useEventCallback } from "@scibly/lib/hooks/use-event-callback";

import { api } from "@/shared/api/trpc/client";

interface UseSubmitSceneOptions {
  mode: ProgressionMode;
  lessonId: string;
  enrollmentId?: string;
  anonymousId?: string;
  courseId?: string;
}

function assertSubmitSceneConfiguration(
  options: Pick<
    UseSubmitSceneOptions,
    "mode" | "enrollmentId" | "anonymousId" | "courseId"
  >,
) {
  if (options.mode === "member" && !options.enrollmentId) {
    throw new Error("Member progression requires an enrollmentId.");
  }
  if (
    options.mode === "anonymous" &&
    (!options.anonymousId || !options.courseId)
  ) {
    throw new Error(
      "Anonymous progression requires an anonymousId and courseId.",
    );
  }
}

export function useSubmitScene(options: UseSubmitSceneOptions): SubmitScene {
  const completeScene = api.sceneProgress.completeScene.useMutation();
  const previewScene = api.sceneProgress.previewScene.useMutation();

  return useEventCallback(
    async (command: SceneSubmissionCommand): Promise<SceneResult> => {
      assertSubmitSceneConfiguration(options);
      const input = {
        lessonId: options.lessonId,
        sceneId: command.sceneId,
        blocks: command.blocks,
      };
      if (options.mode === "preview") {
        return previewScene.mutateAsync(input);
      }
      if (options.mode === "anonymous") {
        return completeScene.mutateAsync({
          ...input,
          anonymousId: options.anonymousId!,
          courseId: options.courseId!,
        });
      }
      return completeScene.mutateAsync({
        ...input,
        enrollmentId: options.enrollmentId!,
      });
    },
  );
}
