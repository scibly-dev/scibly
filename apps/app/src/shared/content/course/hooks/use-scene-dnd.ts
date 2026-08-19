import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";

/**
 * Shared by both the lesson builder's `SceneFlowSidebar` and the AI
 * notebook's `SceneNavigator`, so the DnD sensor/index-computation logic
 * isn't duplicated between them.
 */
export function useSceneDnd<T extends { id: string }>({
  items,
  onReorder,
}: {
  items: readonly T[];
  onReorder: (reordered: T[], oldItems: readonly T[]) => void;
}) {
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDragActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const reordered = arrayMove([...items], oldIndex, newIndex);
      onReorder(reordered, items);
    }
  };

  return { dragActiveId, sensors, handleDragStart, handleDragEnd };
}
