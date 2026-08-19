"use client";

import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import { cn } from "@scibly/ui/utils";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { CheckCircle2, Plus, X, XCircle } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useDebounce } from "use-debounce";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { resolveBlockDocUrl } from "@/lib/utils";
import { applyDisplayOrder } from "@/shared/content/editor/assessment/learner/answer-order";
import {
  getQuestionBlockAttributes,
  updateQuestionAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import {
  getDuplicateChoiceIds,
  MULTIPLE_CHOICE_NODE_NAME,
  type QuestionData,
  type UserAnswer,
  validateChoices,
} from "@/shared/content/editor/blocks/questions/multiple-choice/schema";
import {
  BlockSettingsContainer,
  BlockSettingsSwitch,
} from "@/shared/content/editor/blocks/ui/block-settings-ui";
import {
  buildCorrectStaggerIndexMap,
  getChoiceGradedStatus,
  getQAGameTileClassName,
  QA_GAME,
  QACelebrationMotion,
  useQACelebration,
} from "@/shared/content/editor/blocks/ui/qa-celebration";
import { QuestionBlockGradedFrame } from "@/shared/content/editor/blocks/ui/question-block-graded-frame";
import ReactBlockWrapper from "@/shared/content/editor/blocks/ui/react-block-wrapper";
import { useQuestionBlockRegistration } from "@/shared/content/editor/runtime/hooks/use-question-block";

const MultipleChoice = memo((props: NodeViewProps) => {
  const { translations } = useTranslation("editorUi");
  const { isEditable } = props.editor;

  const attrs = getQuestionBlockAttributes<QuestionData, UserAnswer>(
    props.node,
  );

  const { hidden, isReadOnly, gradedState, displayOrder, missingSolution } =
    useQuestionBlockRegistration<QuestionData, UserAnswer>(props, {
      blockType: MULTIPLE_CHOICE_NODE_NAME,
      isEmpty: (q) => !validateChoices(q.choices).success,
      candidates: (q) => q.choices.map((choice) => choice.id),
    });

  const { celebrateKey, isGraded, isFullyCorrect } =
    useQACelebration(gradedState);

  const questionData = attrs.questionBlockAttributes.questionData;
  const userAnswers = useMemo(
    () => (isEditable ? [] : attrs.questionBlockAttributes.userAnswers || []),
    [isEditable, attrs.questionBlockAttributes.userAnswers],
  );

  const handleToggleOption = useCallback(
    (choiceId: string) => {
      if (isEditable) return;
      if (isReadOnly) return;

      const allowMultiple = questionData.allowMultiple;
      let newAnswers: string[] = [];

      if (allowMultiple) {
        if (userAnswers.includes(choiceId)) {
          newAnswers = userAnswers.filter((id) => id !== choiceId);
        } else {
          newAnswers = [...userAnswers, choiceId];
        }
      } else {
        newAnswers = [choiceId];
      }

      updateQuestionAttributes<QuestionData, UserAnswer>(props, {
        userAnswers: newAnswers,
      });
    },
    [isEditable, isReadOnly, questionData.allowMultiple, userAnswers, props],
  );

  const handleEditChoiceText = (id: string, text: string) => {
    const newChoices = questionData.choices.map((c) =>
      c.id === id ? { ...c, text } : c,
    );
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: { ...questionData, choices: newChoices },
    });
  };

  const handleRemoveChoice = (id: string) => {
    const newChoices = questionData.choices.filter((c) => c.id !== id);
    const newCorrectIds = questionData.correctChoiceIds.filter(
      (cid) => cid !== id,
    );
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: {
        ...questionData,
        choices: newChoices,
        correctChoiceIds: newCorrectIds,
      },
    });
  };

  const handleAddChoice = () => {
    const newId = crypto.randomUUID();
    const newChoices = [...questionData.choices, { id: newId, text: "" }];
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: { ...questionData, choices: newChoices },
    });
  };

  const handleToggleCorrect = (id: string) => {
    let newCorrectIds = [...questionData.correctChoiceIds];
    if (questionData.allowMultiple) {
      if (newCorrectIds.includes(id)) {
        newCorrectIds = newCorrectIds.filter((cid) => cid !== id);
      } else {
        newCorrectIds.push(id);
      }
    } else {
      newCorrectIds = [id];
    }
    updateQuestionAttributes<QuestionData, UserAnswer>(props, {
      questionData: { ...questionData, correctChoiceIds: newCorrectIds },
    });
  };

  const canRemoveOption = questionData.choices.length > 2;
  const isValid = validateChoices(questionData.choices).success;

  const displayedChoices = useMemo(
    () => applyDisplayOrder(questionData.choices, (c) => c.id, displayOrder),
    [questionData.choices, displayOrder],
  );

  const [debouncedChoices] = useDebounce(questionData.choices, 500);
  const currentDuplicateIds = useMemo(
    () => getDuplicateChoiceIds(questionData.choices),
    [questionData.choices],
  );
  const debouncedDuplicateIds = useMemo(
    () => getDuplicateChoiceIds(debouncedChoices),
    [debouncedChoices],
  );

  const isDuplicate = useCallback(
    (id: string) =>
      currentDuplicateIds.includes(id) && debouncedDuplicateIds.includes(id),
    [currentDuplicateIds, debouncedDuplicateIds],
  );

  const correctChoiceStaggerIndex = useMemo(
    () =>
      buildCorrectStaggerIndexMap(
        questionData.choices.map((choice) => choice.id),
        (id) =>
          getChoiceGradedStatus(
            id,
            questionData.correctChoiceIds,
            userAnswers,
            isGraded,
          ),
      ),
    [
      isGraded,
      questionData.choices,
      questionData.correctChoiceIds,
      userAnswers,
    ],
  );

  if (hidden) return null;

  const settingsContent = (
    <BlockSettingsContainer>
      <BlockSettingsSwitch
        label={translations.multipleChoice.optionalLabel}
        checked={attrs.questionBlockAttributes.optional}
        onCheckedChange={() =>
          updateQuestionAttributes<QuestionData, UserAnswer>(props, {
            optional: !attrs.questionBlockAttributes.optional,
          })
        }
      />
      <BlockSettingsSwitch
        label={translations.multipleChoice.allowMultipleLabel}
        checked={questionData.allowMultiple}
        onCheckedChange={() => {
          const newAllowMultiple = !questionData.allowMultiple;
          const newCorrectIds = newAllowMultiple
            ? questionData.correctChoiceIds
            : questionData.correctChoiceIds.slice(0, 1);
          updateQuestionAttributes<QuestionData, UserAnswer>(props, {
            questionData: {
              ...questionData,
              allowMultiple: newAllowMultiple,
              correctChoiceIds: newCorrectIds,
            },
          });
        }}
      />
    </BlockSettingsContainer>
  );

  return (
    <NodeViewWrapper id={attrs.id} className="w-full">
      <ReactBlockWrapper
        isEditorEditable={isEditable}
        nodeViewProps={props}
        docLink={resolveBlockDocUrl("question", "multiple-choice")}
        settingsContent={settingsContent}
      >
        <QuestionBlockGradedFrame
          state={gradedState}
          missingSolution={missingSolution}
          className="relative my-4 flex w-full flex-col gap-3 rounded-2xl py-2"
        >
          {/* Options List */}
          <div className="flex flex-col gap-3 pt-4">
            {displayedChoices.map((choice) => {
              const isSelected = userAnswers.includes(choice.id);
              const isCorrect = questionData.correctChoiceIds.includes(
                choice.id,
              );
              const gradedStatus = getChoiceGradedStatus(
                choice.id,
                questionData.correctChoiceIds,
                userAnswers,
                isGraded,
              );
              const shouldCelebrateOption =
                isGraded && gradedStatus === "correct";

              return (
                <QACelebrationMotion
                  key={choice.id}
                  block
                  className="w-full"
                  celebrateKey={celebrateKey}
                  enabled={shouldCelebrateOption}
                  staggerIndex={
                    isFullyCorrect
                      ? (correctChoiceStaggerIndex.get(choice.id) ?? 0)
                      : 0
                  }
                >
                  <div
                    onClick={() => handleToggleOption(choice.id)}
                    className={getQAGameTileClassName({
                      variant:
                        isGraded && gradedStatus === "neutral"
                          ? "default"
                          : undefined,
                      gradedStatus,
                      isGraded,
                      isSelected: !isGraded && isSelected,
                      interactive: !isEditable && !isReadOnly,
                      size: "option",
                      className: cn(
                        "group relative flex min-h-[3.75rem] w-full items-center gap-3 pr-12",
                        !isEditable && !isReadOnly && "cursor-pointer",
                        (isEditable || isReadOnly) && "cursor-default",
                        !isEditable && "touch-manipulation select-none",
                        isEditable &&
                          isDuplicate(choice.id) &&
                          "ring-2 ring-red-500/80",
                      ),
                    })}
                  >
                    {/* Selection Indicator */}
                    <div className="flex-shrink-0 pt-0.5">
                      {isEditable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCorrect(choice.id);
                          }}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center border transition-colors",
                            questionData.allowMultiple
                              ? "rounded-md"
                              : "rounded-full",
                            isCorrect
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-neutral-300 bg-neutral-100 hover:border-green-500 dark:border-neutral-700 dark:bg-neutral-800",
                          )}
                        >
                          {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      ) : (
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center border transition-colors",
                            questionData.allowMultiple
                              ? "rounded-md"
                              : "rounded-full",
                            gradedStatus === "correct" &&
                              "border-green-500 bg-green-500 text-white",
                            gradedStatus === "incorrect" &&
                              "border-red-500 bg-red-500 text-white",
                            gradedStatus === "missed" &&
                              "border-[#ffc800] bg-[#fff8e6] text-[#c88700] dark:bg-amber-950/40 dark:text-amber-300",
                            gradedStatus === "neutral" &&
                              (isSelected
                                ? "border-[#0066ff] bg-[#0066ff] text-white"
                                : "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"),
                          )}
                        >
                          {gradedStatus === "incorrect" ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            (gradedStatus === "correct" ||
                              gradedStatus === "missed" ||
                              isSelected) && (
                              <CheckCircle2 className="h-4 w-4" />
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1">
                      {isEditable ? (
                        <Input
                          value={choice.text}
                          onChange={(e) =>
                            handleEditChoiceText(choice.id, e.target.value)
                          }
                          placeholder={
                            translations.multipleChoice.optionPlaceholder
                          }
                          className={cn(
                            "h-auto border-none bg-transparent px-0 py-1 text-[14px] font-medium shadow-none focus-visible:ring-0 @min-[40rem]:text-[15px]",
                            isDuplicate(choice.id) &&
                              "text-red-600 placeholder:text-red-300 dark:text-red-400",
                          )}
                        />
                      ) : (
                        <span className="text-[16px] font-medium text-inherit @min-[40rem]:text-[17px]">
                          {choice.text}
                        </span>
                      )}
                    </div>

                    {/* Remove Button */}
                    {isEditable && canRemoveOption && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveChoice(choice.id);
                        }}
                        className="absolute right-2 h-8 w-8 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-500"
                        title={translations.multipleChoice.removeOption}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </QACelebrationMotion>
              );
            })}
          </div>

          {/* Add Option Button */}
          {isEditable && (
            <Button
              variant="outline"
              disabled={!isValid}
              onClick={handleAddChoice}
              className={cn(
                "mt-2 w-fit gap-2 border-dashed text-neutral-500 hover:text-neutral-900 disabled:opacity-50 dark:hover:text-neutral-100",
                QA_GAME.bankTray,
                "min-h-0 border-neutral-300/80 px-4 py-2 dark:border-neutral-700",
              )}
            >
              <Plus className="h-4 w-4" />
              {translations.multipleChoice.addOption}
            </Button>
          )}
        </QuestionBlockGradedFrame>
      </ReactBlockWrapper>
    </NodeViewWrapper>
  );
});

MultipleChoice.displayName = "MultipleChoice";
export default MultipleChoice;
