import type { Editor } from "@tiptap/core";
import type {
  BlockSubmission,
  DisplayedGrade,
} from "@/shared/content/contracts";

import { objectKeys } from "@/lib/object-keys";
import { stringAttribute } from "@/shared/content/editor/blocks/attributes/string-attribute";

interface QuestionBlockUpdates {
  userAnswers?: unknown;
  achievedPoints?: number;
  maxPoints?: number;
  questionData?: unknown;
}

export function injectLearnerAnswers(
  editor: Editor,
  options: {
    blocks?: BlockSubmission[];
    gradedBlocks?: DisplayedGrade[];
  },
): boolean {
  if (!editor || editor.isDestroyed || !editor.state) return false;

  const { tr } = editor.state;
  const blocksById = new Map(
    options.blocks?.map((block) => [block.blockId, block]),
  );
  const gradesById = new Map(
    options.gradedBlocks?.map((grade) => [grade.blockId, grade]),
  );
  let modified = false;

  editor.state.doc.descendants((node, pos) => {
    if (node.attrs?.isQuestionBlock) {
      const blockId = stringAttribute(node, "id");
      if (blockId === null) return;
      const block = blocksById.get(blockId);
      const grade = gradesById.get(blockId);

      if (block || grade) {
        const qAttrs = node.attrs.questionBlockAttributes || {};

        const updates: QuestionBlockUpdates = {};

        if (block?.learnerAnswer !== undefined) {
          updates.userAnswers = block.learnerAnswer;
        }
        if (grade?.achievedPoints !== undefined) {
          updates.achievedPoints = grade.achievedPoints;
        }
        if (grade?.maxPoints !== undefined) {
          updates.maxPoints = grade.maxPoints;
        }
        if (grade?.correctAnswer !== undefined) {
          updates.questionData = grade.correctAnswer;
        }
        const hasChanges = objectKeys(updates).some(
          (key) => JSON.stringify(qAttrs[key]) !== JSON.stringify(updates[key]),
        );

        if (hasChanges) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            questionBlockAttributes: {
              ...qAttrs,
              ...updates,
            },
          });
          modified = true;
        }
      }
    }
  });

  if (modified) {
    editor.view.dispatch(tr);
  }

  return modified;
}
