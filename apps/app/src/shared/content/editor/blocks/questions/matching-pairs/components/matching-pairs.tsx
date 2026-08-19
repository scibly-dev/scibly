"use client";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { Plus } from "lucide-react";
import { memo, useCallback, useEffect, useMemo } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { resolveBlockDocUrl } from "@/lib/utils";
import {
  getQuestionBlockAttributes,
  updateQuestionAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import { MatchingPairsLearnerView } from "@/shared/content/editor/blocks/questions/matching-pairs/components/matching-pairs-learner-view";
import {
  MATCHING_PAIR_NODE_NAME,
  MATCHING_PAIR_SIDE_NODE_NAME,
  MATCHING_PAIRS_NODE_NAME,
  matchingPairsSchema,
  type QuestionData,
  type UserAnswer,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import {
  createMatchingItemIds,
  deriveQuestionDataFromNode,
  extractPairsFromNode,
  getRightTileIds,
  nodeHasValidPairs,
  pairsFingerprint,
} from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";
import {
  BlockSettingsContainer,
  BlockSettingsSwitch,
} from "@/shared/content/editor/blocks/ui/block-settings-ui";
import {
  QA_GAME,
  useQACelebration,
} from "@/shared/content/editor/blocks/ui/qa-celebration";
import { QALearnerResetButton } from "@/shared/content/editor/blocks/ui/qa-learner-reset-button";
import { QuestionBlockGradedFrame } from "@/shared/content/editor/blocks/ui/question-block-graded-frame";
import ReactBlockWrapper from "@/shared/content/editor/blocks/ui/react-block-wrapper";
import { useQATapToAssign } from "@/shared/content/editor/runtime/hooks/use-qa-tap-to-assign";
import { useQuestionBlockRegistration } from "@/shared/content/editor/runtime/hooks/use-question-block";

function createDefaultPairContent(
  ids: ReturnType<typeof createMatchingItemIds>,
) {
  return {
    type: MATCHING_PAIR_NODE_NAME,
    attrs: { id: ids.pairId },
    content: [
      {
        type: MATCHING_PAIR_SIDE_NODE_NAME,
        attrs: { side: "left", itemId: ids.leftItemId },
        content: [{ type: "paragraph" }],
      },
      {
        type: MATCHING_PAIR_SIDE_NODE_NAME,
        attrs: { side: "right", itemId: ids.rightItemId },
        content: [{ type: "paragraph" }],
      },
    ],
  };
}

const MatchingPairsBlock = memo((props: NodeViewProps) => {
  const { translations } = useTranslation("editorUi");
  const { isEditable } = props.editor;

  const attrs = getQuestionBlockAttributes<QuestionData, UserAnswer>(
    props.node,
  );

  const { hidden, isReadOnly, gradedState, displayOrder, missingSolution } =
    useQuestionBlockRegistration<QuestionData, UserAnswer>(props, {
      blockType: MATCHING_PAIRS_NODE_NAME,

      candidates: getRightTileIds,
      isEmpty: (questionData) =>
        !matchingPairsSchema.safeParse(questionData).success ||
        !nodeHasValidPairs(props.node),
    });

  const { isGraded, celebrateKey, isFullyCorrect } =
    useQACelebration(gradedState);

  const questionData = attrs.questionBlockAttributes.questionData;
  const userAnswers = useMemo(
    () => (isEditable ? {} : attrs.questionBlockAttributes.userAnswers || {}),
    [isEditable, attrs.questionBlockAttributes.userAnswers],
  );

  const isSourceAssigned = useCallback(
    (leftId: string) => Boolean(userAnswers[leftId]),
    [userAnswers],
  );

  const isTargetTaken = useCallback(
    (rightId: string) => Object.values(userAnswers).includes(rightId),
    [userAnswers],
  );

  const handleAnswersChange = useCallback(
    (next: UserAnswer) => {
      updateQuestionAttributes<QuestionData, UserAnswer>(props, {
        userAnswers: next,
      });
    },
    [props],
  );

  const { selectedSourceId, selectSource, assignToTarget, clearSelection } =
    useQATapToAssign({
      isReadOnly,
      isGraded,
      isSourceAssigned,
      isTargetTaken,
      onAssign: (leftId, rightId) => {
        handleAnswersChange({ ...userAnswers, [leftId]: rightId });
      },
    });

  const pairStructureFingerprint = useMemo(() => {
    const pairs = extractPairsFromNode(props.node);
    if (pairs.length === 0) return "";
    return pairsFingerprint(pairs);
  }, [props.node]);

  useEffect(() => {
    if (!isEditable) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const currentQuestionData = getQuestionBlockAttributes<
        QuestionData,
        UserAnswer
      >(props.node).questionBlockAttributes.questionData;
      const nextQuestionData = deriveQuestionDataFromNode(
        props.node,
        currentQuestionData,
      );
      const changed =
        pairsFingerprint(nextQuestionData.pairs) !==
        pairsFingerprint(currentQuestionData.pairs);

      if (changed) {
        updateQuestionAttributes<QuestionData, UserAnswer>(props, {
          questionData: nextQuestionData,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isEditable, pairStructureFingerprint, props]);

  const handleAddPair = () => {
    const ids = createMatchingItemIds();
    const pos = props.getPos();
    if (typeof pos !== "number") return;

    props.editor
      .chain()
      .focus()
      .insertContentAt(
        pos + props.node.nodeSize - 1,
        createDefaultPairContent(ids),
      )
      .run();
  };

  const handleReset = () => {
    handleAnswersChange({});
    clearSelection();
  };

  if (hidden) return null;

  const settingsContent = (
    <BlockSettingsContainer>
      <BlockSettingsSwitch
        label={translations.matchingPairs.optionalLabel}
        checked={attrs.questionBlockAttributes.optional}
        onCheckedChange={() =>
          updateQuestionAttributes<QuestionData, UserAnswer>(props, {
            optional: !attrs.questionBlockAttributes.optional,
          })
        }
      />
    </BlockSettingsContainer>
  );

  return (
    <NodeViewWrapper id={attrs.id} className="w-full">
      <ReactBlockWrapper
        isEditorEditable={isEditable}
        nodeViewProps={props}
        docLink={resolveBlockDocUrl("question", "matching-pairs")}
        settingsContent={settingsContent}
      >
        <QuestionBlockGradedFrame
          state={gradedState}
          missingSolution={missingSolution}
          className="relative my-4 w-full rounded-2xl py-2"
        >
          {isEditable ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {translations.matchingPairs.editLabel}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddPair}
                  className="h-8"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {translations.matchingPairs.addPairLabel}
                </Button>
              </div>
              <div className="matching-pairs-edit">
                <div className="mb-2 grid grid-cols-2 gap-3 px-1">
                  <span className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">
                    {translations.matchingPairs.leftColumnLabel}
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">
                    {translations.matchingPairs.rightColumnLabel}
                  </span>
                </div>
                <NodeViewContent className="flex flex-col gap-2" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 select-none">
              <div className="flex h-8 items-center justify-between px-1">
                <span className={cn(QA_GAME.bankLabel, "text-sm font-medium")}>
                  {translations.matchingPairs.tapToMatchLabel}
                </span>
                <QALearnerResetButton
                  visible={Object.keys(userAnswers).length > 0 && !isReadOnly}
                  onReset={handleReset}
                />
              </div>
              <MatchingPairsLearnerView
                blockNode={props.node}
                questionData={questionData}
                displayOrder={displayOrder}
                userAnswers={userAnswers}
                canEditAnswers={!isReadOnly}
                isGraded={isGraded}
                celebrateKey={celebrateKey}
                isFullyCorrect={isFullyCorrect}
                selectedLeftId={selectedSourceId}
                onSelectLeft={selectSource}
                onAssignRight={assignToTarget}
                isSourceAssigned={isSourceAssigned}
                isTargetTaken={isTargetTaken}
              />
            </div>
          )}
        </QuestionBlockGradedFrame>
      </ReactBlockWrapper>
    </NodeViewWrapper>
  );
});

MatchingPairsBlock.displayName = "MatchingPairsBlock";
export default MatchingPairsBlock;
