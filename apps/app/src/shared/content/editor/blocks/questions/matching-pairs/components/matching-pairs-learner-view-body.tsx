"use client";

import type { Node as PMNode } from "@tiptap/pm/model";
import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";

import { cn } from "@scibly/ui/utils";
import { memo, useMemo } from "react";

import { MatchingPairLearnerTile } from "@/shared/content/editor/blocks/questions/matching-pairs/components/matching-pair-learner-tile";
import { MatchingPairMergedRow } from "@/shared/content/editor/blocks/questions/matching-pairs/components/matching-pair-merged-row";
import { useMatchingPairTiles } from "@/shared/content/editor/blocks/questions/matching-pairs/hooks/use-matching-pair-tiles";
import { useMatchingPairsSolutionReveal } from "@/shared/content/editor/blocks/questions/matching-pairs/hooks/use-matching-pairs-solution-reveal";
import {
  buildLearnerRows,
  type LearnerRowModel,
} from "@/shared/content/editor/blocks/questions/matching-pairs/utils/build-learner-rows";
import { MATCHING_PAIR_TILE_MIN_HEIGHT_CLASS } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pair-learner-tile-utils";
import {
  getCorrectMappings,
  getMatchingSideGradedStatus,
} from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";
import { buildCorrectStaggerIndexMap } from "@/shared/content/editor/blocks/ui/qa-celebration";

export const PLAY_ROW_GAP_PX = 12;
const ROW_GAP_PX = 12;

export type MatchingPairsLearnerViewBodyProps = {
  blockNode: PMNode;
  questionData: QuestionData;

  displayOrder: string[] | null;
  userAnswers: UserAnswer;
  canEditAnswers: boolean;
  isGraded: boolean;
  celebrateKey: number;
  isFullyCorrect: boolean;
  selectedLeftId: string | null;
  onSelectLeft: (leftId: string) => void;
  onAssignRight: (rightId: string) => void;
  isSourceAssigned: (leftId: string) => boolean;
  isTargetTaken: (rightId: string) => boolean;
};

export const MatchingPairsLearnerViewBody = memo(
  ({
    blockNode,
    questionData,
    displayOrder,
    userAnswers,
    canEditAnswers,
    isGraded,
    celebrateKey,
    isFullyCorrect,
    selectedLeftId,
    onSelectLeft,
    onAssignRight,
    isSourceAssigned,
    isTargetTaken,
  }: MatchingPairsLearnerViewBodyProps) => {
    const {
      leftTiles,
      shuffledRightTiles,
      rightTileByItemId,
      isShuffleAlreadyAligned,
    } = useMatchingPairTiles(blockNode, questionData, displayOrder);

    const staggerIndexMap = useMemo(() => {
      const correctMappings = getCorrectMappings(questionData);
      const hasAnswerKey = Object.values(correctMappings).some(Boolean);
      return buildCorrectStaggerIndexMap(
        leftTiles.map((tile) => tile.itemId),
        (id) =>
          hasAnswerKey
            ? getMatchingSideGradedStatus(
                "left",
                id,
                questionData,
                userAnswers,
                true,
              )
            : userAnswers[id] && isFullyCorrect
              ? "correct"
              : "incorrect",
      );
    }, [isFullyCorrect, leftTiles, questionData, userAnswers]);

    const hasAnswerKey = Object.values(getCorrectMappings(questionData)).some(
      Boolean,
    );
    const reveal = useMatchingPairsSolutionReveal({
      isGraded: isGraded && hasAnswerKey,
      celebrateKey,
      isShuffleAlreadyAligned,
      correctPairCount: staggerIndexMap.size,
      leftTiles,
    });

    const rows = useMemo(
      () =>
        buildLearnerRows({
          leftTiles,
          shuffledRightTiles,
          rightTileByItemId,
          questionData,
          userAnswers,
          selectedLeftId,
          solutionPhase: reveal.solutionPhase,
          rightColumnAligned: reveal.rightColumnAligned,
          canEditAnswers,
          isGraded,
          isFullyCorrect,
          staggerIndexMap,
          isSourceAssigned,
          isTargetTaken,
        }),
      [
        canEditAnswers,
        isFullyCorrect,
        isGraded,
        isSourceAssigned,
        isTargetTaken,
        leftTiles,
        questionData,
        reveal.rightColumnAligned,
        reveal.solutionPhase,
        rightTileByItemId,
        selectedLeftId,
        shuffledRightTiles,
        staggerIndexMap,
        userAnswers,
      ],
    );

    return (
      <div
        className={cn(
          "matching-pairs-learner relative overflow-visible",
          isGraded && "matching-pairs-learner--graded",
          reveal.isRevealPhase && "matching-pairs-learner--reveal-active",
          reveal.isMerging && "matching-pairs-learner--merging",
          reveal.isRevealed && "matching-pairs-learner--solution-reveal",
        )}
      >
        <div
          className="matching-pairs-learner-rows flex flex-col"
          style={{ rowGap: ROW_GAP_PX }}
        >
          {rows.map((row: LearnerRowModel) => (
            <div
              key={row.leftTile.itemId}
              ref={(element) => {
                if (element) {
                  reveal.rowWrapperRefs.current.set(
                    row.leftTile.itemId,
                    element,
                  );
                } else {
                  reveal.rowWrapperRefs.current.delete(row.leftTile.itemId);
                }
              }}
              className={cn(
                "matching-pair-learner-row relative min-w-0 overflow-visible",
                MATCHING_PAIR_TILE_MIN_HEIGHT_CLASS,
              )}
            >
              {row.showMergedPair && row.rightTile ? (
                <MatchingPairMergedRow
                  leftTile={row.leftTile}
                  rightTile={row.rightTile}
                  isCorrect={row.isRowCorrect}
                  isRevealed={reveal.isRevealed}
                />
              ) : null}

              <div
                className={cn(
                  "matching-pair-learner-row__cells grid min-h-[3.25rem] grid-cols-2 items-stretch overflow-visible",
                  row.hideCells && "pointer-events-none invisible",
                  row.showMergedPair && "z-0",
                )}
                aria-hidden={row.hideCells}
                style={{ columnGap: PLAY_ROW_GAP_PX }}
              >
                <div
                  ref={(element) => {
                    if (element) {
                      reveal.leftSlotRefs.current.set(
                        row.leftTile.itemId,
                        element,
                      );
                    } else {
                      reveal.leftSlotRefs.current.delete(row.leftTile.itemId);
                    }
                  }}
                  className="relative z-20 h-full min-w-0"
                >
                  <MatchingPairLearnerTile
                    sideNode={row.leftTile.sideNode}
                    gradedStatus={row.leftStatus}
                    isGraded={isGraded}
                    isSelected={row.leftSelected}
                    isMatched={row.leftMatched}
                    showGradedColors={reveal.showGradedColors}
                    interactive={row.leftInteractive}
                    celebrateKey={celebrateKey}
                    celebrateEnabled={row.shouldCelebrateLeft}
                    staggerIndex={row.leftStaggerIndex}
                    onActivate={() => onSelectLeft(row.leftTile.itemId)}
                  />
                </div>

                {row.rightTile ? (
                  <div
                    ref={(element) => {
                      if (element) {
                        reveal.rightSlotRefs.current.set(
                          row.rightTile!.itemId,
                          element,
                        );
                      } else {
                        reveal.rightSlotRefs.current.delete(
                          row.rightTile!.itemId,
                        );
                      }
                    }}
                    className="matching-pair-right-slot relative z-20 h-full min-w-0"
                  >
                    <MatchingPairLearnerTile
                      sideNode={row.rightTile.sideNode}
                      gradedStatus={row.rightStatus}
                      isGraded={isGraded}
                      isSelected={false}
                      isMatched={row.rightMatched}
                      showGradedColors={reveal.showGradedColors}
                      interactive={row.rightInteractive}
                      celebrateKey={celebrateKey}
                      celebrateEnabled={row.shouldCelebrateRight}
                      staggerIndex={row.rightStaggerIndex}
                      onActivate={() => onAssignRight(row.rightTile!.itemId)}
                    />
                  </div>
                ) : (
                  <div aria-hidden className="min-w-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

MatchingPairsLearnerViewBody.displayName = "MatchingPairsLearnerViewBody";
