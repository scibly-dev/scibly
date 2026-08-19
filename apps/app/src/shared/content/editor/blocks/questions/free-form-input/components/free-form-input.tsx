"use client";

import { AutosizeTextarea } from "@scibly/ui/components/autosize-textarea";
import { cn } from "@scibly/ui/utils";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { memo } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { resolveBlockDocUrl } from "@/lib/utils";
import {
  getQuestionBlockAttributes,
  updateQuestionAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import {
  FREE_FORM_INPUT_NODE_NAME,
  type QuestionData,
  type UserAnswer,
} from "@/shared/content/editor/blocks/questions/free-form-input/schema";
import {
  BlockSettingsContainer,
  BlockSettingsNumberInput,
  BlockSettingsSwitch,
} from "@/shared/content/editor/blocks/ui/block-settings-ui";
import {
  QA_GAME,
  QACelebrationMotion,
  useQACelebration,
} from "@/shared/content/editor/blocks/ui/qa-celebration";
import { QuestionBlockGradedFrame } from "@/shared/content/editor/blocks/ui/question-block-graded-frame";
import ReactBlockWrapper from "@/shared/content/editor/blocks/ui/react-block-wrapper";
import { useQuestionBlockRegistration } from "@/shared/content/editor/runtime/hooks/use-question-block";

const FreeFormInput = memo((props: NodeViewProps) => {
  const { translations } = useTranslation("editorUi");
  const { isEditable } = props.editor;

  const attrs = getQuestionBlockAttributes<QuestionData, UserAnswer>(
    props.node,
  );

  const { hidden, isReadOnly, gradedState, missingSolution } =
    useQuestionBlockRegistration<QuestionData, UserAnswer>(props, {
      blockType: FREE_FORM_INPUT_NODE_NAME,
      isEmpty: () => false,
      candidates: null,
    });

  const { celebrateKey, isGraded, isFullyCorrect } =
    useQACelebration(gradedState);

  if (hidden) return null;

  const questionData = attrs.questionBlockAttributes.questionData;
  const inputValue = attrs.questionBlockAttributes.userAnswers || "";
  const charCount = inputValue.length;

  const minLength = questionData.minLength;
  const maxLength = questionData.maxLength;

  const isInvalid =
    !isEditable &&
    ((minLength !== undefined && charCount < minLength && charCount > 0) ||
      (maxLength !== undefined && charCount > maxLength));

  const settingsContent = (
    <div className="flex w-full flex-col gap-0.5">
      <BlockSettingsContainer>
        <BlockSettingsSwitch
          label={translations.freeFormInput?.optionalLabel || "Optional"}
          checked={attrs.questionBlockAttributes.optional}
          onCheckedChange={() =>
            updateQuestionAttributes<QuestionData, UserAnswer>(props, {
              optional: !attrs.questionBlockAttributes.optional,
            })
          }
        />
        <BlockSettingsNumberInput
          label={translations.freeFormInput?.minLengthLabel || "Min Length"}
          value={questionData.minLength ?? 0}
          min={0}
          onChange={(value) => {
            const newMinLength = value === 0 ? undefined : value;
            let newMaxLength = questionData.maxLength;

            if (newMinLength !== undefined) {
              if (newMaxLength === undefined || newMaxLength < newMinLength) {
                newMaxLength = newMinLength;
              }
            }

            updateQuestionAttributes<QuestionData, UserAnswer>(props, {
              questionData: {
                ...questionData,
                minLength: newMinLength,
                maxLength: newMaxLength,
              },
            });
          }}
        />
        <BlockSettingsNumberInput
          label={translations.freeFormInput?.maxLengthLabel || "Max Length"}
          value={questionData.maxLength ?? 0}
          min={0}
          onChange={(value) => {
            const newMaxLength = value === 0 ? undefined : value;
            let newMinLength = questionData.minLength;

            if (
              newMaxLength !== undefined &&
              newMinLength !== undefined &&
              newMinLength > newMaxLength
            ) {
              newMinLength = newMaxLength;
            }

            updateQuestionAttributes<QuestionData, UserAnswer>(props, {
              questionData: {
                ...questionData,
                maxLength: newMaxLength,
                minLength: newMinLength,
              },
            });
          }}
        />
      </BlockSettingsContainer>
    </div>
  );

  return (
    <NodeViewWrapper className="my-4 w-full" id={attrs.id}>
      <ReactBlockWrapper
        nodeViewProps={props}
        isEditorEditable={isEditable}
        docLink={resolveBlockDocUrl("interactive", "free-form-input")}
        settingsContent={settingsContent}
      >
        <QuestionBlockGradedFrame
          state={gradedState}
          missingSolution={missingSolution}
          className={cn(
            "flex w-full flex-col transition-all duration-200",
            isGraded && isFullyCorrect
              ? QA_GAME.panelCorrect
              : cn(
                  QA_GAME.panelRecessed,
                  isInvalid && QA_GAME.panelInvalid,
                  !isEditable &&
                    !isReadOnly &&
                    !isGraded &&
                    "focus-within:ring-2 focus-within:ring-blue-400/20",
                ),
          )}
        >
          <QACelebrationMotion
            block
            className="w-full"
            celebrateKey={celebrateKey}
            enabled={isGraded && isFullyCorrect}
            variant="pop"
          >
            <AutosizeTextarea
              rows={3}
              maxHeight={400}
              placeholder={
                isEditable
                  ? translations.freeFormInput?.placeholderAuthor ||
                    "Learners will write their answer here..."
                  : translations.freeFormInput?.placeholderLearner ||
                    "Write your answer here..."
              }
              className="w-full resize-none border-none bg-transparent p-0 text-[15px] font-medium text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-0 dark:text-neutral-100"
              value={inputValue}
              onChange={(e) => {
                if (!isEditable && !isReadOnly) {
                  let val = e.target.value;
                  if (maxLength !== undefined && val.length > maxLength) {
                    val = val.slice(0, maxLength);
                  }
                  updateQuestionAttributes<QuestionData, UserAnswer>(props, {
                    userAnswers: val,
                  });
                }
              }}
              readOnly={isEditable || isReadOnly}
            />
          </QACelebrationMotion>

          {(minLength !== undefined || maxLength !== undefined) && (
            <div className="mt-2 flex justify-end border-t border-neutral-200/40 pt-2 dark:border-neutral-800/40">
              <span
                className={cn(
                  "text-[12px] font-medium",
                  isInvalid ? "text-red-500" : "text-neutral-400",
                )}
              >
                {charCount} {maxLength ? `/ ${maxLength}` : ""}{" "}
                {translations.freeFormInput?.charactersLabel || "characters"}
                {minLength && charCount < minLength
                  ? ` (${translations.freeFormInput?.minLabel || "Min"} ${minLength})`
                  : ""}
              </span>
            </div>
          )}
        </QuestionBlockGradedFrame>
      </ReactBlockWrapper>
    </NodeViewWrapper>
  );
});

FreeFormInput.displayName = "FreeFormInput";
export default FreeFormInput;
