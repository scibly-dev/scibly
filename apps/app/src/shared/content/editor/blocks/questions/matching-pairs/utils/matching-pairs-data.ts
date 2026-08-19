import type { Node as PMNode } from "@tiptap/pm/model";
import type { QAGradedItemStatus } from "@/shared/content/editor/blocks/ui/qa-celebration";

import { stringAttribute } from "@/shared/content/editor/blocks/attributes/string-attribute";
import {
  MATCHING_PAIR_NODE_NAME,
  MATCHING_PAIR_SIDE_NODE_NAME,
  type MatchingPairMeta,
  type QuestionData,
  type UserAnswer,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { getMappingGradedStatus } from "@/shared/content/editor/blocks/ui/qa-celebration";

export function createMatchingItemIds() {
  return {
    pairId: `pair-${crypto.randomUUID()}`,
    leftItemId: `left-${crypto.randomUUID()}`,
    rightItemId: `right-${crypto.randomUUID()}`,
  };
}

export function extractPairsFromNode(node: PMNode): MatchingPairMeta[] {
  const pairs: MatchingPairMeta[] = [];

  node.forEach((pairNode) => {
    if (pairNode.type.name !== MATCHING_PAIR_NODE_NAME) return;

    let leftItemId: string | null = null;
    let rightItemId: string | null = null;

    pairNode.forEach((sideNode) => {
      if (sideNode.type.name !== MATCHING_PAIR_SIDE_NODE_NAME) return;
      if (sideNode.attrs.side === "left") {
        leftItemId = stringAttribute(sideNode, "itemId");
      } else {
        rightItemId = stringAttribute(sideNode, "itemId");
      }
    });

    const pairId = stringAttribute(pairNode, "id");
    if (!pairId || !leftItemId || !rightItemId) return;

    pairs.push({ pairId, leftItemId, rightItemId });
  });

  return pairs;
}

export function buildCorrectMappings(
  pairs: MatchingPairMeta[],
): Record<string, string> {
  return Object.fromEntries(
    pairs.map((pair) => [pair.leftItemId, pair.rightItemId]),
  );
}

export function getCorrectMappings(
  questionData: Pick<QuestionData, "pairs" | "correctMappings">,
): Record<string, string> {
  if (
    questionData.correctMappings &&
    Object.keys(questionData.correctMappings).length > 0
  ) {
    return questionData.correctMappings;
  }

  return buildCorrectMappings(questionData.pairs);
}

export function getRightTileIds(
  questionData: Pick<QuestionData, "rightColumnOrder">,
): string[] {
  return questionData.rightColumnOrder;
}

export function pairsFingerprint(pairs: MatchingPairMeta[]): string {
  if (pairs.length === 0) return "";
  return pairs
    .map((pair) => `${pair.pairId}:${pair.leftItemId}:${pair.rightItemId}`)
    .join("|");
}

function shuffleRightColumnOrder(rightItemIds: string[]): string[] {
  if (rightItemIds.length <= 1) return [...rightItemIds];

  const maxAttempts = 24;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffled = [...rightItemIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }

    if (!shuffled.some((id, index) => id === rightItemIds[index])) {
      return shuffled;
    }
  }

  return [...rightItemIds.slice(1), rightItemIds[0]!];
}

export function preserveOrShuffleRightColumnOrder(
  pairs: MatchingPairMeta[],
  previousOrder: string[],
): string[] {
  const rightItemIds = pairs.map((pair) => pair.rightItemId);
  const sameSet =
    previousOrder.length === rightItemIds.length &&
    previousOrder.every((id) => rightItemIds.includes(id));

  if (sameSet && previousOrder.length > 0) {
    return previousOrder.filter((id) => rightItemIds.includes(id));
  }

  return shuffleRightColumnOrder(rightItemIds);
}

export function deriveQuestionDataFromNode(
  node: PMNode,
  previous?: QuestionData,
): QuestionData {
  const pairs = extractPairsFromNode(node);
  const rightColumnOrder = preserveOrShuffleRightColumnOrder(
    pairs,
    previous?.rightColumnOrder ?? [],
  );

  return {
    pairs,
    rightColumnOrder,
  };
}

function sideHasContent(sideNode: PMNode): boolean {
  let hasText = false;
  sideNode.descendants((child) => {
    if (child.isText && child.text?.trim()) {
      hasText = true;
      return false;
    }
    if (child.isAtom && child.type.name !== "paragraph") {
      hasText = true;
      return false;
    }
    return true;
  });
  return hasText;
}

export function nodeHasValidPairs(node: PMNode): boolean {
  const pairs = extractPairsFromNode(node);
  if (pairs.length === 0) return false;

  for (const pairNode of node.content.content) {
    if (pairNode.type.name !== MATCHING_PAIR_NODE_NAME) continue;
    const sides = pairNode.content.content.filter(
      (child) => child.type.name === MATCHING_PAIR_SIDE_NODE_NAME,
    );
    if (sides.length !== 2) return false;
    if (!sides.every((side) => sideHasContent(side))) return false;
  }

  return true;
}

export function findLeftIdMatchedToRight(
  rightItemId: string,
  userAnswers: UserAnswer,
): string | undefined {
  return Object.entries(userAnswers).find(
    ([, rightId]) => rightId === rightItemId,
  )?.[0];
}

function findLeftIdForCorrectRight(
  rightItemId: string,
  correctMappings: Record<string, string>,
): string | undefined {
  return Object.entries(correctMappings).find(
    ([, rightId]) => rightId === rightItemId,
  )?.[0];
}

export function getMatchingSideGradedStatus(
  side: "left" | "right",
  itemId: string,
  questionData: QuestionData,
  userAnswers: UserAnswer,
  isGraded: boolean,
): QAGradedItemStatus {
  if (!isGraded) return "neutral";

  const correctMappings = getCorrectMappings(questionData);

  if (side === "left") {
    return getMappingGradedStatus(
      correctMappings[itemId],
      userAnswers[itemId],
      isGraded,
    );
  }

  const matchedLeftId = findLeftIdMatchedToRight(itemId, userAnswers);
  if (matchedLeftId) {
    return getMappingGradedStatus(
      correctMappings[matchedLeftId],
      userAnswers[matchedLeftId],
      isGraded,
    );
  }

  const correctLeftId = findLeftIdForCorrectRight(itemId, correctMappings);
  if (correctLeftId) {
    const pairedLeftResult = getMappingGradedStatus(
      correctMappings[correctLeftId],
      userAnswers[correctLeftId],
      isGraded,
    );
    if (pairedLeftResult !== "correct") {
      return "missed";
    }
  }

  return "neutral";
}
