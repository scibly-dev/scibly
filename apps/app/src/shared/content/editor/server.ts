import type { JSONContent } from "@tiptap/core";
import type {
  BlockSubmission,
  GradingResult,
  QuestionBlockSnapshot,
} from "@/shared/content/contracts";
import type { PublishedSceneArtifacts } from "@/shared/content/editor/contracts";

import { AppError } from "@scibly/api/application-error";

import "server-only";
import { gradeContentSubmissions } from "@/shared/content/editor/assessment/grading/grading";
import { assertSubmissionComplete } from "@/shared/content/editor/assessment/grading/submission-completeness";
import {
  buildGradingManifest,
  buildPublishArtifacts,
} from "@/shared/content/editor/assessment/publish/publish-artifacts";
import {
  buildLearnerTipTapContent,
  extractQuestionBlockSnapshotsFromTipTap,
  normalizeAuthorTipTapContent,
} from "@/shared/content/editor/documents/tiptap-document";
import { extractQuestionBlockSnapshots } from "@/shared/content/editor/documents/yjs-document";

export type { PublishedSceneArtifacts };
export { fileHandlerRouter } from "./media/api";
export {
  getAuthorPreviewContent,
  normalizeAuthorTipTapContent,
} from "@/shared/content/editor/documents/tiptap-document";
export {
  extractQuestionBlockSnapshots,
  getQuestionBlockAttributes,
  isQuestionBlockElement,
  walkYjsXmlTree,
} from "@/shared/content/editor/documents/yjs-document";

export function buildPublishedSceneArtifacts(
  documentState: Buffer | Uint8Array | null,
): PublishedSceneArtifacts {
  const authorContent = normalizeAuthorTipTapContent(documentState);
  const artifacts = buildPublishArtifacts(
    extractQuestionBlockSnapshotsFromTipTap(authorContent),
  );
  return Object.freeze({
    gradingManifest: artifacts.gradingManifest,
    learnerContent: buildLearnerTipTapContent(
      authorContent,
      artifacts.learnerDocument,
    ),
  });
}

/**
 * A document that cannot be read means completeness cannot be checked, so
 * the submission is refused rather than graded on a guess.
 */
export function readPublishedSceneQuestions(
  learnerContent: unknown,
): QuestionBlockSnapshot[] {
  if (!learnerContent || typeof learnerContent !== "object") return [];
  try {
    // SAFETY: this is the JSON column `buildLearnerTipTapContent` wrote, read

    return extractQuestionBlockSnapshotsFromTipTap(
      learnerContent as JSONContent,
    );
  } catch (cause) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      applicationCode: "progression.scene_unreadable",
      message: "This scene cannot be submitted right now.",
      cause,
    });
  }
}

/**
 * Unlike the course builder's preview, which returns an empty document for
 * unreadable content, this is the player and must refuse rather than
 * silently show an author a lie about what a learner will see.
 */
function readDraftSceneQuestions(
  documentState: Buffer | Uint8Array | null,
): QuestionBlockSnapshot[] {
  try {
    return extractQuestionBlockSnapshots(documentState);
  } catch (cause) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      applicationCode: "progression.scene_unreadable",
      message:
        "This scene cannot be previewed because it cannot be read. Open it in the editor and save it again.",
      cause,
    });
  }
}

/**
 * Held to the learner's completeness rule: preview exists so an author sees
 * what a learner gets, and an author who can submit here but a learner
 * couldn't has been shown a lie.
 */
export function gradeSceneBlocks(
  blocks: BlockSubmission[] | undefined,
  documentState: Buffer | Uint8Array | null,
  defaultSceneSp: number,
): GradingResult {
  const questions = readDraftSceneQuestions(documentState);
  assertSubmissionComplete(questions, blocks);
  return gradeContentSubmissions(
    blocks,
    buildGradingManifest(questions),
    defaultSceneSp,
  );
}
