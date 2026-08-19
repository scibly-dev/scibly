import type {
  ClozeSegment,
  QuestionData,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";

import {
  getGapSegments,
  getItemById,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import { normalizeAuthorSegments } from "@/shared/content/editor/blocks/questions/cloze-text/utils/segment-normalize";

export function createBlockId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function isEmptyGapLabel(label: string | undefined): boolean {
  return !label?.trim();
}

export function repairClozeQuestionData(data: QuestionData): QuestionData {
  const gaps = getGapSegments(data.segments);
  if (gaps.length === 0) return data;

  const referencedIds = new Set(gaps.map((gap) => gap.correctItemId));
  const gapsNeedingRepair = gaps.filter((gap) => {
    const item = getItemById(data.items, gap.correctItemId);
    return !item || isEmptyGapLabel(item.label);
  });

  if (gapsNeedingRepair.length === 0) return data;

  const unlinkedAnswers = data.items.filter(
    (item) => !referencedIds.has(item.id) && !isEmptyGapLabel(item.label),
  );

  if (unlinkedAnswers.length < gapsNeedingRepair.length) return data;

  const pool = [...unlinkedAnswers];
  const nextSegments: ClozeSegment[] = data.segments.map((segment) => {
    if (segment.type !== "gap") return segment;

    const item = getItemById(data.items, segment.correctItemId);
    if (item && !isEmptyGapLabel(item.label)) return segment;

    const replacement = pool.shift();
    if (!replacement) return segment;

    return { ...segment, correctItemId: replacement.id };
  });

  const nextReferencedIds = new Set(
    getGapSegments(nextSegments).map((gap) => gap.correctItemId),
  );
  const nextItems = data.items.filter(
    (item) => nextReferencedIds.has(item.id) || !isEmptyGapLabel(item.label),
  );

  return {
    segments: normalizeAuthorSegments(nextSegments),
    items: nextItems,
  };
}
