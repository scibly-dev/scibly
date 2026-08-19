import {
  assertKnownParts,
  BaseQuestionBlockParser,
  countCorrectMappings,
} from "@/shared/content/editor/assessment/parsing/base-parser/parser";
import {
  DRAG_AND_DROP_NODE_NAME,
  type QuestionData,
  questionDataStructureSchema,
  type UserAnswer,
  userAnswerStructureSchema,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";

export class DragAndDropParser extends BaseQuestionBlockParser<
  typeof DRAG_AND_DROP_NODE_NAME,
  QuestionData,
  UserAnswer
> {
  readonly questionDataStructure = questionDataStructureSchema;
  readonly userAnswerStructure = userAnswerStructureSchema;
  protected readonly blockType = DRAG_AND_DROP_NODE_NAME;
  protected readonly POINTS_PER_CORRECT_MAPPING = 1;

  getAnswerCorrectness(solution: QuestionData, learnerAnswer: UserAnswer) {
    if (Object.keys(solution.correctMappings).length === 0) return null;
    return countCorrectMappings(solution.correctMappings, learnerAnswer);
  }

  getPoints(solution: QuestionData, learnerAnswer: UserAnswer): number {
    assertKnownParts(learnerAnswer, {
      placed: solution.items.map((item) => item.id),
      targets: solution.zones.map((zone) => zone.id),
    });

    const { correct } = countCorrectMappings(
      solution.correctMappings,
      learnerAnswer,
    );
    return correct * this.POINTS_PER_CORRECT_MAPPING;
  }

  describeMissingSolution(solution: QuestionData): string | null {
    const mappings = Object.entries(solution.correctMappings);
    if (mappings.length === 0) {
      return "No item has been given a correct drop zone";
    }

    const itemLabels = new Map(
      solution.items.map((item) => [item.id, item.label]),
    );
    const zoneIds = new Set(solution.zones.map((zone) => zone.id));
    for (const [itemId, zoneId] of mappings) {
      const label = itemLabels.get(itemId);
      if (label === undefined) {
        return "An item that was given a correct zone has since been deleted";
      }
      if (!zoneIds.has(zoneId)) {
        return `"${label}" belongs in a drop zone that no longer exists`;
      }
    }
    return null;
  }

  isAnswered(learnerAnswer: UserAnswer): boolean {
    const placements = learnerAnswer ?? {};
    return Object.values(placements).some(Boolean);
  }

  getMaxPoints(solution: QuestionData): number {
    return Object.keys(solution.correctMappings).length;
  }

  stripSolution(solution: QuestionData): QuestionData {
    return { ...solution, correctMappings: {} };
  }

  formatLearnerAnswer(
    learnerAnswer: UserAnswer,
    solution: QuestionData,
  ): string {
    if (!learnerAnswer || typeof learnerAnswer !== "object") return "(empty)";
    const formatted = Object.entries(learnerAnswer).map(([itemId, zoneId]) => {
      const itemLabel =
        solution.items?.find((item) => item.id === itemId)?.label ?? itemId;
      const zoneLabel =
        solution.zones?.find((zone) => zone.id === zoneId)?.label ?? zoneId;
      return `${itemLabel} → ${zoneLabel}`;
    });
    return formatted.length > 0 ? formatted.join(", ") : "(empty)";
  }

  formatCorrectAnswer(solution: QuestionData): string {
    return this.formatLearnerAnswer(solution.correctMappings, solution);
  }
}
