"use client";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { Plus, X } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { resolveBlockDocUrl } from "@/lib/utils";
import {
  getQuestionBlockAttributes,
  updateQuestionAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import { ClozeComposerPlaceholder } from "@/shared/content/editor/blocks/questions/cloze-text/components/cloze-composer-placeholder";
import { ClozeLearnerView } from "@/shared/content/editor/blocks/questions/cloze-text/components/cloze-learner-view";
import { ClozeTabGuide } from "@/shared/content/editor/blocks/questions/cloze-text/components/cloze-tab-guide";
import { InlineClozeTextInput } from "@/shared/content/editor/blocks/questions/cloze-text/components/inline-cloze-input";
import {
  CLOZE_TEXT_NODE_NAME,
  getGapSegments,
  isClozeTextEmpty,
  type QuestionData,
  type UserAnswer,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { createBlockId } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-author";
import {
  BlockSettingsContainer,
  BlockSettingsSwitch,
} from "@/shared/content/editor/blocks/ui/block-settings-ui";
import { useQACelebration } from "@/shared/content/editor/blocks/ui/qa-celebration";
import { QuestionBlockGradedFrame } from "@/shared/content/editor/blocks/ui/question-block-graded-frame";
import ReactBlockWrapper from "@/shared/content/editor/blocks/ui/react-block-wrapper";
import { useQuestionBlockRegistration } from "@/shared/content/editor/runtime/hooks/use-question-block";

const CLOZE_BODY_CLASS =
  "text-[1.125rem] @min-[40rem]:text-[1.25rem] font-normal leading-relaxed text-neutral-900 dark:text-neutral-100";

const ClozeTextBlock = memo((props: NodeViewProps) => {
  const { translations } = useTranslation("editorUi");
  const { isEditable } = props.editor;

  const attrs = getQuestionBlockAttributes<QuestionData, UserAnswer>(
    props.node,
  );

  const { hidden, isReadOnly, gradedState, displayOrder, missingSolution } =
    useQuestionBlockRegistration<QuestionData, UserAnswer>(props, {
      blockType: CLOZE_TEXT_NODE_NAME,
      isEmpty: isClozeTextEmpty,

      candidates: (q) => q.items.map((item) => item.id),
    });

  const questionData = attrs.questionBlockAttributes.questionData;

  const updateQuestionData = useCallback(
    (next: QuestionData) => {
      updateQuestionAttributes<QuestionData, UserAnswer>(props, {
        questionData: next,
      });
    },
    [props],
  );

  const userAnswers = useMemo(
    () => (isEditable ? {} : attrs.questionBlockAttributes.userAnswers || {}),
    [isEditable, attrs.questionBlockAttributes.userAnswers],
  );

  const gaps = useMemo(
    () => getGapSegments(questionData.segments),
    [questionData.segments],
  );

  const { celebrateKey, isFullyCorrect } = useQACelebration(gradedState);

  const handleLearnerAnswersChange = useCallback(
    (next: UserAnswer) => {
      updateQuestionAttributes<QuestionData, UserAnswer>(props, {
        userAnswers: next,
      });
    },
    [props],
  );

  const handleAddDistractor = useCallback(() => {
    updateQuestionData({
      ...questionData,
      items: [...questionData.items, { id: createBlockId("item"), label: "" }],
    });
  }, [questionData, updateQuestionData]);

  const handleRemoveDistractor = useCallback(
    (itemId: string) => {
      updateQuestionData({
        ...questionData,
        items: questionData.items.filter((item) => item.id !== itemId),
      });
    },
    [questionData, updateQuestionData],
  );

  const updateDistractorLabel = useCallback(
    (itemId: string, label: string) => {
      updateQuestionData({
        ...questionData,
        items: questionData.items.map((item) =>
          item.id === itemId ? { ...item, label } : item,
        ),
      });
    },
    [questionData, updateQuestionData],
  );

  const correctItemIds = useMemo(
    () => new Set(gaps.map((gap) => gap.correctItemId)),
    [gaps],
  );

  const distractors = useMemo(
    () => questionData.items.filter((item) => !correctItemIds.has(item.id)),
    [questionData.items, correctItemIds],
  );

  const isComposerEmpty = useMemo(
    () =>
      questionData.segments.length === 1 &&
      questionData.segments[0]?.type === "text" &&
      questionData.segments[0].content === "" &&
      gaps.length === 0,
    [gaps.length, questionData.segments],
  );

  if (hidden) return null;

  const settingsContent = (
    <BlockSettingsContainer>
      <BlockSettingsSwitch
        label={translations.clozeText.optionalLabel}
        checked={attrs.questionBlockAttributes.optional}
        onCheckedChange={() =>
          updateQuestionAttributes<QuestionData, UserAnswer>(props, {
            optional: !attrs.questionBlockAttributes.optional,
          })
        }
      />
    </BlockSettingsContainer>
  );

  const renderLearnerView = (
    answers: UserAnswer,
    onAnswersChange?: (next: UserAnswer) => void,
  ) => (
    <ClozeLearnerView
      questionData={questionData}
      displayOrder={displayOrder}
      answers={answers}
      canEditAnswers={!isReadOnly && Boolean(onAnswersChange)}
      isGraded={isReadOnly}
      celebrateKey={celebrateKey}
      isFullyCorrect={isFullyCorrect}
      bodyClassName={CLOZE_BODY_CLASS}
      wordBankLabel={translations.clozeText.wordBankLabel}
      resetLabel={translations.clozeText.resetLabel}
      onAnswersChange={onAnswersChange}
    />
  );

  const renderAuthorEditor = () => (
    <div className="flex flex-col gap-5">
      <div className="relative w-full">
        <div className="mb-3">
          <ClozeTabGuide
            tabKeyLabel={translations.clozeText.tabKeyLabel}
            selectLabel={translations.clozeText.tabHintSelectLabel}
            orLabel={translations.clozeText.tabHintOrLabel}
            blankLabel={translations.clozeText.tabHintBlankLabel}
          />
        </div>

        <div className="not-draggable relative min-w-0">
          {isComposerEmpty ? (
            <div className="pointer-events-none absolute inset-0 z-10">
              <ClozeComposerPlaceholder
                lead={translations.clozeText.placeholderLead}
                bodyClassName={CLOZE_BODY_CLASS}
              />
            </div>
          ) : null}

          <NodeViewContent
            className={cn(
              "cloze-author-content relative my-0 min-h-[1.5em] w-full leading-relaxed wrap-break-word",
              "[&_p]:my-0",
              CLOZE_BODY_CLASS,
            )}
          />
        </div>
      </div>

      {distractors.length > 0 || gaps.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-neutral-200/50 pt-4 dark:border-neutral-800/50">
          <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
            {translations.clozeText.distractorsLabel}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {distractors.map((item) => (
              <span
                key={item.id}
                className="group inline-flex items-center gap-0.5 rounded-xl border border-neutral-200/70 bg-white/80 px-2 py-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80"
              >
                <InlineClozeTextInput
                  value={item.label}
                  onChange={(label) => updateDistractorLabel(item.id, label)}
                  placeholder={translations.clozeText.distractorPlaceholder}
                  className="text-[15px] font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDistractor(item.id)}
                  aria-label={translations.clozeText.removeDistractorLabel}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddDistractor}
              className="h-8 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {translations.clozeText.addDistractorLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <NodeViewWrapper
      id={attrs.id}
      className="w-full"
      data-type={CLOZE_TEXT_NODE_NAME}
    >
      <ReactBlockWrapper
        isEditorEditable={isEditable}
        nodeViewProps={props}
        docLink={resolveBlockDocUrl("question", "cloze-text")}
        settingsContent={settingsContent}
      >
        <div className="relative w-full py-1">
          {isEditable ? (
            renderAuthorEditor()
          ) : (
            <QuestionBlockGradedFrame
              state={gradedState}
              missingSolution={missingSolution}
              className="rounded-2xl py-1"
            >
              {renderLearnerView(userAnswers, handleLearnerAnswersChange)}
            </QuestionBlockGradedFrame>
          )}
        </div>
      </ReactBlockWrapper>
    </NodeViewWrapper>
  );
});

ClozeTextBlock.displayName = "ClozeTextBlock";
export default ClozeTextBlock;
