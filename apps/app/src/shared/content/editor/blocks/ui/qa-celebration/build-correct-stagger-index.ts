import type { QAGradedItemStatus } from "@/shared/content/editor/blocks/ui/qa-celebration/qa-celebration-tokens";

export function buildCorrectStaggerIndexMap<TId extends string>(
  ids: readonly TId[],
  getStatus: (id: TId) => QAGradedItemStatus,
): Map<TId, number> {
  const map = new Map<TId, number>();
  let index = 0;

  for (const id of ids) {
    if (getStatus(id) === "correct") {
      map.set(id, index);
      index += 1;
    }
  }

  return map;
}
