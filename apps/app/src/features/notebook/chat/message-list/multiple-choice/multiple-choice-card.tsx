"use client";

import type {
  AskMultipleChoiceOutput,
  MultipleChoiceAnswer,
  MultipleChoiceQuestionStep,
} from "@/features/notebook/chat/tools/ux-tools";
import type { NotebookTranslations } from "../../../i18n/notebook.types";
import type { MultipleChoiceQuestionInvocation } from "./multiple-choice.types";

import { chipRestClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Questionnaire } from "@shadcn/react/questionnaire";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { useCallback, useMemo } from "react";

import { notebookPrimaryButton } from "../../../workspace/components/notebook-shell";
import { useUxTextAnswer } from "../shared/use-ux-text-answer";
import { useUxToolSubmit } from "../shared/use-ux-tool-submit";
import { uxCardRowSurface } from "../shared/ux-card-row";
import { UxCardShell } from "../shared/ux-card-shell";

// Choices and the freeform input of one question share the item's name, so anything reported back under that name which isn't an option id is what the author typed; the library strips the name entirely from a skipped item's controls.
function readAnswer(
  formData: FormData,
  step: MultipleChoiceQuestionStep,
): MultipleChoiceAnswer {
  const values = formData.getAll(step.id).map(String);
  if (!values.length) {
    return {
      questionId: step.id,
      selectedOptionIds: [],
      selectedLabels: [],
      skipped: true,
    };
  }

  const selected = step.options.filter((option) => values.includes(option.id));
  const custom = values
    .find((value) => !step.options.some((option) => option.id === value))
    ?.trim();

  return {
    questionId: step.id,
    selectedOptionIds: selected.map((option) => option.id),
    selectedLabels: selected.map((option) => option.label),
    customAnswer: custom || undefined,
  };
}

interface MultipleChoiceCardProps {
  invocation: MultipleChoiceQuestionInvocation;
  t: NotebookTranslations;
}

export function MultipleChoiceCard({ invocation, t }: MultipleChoiceCardProps) {
  const mcq = t.chat.multipleChoice;
  const { questions } = invocation;
  const { submit, isInteractive, isSubmitting } = useUxToolSubmit({
    tool: "askMultipleChoice",
    toolCallId: invocation.toolCallId,
    isAnswered: invocation.isAnswered,
  });
  const disabled = !isInteractive || isSubmitting;

  const items = useMemo(
    () =>
      questions.map((step) => ({
        name: step.id,
        choices: step.options.map((option) => ({
          value: option.id,
          disabled,
        })),
      })),
    [disabled, questions],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const output: AskMultipleChoiceOutput = {
        answers: questions.map((step) => readAnswer(formData, step)),
      };
      submit(output);
    },
    [questions, submit],
  );

  const answerWithText = useCallback(
    (text: string) => {
      const step = questions.length === 1 ? questions[0] : undefined;
      const trimmed = text.trim();
      if (!step || !trimmed) return false;
      return submit({
        answers: [
          {
            questionId: step.id,
            selectedOptionIds: [],
            selectedLabels: [],
            customAnswer: trimmed,
          },
        ],
      });
    },
    [questions, submit],
  );

  useUxTextAnswer({
    toolCallId: invocation.toolCallId,
    isInteractive: isInteractive && questions.length === 1,
    onText: answerWithText,
  });

  return (
    <UxCardShell>
      <Questionnaire.Root
        items={items}
        shortcuts="letters"
        onSubmit={handleSubmit}
      >
        {questions.map((step) => (
          <Questionnaire.Item
            key={step.id}
            name={step.id}
            multiple={step.allowMultiple ?? false}
          >
            <Questionnaire.Title className="text-ink block w-full px-5 pt-5 pb-4 text-[15px] leading-snug font-semibold tracking-tight dark:text-neutral-50">
              {step.question}
            </Questionnaire.Title>

            <Questionnaire.Choices className="flex flex-col gap-1 px-4 pb-3">
              {step.options.map((option) => (
                <Questionnaire.Choice
                  key={option.id}
                  value={option.id}
                  disabled={disabled}
                  className={cn(
                    uxCardRowSurface,
                    "group/choice cursor-pointer items-center",
                    "focus-within:bg-ground data-checked:bg-ground",
                    "dark:focus-within:bg-neutral-900/60 dark:data-checked:bg-neutral-900/60",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Questionnaire.ChoiceInput className="sr-only" />
                  <span
                    className={cn(
                      "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
                      "border-edge bg-white dark:border-neutral-600 dark:bg-neutral-950",
                      "group-data-checked/choice:border-[#0066ff] group-data-checked/choice:bg-[#0066ff] group-data-checked/choice:text-white",
                    )}
                  >
                    <Check
                      className="hidden h-3 w-3 group-data-checked/choice:block"
                      strokeWidth={3}
                    />
                  </span>
                  <Questionnaire.ChoiceLabel className="min-w-0 flex-1 text-[15px] leading-snug text-neutral-800 dark:text-neutral-100">
                    {option.label}
                  </Questionnaire.ChoiceLabel>
                  <Questionnaire.ChoiceShortcut className="border-hairline shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-neutral-400 tabular-nums dark:border-neutral-800 dark:text-neutral-500" />
                </Questionnaire.Choice>
              ))}

              <Questionnaire.Input
                disabled={disabled}
                placeholder={mcq.otherLabel}
                className={cn(
                  "w-full rounded-xl py-3.5 pr-4 pl-[2.875rem] transition-colors",
                  "text-[15px] leading-snug text-neutral-800 outline-none",
                  "placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500",
                  "hover:bg-ground focus:bg-ground data-filled:bg-ground",
                  "dark:hover:bg-neutral-900/60 dark:focus:bg-neutral-900/60 dark:data-filled:bg-neutral-900/60",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
            </Questionnaire.Choices>

            <Questionnaire.Error className="px-5 pb-2 text-[13px] text-red-600 dark:text-red-400">
              {mcq.chooseOrSkip}
            </Questionnaire.Error>
          </Questionnaire.Item>
        ))}

        <div className="flex items-center justify-between gap-4 px-5 py-4">
          {questions.length > 1 && (
            <Questionnaire.Progress
              render={(props, state) => (
                <span
                  {...props}
                  className="text-sm text-neutral-500 tabular-nums dark:text-neutral-400"
                >
                  {mcq.stepPagerShort
                    .replace("{{current}}", String(state.current))
                    .replace("{{total}}", String(state.total))}
                </span>
              )}
            />
          )}

          <div className="ml-auto flex items-center gap-2">
            <Questionnaire.Previous
              disabled={disabled}
              aria-label={mcq.back}
              className="hidden h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 data-visible:flex dark:hover:text-neutral-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Questionnaire.Previous>

            <Questionnaire.Skip
              disabled={disabled}
              className={cn(
                "ease-press hidden rounded-xl border-2 px-4 py-1.5 text-sm font-semibold transition-[translate,box-shadow,border-color,color] duration-100 active:translate-y-[3px] active:shadow-none data-visible:block",
                chipRestClass,
                "disabled:cursor-not-allowed disabled:opacity-50",
                "dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 dark:shadow-none",
              )}
            >
              {mcq.skip}
            </Questionnaire.Skip>

            <Questionnaire.Next
              disabled={disabled}
              aria-label={mcq.next}
              className={cn(
                "hidden h-9 w-9 items-center justify-center rounded-xl data-visible:flex",
                notebookPrimaryButton,
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              <ArrowRight className="h-4 w-4" />
            </Questionnaire.Next>

            <Questionnaire.Submit
              disabled={disabled}
              aria-label={mcq.submitAnswers}
              className={cn(
                "hidden h-9 w-9 items-center justify-center rounded-xl data-visible:flex",
                notebookPrimaryButton,
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </Questionnaire.Submit>
          </div>
        </div>
      </Questionnaire.Root>
    </UxCardShell>
  );
}
