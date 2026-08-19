import type {
  DraggableItem,
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/drag-and-drop/schema";

type DragAndDropLearnerPlacements = {
  availableItems: DraggableItem[];
  itemsByZone: Map<string, DraggableItem[]>;
};

export function deriveLearnerPlacements(
  questionData: Pick<QuestionData, "items" | "zones">,
  userAnswers: UserAnswer,
): DragAndDropLearnerPlacements {
  const itemsByZone = new Map(
    questionData.zones.map((zone): [string, DraggableItem[]] => [zone.id, []]),
  );
  const availableItems: DraggableItem[] = [];

  for (const item of questionData.items) {
    const assignedItems = itemsByZone.get(userAnswers[item.id] ?? "");
    if (assignedItems) {
      assignedItems.push(item);
    } else {
      availableItems.push(item);
    }
  }

  return { availableItems, itemsByZone };
}
