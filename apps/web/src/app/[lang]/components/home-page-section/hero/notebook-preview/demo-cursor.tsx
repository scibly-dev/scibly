"use client";

import { motion } from "framer-motion";
import { type RefObject, useState } from "react";

import { PRODUCT_INK } from "@/app/[lang]/components/marketing-tokens";

import { previewWash } from "../hero-preview-kit";
import { CURSOR_MOVE_SECONDS, EASE, PILLAR } from "./notebook-theme";

type Aim = "radio" | "center";

type Point = { x: number; y: number };

type Wait = (ms: number) => Promise<void>;

function pointInFrame(
  frame: HTMLElement,
  el: HTMLElement,
  aim: Aim,
): Point | null {
  const fr = frame.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2 || fr.width < 2 || fr.height < 2) {
    return null;
  }
  const localX = aim === "radio" ? 14 : r.width / 2;
  return {
    x: ((r.left + localX - fr.left) / fr.width) * 100,
    y: ((r.top + r.height / 2 - fr.top) / fr.height) * 100,
  };
}

export function useDemoCursor(frameRef: RefObject<HTMLDivElement | null>) {
  const [cursor, setCursor] = useState({ x: 50, y: 55, visible: false });
  const [pressing, setPressing] = useState(false);
  const [ripple, setRipple] = useState<(Point & { key: number }) | null>(null);

  const moveTo = (el: HTMLElement | null, aim: Aim) => {
    const frame = frameRef.current;
    if (!frame || !el) return null;
    const point = pointInFrame(frame, el, aim);
    if (!point) return null;
    setCursor({ x: point.x, y: point.y, visible: true });
    return point;
  };

  const aimAt = async (
    wait: Wait,
    el: HTMLElement | null,
    aim: Aim = "center",
    retryDelay = 400,
  ) => {
    const point = moveTo(el, aim);
    if (point) return point;
    await wait(retryDelay);
    return moveTo(el, aim);
  };

  const clickAt = async (wait: Wait, point: Point) => {
    setPressing(true);
    setRipple({ ...point, key: Date.now() });
    await wait(280);
    setPressing(false);
  };

  const hide = () => setCursor((c) => ({ ...c, visible: false }));

  const release = () => setPressing(false);

  return { cursor, pressing, ripple, aimAt, clickAt, hide, release };
}

export function DemoCursor({
  x,
  y,
  visible,
  pressing,
  ripple,
}: {
  x: number;
  y: number;
  visible: boolean;
  pressing: boolean;
  ripple: (Point & { key: number }) | null;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 hidden md:block"
      aria-hidden
    >
      {ripple ? (
        <motion.span
          key={ripple.key}
          className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            borderColor: PILLAR.lipColor,
            backgroundColor: previewWash(PILLAR, 60),
          }}
          initial={{ scale: 0.4, opacity: 0.6 }}
          animate={{ scale: 1.65, opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      ) : null}

      <motion.div
        className="absolute"
        initial={false}
        animate={{
          left: `${x}%`,
          top: `${y}%`,
          opacity: visible ? 1 : 0,
          scale: pressing ? 0.9 : 1,
        }}
        transition={{
          left: { duration: CURSOR_MOVE_SECONDS, ease: EASE },
          top: { duration: CURSOR_MOVE_SECONDS, ease: EASE },
          scale: { duration: 0.12 },
          opacity: { duration: 0.28 },
        }}
        style={{ translate: "-2px -1px" }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-[0_2px_4px_rgba(19,28,70,0.3)]"
        >
          <path
            d="M5.5 3.21V20.8c0 .10.05.19.13.25.08.06.18.07.27.02L11.3 18l3.02 5.24c.08.14.26.2.41.12l2.03-1.17c.14-.08.2-.26.12-.41L14 16.5l6.33-.82c.1-.01.18-.08.22-.17.04-.1.02-.2-.05-.27L5.92 3.04c-.08-.08-.2-.1-.3-.06-.1.04-.16.13-.16.23z"
            fill={PRODUCT_INK}
            stroke="white"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
