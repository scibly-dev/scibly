import {
  extensionEntry,
  nodeEntry,
} from "@/shared/content/editor/blocks/registry/definition-helpers";
import { QuestionBlockDefinition } from "@/shared/content/editor/blocks/registry/types";

import { createMatchingPairNode } from "./matching-pair/node";
import { MatchingPairSide } from "./matching-pair-side/node";
import { createMatchingPairsNode } from "./node";
import { MatchingPairsParser } from "./parser/grading";
import { MATCHING_PAIRS_GROUP, MATCHING_PAIRS_NODE_NAME } from "./schema";
import { shouldHideSlashCommandInMatchingPairsContext } from "./utils/matching-pair-side-content";

const matchingPairNode = createMatchingPairNode();
const matchingPairsNode = createMatchingPairsNode();

export const matchingPairsDefinition = new QuestionBlockDefinition({
  name: MATCHING_PAIRS_NODE_NAME,
  ownerPath: "matching-pairs",
  contractOrder: 60,
  slot: "content",
  documentGroup: MATCHING_PAIRS_GROUP,
  scene: true,
  stableId: true,
  stableIdOrder: 60,
  slashCommands: [
    {
      group: "question",
      order: 60,
      name: "matching pairs",
      iconName: "Columns2",
      aliases: [
        "matching",
        "matching pairs",
        "paare",
        "zuordnen",
        "match",
        "pairs",
      ],
      copy: {
        de: {
          label: "Paare zuordnen",
          description: "Linke und rechte Spalte per Antippen zuordnen",
        },
        en: {
          label: "Matching pairs",
          description: "Match left and right tiles by tapping pairs",
        },
      },
      shouldBeHidden: (editor) =>
        editor.isActive("column") ||
        shouldHideSlashCommandInMatchingPairsContext(editor, "matching pairs"),
      action: (editor) => {
        editor.chain().focus().insertMatchingPairs().run();
      },
    },
  ],
  extensions: [
    nodeEntry(matchingPairNode, (nodeView) =>
      createMatchingPairNode({ nodeView }),
    ),
    extensionEntry(MatchingPairSide),
    nodeEntry(matchingPairsNode, (nodeView) =>
      createMatchingPairsNode({ nodeView }),
    ),
  ],
  parser: new MatchingPairsParser(),
  presentation: {
    analyticsLabel: "Matching Pairs",
    iconName: "Columns2",
    userFriendlyName: "Paare zuordnen",
  },
});
