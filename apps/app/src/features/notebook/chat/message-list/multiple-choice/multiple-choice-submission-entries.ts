import type {
  MultipleChoiceAnswer,
  MultipleChoiceOption,
} from "@/features/notebook/chat/tools/ux-tools";
import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type { MultipleChoiceQuestionInvocation } from "./multiple-choice.types";

export interface MultipleChoiceSubmissionEntry {
  question: string;
  answerLabels: string[];
  skipped: boolean;
  isEmpty: boolean;
}

// Each selected id is looked up in the question that was asked rather than trusting the labels that travelled in the output, since that would hide exactly the mismatch this bubble exists to expose.
function resolveSelectedLabels(
  entry: MultipleChoiceAnswer,
  options: MultipleChoiceOption[],
): string[] {
  const ids = entry.selectedOptionIds;
  if (!ids.length) return entry.selectedLabels;

  return ids.map((id, index) => {
    const option = options.find((candidate) => candidate.id === id);
    return option?.label ?? entry.selectedLabels[index] ?? id;
  });
}

// Older transcripts recorded before the `answers` array existed only carry a question-order index, so the index fallback keeps those still rendering correctly.
export function getAnswerForQuestion(
  invocation: MultipleChoiceQuestionInvocation,
  questionId: string,
  index: number,
): MultipleChoiceAnswer | undefined {
  const answer = invocation.answer;
  if (!answer) return undefined;

  const answers = answer.answers;
  if (answers?.length) {
    return (
      answers.find((entry) => entry.questionId === questionId) ?? answers[index]
    );
  }

  if (invocation.questions.length !== 1) return undefined;
  return {
    questionId,
    selectedOptionIds: answer.selectedOptionIds ?? [],
    selectedLabels: answer.selectedLabels ?? [],
    customAnswer: answer.customAnswer,
    skipped: answer.skipped,
  };
}

function getAnswerLabelsForEntry(
  entry: MultipleChoiceAnswer | undefined,
  labels: Pick<
    NotebookTranslations["chat"]["multipleChoice"],
    "skippedLabel" | "noAnswerLabel"
  >,
  options: MultipleChoiceOption[],
): Pick<MultipleChoiceSubmissionEntry, "answerLabels" | "skipped" | "isEmpty"> {
  if (!entry || entry.skipped) {
    return {
      answerLabels: [labels.skippedLabel],
      skipped: true,
      isEmpty: false,
    };
  }

  const answerLabels = [
    ...resolveSelectedLabels(entry, options),
    entry.customAnswer?.trim(),
  ].filter((label): label is string => Boolean(label));

  if (!answerLabels.length) {
    return {
      answerLabels: [labels.noAnswerLabel],
      skipped: false,
      isEmpty: true,
    };
  }

  return { answerLabels, skipped: false, isEmpty: false };
}

export function getMultipleChoiceSubmissionEntries(
  invocation: MultipleChoiceQuestionInvocation,
  mcq: Pick<
    NotebookTranslations["chat"]["multipleChoice"],
    "skippedLabel" | "noAnswerLabel"
  >,
): MultipleChoiceSubmissionEntry[] {
  return invocation.questions.map((step, index) => ({
    question: step.question,
    ...getAnswerLabelsForEntry(
      getAnswerForQuestion(invocation, step.id, index),
      mcq,
      step.options,
    ),
  }));
}
