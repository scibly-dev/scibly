import type { BlockSubmission } from "@/shared/content/contracts";

import { type Prisma } from "@scibly/db";

import "server-only";

import {
  persistMemberSceneAnalytics,
  type SceneGradingResult,
} from "./grading";

type CompletionDetails = {
  lessonId: string;
  attempt: number;
  result: SceneGradingResult;
  blocks?: BlockSubmission[];
};

export async function persistMemberSceneCompletion(
  tx: Prisma.TransactionClient,
  enrollmentId: string,
  details: CompletionDetails,
) {
  await persistMemberSceneAnalytics(tx, enrollmentId, details);
  const progress = {
    status: "COMPLETED" as const,
    completedAt: new Date(),
    spEarned: details.result.spEarned,
  };
  await tx.sceneProgress.upsert({
    where: {
      enrollmentId_lessonId_sceneId_attempt: {
        enrollmentId,
        lessonId: details.lessonId,
        sceneId: details.result.sceneId,
        attempt: details.attempt,
      },
    },
    update: progress,
    create: {
      enrollmentId,
      lessonId: details.lessonId,
      sceneId: details.result.sceneId,
      attempt: details.attempt,
      ...progress,
    },
  });
}
