"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import MatchingPairView from "./components/matching-pair-view";
import MatchingPairsView from "./components/matching-pairs";
import { MATCHING_PAIR_NODE_NAME, MATCHING_PAIRS_NODE_NAME } from "./schema";

export const matchingPairsNodeViewBindings = [
  {
    nodeViewKey: MATCHING_PAIR_NODE_NAME,
    nodeView: ReactNodeViewRenderer(MatchingPairView),
  },
  {
    nodeViewKey: MATCHING_PAIRS_NODE_NAME,
    nodeView: ReactNodeViewRenderer(MatchingPairsView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
