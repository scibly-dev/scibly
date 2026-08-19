import type { NodeViewRenderer } from "@tiptap/core";
import type {
  QuestionData,
  UserAnswer,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";

import { mergeAttributes, Node } from "@tiptap/core";

import { defaultQuestionBlockAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import getDefaultReactBlockAttributes from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { buildDefaultMatchingPairsInsertContent } from "@/shared/content/editor/blocks/questions/matching-pairs/commands/insert-content";
import { matchingPairsMarkdownSpec } from "@/shared/content/editor/blocks/questions/matching-pairs/parser/matching-pairs-markdown";
import {
  defaultAnswerData,
  defaultQuestionData,
  MATCHING_PAIR_NODE_NAME,
  MATCHING_PAIRS_GROUP,
  MATCHING_PAIRS_NODE_NAME,
} from "@/shared/content/editor/blocks/questions/matching-pairs/schema";
import { preserveOrShuffleRightColumnOrder } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/matching-pairs-data";
import { questionBlockSchemaAttribute } from "@/shared/content/editor/html-schema/question-block-schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insertMatchingPairs: {
      insertMatchingPairs: () => ReturnType;
    };
  }
}

type MatchingPairsNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

function buildInitialQuestionData() {
  const pairs = buildDefaultMatchingPairsInsertContent().map((pair) => {
    const leftSide = pair.content[0];
    const rightSide = pair.content[1];
    return {
      pairId: pair.attrs.id,
      leftItemId: leftSide.attrs.itemId,
      rightItemId: rightSide.attrs.itemId,
    };
  });

  return {
    pairs,
    rightColumnOrder: preserveOrShuffleRightColumnOrder(pairs, []),
  };
}

export function createMatchingPairsNode(
  options: MatchingPairsNodeOptions = {},
) {
  const nodeView = options.nodeView;

  return Node.create({
    name: MATCHING_PAIRS_NODE_NAME,

    group: MATCHING_PAIRS_GROUP,

    content: `${MATCHING_PAIR_NODE_NAME}+`,

    isolating: true,

    defining: true,

    selectable: true,

    addAttributes() {
      return getDefaultReactBlockAttributes<QuestionData, UserAnswer>({
        questionBlock: { defaultQuestionData, defaultAnswerData },
      });
    },

    parseHTML() {
      return [
        {
          tag: `div[data-type='${MATCHING_PAIRS_NODE_NAME}']`,
        },
      ];
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": MATCHING_PAIRS_NODE_NAME,
        }),
        0,
      ];
    },

    addNodeView: nodeView ? () => nodeView : undefined,

    addHtmlSchemaAwareness() {
      return {
        tag: "div",
        name: "Matching Pairs",
        description:
          "An interactive matching exercise where learners tap a left item and then the matching right item. Each side supports rich content such as text, images, math, citations, and audio.",
        attributes: [
          {
            attr: "data-type",
            value: MATCHING_PAIRS_NODE_NAME,
            description: "Identifies this block as a matching pairs node",
          },
          questionBlockSchemaAttribute(defaultQuestionData),
        ],
      };
    },

    addCommands() {
      return {
        insertMatchingPairs:
          () =>
          ({ commands }) => {
            const initialQuestionData = buildInitialQuestionData();
            return commands.insertContent({
              type: this.name,
              attrs: {
                questionBlockAttributes: {
                  ...defaultQuestionBlockAttributes,
                  userAnswers: defaultAnswerData,
                  questionData: initialQuestionData,
                },
              },
              content: buildDefaultMatchingPairsInsertContent(),
            });
          },
      };
    },

    ...matchingPairsMarkdownSpec,
  });
}
