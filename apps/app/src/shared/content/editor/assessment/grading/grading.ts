import type {
  BlockSubmission,
  GradedBlock,
  GradingResult,
  PublishArtifacts,
  StoredGradingManifest,
} from "@/shared/content/contracts";

import { AppError } from "@scibly/api/application-error";

import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";

type GradingMetadata = PublishArtifacts["gradingManifest"][number];

interface RefusalDetails {
  blockId: string;
  blockType?: string;
  expected?: string;
  received?: string;
}

function refuse(
  applicationCode: string,
  details: RefusalDetails,
  cause?: unknown,
): never {
  throw new AppError({
    code: "BAD_REQUEST",
    applicationCode,
    message: "This submission could not be graded.",
    details,
    cause,
  });
}

function indexSubmissions(
  blocks: BlockSubmission[] | undefined,
): Map<string, BlockSubmission> {
  const submissionsByBlockId = new Map<string, BlockSubmission>();
  for (const block of blocks ?? []) {
    if (submissionsByBlockId.has(block.blockId)) {
      refuse("grading.duplicate_block", { blockId: block.blockId });
    }
    submissionsByBlockId.set(block.blockId, block);
  }
  return submissionsByBlockId;
}

function marking<T>(metadata: GradingMetadata, mark: () => T): T {
  try {
    return mark();
  } catch (cause) {
    return refuse(
      "grading.unmarkable_question",
      { blockId: metadata.blockId, blockType: metadata.blockType },
      cause,
    );
  }
}

/**
 * A type the current registry doesn't define means the manifest predates
 * this build or was hand-edited, so this refuses rather than grade against a
 * marking scheme that no longer exists.
 */
function requireMarkableQuestionType(
  entry: StoredGradingManifest[number],
): GradingMetadata {
  const blockType = entry.blockType;
  if (!editorSchemaRegistry.isQuestionName(blockType)) {
    refuse("grading.unknown_question_type", {
      blockId: entry.blockId,
      blockType,
    });
  }
  return { ...entry, blockType };
}

function assertMarkable(metadata: GradingMetadata): void {
  marking(metadata, () =>
    questionBlockParserRegistry.assertQuestionDataStructure(
      metadata.blockType,
      metadata.questionData,
    ),
  );

  const complete = marking(metadata, () =>
    questionBlockParserRegistry.hasSolution(
      metadata.blockType,
      metadata.questionData,
    ),
  );
  if (!complete) {
    refuse("grading.incomplete_answer_key", {
      blockId: metadata.blockId,
      blockType: metadata.blockType,
    });
  }
}

function getManifestMaxPoints(metadata: GradingMetadata): number {
  if (metadata.maxPoints === 0) {
    refuse("grading.question_worth_zero_points", {
      blockId: metadata.blockId,
      blockType: metadata.blockType,
    });
  }
  return marking(metadata, () => {
    const authored = metadata.maxPoints;
    if (authored !== undefined && Number.isFinite(authored) && authored > 0) {
      return authored;
    }
    const computed = questionBlockParserRegistry.getMaxPoints(
      metadata.blockType,
      metadata.questionData,
    );
    return Number.isFinite(computed) ? Math.max(0, computed) : 0;
  });
}

function getSubmissionPoints(
  metadata: GradingMetadata,
  submission: BlockSubmission,
): number {
  return marking(metadata, () =>
    questionBlockParserRegistry.getPoints(
      metadata.blockType,
      metadata.questionData,
      submission.learnerAnswer,
    ),
  );
}

function createEmptyGrade(
  metadata: GradingMetadata,
  maxPoints: number,
): GradedBlock {
  return {
    blockId: metadata.blockId,

    blockType: metadata.blockType,
    achievedPoints: 0,
    maxPoints,
    spEarned: 0,
    correctAnswer: metadata.questionData,
  };
}

function gradeManifestBlock(
  metadata: GradingMetadata,
  submission: BlockSubmission | undefined,
): GradedBlock {
  assertMarkable(metadata);
  const maxPoints = getManifestMaxPoints(metadata);
  const emptyGrade = createEmptyGrade(metadata, maxPoints);

  if (!submission) return emptyGrade;

  if (submission.blockType !== metadata.blockType) {
    refuse("grading.block_type_mismatch", {
      blockId: metadata.blockId,
      expected: metadata.blockType,
      received: submission.blockType,
    });
  }

  if (maxPoints <= 0) return emptyGrade;

  const points = getSubmissionPoints(metadata, submission);
  const achievedPoints = Number.isFinite(points)
    ? Math.min(maxPoints, Math.max(0, points))
    : 0;

  if (metadata.sp === 0) {
    refuse("grading.question_worth_zero_sp", {
      blockId: metadata.blockId,
      blockType: metadata.blockType,
    });
  }

  const sp =
    metadata.sp !== undefined && Number.isFinite(metadata.sp) ? metadata.sp : 0;
  return {
    ...emptyGrade,
    achievedPoints,
    spEarned: Math.max(0, Math.floor(sp * (achievedPoints / maxPoints))),
  };
}

export function gradeContentSubmissions(
  blocks: BlockSubmission[] | undefined,
  manifest: StoredGradingManifest,
  defaultSceneSp: number,
): GradingResult {
  if (manifest.length === 0) {
    return { gradedBlocks: [], totalSpEarned: defaultSceneSp };
  }

  const submissionsByBlockId = indexSubmissions(blocks);
  const seenManifestIds = new Set<string>();
  const gradedBlocks: GradedBlock[] = [];
  for (const entry of manifest) {
    if (seenManifestIds.has(entry.blockId)) continue;
    seenManifestIds.add(entry.blockId);
    const metadata = requireMarkableQuestionType(entry);
    gradedBlocks.push(
      gradeManifestBlock(metadata, submissionsByBlockId.get(metadata.blockId)),
    );
  }

  const blockSp = gradedBlocks.reduce(
    (sum, block) => sum + (block.spEarned || 0),
    0,
  );
  return {
    gradedBlocks,
    totalSpEarned: (blocks?.length ? defaultSceneSp : 0) + blockSp,
  };
}
