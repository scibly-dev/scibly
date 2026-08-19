import type { JSONContent } from "@tiptap/core";

import {
  assertKnownParts,
  BaseQuestionBlockParser,
  countCorrectMappings,
} from "@/shared/content/editor/assessment/parsing/base-parser/parser";
import {
  MATCHING_PAIRS_NODE_NAME,
  type QuestionData,
  questionDataStructureSchema,
  type UserAnswer,
  userAnswerStructureSchema,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { getCorrectMappings } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";

const RIGHT = "right";

function tileSortKey(side: JSONContent): string {
  const text: string[] = [];
  const visit = (node: JSONContent) => {
    if (typeof node.text === "string") text.push(node.text);
    node.content?.forEach(visit);
  };
  visit(side);
  return `${text.join(" ")} ${String(side.attrs?.itemId ?? "")}`;
}

export class MatchingPairsParser extends BaseQuestionBlockParser<
  typeof MATCHING_PAIRS_NODE_NAME,
  QuestionData,
  UserAnswer
> {
  readonly questionDataStructure = questionDataStructureSchema;
  readonly userAnswerStructure = userAnswerStructureSchema;
  protected readonly blockType = MATCHING_PAIRS_NODE_NAME;

  getAnswerCorrectness(solution: QuestionData, learnerAnswer: UserAnswer) {
    if (solution.pairs.length === 0) return null;
    return countCorrectMappings(getCorrectMappings(solution), learnerAnswer);
  }

  getPoints(solution: QuestionData, learnerAnswer: UserAnswer): number {
    assertKnownParts(learnerAnswer, {
      placed: solution.pairs.map((pair) => pair.leftItemId),
      targets: solution.pairs.map((pair) => pair.rightItemId),
    });

    const correctness = this.getAnswerCorrectness(solution, learnerAnswer);
    return correctness ? correctness.correct : 0;
  }

  describeMissingSolution(solution: QuestionData): string | null {
    if (solution.pairs.length === 0) {
      return "There are no pairs for a learner to match";
    }
    for (const [index, pair] of solution.pairs.entries()) {
      const position = index + 1;
      if (!pair.leftItemId) return `Row ${position} has nothing on the left`;
      if (!pair.rightItemId) return `Row ${position} has no matching partner`;
    }
    return null;
  }

  isAnswered(
    learnerAnswer: UserAnswer,
    questionValidationMetadata?: QuestionData,
  ): boolean {
    const matches = learnerAnswer ?? {};
    if (!questionValidationMetadata?.pairs.length) {
      return Object.keys(matches).length > 0;
    }
    return questionValidationMetadata.pairs.every((pair) =>
      Boolean(matches[pair.leftItemId]),
    );
  }

  getMaxPoints(solution: QuestionData): number {
    return solution.pairs.length;
  }

  stripSolution(solution: QuestionData) {
    return {
      ...solution,
      pairs: solution.pairs.map((pair) => ({ ...pair, rightItemId: "" })),
      correctMappings: {},
    };
  }

  stripSolutionFromContent(content: JSONContent[] | undefined) {
    if (!content) return content;

    const canonical = content
      .flatMap((pair) => pair.content ?? [])
      .filter((side) => side.attrs?.side === RIGHT)
      .toSorted((a, b) => tileSortKey(a).localeCompare(tileSortKey(b)));

    let next = 0;
    return content.map((pair) => ({
      ...pair,
      content: pair.content?.map((side) =>
        side.attrs?.side === RIGHT ? (canonical[next++] ?? side) : side,
      ),
    }));
  }

  formatLearnerAnswer(learnerAnswer: UserAnswer): string {
    if (!learnerAnswer || typeof learnerAnswer !== "object") return "(empty)";
    const entries = Object.entries(learnerAnswer);
    return entries.length === 0
      ? "(empty)"
      : entries.map(([leftId, rightId]) => `${leftId} → ${rightId}`).join(", ");
  }

  formatCorrectAnswer(solution: QuestionData): string {
    return this.formatLearnerAnswer(getCorrectMappings(solution));
  }
}
