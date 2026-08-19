import type { JSONContent } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type {
  ClozeSegment,
  GapSegment,
  QuestionData,
  TextSegment,
  WordItem,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";

import { stringAttribute } from "@/shared/content/editor/blocks/attributes/string-attribute";
import { CUSTOM_PARAGRAPH_NODE_NAME } from "@/shared/content/editor/blocks/custom-paragraph/schema";
import { CLOZE_GAP_NODE_NAME } from "@/shared/content/editor/blocks/questions/cloze-text/cloze-gap/schema";
import { createBlockId } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-author";
import {
  createTextSegment,
  normalizeAuthorSegments,
} from "@/shared/content/editor/blocks/questions/cloze-text/utils/segment-normalize";

export function buildClozeDocContent(
  questionData: QuestionData,
): JSONContent[] {
  const labelByItemId = new Map(
    questionData.items.map((item) => [item.id, item.label]),
  );
  const paragraphs: JSONContent[] = [];
  let currentInline: JSONContent[] = [];

  const pushParagraph = () => {
    paragraphs.push({
      type: CUSTOM_PARAGRAPH_NODE_NAME,
      content: currentInline.length > 0 ? currentInline : undefined,
    });
    currentInline = [];
  };

  for (const segment of normalizeAuthorSegments(questionData.segments)) {
    if (segment.type === "text") {
      const lines = segment.content.split("\n");
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        if (lineIndex > 0) {
          pushParagraph();
        }
        const line = lines[lineIndex] ?? "";
        if (line) {
          currentInline.push({ type: "text", text: line });
        }
      }
      continue;
    }

    currentInline.push({
      type: CLOZE_GAP_NODE_NAME,
      attrs: {
        gapId: segment.id,
        correctItemId: segment.correctItemId,
        label: labelByItemId.get(segment.correctItemId) ?? "",
      },
    });
  }

  pushParagraph();

  if (paragraphs.length === 0) {
    return [{ type: CUSTOM_PARAGRAPH_NODE_NAME }];
  }

  return paragraphs;
}

type GapNodeInfo = {
  correctItemId: string;
  label: string;
};

function collectGapNodes(node: PMNode): GapNodeInfo[] {
  const gaps: GapNodeInfo[] = [];

  node.forEach((paragraph) => {
    paragraph.forEach((child) => {
      if (child.type.name !== CLOZE_GAP_NODE_NAME) return;
      const correctItemId = stringAttribute(child, "correctItemId");
      if (!correctItemId) return;
      gaps.push({
        correctItemId,
        label: stringAttribute(child, "label") ?? "",
      });
    });
  });

  return gaps;
}

function deriveSegmentsFromNode(
  node: PMNode,
  currentSegments: ClozeSegment[],
): ClozeSegment[] {
  const reusableTextIds = currentSegments
    .filter((segment): segment is TextSegment => segment.type === "text")
    .map((segment) => segment.id);
  let nextTextIdIndex = 0;
  const takeTextId = () =>
    reusableTextIds[nextTextIdIndex++] ?? createBlockId("seg");

  const segments: ClozeSegment[] = [];
  let textBuffer = "";

  const flushText = () => {
    if (textBuffer.length === 0 && segments.length === 0) {
      segments.push(createTextSegment("", takeTextId()));
      return;
    }

    if (textBuffer.length > 0 || segments.at(-1)?.type === "gap") {
      segments.push(createTextSegment(textBuffer, takeTextId()));
      textBuffer = "";
    }
  };

  const paragraphCount = node.childCount;

  node.forEach((paragraph, _offset, paragraphIndex) => {
    paragraph.forEach((child) => {
      if (child.isText) {
        textBuffer += child.text ?? "";
        return;
      }

      if (child.type.name === "hardBreak") {
        textBuffer += "\n";
        return;
      }

      if (child.type.name === CLOZE_GAP_NODE_NAME) {
        const id = stringAttribute(child, "gapId");
        const correctItemId = stringAttribute(child, "correctItemId");

        if (!id || !correctItemId) return;
        flushText();
        segments.push({ type: "gap", id, correctItemId });
      }
    });

    if (paragraphIndex < paragraphCount - 1) {
      textBuffer += "\n";
    }
  });

  flushText();

  return normalizeAuthorSegments(segments);
}

function mergeItems(
  gaps: GapNodeInfo[],
  currentQuestionData: QuestionData,
): WordItem[] {
  const referencedIds = new Set(gaps.map((gap) => gap.correctItemId));

  const previousGapItemIds = new Set(
    currentQuestionData.segments
      .filter((segment): segment is GapSegment => segment.type === "gap")
      .map((segment) => segment.correctItemId),
  );
  const orphanedGapItemIds = new Set(
    [...previousGapItemIds].filter((id) => !referencedIds.has(id)),
  );

  const gapItems: WordItem[] = [];
  const seenGapIds = new Set<string>();
  for (const gap of gaps) {
    if (seenGapIds.has(gap.correctItemId)) continue;
    seenGapIds.add(gap.correctItemId);
    gapItems.push({ id: gap.correctItemId, label: gap.label });
  }

  const distractors = currentQuestionData.items.filter(
    (item) => !referencedIds.has(item.id) && !orphanedGapItemIds.has(item.id),
  );

  return [...gapItems, ...distractors];
}

export function deriveQuestionDataFromClozeNode(
  node: PMNode,
  currentQuestionData: QuestionData,
): QuestionData {
  const gaps = collectGapNodes(node);
  const segments = deriveSegmentsFromNode(node, currentQuestionData.segments);
  const items = mergeItems(gaps, currentQuestionData);

  return {
    segments,
    items,
  };
}

export function questionDataStructureFingerprint(
  questionData: QuestionData,
): string {
  const segmentPart = questionData.segments
    .map((segment) =>
      segment.type === "text"
        ? `t:${segment.content}`
        : `g:${segment.id}:${segment.correctItemId}`,
    )
    .join("|");
  const itemPart = questionData.items
    .map((item) => `${item.id}:${item.label}`)
    .join("|");

  return `${segmentPart}::${itemPart}`;
}
