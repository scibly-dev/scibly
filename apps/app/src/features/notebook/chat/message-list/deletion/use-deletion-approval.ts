"use client";

import type { NotebookCourseBuilderTranslations } from "../../../course-builder/i18n/course-builder.types";
import type { DeletionInvocation } from "./deletion.types";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

import { applyCourseBuilderDeletionEffects } from "../../../course-builder/hooks/invalidate-course-scene-state";
import { useNotebookActions } from "../../runtime/context";
import {
  buildClientDeletionToolOutput,
  type ClientDeletionToolOutput,
} from "./build-client-deletion-tool-output";
import { deletionLabel } from "./deletion-label";

type CourseBuilderStrings = NotebookCourseBuilderTranslations["courseBuilder"];

interface UseDeletionApprovalOptions {
  invocation: DeletionInvocation;
  cb: CourseBuilderStrings;
}

type TrpcUtils = ReturnType<typeof api.useUtils>;

type DeletionAttempt =
  | { ok: true; output: ClientDeletionToolOutput }
  | { ok: false; error: string };

async function executeSceneDeletion(
  invocation: DeletionInvocation,
  utils: TrpcUtils,
): Promise<DeletionAttempt> {
  const result = await utils.client.scene.deleteScene.mutate({
    sceneIds: invocation.items.map((item) => item.id),
  });
  if (!result.success) {
    return { ok: false, error: result.message };
  }
  const courseId =
    invocation.courseId ?? result.deleted[0]?.courseId ?? undefined;
  if (!courseId) {
    return { ok: false, error: "Missing course ID for this scene deletion." };
  }
  applyCourseBuilderDeletionEffects({
    kind: "scene",
    deletedIds: result.deleted.map((entry) => entry.sceneId),
    courseId,
    lessonIds: [...new Set(result.deleted.map((entry) => entry.lessonId))],
    utils,
  });
  return {
    ok: true,
    output: buildClientDeletionToolOutput(
      invocation,
      result.deleted.map((entry) => entry.sceneId),
      courseId,
    ),
  };
}

async function executeLessonDeletion(
  invocation: DeletionInvocation,
  utils: TrpcUtils,
): Promise<DeletionAttempt> {
  const courseId = invocation.courseId;
  if (!courseId) {
    return { ok: false, error: "Missing course ID for this lesson deletion." };
  }
  const result = await utils.client.course.deleteLesson.mutate({
    courseId,
    lessonIds: invocation.items.map((item) => item.id),
  });
  if (!result.success) {
    return { ok: false, error: result.message };
  }
  applyCourseBuilderDeletionEffects({
    kind: "lesson",
    deletedIds: result.deletedLessonIds,
    courseId,
    utils,
  });
  return {
    ok: true,
    output: buildClientDeletionToolOutput(
      invocation,
      result.deletedLessonIds,
      courseId,
    ),
  };
}

function deletedCount(attempt: DeletionAttempt & { ok: true }): number {
  return "deleted" in attempt.output
    ? attempt.output.deleted.length
    : attempt.output.deletedLessonIds.length;
}

function useApprovalResponse(params: {
  invocation: DeletionInvocation;
  canRespond: boolean;
  executeDeletion: () => Promise<DeletionAttempt>;
  setResponding: (value: boolean) => void;
  setError: (error: string | null) => void;
  addToolApprovalResponse: ReturnType<
    typeof useNotebookActions
  >["addToolApprovalResponse"];
  addToolOutput: ReturnType<typeof useNotebookActions>["addToolOutput"];
}) {
  const inFlight = useRef(false);

  const respond = useCallback(
    async (approved: boolean) => {
      if (!params.canRespond || inFlight.current) return;
      inFlight.current = true;
      params.setResponding(true);
      params.setError(null);
      try {
        const attempt = approved ? await params.executeDeletion() : null;
        if (attempt && !attempt.ok) params.setError(attempt.error);

        const { approval, kind } = params.invocation;
        if (!approval) return;

        const tool = kind === "scene" ? "deleteScenes" : "deleteLessons";
        const toolCallId = approval.toolCallId;

        params.addToolApprovalResponse({ id: approval.approvalId, approved });

        if (!attempt) return;
        if (attempt.ok) {
          params.addToolOutput({ tool, toolCallId, output: attempt.output });
        } else {
          params.addToolOutput({
            tool,
            toolCallId,
            state: "output-error",
            errorText: attempt.error,
          });
        }
      } finally {
        inFlight.current = false;
        params.setResponding(false);
      }
    },
    [params],
  );
  return {
    handleApprove: useCallback(() => {
      void respond(true);
    }, [respond]),
    handleDeny: useCallback(() => {
      void respond(false);
    }, [respond]),
  };
}

export function useDeletionApproval({
  invocation,
  cb,
}: UseDeletionApprovalOptions) {
  const { addToolApprovalResponse, addToolOutput } = useNotebookActions();
  const utils = api.useUtils();
  const [isResponding, setIsResponding] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const canRespond =
    invocation.status === "awaiting-approval" &&
    Boolean(invocation.approval) &&
    !isResponding;

  const executeDeletion = useCallback(async (): Promise<DeletionAttempt> => {
    const attempt =
      invocation.kind === "scene"
        ? await executeSceneDeletion(invocation, utils)
        : await executeLessonDeletion(invocation, utils);
    if (attempt.ok) {
      const count = deletedCount(attempt);
      toast.success(
        deletionLabel(invocation.kind === "scene", count > 1, count, cb, true),
      );
    }
    return attempt;
  }, [invocation, utils, cb]);

  const { handleApprove, handleDeny } = useApprovalResponse({
    invocation,
    canRespond,
    executeDeletion,
    setResponding: setIsResponding,
    setError: setLocalError,
    addToolApprovalResponse,
    addToolOutput,
  });

  return {
    isResponding,
    canRespond,
    localError,
    handleApprove,
    handleDeny,
  };
}
