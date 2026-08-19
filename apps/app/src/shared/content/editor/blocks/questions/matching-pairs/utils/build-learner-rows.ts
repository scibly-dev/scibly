import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import type { MatchingPairSideTile } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/serialize-matching-pair-side";
import type { QAGradedItemStatus } from "@/shared/content/editor/blocks/ui/qa-celebration";

import {
  findLeftIdMatchedToRight,
  getCorrectMappings,
  getMatchingSideGradedStatus,
} from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";

export type SolutionPhase =
  | "play"
  | "check"
  | "feedback"
  | "reordering"
  | "merging"
  | "revealed";

export type LearnerRowModel = {
  leftTile: MatchingPairSideTile;
  rightTile: MatchingPairSideTile | undefined;
  leftStatus: QAGradedItemStatus;
  rightStatus: QAGradedItemStatus;
  leftInteractive: boolean;
  rightInteractive: boolean;
  leftSelected: boolean;
  leftMatched: boolean;
  rightMatched: boolean;
  showMergedPair: boolean;
  hideCells: boolean;
  isRowCorrect: boolean;
  leftStaggerIndex: number;
  rightStaggerIndex: number;
  shouldCelebrateLeft: boolean;
  shouldCelebrateRight: boolean;
};

function displayTileGradedStatus(
  status: QAGradedItemStatus,
): QAGradedItemStatus {
  return status === "missed" ? "incorrect" : status;
}

function resolveRightTileForRow(
  rowIndex: number,
  leftTile: MatchingPairSideTile,
  rightColumnAligned: boolean,
  shuffledRightTiles: MatchingPairSideTile[],
  correctMappings: Record<string, string>,
  rightTileByItemId: Map<string, MatchingPairSideTile>,
) {
  if (rightColumnAligned) {
    const rightItemId = correctMappings[leftTile.itemId];
    return rightItemId ? rightTileByItemId.get(rightItemId) : undefined;
  }

  return shuffledRightTiles[rowIndex];
}

function getLeftGradedStatus(
  tile: MatchingPairSideTile,
  questionData: QuestionData,
  userAnswers: UserAnswer,
  isGraded: boolean,
): QAGradedItemStatus {
  if (!isGraded) return "neutral";

  return getMatchingSideGradedStatus(
    "left",
    tile.itemId,
    questionData,
    userAnswers,
    isGraded,
  );
}

function getRightGradedStatus(
  leftTile: MatchingPairSideTile,
  rightTile: MatchingPairSideTile,
  questionData: QuestionData,
  userAnswers: UserAnswer,
  isGraded: boolean,
  isRevealed: boolean,
  rightColumnAligned: boolean,
  leftIdByCorrectRightItemId: Map<string, string>,
): QAGradedItemStatus {
  if (!isGraded) return "neutral";

  if (isRevealed) {
    const rowLeftId = leftIdByCorrectRightItemId.get(rightTile.itemId);
    if (!rowLeftId) return "neutral";

    return getMatchingSideGradedStatus(
      "left",
      rowLeftId,
      questionData,
      userAnswers,
      isGraded,
    );
  }

  const leftRowStatus = getMatchingSideGradedStatus(
    "left",
    leftTile.itemId,
    questionData,
    userAnswers,
    isGraded,
  );
  const userMatchedRightId = userAnswers[leftTile.itemId];

  if (userMatchedRightId === rightTile.itemId) {
    return leftRowStatus;
  }

  const ownStatus = getMatchingSideGradedStatus(
    "right",
    rightTile.itemId,
    questionData,
    userAnswers,
    isGraded,
  );
  if (ownStatus !== "neutral") {
    return ownStatus;
  }

  if (rightColumnAligned) {
    return leftRowStatus;
  }

  return "neutral";
}

function getFallbackStatus(
  isGraded: boolean,
  hasAnswer: boolean,
  isFullyCorrect: boolean,
): QAGradedItemStatus {
  if (!isGraded) return "neutral";
  if (!hasAnswer) return "missed";
  return isFullyCorrect ? "correct" : "incorrect";
}

type BuildLearnerRowsInput = {
  leftTiles: MatchingPairSideTile[];
  shuffledRightTiles: MatchingPairSideTile[];
  rightTileByItemId: Map<string, MatchingPairSideTile>;
  questionData: QuestionData;
  userAnswers: UserAnswer;
  selectedLeftId: string | null;
  solutionPhase: SolutionPhase;
  rightColumnAligned: boolean;
  canEditAnswers: boolean;
  isGraded: boolean;
  isFullyCorrect: boolean;
  staggerIndexMap: Map<string, number>;
  isSourceAssigned: (leftId: string) => boolean;
  isTargetTaken: (rightId: string) => boolean;
};

export function buildLearnerRows({
  leftTiles,
  shuffledRightTiles,
  rightTileByItemId,
  questionData,
  userAnswers,
  selectedLeftId,
  solutionPhase,
  rightColumnAligned,
  canEditAnswers,
  isGraded,
  isFullyCorrect,
  staggerIndexMap,
  isSourceAssigned,
  isTargetTaken,
}: BuildLearnerRowsInput): LearnerRowModel[] {
  const correctMappings = getCorrectMappings(questionData);
  const hasAnswerKey = Object.values(correctMappings).some(Boolean);
  const isRevealed = solutionPhase === "revealed";
  const isCheckPhase = solutionPhase === "check";
  const showMergedPairPhase =
    solutionPhase === "merging" || solutionPhase === "revealed";
  const isAnimating = isGraded && solutionPhase !== "play";

  const leftIdByCorrectRightItemId = new Map<string, string>();
  for (const leftTile of leftTiles) {
    const rightItemId = correctMappings[leftTile.itemId];
    if (rightItemId) {
      leftIdByCorrectRightItemId.set(rightItemId, leftTile.itemId);
    }
  }

  const getCelebrateStaggerIndex = (side: "left" | "right", itemId: string) => {
    if (side === "left") {
      return staggerIndexMap.get(itemId) ?? 0;
    }

    const matchedLeftId = findLeftIdMatchedToRight(itemId, userAnswers);
    if (!matchedLeftId) return 0;

    return staggerIndexMap.get(matchedLeftId) ?? 0;
  };

  return leftTiles.map((leftTile, rowIndex) => {
    const assignedRightId = userAnswers[leftTile.itemId];
    const fallbackStatus = getFallbackStatus(
      isGraded,
      Boolean(assignedRightId),
      isFullyCorrect,
    );
    const leftRowStatus = hasAnswerKey
      ? getMatchingSideGradedStatus(
          "left",
          leftTile.itemId,
          questionData,
          userAnswers,
          isGraded,
        )
      : fallbackStatus;
    const isRowCorrect = displayTileGradedStatus(leftRowStatus) === "correct";
    const useAlignedLayout = hasAnswerKey && isAnimating && rightColumnAligned;
    const rightTile = resolveRightTileForRow(
      rowIndex,
      leftTile,
      useAlignedLayout,
      shuffledRightTiles,
      correctMappings,
      rightTileByItemId,
    );

    const leftStatus = hasAnswerKey
      ? getLeftGradedStatus(leftTile, questionData, userAnswers, isGraded)
      : fallbackStatus;
    const rightStatus =
      rightTile !== undefined
        ? hasAnswerKey
          ? getRightGradedStatus(
              leftTile,
              rightTile,
              questionData,
              userAnswers,
              isGraded,
              isRevealed,
              rightColumnAligned,
              leftIdByCorrectRightItemId,
            )
          : assignedRightId === rightTile.itemId
            ? fallbackStatus
            : "neutral"
        : "neutral";

    const shouldCelebrate = (status: QAGradedItemStatus) =>
      isCheckPhase && displayTileGradedStatus(status) === "correct";

    return {
      leftTile,
      rightTile,
      leftStatus,
      rightStatus,
      leftInteractive: canEditAnswers && !isSourceAssigned(leftTile.itemId),
      rightInteractive:
        rightTile !== undefined &&
        canEditAnswers &&
        !isTargetTaken(rightTile.itemId),
      leftSelected: selectedLeftId === leftTile.itemId,
      leftMatched: isSourceAssigned(leftTile.itemId),
      rightMatched:
        rightTile !== undefined ? isTargetTaken(rightTile.itemId) : false,
      showMergedPair:
        hasAnswerKey && showMergedPairPhase && rightTile !== undefined,
      hideCells: isRevealed,
      isRowCorrect,
      leftStaggerIndex: isFullyCorrect
        ? getCelebrateStaggerIndex("left", leftTile.itemId)
        : 0,
      rightStaggerIndex:
        rightTile !== undefined && isFullyCorrect
          ? getCelebrateStaggerIndex("right", rightTile.itemId)
          : 0,
      shouldCelebrateLeft: shouldCelebrate(leftStatus),
      shouldCelebrateRight: shouldCelebrate(rightStatus),
    };
  });
}
