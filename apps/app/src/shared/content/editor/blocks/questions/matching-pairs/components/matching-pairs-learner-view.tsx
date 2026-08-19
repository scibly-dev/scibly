"use client";

import { memo } from "react";

import {
  MatchingPairsLearnerViewBody,
  type MatchingPairsLearnerViewBodyProps,
} from "@/shared/content/editor/blocks/questions/matching-pairs/components/matching-pairs-learner-view-body";

type MatchingPairsLearnerViewProps = MatchingPairsLearnerViewBodyProps;

export const MatchingPairsLearnerView = memo(
  (props: MatchingPairsLearnerViewProps) => (
    <MatchingPairsLearnerViewBody
      key={props.isGraded ? `graded-${props.celebrateKey}` : "play"}
      {...props}
    />
  ),
);

MatchingPairsLearnerView.displayName = "MatchingPairsLearnerView";
