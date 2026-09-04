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
import {
  gradePracticeSubmission,
  type PracticeGradedField,
  type PracticeGradingManifest,
} from "@/shared/content/practice/grade-practice-submission";
import { gradeContentSubmissions } from "@/shared/content/server";

export type SceneGradingResult = {
  sceneId: string;
  lessonId: string;
  courseVersionId: string | null;
  spEarned: number;
  gradedBlocks: (
    | ReturnType<typeof gradeContentSubmissions>["gradedBlocks"][number]
    | PracticeGradedField
  )[];
  explanation?: string | null;
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
    practiceWork?: unknown;
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
      kind: true,
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

    if (scene.kind === "PRACTICE") {
      // SAFETY: this is the { solution, explain } answer key publish wrote.
      const manifest =
        (scene.gradingManifest as PracticeGradingManifest | null) ?? {
          solution: null,
          explain: null,
        };
      const { gradedFields, totalSpEarned, explanation } =
        gradePracticeSubmission(
          submission.practiceWork,
          manifest,
          getEffectiveSceneSp(scene.sp),
        );
      return {
        sceneId: scene.id,
        lessonId: scene.lessonId,
        courseVersionId: scene.courseVersionId,
        gradedBlocks: gradedFields,
        spEarned: totalSpEarned,
        explanation,
      };
    }

    // SAFETY: the answer key publish wrote on the same immutable row.
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

// A PRACTICE scene has no per-block submission list, just one `work` object keyed by solution field.
function buildAnalyticsBlocks(
  gradedBlocks: SceneGradingResult["gradedBlocks"],
  submissions: BlockSubmission[] | undefined,
  practiceWork: unknown,
) {
  const submissionById = new Map(
    (submissions ?? []).map((submission) => [submission.blockId, submission]),
  );
  // SAFETY: opaque JSON, same trust boundary as `BlockSubmission.learnerAnswer`.
  const practiceWorkByField =
    typeof practiceWork === "object" &&
    practiceWork !== null &&
    !Array.isArray(practiceWork)
      ? (practiceWork as Record<string, Prisma.JsonValue>)
      : {};
  return gradedBlocks.map((graded) => {
    const submission = submissionById.get(graded.blockId);
    const learnerAnswer =
      graded.blockType === "practice"
        ? (practiceWorkByField[graded.blockId] ?? null)
        : (submission?.learnerAnswer ?? null);
    return {
      blockId: graded.blockId,
      blockType: graded.blockType,
      // SAFETY: both arrived as JSON — one off the request body, one out of `practiceWorkByField`.
      learnerAnswer: learnerAnswer as Prisma.InputJsonValue,
      achievedPoints: graded.achievedPoints,
      maxPoints: graded.maxPoints,
      spEarned: graded.spEarned,
      // SAFETY: `correctAnswer` on both graded-block shapes is JSON-serializable.
      correctAnswer: (graded.correctAnswer ?? null) as Prisma.InputJsonValue,
    };
  });
}

type SceneAnalyticsDetails = {
  lessonId: string;
  attempt: number;
  result: SceneGradingResult;
  blocks?: BlockSubmission[];
  practiceWork?: unknown;
};

function analyticsData(params: SceneAnalyticsDetails) {
  // SAFETY: an array of the JSON objects `buildAnalyticsBlocks` just built.
  const gradedBlocks = buildAnalyticsBlocks(
    params.result.gradedBlocks,
    params.blocks,
    params.practiceWork,
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
