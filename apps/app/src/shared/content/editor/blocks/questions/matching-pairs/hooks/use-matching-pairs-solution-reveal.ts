"use client";

import type { SolutionPhase } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/build-learner-rows";
import type { MatchingPairSideTile } from "@/shared/content/editor/blocks/questions/matching-pairs/utils/serialize-matching-pair-side";

import { useReducedMotion } from "framer-motion";
import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  QA_CELEBRATION_DURATION_MS,
  QA_CELEBRATION_STAGGER_MS,
} from "@/shared/content/editor/blocks/ui/qa-celebration";

const FEEDBACK_COLOR_SETTLE_MS = 120;
const FEEDBACK_BEFORE_REORDER_MS = 400;
const REORDER_DURATION_MS = 800;
const MERGE_CROSSFADE_MS = 600;
const MERGE_OVERLAP_MS = 220;
const SHUFFLE_ALIGNED_LEAD_MS = 100;

const FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const ROW_HEIGHT_TRANSITION = `height ${REORDER_DURATION_MS}ms ${FLIP_EASING}`;

function cancelFlipAnimations(slots: Map<string, HTMLDivElement>) {
  slots.forEach((element) => {
    element.getAnimations().forEach((animation) => animation.cancel());
    element.style.transform = "";
  });
}

function runFlipAnimations(
  slots: Map<string, HTMLDivElement>,
  firstPositions: Map<string, DOMRect>,
  durationMs: number,
) {
  slots.forEach((element, itemId) => {
    const first = firstPositions.get(itemId);
    if (!first) return;

    const last = element.getBoundingClientRect();
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;

    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

    element.getAnimations().forEach((animation) => animation.cancel());

    element.animate(
      [
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
        { transform: "translate3d(0, 0, 0)" },
      ],
      {
        duration: durationMs,
        easing: FLIP_EASING,
        fill: "both",
      },
    );
  });
}

function getRowCellsElement(
  rowWrapperRefs: Map<string, HTMLDivElement>,
  leftTileItemId: string,
) {
  const rowEl = rowWrapperRefs.get(leftTileItemId);
  return rowEl?.querySelector<HTMLElement>(".matching-pair-learner-row__cells");
}

function measureRowHeight(rowEl: HTMLDivElement) {
  return rowEl.getBoundingClientRect().height;
}

function lockRowHeight(rowEl: HTMLDivElement, height: number) {
  rowEl.style.height = `${height}px`;
}

function measureRowHeights(
  leftTiles: MatchingPairSideTile[],
  rowWrapperRefs: Map<string, HTMLDivElement>,
) {
  const heights = new Map<string, number>();

  leftTiles.forEach((leftTile) => {
    const rowEl = rowWrapperRefs.get(leftTile.itemId);
    if (!rowEl) return;

    const height = measureRowHeight(rowEl);
    if (height > 0) {
      heights.set(leftTile.itemId, height);
    }
  });

  return heights;
}

function cleanupRowHeightAnimations(
  leftTiles: MatchingPairSideTile[],
  rowWrapperRefs: Map<string, HTMLDivElement>,
) {
  leftTiles.forEach((leftTile) => {
    const rowEl = rowWrapperRefs.get(leftTile.itemId);
    const cellsEl = getRowCellsElement(rowWrapperRefs, leftTile.itemId);
    if (rowEl) {
      rowEl.style.transition = "none";
      rowEl.style.height = "";
      rowEl.classList.remove("matching-pair-learner-row--height-animating");
    }
    if (cellsEl) {
      cellsEl.style.height = "";
      cellsEl.style.overflow = "";
    }
  });
}

function runRowHeightAnimations(
  leftTiles: MatchingPairSideTile[],
  rowWrapperRefs: Map<string, HTMLDivElement>,
  beforeHeights: Map<string, number>,
  afterHeights: Map<string, number>,
  targetHeightsRef: { current: Map<string, number> },
) {
  leftTiles.forEach((leftTile) => {
    const rowEl = rowWrapperRefs.get(leftTile.itemId);
    const cellsEl = getRowCellsElement(rowWrapperRefs, leftTile.itemId);
    const fromHeight = beforeHeights.get(leftTile.itemId);
    const toHeight = afterHeights.get(leftTile.itemId);
    if (
      !rowEl ||
      !cellsEl ||
      fromHeight === undefined ||
      toHeight === undefined
    ) {
      return;
    }

    targetHeightsRef.current.set(leftTile.itemId, toHeight);

    if (Math.abs(fromHeight - toHeight) < 0.5) return;

    rowEl.classList.add("matching-pair-learner-row--height-animating");
    rowEl.style.transition = "none";
    rowEl.style.height = `${fromHeight}px`;
    void rowEl.offsetHeight;
    rowEl.style.transition = ROW_HEIGHT_TRANSITION;
    rowEl.style.height = `${toHeight}px`;

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== rowEl || event.propertyName !== "height") return;
      const lockedHeight = rowEl.getBoundingClientRect().height;
      rowEl.style.transition = "none";
      lockRowHeight(rowEl, lockedHeight);
    };

    rowEl.addEventListener("transitionend", handleTransitionEnd, {
      once: true,
    });
  });
}

type RevealAnimationHandles = {
  alignFrame: number;
  timers: {
    check: number;
    celebrateEnd: number;
    reorder: number;
    merge: number;
    reveal: number;
  };
};

function createRevealAnimationHandles(): RevealAnimationHandles {
  return {
    alignFrame: 0,
    timers: {
      check: 0,
      celebrateEnd: 0,
      reorder: 0,
      merge: 0,
      reveal: 0,
    },
  };
}

function clearRevealAnimationHandles(handles: RevealAnimationHandles) {
  window.cancelAnimationFrame(handles.alignFrame);
  for (const timerId of Object.values(handles.timers)) {
    window.clearTimeout(timerId);
  }
}

type UseMatchingPairsSolutionRevealOptions = {
  isGraded: boolean;
  celebrateKey: number;
  isShuffleAlreadyAligned: boolean;
  correctPairCount: number;
  leftTiles: MatchingPairSideTile[];
};

type MatchingPairsSolutionRevealState = {
  solutionPhase: SolutionPhase;
  rightColumnAligned: boolean;
  isRevealPhase: boolean;
  isMerging: boolean;
  isRevealed: boolean;
  showGradedColors: boolean;
  leftSlotRefs: RefObject<Map<string, HTMLDivElement>>;
  rightSlotRefs: RefObject<Map<string, HTMLDivElement>>;
  rowWrapperRefs: RefObject<Map<string, HTMLDivElement>>;
};

export function useMatchingPairsSolutionReveal({
  isGraded,
  celebrateKey,
  isShuffleAlreadyAligned,
  correctPairCount,
  leftTiles,
}: UseMatchingPairsSolutionRevealOptions): MatchingPairsSolutionRevealState {
  const prefersReducedMotion = useReducedMotion();
  const isMountedRef = useRef(true);
  const leftSlotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rightSlotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rowWrapperRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rowHeightsBeforeAlignRef = useRef<Map<string, number>>(new Map());
  const rowTargetHeightsRef = useRef<Map<string, number>>(new Map());
  const flipFirstPositionsRef = useRef<Map<string, DOMRect>>(new Map());
  const flipArmedRef = useRef(false);
  const [solutionPhase, setSolutionPhase] = useState<SolutionPhase>(() =>
    isGraded ? "feedback" : "play",
  );
  const [rightColumnAligned, setRightColumnAligned] = useState(
    () => isGraded && isShuffleAlreadyAligned,
  );

  useEffect(() => {
    isMountedRef.current = true;
    const rowWrapperMap = rowWrapperRefs.current;
    const rowHeightsBeforeAlignMap = rowHeightsBeforeAlignRef.current;
    const rowTargetHeightsMap = rowTargetHeightsRef.current;
    const rightSlotMap = rightSlotRefs.current;

    return () => {
      isMountedRef.current = false;
      flipArmedRef.current = false;
      flipFirstPositionsRef.current.clear();
      cleanupRowHeightAnimations(leftTiles, rowWrapperMap);
      rowHeightsBeforeAlignMap.clear();
      rowTargetHeightsMap.clear();
      cancelFlipAnimations(rightSlotMap);
    };
  }, [leftTiles]);

  useEffect(() => {
    if (!isGraded || prefersReducedMotion) {
      return;
    }

    const handles = createRevealAnimationHandles();
    const { timers } = handles;

    const scheduleMerge = () => {
      const mergeLeadMs = isShuffleAlreadyAligned
        ? SHUFFLE_ALIGNED_LEAD_MS
        : Math.max(0, REORDER_DURATION_MS - MERGE_OVERLAP_MS);
      const revealLeadMs = mergeLeadMs + MERGE_CROSSFADE_MS + 24;

      timers.merge = window.setTimeout(() => {
        if (!isMountedRef.current) return;
        setSolutionPhase("merging");
      }, mergeLeadMs);

      timers.reveal = window.setTimeout(() => {
        if (!isMountedRef.current) return;
        setSolutionPhase("revealed");
      }, revealLeadMs);
    };

    const beginReorder = () => {
      if (!isMountedRef.current) return;
      setSolutionPhase("reordering");

      if (isShuffleAlreadyAligned) {
        setRightColumnAligned(true);
        scheduleMerge();
        return;
      }

      flipArmedRef.current = true;
      setRightColumnAligned(false);
      handles.alignFrame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!isMountedRef.current) return;
          setRightColumnAligned(true);
          scheduleMerge();
        });
      });
    };

    const beginCheck = () => {
      if (!isMountedRef.current) return;
      setSolutionPhase("check");

      const checkDurationMs =
        QA_CELEBRATION_DURATION_MS +
        Math.max(0, correctPairCount - 1) * QA_CELEBRATION_STAGGER_MS +
        80;

      timers.celebrateEnd = window.setTimeout(() => {
        if (!isMountedRef.current) return;
        setSolutionPhase("feedback");
        timers.reorder = window.setTimeout(
          beginReorder,
          FEEDBACK_BEFORE_REORDER_MS,
        );
      }, checkDurationMs);
    };

    timers.check = window.setTimeout(beginCheck, FEEDBACK_COLOR_SETTLE_MS);

    return () => {
      clearRevealAnimationHandles(handles);
    };
  }, [
    celebrateKey,
    correctPairCount,
    isGraded,
    isShuffleAlreadyAligned,
    prefersReducedMotion,
  ]);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !flipArmedRef.current) return;

    if (solutionPhase === "reordering" && !rightColumnAligned) {
      const firstPositions = new Map<string, DOMRect>();
      rightSlotRefs.current.forEach((element, itemId) => {
        firstPositions.set(itemId, element.getBoundingClientRect());
      });
      flipFirstPositionsRef.current = firstPositions;
      rowHeightsBeforeAlignRef.current = measureRowHeights(
        leftTiles,
        rowWrapperRefs.current,
      );
      return;
    }

    if (!rightColumnAligned || flipFirstPositionsRef.current.size === 0) {
      return;
    }

    const beforeRowHeights = rowHeightsBeforeAlignRef.current;
    const afterRowHeights = measureRowHeights(
      leftTiles,
      rowWrapperRefs.current,
    );

    if (beforeRowHeights.size > 0) {
      cleanupRowHeightAnimations(leftTiles, rowWrapperRefs.current);
      runRowHeightAnimations(
        leftTiles,
        rowWrapperRefs.current,
        beforeRowHeights,
        afterRowHeights,
        rowTargetHeightsRef,
      );
      rowHeightsBeforeAlignRef.current.clear();
    }

    runFlipAnimations(
      rightSlotRefs.current,
      flipFirstPositionsRef.current,
      REORDER_DURATION_MS,
    );
    flipFirstPositionsRef.current.clear();
    flipArmedRef.current = false;
  }, [leftTiles, prefersReducedMotion, rightColumnAligned, solutionPhase]);

  useLayoutEffect(() => {
    if (solutionPhase === "revealed") {
      leftTiles.forEach((leftTile) => {
        const rowEl = rowWrapperRefs.current.get(leftTile.itemId);
        if (!rowEl) return;
        rowEl.style.transition = "none";
        rowEl.classList.remove("matching-pair-learner-row--height-animating");
      });
      rowHeightsBeforeAlignRef.current.clear();
      rowTargetHeightsRef.current.clear();
    }

    if (solutionPhase === "merging") {
      cancelFlipAnimations(rightSlotRefs.current);
    }
  }, [leftTiles, solutionPhase]);

  const resolvedPhase =
    isGraded && prefersReducedMotion ? "revealed" : solutionPhase;
  const resolvedRightColumnAligned =
    isGraded && prefersReducedMotion ? true : rightColumnAligned;
  const isRevealed = resolvedPhase === "revealed";
  const isMerging = resolvedPhase === "merging";
  const isRevealPhase =
    resolvedPhase === "reordering" ||
    resolvedPhase === "merging" ||
    resolvedPhase === "revealed";

  return {
    solutionPhase: resolvedPhase,
    rightColumnAligned: resolvedRightColumnAligned,
    isRevealPhase,
    isMerging,
    isRevealed,
    showGradedColors: isGraded,
    leftSlotRefs,
    rightSlotRefs,
    rowWrapperRefs,
  };
}
