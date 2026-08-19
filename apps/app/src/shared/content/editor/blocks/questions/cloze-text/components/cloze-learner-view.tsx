"use client";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import {
  Fragment,
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { applyDisplayOrder } from "@/shared/content/editor/assessment/learner/answer-order";
import { ClozeGapSlot } from "@/shared/content/editor/blocks/questions/cloze-text/components/cloze-gap-slot";
import { FlyingWordChip } from "@/shared/content/editor/blocks/questions/cloze-text/components/flying-word-chip";
import { WordBankShadow } from "@/shared/content/editor/blocks/questions/cloze-text/components/word-bank-shadow";
import { WordChip } from "@/shared/content/editor/blocks/questions/cloze-text/components/word-chip";
import {
  findFirstEmptyGapId,
  type GapSegment,
  getItemById,
  isItemPlaced,
  type QuestionData,
  type UserAnswer,
} from "@/shared/content/editor/blocks/questions/cloze-text/schema";
import {
  assignWordToNextGap,
  removeWordFromGap,
} from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-actions";
import { CLOZE_GAME } from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-game-tokens";
import {
  type FlightPoint,
  getElementCenter,
} from "@/shared/content/editor/blocks/questions/cloze-text/utils/cloze-word-flight";
import {
  getClozeBankItemStatus,
  getGapGradedStatus,
} from "@/shared/content/editor/blocks/ui/qa-celebration";

// Purely visual — the answer is already committed when a flight starts; `end` is null until the target gap has laid out.
type Flight = {
  kind: "place" | "remove";
  itemId: string;
  gapId: string;
  label: string;
  start: FlightPoint;
  end: FlightPoint | null;
};

type ClozeLearnerViewProps = {
  questionData: QuestionData;
  displayOrder: string[] | null;
  answers: UserAnswer;
  canEditAnswers: boolean;
  isGraded?: boolean;
  celebrateKey?: number;
  isFullyCorrect?: boolean;
  bodyClassName?: string;
  wordBankLabel: string;
  resetLabel: string;
  onAnswersChange?: (next: UserAnswer) => void;
};

export const ClozeLearnerView = memo(
  ({
    questionData,
    displayOrder,
    answers,
    canEditAnswers,
    isGraded = false,
    celebrateKey = 0,
    isFullyCorrect = false,
    bodyClassName,
    wordBankLabel,
    resetLabel,
    onAnswersChange,
  }: ClozeLearnerViewProps) => {
    const prefersReducedMotion = useReducedMotion();
    const bankRefs = useRef(new Map<string, HTMLButtonElement>());
    const gapRefs = useRef(new Map<string, HTMLSpanElement>());
    const bankGhostRefs = useRef(new Map<string, HTMLDivElement>());

    const flightRef = useRef<Flight | null>(null);

    const [flight, setFlightState] = useState<Flight | null>(null);

    const displayedItems = useMemo(
      () =>
        applyDisplayOrder(questionData.items, (item) => item.id, displayOrder),
      [questionData.items, displayOrder],
    );

    const setFlight = useCallback((next: Flight | null) => {
      flightRef.current = next;
      setFlightState(next);
    }, []);

    const gapOrderById = useMemo(() => {
      const order = new Map<string, number>();
      let index = 0;
      for (const segment of questionData.segments) {
        if (segment.type === "gap") {
          order.set(segment.id, index);
          index += 1;
        }
      }
      return order;
    }, [questionData.segments]);

    const gaps = questionData.segments.filter(
      (segment): segment is GapSegment => segment.type === "gap",
    );

    const correctItemIds = useMemo(
      () => new Set(gaps.map((gap) => gap.correctItemId)),
      [gaps],
    );

    useLayoutEffect(() => {
      if (!flight || flight.kind !== "place" || flight.end !== null) return;

      const target = gapRefs.current.get(flight.gapId);
      if (!target) {
        setFlight(null);
        return;
      }

      setFlight({ ...flight, end: getElementCenter(target) });
    }, [flight, setFlight]);

    const handlePlaceWord = useCallback(
      (itemId: string) => {
        if (!canEditAnswers || !onAnswersChange || flightRef.current) return;

        const item = getItemById(questionData.items, itemId);
        if (!item) return;

        const gapId = findFirstEmptyGapId(gaps, answers);
        if (!gapId) return;

        const nextAnswers = assignWordToNextGap(questionData, answers, itemId);
        if (!nextAnswers) return;

        const source = bankRefs.current.get(itemId);

        if (prefersReducedMotion || !source) {
          onAnswersChange(nextAnswers);
          return;
        }

        const start = getElementCenter(source);
        onAnswersChange(nextAnswers);
        setFlight({
          kind: "place",
          itemId,
          gapId,
          label: item.label,
          start,
          end: null,
        });
      },
      [
        answers,
        canEditAnswers,
        gaps,
        onAnswersChange,
        prefersReducedMotion,
        questionData,
        setFlight,
      ],
    );

    const handleRemoveWord = useCallback(
      (gapId: string, itemId: string) => {
        if (!canEditAnswers || !onAnswersChange || flightRef.current) return;

        const item = getItemById(questionData.items, itemId);
        if (!item) return;

        const source = gapRefs.current.get(gapId);
        const target = bankGhostRefs.current.get(itemId);
        const nextAnswers = removeWordFromGap(answers, gapId);

        if (prefersReducedMotion || !source || !target) {
          onAnswersChange(nextAnswers);
          return;
        }

        const start = getElementCenter(source);
        const end = getElementCenter(target);
        onAnswersChange(nextAnswers);
        setFlight({
          kind: "remove",
          itemId,
          gapId,
          label: item.label,
          start,
          end,
        });
      },
      [
        answers,
        canEditAnswers,
        onAnswersChange,
        prefersReducedMotion,
        questionData.items,
        setFlight,
      ],
    );

    const handleFlightComplete = useCallback(() => {
      setFlight(null);
    }, [setFlight]);

    const interactionLocked = Boolean(flight);

    return (
      <div className={cn("relative flex flex-col gap-4")}>
        <p
          className={cn(
            "my-0 flex flex-wrap items-baseline gap-y-2 leading-relaxed",
            bodyClassName,
          )}
        >
          {questionData.segments.map((segment) => {
            if (segment.type === "text") {
              if (!segment.content) return null;
              const lines = segment.content.split("\n");
              return (
                <Fragment key={segment.id}>
                  {lines.map((line, lineIndex) => (
                    <Fragment key={`${segment.id}:${lineIndex}`}>
                      {lineIndex > 0 ? <br /> : null}
                      <span className="whitespace-pre-wrap">{line}</span>
                    </Fragment>
                  ))}
                </Fragment>
              );
            }

            const placedItemId = answers[segment.id];
            const placedItem = placedItemId
              ? getItemById(questionData.items, placedItemId)
              : undefined;
            const correctItem = getItemById(
              questionData.items,
              segment.correctItemId,
            );
            const gradedStatus = segment.correctItemId
              ? getGapGradedStatus(
                  segment.correctItemId,
                  placedItemId,
                  isGraded,
                )
              : !isGraded
                ? "neutral"
                : !placedItemId
                  ? "missed"
                  : isFullyCorrect
                    ? "correct"
                    : "incorrect";

            const isFlightPlaceTarget =
              flight?.kind === "place" && flight.gapId === segment.id;

            const isFlightRemoveSource =
              flight?.kind === "remove" && flight.gapId === segment.id;

            const isFilled = isFlightRemoveSource
              ? true
              : isFlightPlaceTarget
                ? false
                : Boolean(placedItem);
            const label = isFlightRemoveSource
              ? flight.label
              : placedItem?.label;

            return (
              <ClozeGapSlot
                key={segment.id}
                ref={(node) => {
                  if (node) gapRefs.current.set(segment.id, node);
                  else gapRefs.current.delete(segment.id);
                }}
                gapId={segment.id}
                label={label}
                solutionLabel={correctItem?.label}
                isFilled={isFilled}
                isHidden={isFlightRemoveSource}
                incomingLabel={isFlightPlaceTarget ? flight.label : undefined}
                gradedStatus={gradedStatus}
                bounceIndex={gapOrderById.get(segment.id) ?? 0}
                celebrateKey={celebrateKey}
                celebrateFullBlock={isFullyCorrect}
                disabled={!canEditAnswers || interactionLocked}
                onClick={
                  placedItem && canEditAnswers && !isFlightRemoveSource
                    ? () => handleRemoveWord(segment.id, placedItem.id)
                    : undefined
                }
              />
            );
          })}
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className={CLOZE_GAME.bankLabel}>{wordBankLabel}</span>
            {canEditAnswers && Object.keys(answers).length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={interactionLocked}
                onClick={() => onAnswersChange?.({})}
                className="h-7 rounded-lg text-neutral-500 hover:text-neutral-900 @min-[40rem]:h-8 dark:hover:text-neutral-100"
              >
                <RotateCcw className="mr-1.5 h-3 w-3 @min-[40rem]:h-3.5 @min-[40rem]:w-3.5" />
                {resetLabel}
              </Button>
            ) : null}
          </div>

          <div
            className={cn(
              "flex flex-wrap gap-2 @min-[40rem]:gap-2.5",
              CLOZE_GAME.bankTray,
            )}
          >
            {displayedItems.map((item) => {
              const isReturning =
                flight?.kind === "remove" && flight.itemId === item.id;
              const placed = isItemPlaced(item.id, answers) || isReturning;

              if (placed) {
                return (
                  <WordBankShadow
                    key={item.id}
                    label={item.label}
                    ref={(node) => {
                      if (node) bankGhostRefs.current.set(item.id, node);
                      else bankGhostRefs.current.delete(item.id);
                    }}
                  />
                );
              }

              return (
                <WordChip
                  key={item.id}
                  ref={(node) => {
                    if (node) bankRefs.current.set(item.id, node);
                    else bankRefs.current.delete(item.id);
                  }}
                  label={item.label}
                  disabled={!canEditAnswers || interactionLocked}
                  variant={(() => {
                    const bankStatus = getClozeBankItemStatus(
                      item.id,
                      correctItemIds,
                      isGraded,
                    );
                    if (bankStatus === "missed") return "missed";
                    if (isGraded) return "unused";
                    return "bank";
                  })()}
                  onClick={
                    canEditAnswers ? () => handlePlaceWord(item.id) : undefined
                  }
                />
              );
            })}
          </div>
        </div>

        {flight && flight.end ? (
          <FlyingWordChip
            key={`${flight.kind}-${flight.itemId}-${flight.gapId}`}
            label={flight.label}
            flight={{ start: flight.start, end: flight.end }}
            onComplete={handleFlightComplete}
          />
        ) : null}
      </div>
    );
  },
);
ClozeLearnerView.displayName = "ClozeLearnerView";
