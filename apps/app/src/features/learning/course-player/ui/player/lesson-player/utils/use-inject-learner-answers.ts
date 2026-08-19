import type { Editor } from "@tiptap/core";
import type { PendingSceneSubmission } from "../progression/lesson-progression.machine";

import { useEffect } from "react";

import { injectLearnerAnswers } from "@/shared/content/editor/assessment/grading/inject-learner-answers";

interface UseInjectLearnerAnswersOptions {
  editor: Editor | null;
  currentScene: { id: string } | undefined;
  pendingSubmission: PendingSceneSubmission | undefined;
}

export function useInjectLearnerAnswers({
  editor,
  currentScene,
  pendingSubmission,
}: UseInjectLearnerAnswersOptions) {
  const currentSceneId = currentScene?.id;

  useEffect(() => {
    if (
      !editor ||
      editor.isDestroyed ||
      !editor.state ||
      !currentSceneId ||
      !pendingSubmission
    ) {
      return;
    }

    injectLearnerAnswers(editor, {
      blocks: pendingSubmission.blocks,
      gradedBlocks: pendingSubmission.gradedBlocks,
    });
  }, [editor, currentSceneId, pendingSubmission]);
}
