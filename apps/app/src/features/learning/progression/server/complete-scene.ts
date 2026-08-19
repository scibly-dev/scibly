import type { BlockSubmission } from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";

import "server-only";
import {
  lockAnonymousAttempt,
  lockEnrollmentAttempt,
} from "@/lib/db/transaction-locks";

import { withAnonymousGradingRateLimit } from "../../public-course/server/anonymous-session";
import {
  getLatestCourseVersion,
  requireAnonymousCourse,
} from "../../public-course/server/public-course";
import {
  type AttemptTransition,
  transitionAttempt,
} from "../progression-rules";
import {
  type AnonymousCompletionContext,
  loadAnonymousCompletionContext,
  loadAuthoritativeSceneIds,
  loadMemberCompletionContext,
  type MemberCompletionContext,
} from "./completion-context";
import { finishMemberCourseWhenComplete } from "./finish-member-course";
import {
  gradeSceneSubmissions,
  persistAnonymousSceneAnalytics,
} from "./grading";
import { persistMemberSceneCompletion } from "./persist-completion";

type SceneCompletionInput = {
  lessonId: string;
  sceneId: string;
  blocks?: BlockSubmission[];
};

function throwRejectedTransition(
  transition: Extract<AttemptTransition, { kind: "rejected" }>,
  finishedMessage: string,
): never {
  if (transition.reason === "PREVIOUS_SCENE_INCOMPLETE") {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "progression.previous_scene_incomplete",
      message: "You must complete all previous scenes before progressing.",
    });
  }
  if (transition.reason === "SCENE_NOT_FOUND") {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "progression.scene_not_found",
      message: "Scene does not belong to this lesson.",
    });
  }
  throw new AppError({
    code: "CONFLICT",
    applicationCode: "progression.attempt_finished",
    message: finishedMessage,
  });
}

async function gradeExpectedScene(
  client: Parameters<typeof gradeSceneSubmissions>[0],
  context: Pick<MemberCompletionContext, "courseVersionId">,
  input: SceneCompletionInput,
) {
  const { results } = await gradeSceneSubmissions(client, [
    { sceneId: input.sceneId, blocks: input.blocks },
  ]);
  const result = results[0]!;
  if (
    result.lessonId !== input.lessonId ||
    result.courseVersionId !== context.courseVersionId
  ) {
    throw new AppError({
      code: "FORBIDDEN",
      applicationCode: "api.forbidden",
      message: "Scene does not belong to this lesson.",
    });
  }
  return result;
}

async function transitionScene(
  client: Parameters<typeof gradeSceneSubmissions>[0],
  context: MemberCompletionContext | AnonymousCompletionContext,
  input: SceneCompletionInput,
  finishedMessage: string,
) {
  const orderedSceneIds = await loadAuthoritativeSceneIds(
    client,
    context.courseVersionId,
  );
  const transition = transitionAttempt(
    context.status === "active"
      ? {
          status: "active",
          completedSceneIds: context.completedSceneIds,
        }
      : {
          status: "finished",
          completedSceneIds: context.completedSceneIds,
          passed: context.passed,
          triesUsed: context.triesUsed,
          maxTries: context.maxTries,
        },
    {
      type: "complete-scene",
      sceneId: input.sceneId,
      orderedSceneIds,
    },
  );
  if (transition.kind === "rejected") {
    throwRejectedTransition(transition, finishedMessage);
  }
  return transition;
}

export async function completeMemberScene(
  identifier: { userId: string; enrollmentId: string },
  input: SceneCompletionInput,
) {
  return db.$transaction(async (tx) => {
    await lockEnrollmentAttempt(tx, identifier.enrollmentId);
    const context = await loadMemberCompletionContext({
      client: tx,
      ...identifier,
    });
    const transition = await transitionScene(
      tx,
      context,
      input,
      context.passed
        ? "This course has already been completed successfully."
        : "Cannot update progress on a completed attempt.",
    );
    if (transition.kind === "idempotent") {
      return {
        success: true,
        gradedBlocks: [],
        spEarned: 0,
      };
    }
    const result = await gradeExpectedScene(tx, context, input);
    await persistMemberSceneCompletion(tx, context.enrollmentId, {
      lessonId: input.lessonId,
      attempt: context.attempt,
      result,
      blocks: input.blocks,
    });
    await finishMemberCourseWhenComplete(tx, context);
    return {
      success: true,
      gradedBlocks: result.gradedBlocks,
      spEarned: result.spEarned,
    };
  });
}

async function completeAnonymousSceneWithoutRateLimit(
  identifier: { courseId: string; anonymousId: string },
  input: SceneCompletionInput,
) {
  const [course, latestVersion] = await Promise.all([
    requireAnonymousCourse(identifier.courseId),
    getLatestCourseVersion(identifier.courseId),
  ]);
  return db.$transaction(async (tx) => {
    await lockAnonymousAttempt(tx, identifier.anonymousId, latestVersion.id);
    const context = await loadAnonymousCompletionContext({
      client: tx,
      anonymousId: identifier.anonymousId,
      courseVersionId: latestVersion.id,
      maxTries: course.maxTries,
      passingScorePct: course.passingScorePct,
    });
    const transition = await transitionScene(
      tx,
      context,
      input,
      "Cannot update progress on a completed session.",
    );
    if (transition.kind === "idempotent") {
      return {
        success: true,
        gradedBlocks: [],
        spEarned: 0,
      };
    }
    const result = await gradeExpectedScene(tx, context, input);
    await persistAnonymousSceneAnalytics(tx, context.anonymousSessionId, {
      lessonId: input.lessonId,
      attempt: context.attempt,
      result,
      blocks: input.blocks,
    });
    return {
      success: true,
      gradedBlocks: result.gradedBlocks,
      spEarned: result.spEarned,
    };
  });
}

export function completeAnonymousScene(
  headers: Headers,
  identifier: { courseId: string; anonymousId: string },
  input: SceneCompletionInput,
) {
  return withAnonymousGradingRateLimit(
    headers,
    identifier.anonymousId,
    "anon.gradeScene",
    () => completeAnonymousSceneWithoutRateLimit(identifier, input),
  );
}
