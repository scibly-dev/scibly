"use client";

import { cn } from "@scibly/ui/utils";
import {
  motion,
  type MotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/components/in-view-reveal";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const SPRING = { stiffness: 150, damping: 26, mass: 0.7 };

function Glyph({
  column,
  digit,
}: {
  column: MotionValue<number>;
  digit: number;
}) {
  const y = useTransform(column, (latest) => {
    // Wrapped so a wheel never travels more than five steps: 9 -> 1 rolls forward two, not back eight.
    const offset = (10 + digit - (latest % 10)) % 10;
    return `${(offset > 5 ? offset - 10 : offset) * 100}%`;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {digit}
    </motion.span>
  );
}

function Digit({
  shiftedValue,
  active,
}: {
  shiftedValue: number;
  active: boolean;
}) {
  const column = useSpring(0, SPRING);

  useEffect(() => {
    if (active) column.set(shiftedValue);
  }, [active, shiftedValue, column]);

  return (
    <span className="relative inline-block h-[1.15em] w-[1ch] overflow-hidden">
      {DIGITS.map((digit) => (
        <Glyph key={digit} column={column} digit={digit} />
      ))}
    </span>
  );
}

function Rolling({ digits, active }: { digits: string; active: boolean }) {
  const value = Number.parseInt(digits, 10);

  return (
    <>
      {[...digits].map((_, index) => {
        const place = 10 ** (digits.length - 1 - index);
        return (
          <Digit
            key={index}
            shiftedValue={Math.floor(value / place)}
            active={active}
          />
        );
      })}
    </>
  );
}

export function SlidingNumber({
  value,
  active,
  className,
}: {
  value: string;
  active: boolean;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <span className={className}>
      <span aria-hidden className="sc-roll-plain">
        {value}
      </span>

      <span
        aria-hidden
        className={cn(
          "sc-roll inline-flex items-center tabular-nums transition-opacity duration-300",
          (reducedMotion || active) && "sc-roll-ready",
        )}
      >
        {reducedMotion
          ? value
          : value
              .split(/(\d+)/)
              .filter(Boolean)
              .map((part, index) =>
                /^\d+$/.test(part) ? (
                  <Rolling key={index} digits={part} active={active} />
                ) : (
                  <span key={index} className="whitespace-pre">
                    {part}
                  </span>
                ),
              )}
      </span>

      <span className="sr-only">{value}</span>
    </span>
  );
}
