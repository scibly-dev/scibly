import type { AskMultipleChoiceOutput } from "@/features/notebook/chat/tools/ux-tools";
import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type { MultipleChoiceQuestionInvocation } from "./multiple-choice.types";

import { getAnswerForQuestion } from "./multiple-choice-submission-entries";

export {
  getMultipleChoiceSubmissionEntries,
  type MultipleChoiceSubmissionEntry,
} from "./multiple-choice-submission-entries";

export function hasMeaningfulMultipleChoiceAnswer(
  answer?: AskMultipleChoiceOutput,
): boolean {
  if (!answer) return false;
  if (answer.error) return true;
  if (answer.skipped) return true;
  if (answer.customAnswer?.trim()) return true;
  if ((answer.selectedOptionIds?.length ?? 0) > 0) return true;
  if ((answer.selectedLabels?.length ?? 0) > 0) return true;
  if (
    answer.answers?.some(
      (entry) =>
        entry.skipped ||
        entry.customAnswer?.trim() ||
        entry.selectedOptionIds.length > 0 ||
        entry.selectedLabels.length > 0,
    )
  ) {
    return true;
  }
  return false;
}

export function formatMultipleChoiceUserSubmission(
  invocation: MultipleChoiceQuestionInvocation,
  mcq: Pick<
    NotebookTranslations["chat"]["multipleChoice"],
    "questionPrefix" | "answerPrefix" | "skippedLabel" | "noAnswerLabel"
  >,
): string {
  return invocation.questions
    .map((step, index) => {
      const entry = getAnswerForQuestion(invocation, step.id, index);
      const answerText =
        !entry || entry.skipped
          ? mcq.skippedLabel
          : [...entry.selectedLabels, entry.customAnswer?.trim()]
              .filter(Boolean)
              .join(", ") || mcq.noAnswerLabel;
      return `${mcq.questionPrefix} ${step.question}\n${mcq.answerPrefix} ${answerText}`;
    })
    .join("\n\n");
}
