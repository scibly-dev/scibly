"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { COURSE_HIGHLIGHT } from "../../course-overview/course-path-theme";
import {
  playSpCoinSound,
  playSpCollectStartSound,
} from "../../lesson-player/utils/player-sfx";
import {
  COIN_FLIGHT_MS,
  type FlyingCoin,
  FlyingSpCoin,
} from "./flying-sp-coin";

export const CELEBRATION_GOLD = "#FFC800";
export const CELEBRATION_GOLD_DARK = "#E5B000";

interface Point {
  x: number;
  y: number;
}

function getCoinCount(spAmount: number): number {
  if (spAmount <= 0) return 0;
  return Math.min(14, Math.max(6, Math.ceil(spAmount / 2)));
}

function buildCoins(
  spAmount: number,
  sourceCenter: Point,
  targetCenter: Point,
): FlyingCoin[] {
  const count = getCoinCount(spAmount);
  const baseValue = Math.floor(spAmount / count);
  const remainder = spAmount - baseValue * count;

  return Array.from({ length: count }, (_, index) => {
    const spreadX = (index - (count - 1) / 2) * 16;
    const spreadY = (index % 3) * 10 - 10;
    const start = {
      x: sourceCenter.x + spreadX,
      y: sourceCenter.y + spreadY,
    };
    const end = {
      x: targetCenter.x + (index % 2 === 0 ? -8 : 8),
      y: targetCenter.y + 4,
    };
    const mid = {
      x: (start.x + end.x) / 2 + (index % 2 === 0 ? -90 : 90),
      y: Math.min(start.y, end.y) - 140 - (index % 4) * 18,
    };

    return {
      id: index,
      start,
      mid,
      end,
      delayMs: index * 80,
      value: baseValue + (index < remainder ? 1 : 0),
    };
  });
}

interface SpCollectOverlayProps {
  active: boolean;
  spAmount: number;
  sourceRef: RefObject<HTMLElement | null>;
  onComplete: () => void;
}

type AnimationRefs = {
  sourceRef: RefObject<HTMLElement | null>;
  bucketRef: RefObject<HTMLDivElement | null>;
  timersRef: React.MutableRefObject<number[]>;
  runIdRef: React.MutableRefObject<number>;
  onCompleteRef: React.MutableRefObject<() => void>;
};

function startCoinAnimation(
  spAmount: number,
  refs: AnimationRefs,
  actions: {
    setCollected: React.Dispatch<React.SetStateAction<number>>;
    setRunId: (value: number) => void;
    setCoins: (coins: FlyingCoin[]) => void;
    bumpBucket: () => void;
  },
) {
  let cancelled = false;
  let attempts = 0;
  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    refs.timersRef.current.push(id);
  };
  const tryStart = () => {
    if (cancelled) return;
    const sourceEl = refs.sourceRef.current;
    const bucketEl = refs.bucketRef.current;
    if (!sourceEl || !bucketEl) {
      attempts += 1;
      if (attempts < 30) requestAnimationFrame(tryStart);
      return;
    }
    const sourceRect = sourceEl.getBoundingClientRect();
    const bucketRect = bucketEl.getBoundingClientRect();
    const sourceCenter = {
      x: sourceRect.left + sourceRect.width / 2,
      y: sourceRect.top + sourceRect.height / 2,
    };
    const targetCenter = {
      x: bucketRect.left + bucketRect.width / 2,
      y: bucketRect.top + bucketRect.height / 2,
    };
    const nextRunId = refs.runIdRef.current + 1;
    refs.runIdRef.current = nextRunId;
    const builtCoins = buildCoins(spAmount, sourceCenter, targetCenter);
    playSpCollectStartSound();
    actions.setCollected(0);
    actions.setRunId(nextRunId);
    actions.setCoins(builtCoins);
    builtCoins.forEach((coin) => {
      schedule(
        () => {
          actions.setCollected((current) => current + coin.value);
          actions.bumpBucket();
          playSpCoinSound();
        },
        coin.delayMs + COIN_FLIGHT_MS - 80,
      );
    });
    const lastCoin = builtCoins[builtCoins.length - 1];
    const finishMs = lastCoin
      ? lastCoin.delayMs + COIN_FLIGHT_MS + 450
      : COIN_FLIGHT_MS;
    schedule(() => refs.onCompleteRef.current(), finishMs);
  };
  requestAnimationFrame(tryStart);
  return () => {
    cancelled = true;
  };
}

export const CollectionBucket = ({
  bucketRef,
  bucketBump,
  collected,
  fillPct,
}: {
  bucketRef: React.RefObject<HTMLDivElement | null>;
  bucketBump: number;
  collected: number;
  fillPct: number;
}) => (
  <div className="fixed top-8 left-1/2 z-[120] -translate-x-1/2">
    <motion.div
      ref={bucketRef}
      initial={{ opacity: 0, y: -28, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <motion.div
        key={bucketBump}
        initial={{ scale: 1 }}
        animate={{ scale: bucketBump > 0 ? [1, 1.14, 1] : 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative flex min-w-[8.5rem] flex-col items-center overflow-hidden rounded-[1.35rem] border-[3px] bg-white px-5 pt-2 pb-3 shadow-xl"
        style={{ borderColor: CELEBRATION_GOLD_DARK }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ backgroundColor: CELEBRATION_GOLD }}
        />
        <p className="mt-1 text-[10px] font-extrabold tracking-[0.14em] text-neutral-500 uppercase">
          Scibly Points
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: COURSE_HIGHLIGHT.primaryWash }}
          >
            <Zap
              className="h-4 w-4 fill-current"
              style={{ color: COURSE_HIGHLIGHT.primaryDark }}
              strokeWidth={2}
            />
          </div>
          <span className="text-3xl font-extrabold text-neutral-900 tabular-nums">
            +{collected}
          </span>
        </div>
        <div
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: COURSE_HIGHLIGHT.primaryWash }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-150 ease-out"
            style={{
              width: `${fillPct}%`,
              backgroundColor: COURSE_HIGHLIGHT.primary,
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  </div>
);

export function SpCollectOverlay({
  active,
  spAmount,
  sourceRef,
  onComplete,
}: SpCollectOverlayProps) {
  const reduceMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);
  const bucketRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const runIdRef = useRef(0);
  const hasStartedRef = useRef(false);
  const [coins, setCoins] = useState<FlyingCoin[]>([]);
  const [collected, setCollected] = useState(0);
  const [runId, setRunId] = useState(0);
  const [bucketBump, setBucketBump] = useState(0);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  const clearTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  };
  useLayoutEffect(() => {
    if (!active) {
      hasStartedRef.current = false;
      clearTimers();
      return;
    }
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    if (reduceMotion || spAmount <= 0) {
      const id = window.setTimeout(() => onCompleteRef.current(), 80);
      timersRef.current.push(id);
      return;
    }
    const cancel = startCoinAnimation(
      spAmount,
      { sourceRef, bucketRef, timersRef, runIdRef, onCompleteRef },
      {
        setCollected,
        setRunId,
        setCoins,
        bumpBucket: () => setBucketBump((current) => current + 1),
      },
    );
    return () => {
      cancel();
      clearTimers();
    };
  }, [active, reduceMotion, sourceRef, spAmount]);
  if (!active) return null;
  const fillPct =
    spAmount > 0
      ? Math.min(100, Math.round((collected / spAmount) * 100))
      : 100;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[110] bg-white/50" />

      <CollectionBucket
        bucketRef={bucketRef}
        bucketBump={bucketBump}
        collected={collected}
        fillPct={fillPct}
      />

      {coins.map((coin) => (
        <FlyingSpCoin key={`${runId}-${coin.id}`} coin={coin} />
      ))}
    </>
  );
}
