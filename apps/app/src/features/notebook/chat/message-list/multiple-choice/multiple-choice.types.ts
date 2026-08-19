import type {
  AskMultipleChoiceOutput,
  MultipleChoiceQuestionStep,
} from "@/features/notebook/chat/tools/ux-tools";

export interface MultipleChoiceQuestionInvocation {
  toolCallId?: string;

  questions: MultipleChoiceQuestionStep[];
  isAnswered: boolean;
  answer?: AskMultipleChoiceOutput;
}
