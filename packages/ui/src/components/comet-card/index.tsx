"use client";

import { cn } from "@scibly/ui/utils";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
} from "react";

interface CometCardProps {
  children: ReactNode;
  className?: string;
  rotateDepth?: number;
  translateDepth?: number;
}

export function CometCard({
  children,
  className,
  rotateDepth = 5,
  translateDepth = 4,
}: CometCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const pointerXSpring = useSpring(pointerX, {
    stiffness: 180,
    damping: 24,
    mass: 0.35,
  });
  const pointerYSpring = useSpring(pointerY, {
    stiffness: 180,
    damping: 24,
    mass: 0.35,
  });
  const rotateX = useTransform(
    pointerYSpring,
    [-0.5, 0.5],
    [`-${rotateDepth}deg`, `${rotateDepth}deg`],
  );
  const rotateY = useTransform(
    pointerXSpring,
    [-0.5, 0.5],
    [`${rotateDepth}deg`, `-${rotateDepth}deg`],
  );
  const translateX = useTransform(
    pointerXSpring,
    [-0.5, 0.5],
    [`-${translateDepth}px`, `${translateDepth}px`],
  );
  const translateY = useTransform(
    pointerYSpring,
    [-0.5, 0.5],
    [`${translateDepth}px`, `-${translateDepth}px`],
  );
  const glareX = useTransform(pointerXSpring, [-0.5, 0.5], [10, 90]);
  const glareY = useTransform(pointerYSpring, [-0.5, 0.5], [10, 90]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.24) 28%, rgba(255, 255, 255, 0) 66%)`;

  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType === "touch" || !cardRef.current) {
      return;
    }

    const bounds = cardRef.current.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  return (
    <div className={cn("perspective-distant", className)}>
      <motion.div
        ref={cardRef}
        className="relative h-full transform-3d"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        style={
          reduceMotion
            ? undefined
            : { rotateX, rotateY, translateX, translateY }
        }
        initial={false}
        whileHover={reduceMotion ? undefined : { scale: 1.012, z: 18 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] mix-blend-soft-light"
          style={{
            background: glareBackground,
            opacity: reduceMotion ? 0 : 0.55,
          }}
          aria-hidden
        />
      </motion.div>
    </div>
  );
}
