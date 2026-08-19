import type {
  BlockSubmission,
  StoredGradingManifest,
} from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";
import { type db, type Prisma } from "@scibly/db";

import "server-only";
import { assertSubmissionComplete } from "@/shared/content/editor/assessment/grading/submission-completeness";
import { readPublishedSceneQuestions } from "@/shared/content/editor/server";
import {
  getEffectiveSceneSp,
  sumPublishedScenesMaxSp,
} from "@/shared/content/learning/scene-sp";
import { gradeContentSubmissions } from "@/shared/content/server";

export type SceneGradingResult = {
  sceneId: string;
  lessonId: string;
  courseVersionId: string | null;
  spEarned: number;
  gradedBlocks: ReturnType<typeof gradeContentSubmissions>["gradedBlocks"];
};

export async function computeCourseMaxSp(
  client: typeof db | Prisma.TransactionClient,
  courseVersionId: string,
): Promise<number> {
  const scenes = await client.scene.findMany({
    where: { courseVersionId },
    select: { maxSp: true },
  });
  return sumPublishedScenesMaxSp(scenes);
}

export async function gradeSceneSubmissions(
  client: typeof db | Prisma.TransactionClient,
  submissions: readonly {
    sceneId: string;
    blocks?: BlockSubmission[];
  }[],
): Promise<{ results: SceneGradingResult[]; totalSpEarned: number }> {
  if (submissions.length === 0) {
    return { results: [], totalSpEarned: 0 };
  }
  const scenes = await client.scene.findMany({
    where: { id: { in: submissions.map((submission) => submission.sceneId) } },
    select: {
      id: true,
      lessonId: true,
      courseVersionId: true,
      sp: true,
      gradingManifest: true,

      learnerContent: true,
    },
  });
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const results = submissions.map((submission): SceneGradingResult => {
    const scene = sceneById.get(submission.sceneId);
    if (!scene) {
      throw new AppError({
        code: "FORBIDDEN",
        applicationCode: "api.forbidden",
        message: "Scene does not belong to this lesson.",
      });
    }
    // SAFETY: this is the answer key the publish step wrote alongside

    const manifest =
      (scene.gradingManifest as StoredGradingManifest | null) ?? [];

    assertSubmissionComplete(
      readPublishedSceneQuestions(scene.learnerContent),
      submission.blocks,
    );
    const { gradedBlocks, totalSpEarned } = gradeContentSubmissions(
      submission.blocks,
      manifest,
      getEffectiveSceneSp(scene.sp),
    );
    return {
      sceneId: scene.id,
      lessonId: scene.lessonId,
      courseVersionId: scene.courseVersionId,
      gradedBlocks,
      spEarned: totalSpEarned,
    };
  });
  return {
    results,
    totalSpEarned: results.reduce(
      (total, result) => total + result.spEarned,
      0,
    ),
  };
}

// Question metadata (blockType, etc.) comes from the graded manifest, not the
// submission — the submission only supplies the learner's answer (SC24, GR15).
function buildAnalyticsBlocks(
  gradedBlocks: SceneGradingResult["gradedBlocks"],
  submissions: BlockSubmission[] | undefined,
) {
  const submissionById = new Map(
    (submissions ?? []).map((submission) => [submission.blockId, submission]),
  );
  return gradedBlocks.map((graded) => {
    const submission = submissionById.get(graded.blockId);
    // SAFETY: both answers arrived as JSON — one parsed off the request body,

    return {
      blockId: graded.blockId,
      blockType: graded.blockType,
      learnerAnswer: (submission?.learnerAnswer ??
        null) as Prisma.InputJsonValue,
      achievedPoints: graded.achievedPoints,
      maxPoints: graded.maxPoints,
      spEarned: graded.spEarned,
      correctAnswer: (graded.correctAnswer ?? null) as Prisma.InputJsonValue,
    };
  });
}

type SceneAnalyticsDetails = {
  lessonId: string;
  attempt: number;
  result: SceneGradingResult;
  blocks?: BlockSubmission[];
};

function analyticsData(params: SceneAnalyticsDetails) {
  // SAFETY: an array of the JSON objects `buildAnalyticsBlocks` just built.
  const gradedBlocks = buildAnalyticsBlocks(
    params.result.gradedBlocks,
    params.blocks,
  ) as Prisma.InputJsonValue;
  return {
    spEarned: params.result.spEarned,
    gradedBlocks,
    completedAt: new Date(),
  };
}

export function persistMemberSceneAnalytics(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
  details: SceneAnalyticsDetails,
) {
  const data = analyticsData(details);
  return tx.sceneAnalytics.upsert({
    where: {
      enrollmentId_lessonId_sceneId_attempt: {
        enrollmentId,
        lessonId: details.lessonId,
        sceneId: details.result.sceneId,
        attempt: details.attempt,
      },
    },
    update: {},
    create: {
      enrollmentId,
      lessonId: details.lessonId,
      sceneId: details.result.sceneId,
      attempt: details.attempt,
      ...data,
    },
  });
}

export function persistAnonymousSceneAnalytics(
  tx: Prisma.TransactionClient,
  anonymousSessionId: string,
  details: SceneAnalyticsDetails,
) {
  const data = analyticsData(details);
  return tx.sceneAnalytics.upsert({
    where: {
      anonymousSessionId_lessonId_sceneId_attempt: {
        anonymousSessionId,
        lessonId: details.lessonId,
        sceneId: details.result.sceneId,
        attempt: details.attempt,
      },
    },
    update: {},
    create: {
      anonymousSessionId,
      lessonId: details.lessonId,
      sceneId: details.result.sceneId,
      attempt: details.attempt,
      ...data,
    },
  });
}
