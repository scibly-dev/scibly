import type { Editor } from "@tiptap/core";
import type { QuestionBlockMap } from "@/shared/content/editor/assessment/parsing/base-parser/types";
import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";
import type {
  PendingSceneSubmission,
  SceneSubmissionCommand,
} from "../progression/lesson-progression.model";

import { getQuestionBlockIdsFromEditor } from "@/shared/content/editor/assessment/grading/question-block-order";
import { getQuestionAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";

export type NavigationTranslations = Pick<
  LearningPlayerTranslations["navigation"],
  "done" | "next" | "saving" | "check" | "complete" | "submissionError"
>;

export function getSceneQuestionBlocksForEditor(
  editor: Editor | null,
  questionBlocks: QuestionBlockMap,
): QuestionBlockMap {
  const blockIds = getQuestionBlockIdsFromEditor(editor);
  if (blockIds.length === 0) return new Map();
  return new Map(
    blockIds.flatMap((blockId) => {
      const block = questionBlocks.get(blockId);
      return block ? [[blockId, block]] : [];
    }),
  );
}

export function collectBlocksFromEditor(
  editor: Editor | null,
  fallbackBlocks?: QuestionBlockMap,
) {
  if (!editor?.state?.doc) {
    if (!fallbackBlocks?.size) return undefined;
    return [...fallbackBlocks.values()].map((block) => ({
      blockId: block.blockId,
      blockType: block.blockType,
      learnerAnswer: structuredClone(block.learnerAnswer),
    }));
  }

  const submissions: NonNullable<PendingSceneSubmission["blocks"]> = [];
  editor.state.doc.descendants((node) => {
    if (
      node.attrs.isQuestionBlock !== true ||
      typeof node.attrs.id !== "string"
    ) {
      return;
    }

    submissions.push({
      blockId: node.attrs.id,
      blockType: node.type.name,
      learnerAnswer: structuredClone(
        getQuestionAttributes<unknown, unknown>(node).userAnswers,
      ),
    });
  });

  return submissions.length > 0 ? submissions : undefined;
}

export function buildPendingSceneSnapshot(
  sceneId: string,
  blocks: PendingSceneSubmission["blocks"],
  existing?: PendingSceneSubmission,
): PendingSceneSubmission {
  return {
    sceneId,
    blocks: blocks ?? existing?.blocks,
    gradedBlocks: existing?.gradedBlocks,
    feedbackSummary: existing?.feedbackSummary,
  };
}

export function buildSceneSubmissionCommand(options: {
  sceneId: string;
  requestSequence: number;
  blocks: PendingSceneSubmission["blocks"];
}): SceneSubmissionCommand {
  return {
    requestId: `${options.sceneId}:${options.requestSequence}`,
    sceneId: options.sceneId,
    blocks: options.blocks,
  };
}

export function getButtonLabel(
  isPending: boolean,
  sceneIndex: number,
  totalScenes: number,
  hasQuestionsToCheck: boolean,
  isReadOnly: boolean,
  translations?: NavigationTranslations,
): string {
  const provided: Partial<NavigationTranslations> = translations || {};
  const labels = {
    saving: provided.saving || "Speichert...",
    done: provided.done || "Fertig",
    next: provided.next || "Weiter",
    check: provided.check || "Überprüfen",
    complete: provided.complete || "Abschließen",
  };
  if (isPending) return labels.saving;
  if (isReadOnly) {
    return sceneIndex === totalScenes - 1 ? labels.done : labels.next;
  }
  if (hasQuestionsToCheck) return labels.check;
  return sceneIndex === totalScenes - 1 ? labels.complete : labels.next;
}
