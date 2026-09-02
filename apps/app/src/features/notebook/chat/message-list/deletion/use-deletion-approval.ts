"use client";

import type { NotebookCourseBuilderTranslations } from "../../../course-builder/i18n/course-builder.types";
import type { DeletionInvocation, DeletionResolution } from "./deletion.types";

import { useCallback, useEffect, useRef, useState } from "react";
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
  resolution: DeletionResolution | null;
  cb: CourseBuilderStrings;
}

type TrpcUtils = ReturnType<typeof api.useUtils>;

type DeletionAttempt =
  | { ok: true; output: ClientDeletionToolOutput }
  | { ok: false; error: string };

async function executeSceneDeletion(
  invocation: DeletionInvocation,
  resolution: DeletionResolution,
  utils: TrpcUtils,
): Promise<DeletionAttempt> {
  const result = await utils.client.scene.deleteScene.mutate({
    sceneIds: invocation.ids,
  });
  if (!result.success) {
    return { ok: false, error: result.message };
  }
  applyCourseBuilderDeletionEffects({
    kind: "scene",
    deletedIds: result.deleted.map((entry) => entry.sceneId),
    courseId: invocation.courseId,
    lessonIds: [...new Set(result.deleted.map((entry) => entry.lessonId))],
    utils,
  });
  return {
    ok: true,
    output: buildClientDeletionToolOutput(
      invocation,
      resolution,
      result.deleted.map((entry) => entry.sceneId),
    ),
  };
}

async function executeLessonDeletion(
  invocation: DeletionInvocation,
  resolution: DeletionResolution,
  utils: TrpcUtils,
): Promise<DeletionAttempt> {
  const result = await utils.client.course.deleteLesson.mutate({
    courseId: invocation.courseId,
    lessonIds: invocation.ids,
  });
  if (!result.success) {
    return { ok: false, error: result.message };
  }
  applyCourseBuilderDeletionEffects({
    kind: "lesson",
    deletedIds: result.deletedLessonIds,
    courseId: invocation.courseId,
    utils,
  });
  return {
    ok: true,
    output: buildClientDeletionToolOutput(
      invocation,
      resolution,
      result.deletedLessonIds,
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

const UNRESOLVED_REASON = {
  scene:
    "Those scene IDs no longer name draft scenes in that course, so the user was not asked. " +
    "Call listScenes and retry with the exact ids.",
  lesson:
    "Those lesson IDs no longer name lessons in that course, so the user was not asked. " +
    "Call listLessons and retry with the exact ids.",
} satisfies Record<DeletionInvocation["kind"], string>;

/** Denial only, never `addToolOutput`: the transport resubmits a denied call while the part sits in `approval-responded`, and an output would strand the turn. */
export function useBounceUnresolvedDeletion(
  invocation: DeletionInvocation,
  isUnresolved: boolean,
) {
  const { addToolApprovalResponse } = useNotebookActions();
  const sent = useRef(false);
  const approvalId = invocation.approval?.approvalId;

  useEffect(() => {
    if (!isUnresolved || !approvalId || sent.current) return;
    sent.current = true;
    addToolApprovalResponse({
      id: approvalId,
      approved: false,
      reason: UNRESOLVED_REASON[invocation.kind],
    });
  }, [isUnresolved, approvalId, invocation.kind, addToolApprovalResponse]);
}

export function useDeletionApproval({
  invocation,
  resolution,
  cb,
}: UseDeletionApprovalOptions) {
  const { addToolApprovalResponse, addToolOutput } = useNotebookActions();
  const utils = api.useUtils();
  const [isResponding, setIsResponding] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const canRespond =
    invocation.status === "awaiting-approval" &&
    Boolean(invocation.approval) &&
    resolution != null &&
    !isResponding;

  const executeDeletion = useCallback(async (): Promise<DeletionAttempt> => {
    if (!resolution) {
      return { ok: false, error: "Could not confirm what to delete." };
    }
    const attempt =
      invocation.kind === "scene"
        ? await executeSceneDeletion(invocation, resolution, utils)
        : await executeLessonDeletion(invocation, resolution, utils);
    if (attempt.ok) {
      const count = deletedCount(attempt);
      toast.success(
        deletionLabel(invocation.kind === "scene", count > 1, count, cb, true),
      );
    }
    return attempt;
  }, [invocation, resolution, utils, cb]);

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
