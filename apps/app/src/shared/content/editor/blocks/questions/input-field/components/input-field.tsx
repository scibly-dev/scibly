"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@scibly/ui/components/popover";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Settings } from "lucide-react";
import { memo } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import {
  getQuestionBlockAttributes,
  updateQuestionAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import {
  defaultQuestionData,
  INPUT_FIELD_NODE_NAME,
  type QuestionData,
  type UserAnswer,
} from "@/shared/content/editor/blocks/questions/input-field/schema";
import {
  BlockSettingsContainer,
  BlockSettingsFooter,
  BlockSettingsSwitch,
} from "@/shared/content/editor/blocks/ui/block-settings-ui";
import {
  getQAGameTileClassName,
  QACelebrationMotion,
  QASolutionHint,
  useQACelebration,
} from "@/shared/content/editor/blocks/ui/qa-celebration";
import { QuestionBlockGradedFrame } from "@/shared/content/editor/blocks/ui/question-block-graded-frame";
import { useQuestionBlockRegistration } from "@/shared/content/editor/runtime/hooks/use-question-block";
import ResizeInputField from "@/shared/ui/components/resize-input-field";

const INPUT_MIN_WIDTH_PX = 72;

function getInputShellVariant(
  isGraded: boolean,
  isFullyCorrect: boolean,
  isPartial: boolean,
  isIncorrect: boolean,
) {
  if (!isGraded) return "default" as const;
  if (isFullyCorrect) return "correct" as const;
  if (isIncorrect) return "incorrect" as const;
  if (isPartial) return "missed" as const;
  return "default" as const;
}

const InputField = memo((props: NodeViewProps) => {
  const { translations } = useTranslation("editorUi");
  const { isEditable } = props.editor;

  const attrs = getQuestionBlockAttributes<QuestionData, UserAnswer>(
    props.node,
  );

  const { hidden, isReadOnly, gradedState, missingSolution } =
    useQuestionBlockRegistration<QuestionData, UserAnswer>(props, {
      blockType: INPUT_FIELD_NODE_NAME,
      isEmpty: (q) => q.answer.trim() === defaultQuestionData.answer,
      candidates: null,
    });

  const {
    celebrateKey,
    isGraded,
    isFullyCorrect,
    isPartial,
    isIncorrect,
    hasPositiveResult,
  } = useQACelebration(gradedState);

  if (hidden) return null;

  const questionData = attrs.questionBlockAttributes.questionData;
  const inputValue = isEditable
    ? questionData.answer
    : attrs.questionBlockAttributes.userAnswers;

  return (
    <NodeViewWrapper
      as="span"
      id={attrs.id}
      className="mx-0.5 inline-flex flex-wrap items-center gap-1 align-middle"
    >
      <QuestionBlockGradedFrame
        state={gradedState}
        missingSolution={missingSolution}
        variant="inline"
        className={getQAGameTileClassName({
          variant: getInputShellVariant(
            isGraded,
            isFullyCorrect,
            isPartial,
            isIncorrect,
          ),
          className:
            "inline-flex max-w-full items-center gap-0.5 px-2 py-1 focus-within:border-[#b9d7ff] focus-within:bg-[#eff5ff] focus-within:text-[#0b4fb0] focus-within:shadow-[0_3px_0_0_#94c4ff] dark:focus-within:text-sky-300",
        })}
      >
        <QACelebrationMotion
          celebrateKey={celebrateKey}
          enabled={isGraded && hasPositiveResult}
          variant="pop"
        >
          <ResizeInputField
            minWidthPx={INPUT_MIN_WIDTH_PX}
            wrapperClassName="inline-flex max-w-[240px]"
            className="h-7 max-w-[240px] border-none bg-transparent px-2 py-0 text-[15px] font-medium text-inherit shadow-none focus-visible:ring-0"
            value={inputValue}
            onChange={(e) => {
              if (isEditable) {
                updateQuestionAttributes<QuestionData, UserAnswer>(props, {
                  questionData: { ...questionData, answer: e.target.value },
                });
              } else {
                updateQuestionAttributes<QuestionData, UserAnswer>(props, {
                  userAnswers: e.target.value,
                });
              }
            }}
            readOnly={isReadOnly}
          />
        </QACelebrationMotion>

        {isEditable ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                contentEditable={false}
              >
                <Settings className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="flex w-[240px] flex-col gap-0.5 p-1">
              <BlockSettingsContainer>
                <BlockSettingsSwitch
                  label={translations.inputField.optionalLabel}
                  checked={attrs.questionBlockAttributes.optional}
                  onCheckedChange={() =>
                    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
                      optional: !attrs.questionBlockAttributes.optional,
                    })
                  }
                />
                <BlockSettingsSwitch
                  label={translations.inputField.caseSensitiveLabel}
                  checked={questionData.caseSensitive}
                  onCheckedChange={() =>
                    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
                      questionData: {
                        ...questionData,
                        caseSensitive: !questionData.caseSensitive,
                      },
                    })
                  }
                />
              </BlockSettingsContainer>
              <BlockSettingsFooter nodeViewProps={props} />
            </PopoverContent>
          </Popover>
        ) : null}
      </QuestionBlockGradedFrame>

      {isGraded && !isFullyCorrect ? (
        <QASolutionHint variant="chip">{questionData.answer}</QASolutionHint>
      ) : null}
    </NodeViewWrapper>
  );
});

InputField.displayName = "InputField";
export default InputField;
