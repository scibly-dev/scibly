"use client";

import type { ReactNode } from "react";

import { motion } from "framer-motion";

interface LessonStatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
  accentDark: string;
  delay: number;
  dimmed?: boolean;
}

export function LessonStatCard({
  label,
  value,
  icon,
  accent,
  accentDark,
  delay,
  dimmed = false,
}: LessonStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.92 }}
      animate={{ opacity: dimmed ? 0.35 : 1, y: 0, scale: dimmed ? 0.96 : 1 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 24 }}
      className="min-w-0 flex-1 overflow-hidden rounded-2xl border-[2.5px] bg-white"
      style={{ borderColor: accentDark }}
    >
      <div
        className="px-2 py-1.5 text-center text-[10px] font-extrabold tracking-[0.12em] text-white uppercase"
        style={{ backgroundColor: accent }}
      >
        {label}
      </div>
      <div className="flex items-center justify-center gap-1.5 px-2 py-4">
        {icon}
        <span className="text-[1.65rem] leading-none font-extrabold text-neutral-900 tabular-nums">
          {value}
        </span>
      </div>
    </motion.div>
  );
}
