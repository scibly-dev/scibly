import type { StoredGradingManifest } from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";
import { db, Prisma } from "@scibly/db";
import { z } from "zod";

import { questionBlockParserRegistry } from "@/shared/content/server";

import { type getBlockAnalyticsSchema } from "../../courses/api/course.schema";

type PublishedBlock = StoredGradingManifest[number];
type MasterBlocks = Map<string, PublishedBlock>;

const publishedBlockSchema = z.object({
  blockId: z.string(),
  blockType: z.string().catch(""),
  questionData: z.unknown(),
  maxPoints: z.number().optional(),
  sp: z.number().optional(),
});

function indexPublishedBlocks(gradingManifest: unknown): MasterBlocks {
  if (!Array.isArray(gradingManifest)) return new Map();
  return new Map(
    gradingManifest.flatMap((block) => {
      const parsed = publishedBlockSchema.safeParse(block);
      return parsed.success
        ? [[parsed.data.blockId, parsed.data] as const]
        : [];
    }),
  );
}

function requirePublishedBlock(
  masterBlocks: MasterBlocks,
  blockId: string,
): PublishedBlock {
  const masterBlock = masterBlocks.get(blockId);
  if (!masterBlock) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      applicationCode: "analytics.block_not_in_manifest",
      message: `This scene's analytics cannot be shown: question ${blockId} was answered but is not in the published version's answer key. Republish the course to regenerate it.`,
    });
  }
  return masterBlock;
}

// spEarned stays optional because pre-SP-tracking submissions have none; requireSpEarned rejects
// those rather than silently scoring them zero.
const gradedBlockSchema = z.object({
  blockId: z.string(),
  spEarned: z.number().optional(),
  learnerAnswer: z.unknown().optional(),
});

type GradedBlock = z.infer<typeof gradedBlockSchema>;

type AnswerAggregate = {
  answer: string;
  enrolledCount: number;
  anonCount: number;
};
type ScoreAggregate = {
  enrolledCount: number;
  anonCount: number;
  answersMap: Map<string, AnswerAggregate>;
};
type BlockAggregate = {
  blockId: string;
  blockType: PublishedBlock["blockType"];
  maxSp: number;
  enrolledTotalSp: number;
  enrolledCount: number;
  anonTotalSp: number;
  anonCount: number;
  scoreMap: Map<number, ScoreAggregate>;
};

function requireMaxSp(masterBlock: PublishedBlock, blockId: string): number {
  if (typeof masterBlock.sp !== "number" || masterBlock.sp === 0) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      applicationCode: "analytics.block_missing_sp",
      message: `This scene's analytics cannot be shown: question ${blockId} has no SP value in the published answer key. Republish the course to regenerate it.`,
    });
  }
  return masterBlock.sp;
}

function requireSpEarned(block: GradedBlock): number {
  if (typeof block.spEarned !== "number") {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      applicationCode: "analytics.block_missing_sp_earned",
      message: `This scene's analytics cannot be shown: a graded answer for question ${block.blockId} has no recorded SP earned. This submission predates SP tracking and cannot be included.`,
    });
  }
  return block.spEarned;
}

function updateParticipantTotals(
  aggregate: BlockAggregate,
  score: ScoreAggregate,
  spEarned: number,
  enrolled: boolean,
) {
  if (enrolled) {
    aggregate.enrolledTotalSp += spEarned;
    aggregate.enrolledCount += 1;
    score.enrolledCount += 1;
    return;
  }
  aggregate.anonTotalSp += spEarned;
  aggregate.anonCount += 1;
  score.anonCount += 1;
}

function recordAnswer(
  score: ScoreAggregate,
  answer: string | null,
  enrolled: boolean,
) {
  if (!answer) return;
  const current = score.answersMap.get(answer) ?? {
    answer,
    enrolledCount: 0,
    anonCount: 0,
  };
  if (enrolled) current.enrolledCount += 1;
  else current.anonCount += 1;
  score.answersMap.set(answer, current);
}

function aggregateBlock(
  blockMap: Map<string, BlockAggregate>,
  masterBlocks: MasterBlocks,
  block: GradedBlock,
  enrolled: boolean,
) {
  const masterBlock = requirePublishedBlock(masterBlocks, block.blockId);
  const maxSp = requireMaxSp(masterBlock, block.blockId);
  const spEarned = requireSpEarned(block);
  const aggregate = blockMap.get(block.blockId) ?? {
    blockId: block.blockId,
    blockType: masterBlock.blockType,
    maxSp,
    enrolledTotalSp: 0,
    enrolledCount: 0,
    anonTotalSp: 0,
    anonCount: 0,
    scoreMap: new Map<number, ScoreAggregate>(),
  };
  const score = aggregate.scoreMap.get(spEarned) ?? {
    enrolledCount: 0,
    anonCount: 0,
    answersMap: new Map<string, AnswerAggregate>(),
  };
  updateParticipantTotals(aggregate, score, spEarned, enrolled);
  recordAnswer(
    score,
    questionBlockParserRegistry.formatLearnerAnswer(
      aggregate.blockType,
      block.learnerAnswer,
      masterBlock.questionData,
    ),
    enrolled,
  );
  aggregate.scoreMap.set(spEarned, score);
  blockMap.set(block.blockId, aggregate);
}

function buildBlockResult(
  aggregate: BlockAggregate,
  masterBlocks: MasterBlocks,
) {
  const masterBlock = requirePublishedBlock(masterBlocks, aggregate.blockId);
  const scoreDistribution = Array.from(aggregate.scoreMap.entries())
    .map(([score, counts]) => ({
      achievedPoints: score,
      enrolledCount: counts.enrolledCount,
      anonCount: counts.anonCount,
      answers: Array.from(counts.answersMap.values()).sort(
        (left, right) =>
          right.enrolledCount +
          right.anonCount -
          (left.enrolledCount + left.anonCount),
      ),
    }))
    .sort((left, right) => right.achievedPoints - left.achievedPoints);
  const average = (total: number, count: number) =>
    count > 0 ? Math.round((total / count) * 100) / 100 : 0;
  return {
    blockId: aggregate.blockId,
    blockType: aggregate.blockType,
    maxPoints: aggregate.maxSp,
    correctAnswer:
      questionBlockParserRegistry.formatCorrectAnswer(
        aggregate.blockType,
        masterBlock.questionData,
      ) || null,
    enrolled: {
      avgAchieved: average(aggregate.enrolledTotalSp, aggregate.enrolledCount),
      count: aggregate.enrolledCount,
    },
    anonymous: {
      avgAchieved: average(aggregate.anonTotalSp, aggregate.anonCount),
      count: aggregate.anonCount,
    },
    scoreDistribution,
  };
}

export async function getBlockAnalyticsHelper(
  input: z.infer<typeof getBlockAnalyticsSchema>,
) {
  const [scene, rows] = await Promise.all([
    db.scene.findUnique({
      where: { id: input.sceneId },
      select: { gradingManifest: true },
    }),
    db.sceneAnalytics.findMany({
      where: {
        sceneId: input.sceneId,
        gradedBlocks: { not: Prisma.AnyNull },
        OR: [
          { enrollment: { courseId: input.courseId } },
          { anonymousSession: { courseId: input.courseId } },
        ],
      },
      select: {
        enrollmentId: true,
        anonymousSessionId: true,
        gradedBlocks: true,
      },
    }),
  ]);
  const masterBlocks = indexPublishedBlocks(scene?.gradingManifest);
  const blockMap = new Map<string, BlockAggregate>();
  for (const row of rows) {
    if (!Array.isArray(row.gradedBlocks)) continue;
    for (const block of row.gradedBlocks) {
      const parsed = gradedBlockSchema.safeParse(block);
      if (!parsed.success) continue;
      aggregateBlock(
        blockMap,
        masterBlocks,
        parsed.data,
        Boolean(row.enrollmentId),
      );
    }
  }
  return Array.from(blockMap.values()).map((aggregate) =>
    buildBlockResult(aggregate, masterBlocks),
  );
}
